import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const NammaHoodMark = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Specular & Gradient Shaders */}
        <linearGradient id="nh-primary-sprout" x1="45" y1="88" x2="85" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="45%" stopColor="#10b981" />
          <stop offset="85%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>

        <linearGradient id="nh-secondary-leaf" x1="22" y1="82" x2="42" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <linearGradient id="nh-inner-rib" x1="50" y1="85" x2="75" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#a7f3d0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="nh-secondary-rib" x1="32" y1="78" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
        </linearGradient>

        {/* Ambient Glow Filter */}
        <filter id="nh-crest-glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#10b981" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Background Soft Glow */}
      <g filter="url(#nh-crest-glow)">
        {/* Left Cotyledon / Foundation Leaf */}
        <path
          d="M 48 84 C 36 82 22 72 20 54 C 18 42 24 35 34 33 C 44 31 48 40 48 54 C 48 66 48 78 48 84 Z"
          fill="url(#nh-secondary-leaf)"
        />

        {/* Left Leaf Specular Rib */}
        <path
          d="M 44 76 C 36 68 28 58 29 48"
          stroke="url(#nh-secondary-rib)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Right Ascending Sprout / Civic Surge */}
        <path
          d="M 52 86 C 52 74 53 58 59 44 C 65 30 73 18 80 14 C 82 13 83 14 83 17 C 82 28 82 42 76 56 C 70 70 61 80 52 86 Z"
          fill="url(#nh-primary-sprout)"
        />

        {/* Dynamic Center Sprout Body */}
        <path
          d="M 52 86 C 60 76 72 62 76 44 C 80 26 78 16 80 14 C 76 22 68 34 60 50 C 54 62 52 76 52 86 Z"
          fill="#ffffff"
          opacity="0.18"
        />

        {/* Precision Spine Highlight */}
        <path
          d="M 54 80 C 58 68 66 50 74 28"
          stroke="url(#nh-inner-rib)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Foundation Seed Node */}
        <circle cx="50" cy="87" r="3.5" fill="#34d399" />
        <circle cx="50" cy="87" r="1.5" fill="#ffffff" />
      </g>
    </svg>
  );
};

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <NammaHoodMark className="w-full h-full" />
    </div>
  );
};

export default Logo;
