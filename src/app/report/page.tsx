"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera as CameraIcon, Upload, CheckCircle2, AlertTriangle, AlertOctagon, Info, Flame, RotateCcw, MapPin, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { getCurrentUser } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { getFastLocation } from "@/lib/location";
import { cn, compressImageBase64 } from "@/lib/utils";
import { enqueueOfflineTask } from "@/lib/offlineSync";

const SEVERITIES = [
  { value: 1, label: "Light", desc: "Small litter, cups, wrappers", xp: "+10 XP", icon: Info, color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/50", glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]", tag: "LVL 1" },
  { value: 2, label: "Moderate", desc: "Noticeable trash pile or overflow", xp: "+20 XP", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/50", glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]", tag: "LVL 2" },
  { value: 3, label: "Severe", desc: "Large commercial or street dump", xp: "+30 XP", icon: Flame, color: "text-orange-400", bg: "bg-orange-500", border: "border-orange-500/50", glow: "shadow-[0_0_20px_rgba(249,115,22,0.25)]", tag: "LVL 3" },
  { value: 4, label: "Critical", desc: "Biohazard, toxic, blocked canal", xp: "+40 XP", icon: AlertOctagon, color: "text-rose-400", bg: "bg-rose-500", border: "border-rose-500/50", glow: "shadow-[0_0_20px_rgba(244,63,94,0.25)]", tag: "LVL 4" }
];

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

export default function ReportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const takePhoto = async () => {
    setErrorMsg(null);
    try {
      try {
        const permissions = await Camera.requestPermissions({ permissions: ['camera'] });
        if (permissions.camera === 'denied' || permissions.camera === 'prompt-with-rationale') {
          setErrorMsg("Camera permission is required to capture live evidence. Please allow camera access in device settings.");
          return;
        }
      } catch (e) { }

      const image = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      if (image.base64String) {
        setPhoto(`data:image/jpeg;base64,${image.base64String}`);
      }
    } catch (e: any) {
      if (e?.message?.includes("User cancelled") || e?.message?.includes("cancelled")) {
        return;
      }
      console.warn("Camera trigger fallback", e);
      // Hardware camera-only web fallback (capture="environment" triggers rear camera, not gallery)
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setErrorMsg("Camera access failed. Live photo capture is required to prevent cheating.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!photo || !severity) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    const finalLocation = await getFastLocation();
    const username = getCurrentUser();

    try {
      // Spam Check: Max 5 reports per hour within a 50m radius
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentReports } = await supabase
        .from('reports')
        .select('lat, lng')
        .eq('username', username)
        .gte('timestamp', oneHourAgo);

      if (recentReports) {
        let nearbyCount = 0;
        recentReports.forEach(r => {
          if (getDistance(finalLocation.lat, finalLocation.lng, r.lat, r.lng) < 50) {
            nearbyCount++;
          }
        });

        if (nearbyCount >= 5) {
          setErrorMsg("Spam prevented: You've already made 5 reports in this specific area in the last hour. Please move to a new location to continue earning XP.");
          setIsSubmitting(false);
          return;
        }
      }

      const compressedPhoto = await compressImageBase64(photo);

      let imageUrl = null;
      if (compressedPhoto) {
        try {
          const res = await fetch(compressedPhoto);
          const blob = await res.blob();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const { data, error } = await supabase.storage.from('uploads').upload(fileName, blob, { contentType: 'image/jpeg' });
          if (!error && data) {
            imageUrl = data.path;
          }
        } catch (e) {
          console.error("Storage upload failed", e);
        }
      }

      const selectedSeverity = SEVERITIES.find(s => s.value === severity)?.label.toLowerCase() || 'light';

      const payload = {
        username,
        lat: finalLocation.lat,
        lng: finalLocation.lng,
        severity: selectedSeverity,
        image_base64: imageUrl
      };

      try {
        const { error } = await supabase.from('reports').insert([payload]);
        if (error) throw error;
      } catch (e) {
        console.warn("Network failed, enqueuing offline task", e);
        await enqueueOfflineTask('/reports', 'POST', payload);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2200);
    } catch (e) {
      console.error("Failed to process report", e);
      setErrorMsg("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    const earnedXp = SEVERITIES.find(s => s.value === severity)?.xp || "+10 XP";
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-5 max-w-sm mx-auto">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="w-24 h-24 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.35)]"
        >
          <CheckCircle2 className="w-14 h-14 text-emerald-400" />
        </motion.div>

        <div className="space-y-1.5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold"
          >
            <span>MISSION DISPATCHED</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white tracking-tight uppercase"
          >
            Report Logged!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-zinc-400 text-xs font-medium max-w-xs mx-auto"
          >
            Civic patrol squads notified. You earned <strong className="text-emerald-400 font-bold">{earnedXp}</strong> towards your ward level.
          </motion.p>
        </div>
      </div>
    );
  }

  const selectedSeverityObj = SEVERITIES.find(s => s.value === severity);

  return (
    <div className="p-4 space-y-5 h-full overflow-y-auto flex flex-col pt-safe-header pb-[calc(env(safe-area-inset-bottom)+8rem)] max-w-md mx-auto relative z-10 selection:bg-emerald-500 selection:text-black">

      {/* Hidden File Picker Fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start justify-center mt-2 space-y-1 w-full"
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>EVIDENCE CAPTURE // BLR</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
          Report Issue
        </h1>
        <p className="text-zinc-400 text-xs font-medium">
          Capture the piles to deploy community cleanup squads.
        </p>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-red-500/15 border border-red-500/30 p-3 rounded-2xl flex items-start space-x-2.5 text-left"
          >
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-red-300 leading-snug">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewfinder Camera Plinth */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="w-full flex flex-col items-center"
      >
        <div
          onClick={!photo ? takePhoto : undefined}
          className={cn(
            "w-full rounded-[2rem] border transition-all overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.85)]",
            photo
              ? "border-emerald-500/30 aspect-[4/3] bg-black"
              : "border-white/[0.1] hover:border-emerald-500/40 bg-[#070b09]/95 backdrop-blur-3xl aspect-[4/3] flex flex-col items-center justify-center cursor-pointer group active:scale-[0.99]"
          )}
        >
          {/* Top Chamfer Light Rim */}
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none z-20" />

          {/* Tactical Viewfinder Corner Registration Crosshairs */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400/70 pointer-events-none z-20" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400/70 pointer-events-none z-20" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400/70 pointer-events-none z-20" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400/70 pointer-events-none z-20" />

          {photo ? (
            <>
              {/* Captured Image Display */}
              <img src={photo} alt="Captured evidence" className="w-full h-full object-cover" />

              {/* Top Verified Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold uppercase shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>GEO-EVIDENCE ATTACHED</span>
              </div>

              {/* Retake Floating Pill */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); takePhoto(); }}
                className="absolute bottom-4 right-4 z-20 bg-black/75 hover:bg-black/90 backdrop-blur-xl px-3.5 py-2 rounded-xl text-white text-xs font-bold border border-white/20 shadow-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </>
          ) : (
            <>
              {/* Telemetry Stamps */}
              <div className="absolute top-4 inset-x-6 flex justify-between items-center text-[9px] font-mono text-zinc-500 pointer-events-none z-10">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>CAM // ARMED</span>
                </span>
                <span>GRID // BLR_SOUTH</span>
              </div>

              {/* Center Shutter Aperture Button */}
              <div className="relative group-hover:scale-105 transition-transform duration-300 flex flex-col items-center">
                {/* Radial ambient aura */}
                <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />

                <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-white/10 to-white/[0.02] p-[1.5px] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                  <div className="w-full h-full rounded-full bg-[#0a110d] flex items-center justify-center border border-emerald-500/30 relative overflow-hidden group-hover:border-emerald-400 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-white/10 pointer-events-none" />
                    <CameraIcon className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  </div>
                </div>

                <div className="mt-3.5 text-center">
                  <span className="text-base font-extrabold text-white tracking-tight block">
                    Take Photo
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 block mt-0.5">
                    Tap to trigger live camera shutter
                  </span>
                </div>
              </div>

              {/* Bottom Telemetry */}
              <div className="absolute bottom-4 inset-x-6 flex justify-center items-center text-[9px] font-mono text-zinc-500 pointer-events-none z-10">
                <span>HIGH RES EVIDENCE ENCRYPTION</span>
              </div>
            </>
          )}
        </div>

        {/* Anti-Cheat Real-time Verification Badge */}
        {!photo && (
          <div className="mt-3.5 text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/[0.025] border border-white/[0.07] shadow-inner select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-zinc-300 font-semibold">Live Camera Feed Only</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">Camera Roll Disabled</span>
          </div>
        )}
      </motion.div>

      {/* Severity Selection Stage */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <span>ISSUE SEVERITY</span>
            <span className="text-zinc-600">• REWARD TIER</span>
          </h2>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            {severity ? `${selectedSeverityObj?.xp} UPON APPROVAL` : "SELECT ONE"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {SEVERITIES.map((s) => {
            const isSelected = severity === s.value;
            const Icon = s.icon;
            return (
              <motion.button
                key={s.value}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setSeverity(s.value)}
                className={cn(
                  "p-3 rounded-2xl border flex flex-col items-start transition-all text-left relative overflow-hidden cursor-pointer",
                  isSelected
                    ? `bg-[#0a120e] ${s.border} ${s.glow}`
                    : "bg-[#070b09]/80 border-white/[0.06] hover:border-white/[0.15]"
                )}
              >
                {/* Active Indicator Pip */}
                <div className="w-full flex items-center justify-between mb-2">
                  <div className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center border",
                    isSelected ? "bg-white/10 border-white/20" : "bg-white/[0.03] border-white/[0.06]"
                  )}>
                    <Icon className={cn("w-4 h-4", isSelected ? s.color : "text-zinc-500")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border",
                    isSelected ? `${s.color} bg-white/10 border-white/20` : "text-zinc-500 bg-white/[0.02] border-white/[0.04]"
                  )}>
                    {s.xp}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("font-bold text-sm", isSelected ? "text-white" : "text-zinc-300")}>
                      {s.label}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 font-bold">
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium leading-tight">
                    {s.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Helpful Civic Guideline Tip */}
      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-3 flex items-start space-x-2.5">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
          Each report helps our community make progress to become free of gargabe on our roads and footpaths
        </p>
      </div>

      {/* Submit Action Button */}
      <div className="pt-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !photo || !severity}
          className={cn(
            "w-full relative group overflow-hidden rounded-2xl p-[1px] transition-all cursor-pointer",
            photo && severity
              ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 shadow-[0_12px_30px_-5px_rgba(16,185,129,0.45)]"
              : "bg-white/[0.06] opacity-60 cursor-not-allowed"
          )}
        >
          {photo && severity && (
            <div className="absolute top-0 inset-x-0 h-[1px] bg-white/40 pointer-events-none" />
          )}
          <div className={cn(
            "relative flex items-center justify-center space-x-2 rounded-2xl py-3.5 px-4 font-black text-sm tracking-wide transition-colors",
            photo && severity
              ? "bg-gradient-to-b from-black/0 via-black/5 to-black/25 text-black"
              : "bg-[#0a0f0c] text-zinc-500"
          )}>
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Upload className={cn("w-4 h-4 stroke-[2.5]", photo && severity ? "text-black" : "text-zinc-500")} />
                <span>
                  {!photo
                    ? "Capture photo to continue"
                    : !severity
                      ? "Select issue severity"
                      : `Submit Report (${selectedSeverityObj?.xp})`}
                </span>
                {photo && severity && (
                  <ArrowRight className="w-4 h-4 stroke-[2.8] group-hover:translate-x-0.5 transition-transform" />
                )}
              </>
            )}
          </div>
        </motion.button>
      </div>

    </div>
  );
}
