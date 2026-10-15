"use client";

import React from "react";

interface ShopItemIconProps {
  itemId: string;
  className?: string;
  size?: number;
}

export const ShopItemIcon = ({ itemId, className = "w-8 h-8" }: ShopItemIconProps) => {
  switch (itemId) {
    case "aura_gold":
      // Golden Guardian Aura: Concentric celestial solar aura with 8-point radiant compass star & orbital rings
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <radialGradient id="gold-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <linearGradient id="gold-ring" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.8" />
            </linearGradient>
            <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.6" />
            </filter>
          </defs>
          <g filter="url(#gold-glow)">
            {/* Outer Concentric Pulse Rings */}
            <circle cx="24" cy="24" r="20" stroke="url(#gold-ring)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="24" cy="24" r="15" stroke="url(#gold-ring)" strokeWidth="1.5" />
            
            {/* Cardinal Ray Ticks */}
            <line x1="24" y1="3" x2="24" y2="7" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="41" x2="24" y2="45" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="24" x2="7" y2="24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="41" y1="24" x2="45" y2="24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />

            {/* Radiant 8-Point Diamond Star */}
            <path
              d="M 24 9 L 27.5 20.5 L 39 24 L 27.5 27.5 L 24 39 L 20.5 27.5 L 9 24 L 20.5 20.5 Z"
              fill="url(#gold-core)"
            />
            {/* Secondary Diagonal Diamond Points */}
            <path
              d="M 24 14 L 26 22 L 34 24 L 26 26 L 24 34 L 22 26 L 14 24 L 22 22 Z"
              fill="#ffffff"
              opacity="0.45"
            />
            {/* Specular Center Spark */}
            <circle cx="24" cy="24" r="3" fill="#ffffff" />
          </g>
        </svg>
      );

    case "aura_cyber":
      // Cyber Neon Trail: Precision kinetic lightning shard with speed trails and cyan/emerald laser arcs
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="cyber-shard" x1="12" y1="4" x2="38" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#a3e635" />
            </linearGradient>
            <linearGradient id="cyber-trail" x1="0" y1="24" x2="30" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
            </linearGradient>
            <filter id="cyber-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#22d3ee" floodOpacity="0.65" />
            </filter>
          </defs>
          <g filter="url(#cyber-glow)">
            {/* Horizontal Speed Glitch Trails */}
            <line x1="6" y1="16" x2="20" y2="16" stroke="url(#cyber-trail)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4" y1="24" x2="16" y2="24" stroke="url(#cyber-trail)" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="32" x2="22" y2="32" stroke="url(#cyber-trail)" strokeWidth="1.5" strokeLinecap="round" />

            {/* Dual Precision Kinetic Shard Lightning */}
            <path
              d="M 28 4 L 14 24 L 24 24 L 20 44 L 36 22 L 26 22 Z"
              fill="url(#cyber-shard)"
            />
            {/* Interior Specular Lightning Spine */}
            <path
              d="M 27 7 L 17 23 L 24 23 L 21 38 L 32 23 L 26 23 Z"
              fill="#ffffff"
              opacity="0.65"
            />
            {/* Cyber Data Nodes */}
            <circle cx="28" cy="4" r="1.5" fill="#ffffff" />
            <circle cx="20" cy="44" r="1.5" fill="#a3e635" />
          </g>
        </svg>
      );

    case "title_terminator":
      // The Trash Terminator: Tactical cybernetic visor / guardian helmet chassis with targeting optics
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="mech-plate" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="hud-visor" x1="12" y1="23" x2="36" y2="23" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="hud-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.7" />
            </filter>
          </defs>
          <g>
            {/* Targeting HUD Reticle Brackets */}
            <path d="M 8 14 L 8 8 L 14 8" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M 40 14 L 40 8 L 34 8" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M 8 34 L 8 40 L 14 40" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M 40 34 L 40 40 L 34 40" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

            {/* Tactical Vanguard Helmet Shell */}
            <path
              d="M 14 14 L 24 9 L 34 14 L 36 26 L 31 37 L 24 40 L 17 37 L 12 26 Z"
              fill="url(#mech-plate)"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Crown Armor Plating Lines */}
            <path d="M 24 9 L 24 19" stroke="#64748b" strokeWidth="1.5" />
            <path d="M 18 16 L 24 19 L 30 16" stroke="#64748b" strokeWidth="1" fill="none" />

            {/* Glowing Tactical Visor Strip */}
            <path
              d="M 15 22 L 24 20 L 33 22 L 31 26 L 24 25 L 17 26 Z"
              fill="url(#hud-visor)"
              filter="url(#hud-glow)"
            />
            <line x1="17" y1="23.5" x2="31" y2="23.5" stroke="#ffffff" strokeWidth="1" opacity="0.9" />

            {/* Chin Exhaust Grille */}
            <line x1="21" y1="33" x2="27" y2="33" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <line x1="22.5" y1="36" x2="25.5" y2="36" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </g>
        </svg>
      );

    case "title_sovereign":
      // Title: Eco Sovereign: Architectural faceted imperial crown with emerald jewels
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="crown-gold" x1="8" y1="12" x2="40" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#fbbf24" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="emerald-gem" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <filter id="crown-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#f59e0b" floodOpacity="0.5" />
            </filter>
          </defs>
          <g filter="url(#crown-glow)">
            {/* Imperial Faceted 5-Point Crown Body */}
            <path
              d="M 8 36 L 6 18 L 15 25 L 24 10 L 33 25 L 42 18 L 40 36 Z"
              fill="url(#crown-gold)"
              stroke="#fef08a"
              strokeWidth="1"
            />

            {/* Inner Facet Shadows for 3D Geometry */}
            <path d="M 6 18 L 15 25 L 12 36 Z" fill="#b45309" opacity="0.35" />
            <path d="M 24 10 L 15 25 L 24 36 Z" fill="#ffffff" opacity="0.25" />
            <path d="M 24 10 L 33 25 L 24 36 Z" fill="#78350f" opacity="0.35" />
            <path d="M 42 18 L 33 25 L 36 36 Z" fill="#ffffff" opacity="0.25" />

            {/* Crown Base Rim */}
            <path
              d="M 7 36 L 41 36 L 40 40 L 8 40 Z"
              fill="#b45309"
              stroke="#fbbf24"
              strokeWidth="1"
            />
            {/* Base Band Jewels */}
            <circle cx="14" cy="38" r="1.2" fill="#34d399" />
            <circle cx="24" cy="38" r="1.5" fill="#fef08a" />
            <circle cx="34" cy="38" r="1.2" fill="#34d399" />

            {/* Peak Pinnacles & Jewels */}
            <circle cx="24" cy="10" r="2.5" fill="url(#emerald-gem)" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="6" cy="18" r="1.8" fill="url(#emerald-gem)" stroke="#ffffff" strokeWidth="0.6" />
            <circle cx="42" cy="18" r="1.8" fill="url(#emerald-gem)" stroke="#ffffff" strokeWidth="0.6" />
            <circle cx="15" cy="25" r="1.4" fill="#fef08a" />
            <circle cx="33" cy="25" r="1.4" fill="#fef08a" />
            
            {/* Center Sovereign Diamond Emblem */}
            <polygon points="24,26 27,30 24,34 21,30" fill="url(#emerald-gem)" stroke="#ffffff" strokeWidth="0.8" />
          </g>
        </svg>
      );

    case "boost_xp":
      // 24Hr XP Booster: Aerodynamic quantum rocket / kinetic accelerator with sonic wave rings
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="rocket-body" x1="16" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="thruster-fire" x1="24" y1="32" x2="24" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="40%" stopColor="#10b981" />
              <stop offset="80%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <filter id="booster-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#a855f7" floodOpacity="0.6" />
            </filter>
          </defs>
          <g filter="url(#booster-glow)">
            {/* Sonic Expansion Warp Rings */}
            <ellipse cx="24" cy="14" rx="14" ry="4" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <ellipse cx="24" cy="24" rx="18" ry="5" stroke="#10b981" strokeWidth="1" opacity="0.4" />

            {/* Aerodynamic Fuselage */}
            <path
              d="M 24 6 C 21 11 18 20 18 31 L 30 31 C 30 20 27 11 24 6 Z"
              fill="url(#rocket-body)"
            />
            {/* Left & Right Swept Stabilizer Wings */}
            <path d="M 18 25 L 10 34 L 18 32 Z" fill="#64748b" />
            <path d="M 30 25 L 38 34 L 30 32 Z" fill="#475569" />

            {/* Visor / Energy Core Window */}
            <ellipse cx="24" cy="18" rx="2.5" ry="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
            <line x1="24" y1="8" x2="24" y2="31" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

            {/* Hyper-Thrust Exhaust Plume */}
            <path
              d="M 19 32 L 24 45 L 29 32 L 26 34 L 24 33 L 22 34 Z"
              fill="url(#thruster-fire)"
            />
            {/* Inner White Flame Core */}
            <polygon points="21,32 24,41 27,32" fill="#ffffff" />
          </g>
        </svg>
      );

    default:
      // Fallback: Radiant Diamond Crest
      return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <circle cx="24" cy="24" r="16" stroke="#10b981" strokeWidth="1.5" />
          <polygon points="24,12 34,24 24,36 14,24" fill="#10b981" />
        </svg>
      );
  }
};

export default ShopItemIcon;
