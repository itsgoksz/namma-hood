"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
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

  const isUsernameValid = name.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(name.trim()) && !hasProfanity(name.trim());
  const hasMinLength = password.length >= 8;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasLettersAndNumbers && password.length >= 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[10000] bg-[#030604] flex flex-col items-center justify-center p-3.5 sm:p-6 overflow-y-auto overflow-x-hidden selection:bg-emerald-500 selection:text-black"
        >
          {/* Layer 1: Precision Telemetry Grid Background (Bengaluru Civic Grid) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="civic-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#10b981" strokeWidth="1" />
                  <circle cx="48" cy="48" r="1.5" fill="#10b981" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#civic-grid)" />
            </svg>
          </div>

          {/* Layer 2: Ambient Ethereal Atmosphere Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[550px] bg-gradient-to-b from-emerald-500/18 via-teal-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-80 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Micro Top Status Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-3.5 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080e0a]/90 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-emerald-400 uppercase">
              Maken Bengaluru the Garden City Again
            </span>
          </motion.div>

          {/* Main Obsidian Vault Modal */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="z-10 w-full max-w-[390px] flex flex-col items-center text-center space-y-4 sm:space-y-4.5 bg-[#070b09]/92 backdrop-blur-3xl p-5 sm:p-7 rounded-[2.25rem] border border-white/[0.09] shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_60px_rgba(16,185,129,0.08)] my-auto relative overflow-hidden"
          >
            {/* Specular Top Chamfer Glow Line */}
            <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent pointer-events-none" />

            {/* Architectural Corner Registration Marks */}
            <div className="absolute top-3.5 left-3.5 w-2 h-2 border-t border-l border-emerald-500/30 pointer-events-none" />
            <div className="absolute top-3.5 right-3.5 w-2 h-2 border-t border-r border-emerald-500/30 pointer-events-none" />
            <div className="absolute bottom-3.5 left-3.5 w-2 h-2 border-b border-l border-emerald-500/30 pointer-events-none" />
            <div className="absolute bottom-3.5 right-3.5 w-2 h-2 border-b border-r border-emerald-500/30 pointer-events-none" />

            {/* Handcrafted Mathematical Brand Crest (Zero AI-Artifacts) */}
            <div className="relative group pt-1">
              {/* Radial back glow */}
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-b from-emerald-500/35 via-teal-500/20 to-transparent blur-xl opacity-80 group-hover:opacity-100 transition duration-700 pointer-events-none" />

              {/* Outer Frosted Obsidian Medallion */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-[1.75rem] bg-gradient-to-b from-white/15 via-white/[0.03] to-transparent p-[1.5px] shadow-[0_12px_35px_rgba(0,0,0,0.85)]">
                <div className="w-full h-full rounded-[1.65rem] bg-gradient-to-b from-[#090f0c] to-[#040705] flex items-center justify-center p-3 sm:p-3.5 overflow-hidden relative">
                  {/* Subtle inner glass diagonal sheen */}
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/[0.08] rotate-45 pointer-events-none blur-sm" />

                  {/* Vector SVG Brand Emblem */}
                  <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full filter drop-shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                  >
                    <defs>
                      <linearGradient id="crest-primary" x1="45" y1="88" x2="85" y2="12" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="45%" stopColor="#10b981" />
                        <stop offset="85%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#6ee7b7" />
                      </linearGradient>

                      <linearGradient id="crest-secondary" x1="22" y1="82" x2="42" y2="34" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#047857" />
                        <stop offset="50%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>

                      <linearGradient id="crest-inner-rib" x1="50" y1="85" x2="75" y2="22" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#a7f3d0" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
                      </linearGradient>

                      <linearGradient id="crest-sec-rib" x1="32" y1="78" x2="36" y2="42" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>

                    {/* Foundation / Left Cotyledon Leaf */}
                    <path
                      d="M 48 84 C 36 82 22 72 20 54 C 18 42 24 35 34 33 C 44 31 48 40 48 54 C 48 66 48 78 48 84 Z"
                      fill="url(#crest-secondary)"
                    />
                    <path
                      d="M 44 76 C 36 68 28 58 29 48"
                      stroke="url(#crest-sec-rib)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />

                    {/* Ascending Civic Sprout */}
                    <path
                      d="M 52 86 C 52 74 53 58 59 44 C 65 30 73 18 80 14 C 82 13 83 14 83 17 C 82 28 82 42 76 56 C 70 70 61 80 52 86 Z"
                      fill="url(#crest-primary)"
                    />
                    <path
                      d="M 52 86 C 60 76 72 62 76 44 C 80 26 78 16 80 14 C 76 22 68 34 60 50 C 54 62 52 76 52 86 Z"
                      fill="#ffffff"
                      opacity="0.18"
                    />
                    <path
                      d="M 54 80 C 58 68 66 50 74 28"
                      stroke="url(#crest-inner-rib)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Radiant Core Origin */}
                    <circle cx="50" cy="87" r="3.5" fill="#34d399" />
                    <circle cx="50" cy="87" r="1.5" fill="#ffffff" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Header */}
            <div className="space-y-1 text-center">
              <h1 className="text-2xl sm:text-[27px] font-black text-white tracking-tight uppercase leading-none flex items-center justify-center gap-1.5">
                <span>Namma</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                  Hood
                </span>
              </h1>
              <p className="text-[12px] font-medium text-zinc-400 max-w-[280px] mx-auto leading-tight pt-0.5">
                {isLoginMode
                  ? "Your missions are waiting for you"
                  : "Spot civic issues, report them or organize cleanup squads, and earn XP through which you can even earn a free breakfast"}
              </p>
            </div>

            {/* Real-time Telemetry Impact Ticker */}
            <div className="w-full grid grid-cols-3 divide-x divide-white/[0.06] bg-[#050806]/80 rounded-xl py-2 px-1 border border-white/[0.06] text-center">
              <div>
                <div className="text-[12px] font-extrabold text-white">Make your own Squad</div>
                <div className="text-[9px] font-mono text-zinc-500 uppercase"></div>
              </div>
              <div>
                <div className="text-[12px] font-extrabold text-emerald-400">+50 XP and more for a Cleanup</div>
                {/* <div className="text-[9px] font-mono text-zinc-500 uppercase">Per Cleanup</div> */}
              </div>
              <div>
                <div className="text-[12px] font-extrabold text-teal-300">+25 XP for a Garbage Report</div>
                {/* <div className="text-[9px] font-mono text-zinc-500 uppercase">Per Report</div> */}
              </div>
            </div>

            {/* Apple / Linear Style Segmented Tab Switcher */}
            <div className="w-full p-1 bg-[#040705] rounded-2xl border border-white/[0.08] flex relative shadow-inner">
              <button
                type="button"
                onClick={() => { setIsLoginMode(false); setErrorMsg(""); }}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-colors duration-200 relative z-10 cursor-pointer",
                  !isLoginMode ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {!isLoginMode && (
                  <motion.div
                    layoutId="active-auth-pill"
                    className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 rounded-xl border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5 font-bold">
                  {!isLoginMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  New User
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setIsLoginMode(true); setErrorMsg(""); }}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-colors duration-200 relative z-10 cursor-pointer",
                  isLoginMode ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {isLoginMode && (
                  <motion.div
                    layoutId="active-auth-pill"
                    className="absolute inset-0 bg-gradient-to-b from-white/15 to-white/5 rounded-xl border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5 font-bold">
                  {isLoginMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  Sign In
                </span>
              </button>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3 mt-1">
              <div className="space-y-2.5 w-full text-left">
                {/* Username Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <span>USERNAME</span>
                      {/* <span className="text-zinc-600">• USERNAME</span> */}
                    </label>
                    {name.length > 0 && (
                      <span className={cn(
                        "text-[9px] font-mono font-bold",
                        isUsernameValid ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {isUsernameValid ? "✓ VALID FORMAT" : "3-20 ALPHANUMERIC"}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center bg-[#050806]/95 border border-white/[0.08] rounded-2xl focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden shadow-inner">
                    <div className="pl-3.5 pr-2 text-zinc-500 font-mono text-sm font-bold select-none">@</div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. eco_warrior12"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full bg-transparent py-2.5 pr-4 text-white placeholder:text-zinc-600 focus:outline-none font-semibold text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <span>PASSWORD</span>
                    </label>
                    {!isLoginMode && password.length > 0 && (
                      <span className="text-[9px] font-mono font-bold text-zinc-500">
                        {isPasswordStrong ? "🟢 STRONG" : hasMinLength ? "🟡 GOOD" : "⚪ MIN 8 CHARS"}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center bg-[#050806]/95 border border-white/[0.08] rounded-2xl focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden shadow-inner">
                    <div className="pl-3.5 pr-2 text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isLoginMode ? "••••••••" : "Min 8 letters & numbers"}
                      className="w-full bg-transparent py-2.5 pr-10 text-white placeholder:text-zinc-600 focus:outline-none font-semibold text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Dynamic 3-Bar Password Visual Gauge (Sign Up Only) */}
                {!isLoginMode && password.length > 0 && (
                  <div className="space-y-1.5 px-1 pt-0.5">
                    <div className="grid grid-cols-3 gap-1.5 h-1">
                      <div className={cn("rounded-full transition-colors duration-300", password.length > 0 ? (hasMinLength ? "bg-emerald-400" : "bg-amber-400") : "bg-zinc-800")} />
                      <div className={cn("rounded-full transition-colors duration-300", hasLettersAndNumbers ? "bg-emerald-400" : "bg-zinc-800")} />
                      <div className={cn("rounded-full transition-colors duration-300", isPasswordStrong ? "bg-emerald-400" : "bg-zinc-800")} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className={hasMinLength ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                        {hasMinLength ? "✓" : "○"} 8+ chars
                      </span>
                      <span className={hasLettersAndNumbers ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                        {hasLettersAndNumbers ? "✓" : "○"} Letters &amp; numbers
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold p-2.5 rounded-xl flex items-start space-x-2 text-left"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span className="leading-tight">{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary Action Button (The High-Craft Jewel) */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 p-[1px] shadow-[0_12px_30px_-5px_rgba(16,185,129,0.45)] disabled:opacity-50 cursor-pointer transition-all mt-2"
              >
                {/* Top specular reflection line */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-white/40 pointer-events-none" />
                <div className="relative flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-b from-black/0 via-black/5 to-black/25 py-3 px-4 font-black text-black text-sm tracking-wide">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="font-extrabold tracking-wide">
                        {isLoginMode ? "Welcome back" : "Let's get you started"}
                      </span>
                      <ArrowRight className="w-4 h-4 stroke-[2.8] group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Seamless VIP Guest / Observer Access */}
            <div className="pt-2 w-full border-t border-white/[0.07] flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleGuestEnter}
                className="w-full text-xs text-zinc-400 hover:text-white transition-all font-semibold flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] cursor-pointer group"
              >
                <span className="text-[11px] text-zinc-500">Outside Bengaluru or just checking us out?</span>
                <span className="text-emerald-400 font-bold group-hover:underline underline-offset-2 flex items-center gap-1">
                  <span>Enter With Guest Pass</span>
                  <span>→</span>
                </span>
              </button>

              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
                <span>🛡️ CIVIC ENCRYPTION</span>
                <span>•</span>
                <span>NO TRACKERS</span>
                <span>•</span>
                <span>BENGALURU</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
