"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Leaf, Lock, User, AlertCircle, Eye, EyeOff, Sparkles, Shield, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFastLocation } from "@/lib/location";
import { hasProfanity, validatePassword, cn } from "@/lib/utils";

export default function LoginOverlay() {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoginMode, setIsLoginMode] = useState(false); // Default to signup
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setIsMounted(true);
    // Check if user is already logged in (Supabase session exists)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsOpen(false);
        // Sync local storage just in case
        if (session.user.email) {
            localStorage.setItem("namma_user", session.user.email.split('@')[0]);
        }
      }
    };
    checkSession();
  }, []);

  const handleGuestEnter = () => {
    if (!localStorage.getItem("namma_user")) {
      localStorage.setItem("namma_user", "guest_guardian");
    }
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmedName = name.trim();
    
    if (trimmedName.length <= 2) {
      setErrorMsg("Username must be at least 3 characters long.");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      setErrorMsg("Username can only contain letters, numbers, and underscores.");
      return;
    }
    
    if (hasProfanity(trimmedName)) {
      setErrorMsg("Please choose an appropriate username.");
      return;
    }

    const dummyEmail = `${trimmedName.toLowerCase()}@user.nammavoice.in`;

    setIsLoading(true);

    try {
      if (isLoginMode) {
        // Handle Login
        const { error } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password: password
        });
        
        if (error) {
          setErrorMsg("Invalid username or password.");
          setIsLoading(false);
          return;
        }
        
        // Check if user is banned
        const { data: userProfile } = await supabase.from('users').select('banned').ilike('name', trimmedName).maybeSingle();
        if (userProfile && userProfile.banned) {
          await supabase.auth.signOut();
          setErrorMsg("Your account has been banned by an administrator due to community flags.");
          setIsLoading(false);
          return;
        }
        
        // Ensure legacy localStorage is synced
        localStorage.setItem("namma_user", trimmedName);
        setIsOpen(false);
        
      } else {
        // Handle Sign Up

        // Anti-spam registration rate limit (max 3 per day per device)
        const today = new Date().toISOString().split('T')[0];
        const regCount = parseInt(localStorage.getItem(`namma_reg_count_${today}`) || '0');
        if (regCount >= 3) {
          setErrorMsg("Device limit reached. You can only create 3 accounts per day from this device to prevent spam.");
          setIsLoading(false);
          return;
        }

        const passValidation = validatePassword(password);
        if (!passValidation.valid) {
          setErrorMsg(passValidation.message);
          setIsLoading(false);
          return;
        }

        // Check if username is already taken in the public users table
        const { data: existingUser } = await supabase.from('users').select('name').ilike('name', trimmedName).maybeSingle();
        if (existingUser) {
          setErrorMsg("This username is already taken.");
          setIsLoading(false);
          return;
        }

        // Attempt signup
        const { error: signUpError } = await supabase.auth.signUp({
          email: dummyEmail,
          password: password
        });

        if (signUpError) {
          const sanitizedMsg = signUpError.message.includes('Email') 
            ? "Could not create account with this username. Please try another."
            : signUpError.message;
          setErrorMsg(sanitizedMsg);
          setIsLoading(false);
          return;
        }

        // Create initial profile
        let loc = { lat: 0, lng: 0 };
        try {
          loc = await getFastLocation();
        } catch (e) {
          console.log("Could not get location for login");
        }

        let area = "Unknown";
        if (loc.lat >= 12.92 && loc.lat <= 12.94 && loc.lng >= 77.57 && loc.lng <= 77.60) area = "Jayanagar";
        else if (loc.lat >= 12.90 && loc.lat <= 12.92 && loc.lng >= 77.57 && loc.lng <= 77.60) area = "JP Nagar";
        else if (loc.lat >= 12.90 && loc.lat <= 12.92 && loc.lng >= 77.60 && loc.lng <= 77.62) area = "BTM Layout";

        await supabase.from('users').insert([{ name: trimmedName, area }]);

        localStorage.setItem(`namma_reg_count_${today}`, (regCount + 1).toString());
        localStorage.setItem("namma_user", trimmedName);
        setIsOpen(false);
      }
    } catch (e) {
      console.error("Auth failed", e);
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] bg-[#000000]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#10b981]/15 rounded-full blur-[100px] pointer-events-none" />

          <motion.div 
            initial={{ y: 25, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="z-10 w-full max-w-sm flex flex-col items-center text-center space-y-5 bg-[#0a0f0d]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] border border-[#10b981]/25 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.12)] my-auto relative overflow-hidden"
          >
            {/* Top Branding */}
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10b981]/25 to-[#10b981]/5 border border-[#10b981]/40 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Leaf className="w-8 h-8 text-[#10b981]" strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Namma Hood</h1>
              <p className="text-zinc-400 font-medium text-xs">
                Bangalore&apos;s Civic Action &amp; Cleanup Network
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-bold text-zinc-300">
              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#10b981]" /> Live Missions
              </span>
              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Trophy className="w-3 h-3 text-[#d4af37]" /> Eco XP
              </span>
              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#38bdf8]" /> Ward Ranks
              </span>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 w-full">
              <button
                type="button"
                onClick={() => { setIsLoginMode(false); setErrorMsg(""); }}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-lg transition-all relative",
                  !isLoginMode ? "text-black" : "text-zinc-400 hover:text-white"
                )}
              >
                {!isLoginMode && (
                  <motion.div
                    layoutId="auth-tab"
                    className="absolute inset-0 bg-[#10b981] rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Create Account</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsLoginMode(true); setErrorMsg(""); }}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-lg transition-all relative",
                  isLoginMode ? "text-black" : "text-zinc-400 hover:text-white"
                )}
              >
                {isLoginMode && (
                  <motion.div
                    layoutId="auth-tab"
                    className="absolute inset-0 bg-[#10b981] rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Sign In</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-3.5 mt-1">
              <div className="space-y-3">
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Username (e.g. gokul_hood)"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all font-semibold text-sm"
                    required
                  />
                </div>
                
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLoginMode ? "Enter password" : "Create password (8+ chars)"}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all font-semibold text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-zinc-500 hover:text-white transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold p-3 rounded-xl flex items-start space-x-2 text-left"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span className="leading-tight">{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!isLoginMode && (
                <p className="text-zinc-500 text-[11px] font-medium px-1 text-left leading-tight">
                  Your username is public and used for ward missions, leaderboards, and cleanup squads.
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] hover:brightness-110 text-black font-black py-3.5 rounded-xl flex items-center justify-center space-x-2 text-sm disabled:opacity-50 transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isLoginMode ? "Sign In to Namma Hood" : "Create Account & Join"}</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Quick Guest Preview Action */}
            <div className="pt-2 w-full border-t border-white/10 flex flex-col items-center gap-1.5">
              <button 
                type="button"
                onClick={handleGuestEnter}
                className="text-xs text-zinc-400 hover:text-[#10b981] transition-colors font-bold flex items-center gap-1"
              >
                <span>Just exploring?</span>
                <span className="underline underline-offset-2">Browse as Guest →</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
