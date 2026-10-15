"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Flame, Target, CheckCircle2, X, Info, ChevronDown, Compass, Sparkles } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { getUserStreak } from "@/lib/streak";
import { getFastLocation } from "@/lib/location";
import { Geolocation } from "@capacitor/geolocation";
import { getDailyMissions, Mission } from "@/lib/missions";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const GarbageMap = dynamic(() => import("@/components/GarbageMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#000000]">
      <div className="flex flex-col items-center">
        <MapPin className="text-zinc-400 w-8 h-8 animate-bounce mb-4" />
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Loading Map Data...</p>
      </div>
    </div>
  ),
});

export const DEMO_HUBS = [
  {
    id: "jp_nagar",
    name: "JP Nagar",
    tag: "Recommended",
    badge: "12 Live Reports",
    description: "South Bengaluru • 7th Phase",
    coords: { lat: 12.9063, lng: 77.5857 },
  },
  {
    id: "jayanagar",
    name: "Jayanagar",
    tag: "Active Hub",
    badge: "8 Live Reports",
    description: "South Bengaluru • 4th Block",
    coords: { lat: 12.9308, lng: 77.5838 },
  },
  {
    id: "btm",
    name: "BTM Layout",
    tag: "Active Hub",
    badge: "5 Live Reports",
    description: "South Bengaluru • 2nd Stage",
    coords: { lat: 12.9165, lng: 77.6101 },
  }
];

// Haversine formula to calculate distance between two coordinates in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

let cachedClosestMission: any = null;
let cachedObjectives: any = { hotspot: false, sunset: false, newArea: false };

export default function Home() {
  const [closestMission, setClosestMission] = useState<{ id: number, lat: number, lng: number, distance: number, severity?: any } | null>(cachedClosestMission);

  useEffect(() => {
    // Eagerly fetch hotspots the millisecond the app launches so they are ready for the map
    if (typeof window !== 'undefined' && !(window as any).__nammaHotspotsPromise) {
      (window as any).__nammaHotspotsPromise = supabase.from('reports').select('*');
    }
  }, []);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('namma_demo_mode') === 'true';
    }
    return false;
  });
  const [selectedHubId, setSelectedHubId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('namma_demo_hub') || 'jp_nagar';
    }
    return 'jp_nagar';
  });

  // Try to instantly grab location from cache on mount (or demo hub if demo mode active)
  const [userLoc, setUserLoc] = useState<{ lat: number, lng: number, heading?: number | null } | null>(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('namma_demo_mode') === 'true') {
        const hubId = sessionStorage.getItem('namma_demo_hub') || 'jp_nagar';
        const hub = DEMO_HUBS.find(h => h.id === hubId) || DEMO_HUBS[0];
        return { lat: hub.coords.lat, lng: hub.coords.lng, heading: 0 };
      }
      const lat = localStorage.getItem('namma_lat');
      const lng = localStorage.getItem('namma_lng');
      if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    return null;
  });

  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isMissionDismissed, setIsMissionDismissed] = useState(false);
  const [dailyMissions, setDailyMissions] = useState<Mission[]>([]);
  const [claims, setClaims] = useState<Record<string, boolean>>({});
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [missionRouteDest, setMissionRouteDest] = useState<{ lat: number, lng: number } | null>(null);
  const [navInstruction, setNavInstruction] = useState<string | undefined>(undefined);
  const [navDistance, setNavDistance] = useState<number | undefined>(undefined);
  const [isMapRouting, setIsMapRouting] = useState(false);
  const [isMissionsCollapsed, setIsMissionsCollapsed] = useState(true);
  const [hasOpenedMissions, setHasOpenedMissions] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('navigationStateChange', { detail: { isActive: isMapRouting } }));
    }
  }, [isMapRouting]);

  const checkBounds = (lat: number, lng: number) => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('namma_demo_mode') === 'true') {
      setIsOutOfBounds(false);
      return;
    }
    // strict allowedBounds: [12.865, 77.550] to [12.945, 77.625]
    if (lat < 12.865 || lat > 12.945 || lng < 77.550 || lng > 77.625) {
      setIsOutOfBounds(true);
    } else {
      setIsOutOfBounds(false);
    }
  };

  const enterDemoMode = (hubId?: string) => {
    const targetId = hubId || selectedHubId;
    const hub = DEMO_HUBS.find(h => h.id === targetId) || DEMO_HUBS[0];
    sessionStorage.setItem('namma_demo_mode', 'true');
    sessionStorage.setItem('namma_demo_hub', hub.id);
    setIsDemoMode(true);
    setSelectedHubId(hub.id);
    setUserLoc({ lat: hub.coords.lat, lng: hub.coords.lng, heading: 0 });
    setIsOutOfBounds(false);
  };

  const exitDemoMode = async () => {
    sessionStorage.removeItem('namma_demo_mode');
    sessionStorage.removeItem('namma_demo_hub');
    setIsDemoMode(false);
    const loc = await getFastLocation();
    setUserLoc(loc);
    checkBounds(loc.lat, loc.lng);
  };

  useEffect(() => {
    if (sessionStorage.getItem('namma_mission_dismissed') === 'true') {
      setIsMissionDismissed(true);
    }
    if (sessionStorage.getItem('namma_missions_opened') === 'true') {
      setHasOpenedMissions(true);
    }
    const today = new Date().toISOString().split('T')[0];
    const missions = getDailyMissions(today);
    setDailyMissions(missions);

    const initialClaims: Record<string, boolean> = {};
    missions.forEach(m => {
      initialClaims[m.id] = localStorage.getItem(`namma_mission_${today}_${m.id}_claimed`) === 'true';
    });
    setClaims(initialClaims);
  }, []);

  const [xpEvent, setXpEvent] = useState<{amount: number, id: string} | null>(null);

  const claimMission = async (mission: any) => {
    if (claims[mission.id]) return;
    const today = new Date().toISOString().split('T')[0];
    setClaims(prev => ({ ...prev, [mission.id]: true }));
    localStorage.setItem(`namma_mission_${today}_${mission.id}_claimed`, 'true');
    setXpEvent({ amount: mission.xp, id: Date.now().toString() });
    try {
      // Use secure Server RPC instead of raw client update
      await supabase.rpc('add_mission_xp', {
        user_name: getCurrentUser(),
        amount: mission.xp
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let watchId: string;
    // Proactively request native permissions (iOS/Android will show prompt, web ignores or handles gracefully)
    const requestNativePermissions = async () => {
      try {
        await Geolocation.requestPermissions();
        watchId = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }, (pos, err) => {
          if (pos) {
            if (sessionStorage.getItem('namma_demo_mode') === 'true') return;
            setUserLoc({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              heading: pos.coords.heading
            });
            checkBounds(pos.coords.latitude, pos.coords.longitude);
          }
        });
      } catch (e) {
        // Safe to ignore on Web
      }
    };
    requestNativePermissions();

    getUserStreak(getCurrentUser()).then(setStreak);
    const fetchMissions = async () => {
      try {
        const feedNavigate = localStorage.getItem('namma_feed_navigate');
        if (feedNavigate) {
          try {
            const dest = JSON.parse(feedNavigate);
            setMissionRouteDest(dest);
            localStorage.removeItem('namma_feed_navigate');
            setIsMissionDismissed(true);
            sessionStorage.setItem('namma_mission_dismissed', 'true');
          } catch (e) { }
        }

        const { data: reportsData, error: reportsError } = await supabase.from('reports').select('*');
        if (reportsError || !reportsData) return;
        const data = reportsData.map(r => ({ ...r, pos: [r.lat, r.lng] }));

        let loc: { lat: number, lng: number, heading?: number | null };
        if (sessionStorage.getItem('namma_demo_mode') === 'true') {
          const hubId = sessionStorage.getItem('namma_demo_hub') || 'jp_nagar';
          const hub = DEMO_HUBS.find(h => h.id === hubId) || DEMO_HUBS[0];
          loc = { lat: hub.coords.lat, lng: hub.coords.lng, heading: 0 };
          setUserLoc(loc);
          setIsOutOfBounds(false);
        } else {
          // Guarantee location within 1.5s max (cache -> GPS -> JP Nagar fallback)
          loc = await getFastLocation();
          setUserLoc(loc);
          checkBounds(loc.lat, loc.lng);
        }

        let closest: any = null;
        let minDistance = Infinity;
        data.forEach((report: any) => {
          const dist = getDistance(loc.lat, loc.lng, report.pos[0], report.pos[1]);
          if (dist < minDistance) {
            minDistance = dist;
            closest = { id: report.id, lat: report.pos[0], lng: report.pos[1], distance: dist, severity: report.severity || 1 };
          }
        });
        if (closest && minDistance < 10000) {
          cachedClosestMission = closest;
          setClosestMission(closest);
        }

        const { data: feedData, error: feedError } = await supabase.from('reports').select('*').order('timestamp', { ascending: false });
        if (!feedError && feedData) {
          const feed = feedData;
          const today = new Date().toISOString().split('T')[0];

          const myReports = feed.filter((r: any) => r.username === getCurrentUser() && r.timestamp?.startsWith(today));
          const supportedCount = parseInt(localStorage.getItem(`namma_supported_count_${today}`) || '0');

          const myCleanups = feed.filter((r: any) => r.cleanup_squad?.includes(getCurrentUser()) && (r.cleanup_timestamp?.startsWith(today) || r.timestamp?.startsWith(today)));

          let shareCount = parseInt(localStorage.getItem(`namma_share_count_${today}`) || '0');

          setDailyMissions(prevMissions => {
            const newCompletions: Record<string, boolean> = {};
            prevMissions.forEach(m => {
              newCompletions[m.id] = m.evaluate(myReports, supportedCount, myCleanups, shareCount);
            });
            setCompletions(newCompletions);
            return prevMissions;
          });
        }
      } catch (e) {
        console.error("Failed to load missions", e);
      }
    };
    fetchMissions();

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, []);

  const openNavigation = () => {
    if (closestMission) {
      setMissionRouteDest({ lat: closestMission.lat, lng: closestMission.lng });
      setIsMissionDismissed(true);
      setIsMissionsCollapsed(true);
      sessionStorage.setItem('namma_mission_dismissed', 'true');
    }
  };

  if (isOutOfBounds) {
    const selectedHub = DEMO_HUBS.find(h => h.id === selectedHubId) || DEMO_HUBS[0];
    return (
      <div className="h-full w-full flex flex-col justify-between p-4 sm:p-6 text-center max-w-md mx-auto relative z-50 pt-safe-header pb-[calc(env(safe-area-inset-bottom)+5rem)] overflow-y-auto">
        <div className="my-auto space-y-6">
          {/* Header Icon with Glowing Radar Pulse */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-60" />
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-full flex items-center justify-center border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Compass className="w-9 h-9 text-amber-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Outside Live Service Area</h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Namma Hood&apos;s real-time civic cleanups are currently live in <span className="text-white font-bold">South Bengaluru</span>. Physical GPS presence is required to verify reports.
            </p>
          </div>

          {/* Interactive Demo Mode Card */}
          <div className="glass-panel p-5 rounded-3xl border border-[#10b981]/30 bg-[#10b981]/5 text-left space-y-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#10b981]" />
                <h3 className="text-sm font-bold text-white tracking-wide">Test Drive in Demo Mode</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#10b981]/15 text-[#10b981] px-2 py-0.5 rounded-full border border-[#10b981]/25">
                Preview
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-normal">
              Want to get a feel of the app? Select an active hub to explore live reports, missions, and the interactive map:
            </p>

            {/* Hub Selector Cards */}
            <div className="space-y-2">
              {DEMO_HUBS.map((hub) => {
                const isSelected = selectedHubId === hub.id;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setSelectedHubId(hub.id)}
                    className={cn(
                      "w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer",
                      isSelected
                        ? "bg-[#10b981]/15 border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "border-[#10b981] bg-[#10b981]" : "border-zinc-500 bg-white/5"
                      )}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={cn("text-sm font-bold", isSelected ? "text-white" : "text-zinc-300")}>{hub.name}</span>
                          <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded", isSelected ? "bg-[#10b981]/20 text-[#10b981]" : "bg-white/5 text-zinc-400")}>
                            {hub.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-medium">{hub.description}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-semibold">{hub.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* Primary Action Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => enterDemoMode()}
              className="w-full bg-[#10b981] hover:bg-[#10b981]/90 text-black font-black py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all text-sm cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-current" />
              <span>Explore {selectedHub.name} (Demo Mode)</span>
            </motion.button>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-3 pt-2">
            <Link
              href="/feed"
              className="inline-flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white font-bold transition-colors"
            >
              <span>Browse Community Feed</span>
              <span>→</span>
            </Link>
            <p className="text-zinc-600 text-[11px] font-semibold">
              Expanding across Bangalore soon!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-3 h-full flex flex-col pt-safe-header pb-[calc(env(safe-area-inset-bottom)+6rem)] max-w-md mx-auto relative z-10 overflow-hidden">
        <motion.div 
          initial={false}
          animate={{ 
            opacity: isMapRouting ? 0 : 1, 
            y: isMapRouting ? -20 : 0, 
            pointerEvents: isMapRouting ? 'none' : 'auto' 
          }}
          transition={{ duration: 0.3 }}
          className="flex justify-between items-start z-10 shrink-0 mt-1"
        >
          <div className="max-w-[calc(100%-150px)] pb-1">
            <div className="mb-1">
              <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">Namma<br />Hood</h1>
            </div>
            <p className="text-zinc-400 text-xs font-semibold mt-1">Together, we’re making Bangalore the garden city again.</p>
          </div>
        </motion.div>

        {/* Main Content Area - Fixed Bounds */}
        <div className="w-full flex-1 relative mt-2">

          {/* Map Wrapper (Fixed Size) */}
          <div className="w-full h-full absolute inset-0 overflow-hidden rounded-2xl bg-black border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Map Container */}
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full absolute top-0 left-0 right-0 z-0 h-full"
            >
              <GarbageMap 
                userLoc={userLoc} 
                externalRouteDest={missionRouteDest} 
                onActiveRouteChange={setIsMapRouting} 
                xpEvent={xpEvent}
                onNavInstructionChange={setNavInstruction}
                onNavDistanceChange={setNavDistance}
                onClearRoute={() => setMissionRouteDest(null)}
              />

              {/* Demo Mode Top Indicator */}
              {isDemoMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-[990] flex items-center space-x-2 bg-black/85 backdrop-blur-md border border-[#10b981]/40 px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto"
                >
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]" />
                  <span className="text-white text-xs font-bold tracking-tight">
                    Demo Mode: <span className="text-[#10b981]">{DEMO_HUBS.find(h => h.id === selectedHubId)?.name || "JP Nagar"}</span>
                  </span>
                  <button
                    onClick={exitDemoMode}
                    className="text-zinc-400 hover:text-white text-[11px] font-bold bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full transition-colors ml-1 cursor-pointer"
                  >
                    Exit
                  </button>
                </motion.div>
              )}

              {/* Combined Missions & Nearest Cleanup Overlay */}
              <AnimatePresence>
                {!isMissionsCollapsed && (
                  <motion.div
                    key="combined-missions"
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="absolute bottom-4 left-4 right-4 z-[9999] glass-panel border border-[#10b981]/20 bg-[#000000]/95 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,1)] flex flex-col space-y-4"
                  >
                    <button
                      onClick={() => setIsMissionsCollapsed(true)}
                      className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors bg-white/5 p-1 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Today's Missions Section */}
                    <div className="pt-1">
                      <h3 className={`${Object.values(claims).filter(Boolean).length === dailyMissions.length && dailyMissions.length > 0 ? 'text-[#10b981]/80' : 'text-[#ff4d6d]/80'} font-black text-[11px] uppercase tracking-widest flex items-center mb-3`}>
                        <div className="relative flex items-center justify-center mr-2 w-2 h-2">
                          <div className={`w-2 h-2 rounded-full ${Object.values(claims).filter(Boolean).length === dailyMissions.length && dailyMissions.length > 0 ? 'bg-[#10b981]' : 'bg-[#ff4d6d]'}`} />
                          {!(Object.values(claims).filter(Boolean).length === dailyMissions.length && dailyMissions.length > 0) && (
                            <div className="absolute inset-0 rounded-full border border-[#ff4d6d] animate-ping opacity-75 scale-150" />
                          )}
                        </div>
                        Today's Missions
                      </h3>

                      <div className="space-y-2.5">
                        {dailyMissions.map((mission, index) => {
                          const isCompleted = completions[mission.id];
                          const isClaimed = claims[mission.id];

                          return (
                            <div key={mission.id} className={`flex items-center justify-between ${isCompleted ? 'opacity-100' : 'opacity-70'}`}>
                              <div className="flex items-center space-x-3">
                                {isClaimed ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                                ) : (
                                  <div className={`w-5 h-5 rounded-full border-2 ${isCompleted ? 'border-[#10b981] bg-[#10b981]/20' : 'border-zinc-500 bg-white/5'}`} />
                                )}
                                <span className={`font-bold text-[13px] ${isCompleted ? 'text-white' : 'text-zinc-300'}`}>{mission.title}</span>
                              </div>
                              {isClaimed ? (
                                <span className="text-[#10b981] font-black text-[10px] uppercase tracking-wider bg-[#10b981]/10 px-2 py-1 rounded">Claimed</span>
                              ) : isCompleted ? (
                                <button
                                  onClick={() => claimMission(mission)}
                                  className={`text-black font-black text-xs ${index === 2 ? 'bg-[#d4af37] hover:bg-[#d4af37]/80 shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-[#10b981] hover:bg-[#10b981]/80 shadow-[0_0_10px_rgba(16,185,129,0.4)]'} px-3 py-1 rounded transition-all active:scale-95`}
                                >
                                  Claim +{mission.xp} XP
                                </button>
                              ) : (
                                <span className="text-zinc-400 font-black text-[10px] bg-white/5 px-2 py-1 rounded">+{mission.xp} XP</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nearest Cleanup Section */}
                    {closestMission && (
                      <div className="pt-4 border-t border-white/10 mt-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="relative flex items-center justify-center w-2 h-2">
                            <div className="w-2 h-2 bg-[#ff4d6d] rounded-full" />
                            {!isMissionDismissed && (
                              <div className="absolute inset-0 rounded-full border border-[#ff4d6d] animate-ping opacity-75 scale-150" />
                            )}
                          </div>
                          <p className="text-[#ff4d6d]/80 font-black text-[11px] uppercase tracking-widest">Nearest Mission Available</p>
                        </div>
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <h3 className="text-[#d4af37] font-bold text-lg leading-tight mb-0.5">
                              {closestMission.severity === 4 || closestMission.severity === 'high' ? 'Critical Biohazard' :
                                closestMission.severity === 3 || closestMission.severity === 'medium' ? 'Severe Garbage Dump' :
                                  closestMission.severity === 2 ? 'Moderate Trash Pile' : 'Overflowing Garbage'}
                            </h3>
                            <p className="text-zinc-400 text-xs font-semibold">{closestMission.distance}m away</p>
                          </div>
                          <button
                            onClick={openNavigation}
                            className="bg-[#f14f4f] text-white font-black py-2.5 px-5 rounded-xl flex items-center space-x-2 active:scale-95 transition-transform shadow-[0_0_15px_rgba(241,79,79,0.4)]"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Navigate</span>
                          </button>
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl flex items-center justify-between border border-white/5">
                          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Completion Reward</span>
                          <span className="text-[#d4af37] text-xs font-black">+20 Eco XP</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Glowing FAB Info Button */}
                {isMissionsCollapsed && !isMapRouting && (
                  <motion.div
                    key="mission-fab"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute bottom-5 right-5 z-[9999]"
                  >
                    <button
                      onClick={() => {
                        setIsMissionsCollapsed(false);
                        setHasOpenedMissions(true);
                        sessionStorage.setItem('namma_missions_opened', 'true');
                      }}
                      className="w-12 h-12 bg-[#ff4d6d] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,77,109,0.5)] border border-[#10b981]/20 active:scale-95 transition-transform relative"
                    >
                      {/* Glowing ring animation */}
                      {!(Object.values(claims).filter(Boolean).length === dailyMissions.length && dailyMissions.length > 0) && !hasOpenedMissions && (
                        <div className="absolute inset-0 rounded-full border-2 border-[#ff4d6d] animate-ping opacity-60" />
                      )}
                      <Info className="w-6 h-6 text-white relative z-10" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
