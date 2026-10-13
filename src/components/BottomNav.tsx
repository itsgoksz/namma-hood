"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Compass, Plus, Trophy, User, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "MAP", href: "/", icon: Home },
  { name: "FEED", href: "/feed", icon: Compass },
  { name: "ADD", href: "/report", icon: Plus, special: true },
  { name: "RANK", href: "/leaderboard", icon: Trophy },
  { name: "ME", href: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  
  const isFeedOrMe = pathname === "/feed" || pathname === "/profile";
  const isCompact = isFeedOrMe && isScrolledDown;

  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      
      // Get scroll position from the actual scrolling container
      const currentScrollY = 'scrollTop' in target ? target.scrollTop : (window.scrollY || document.documentElement.scrollTop);
      
      // If we are at the top (or bouncing past the top on iOS), always show the full nav
      if (currentScrollY <= 50) {
        setIsScrolledDown(false);
        lastScrollY.current = currentScrollY;
        return;
      }
      
      // Use a 10px hysteresis threshold to prevent glitching from tiny scroll movements
      if (currentScrollY > lastScrollY.current + 10) {
        setIsScrolledDown(true); // Scrolling down, show pill
        lastScrollY.current = currentScrollY;
      } else if (currentScrollY < lastScrollY.current - 10) {
        setIsScrolledDown(false); // Scrolling up, show full nav
        lastScrollY.current = currentScrollY;
      }
    };

    // Use capture phase to intercept scroll events from any scrollable container in the app
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  return (
    <motion.nav 
      initial={false}
      animate={{ 
        width: isCompact ? 80 : "calc(100% - 32px)",
        borderRadius: isCompact ? 40 : 32
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.25rem)] left-0 right-0 mx-auto z-[9999] bg-[#05110b]/[0.87] backdrop-blur-2xl border border-[#10b981]/20 max-w-md h-20 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-visible"
    >
      <div className={cn("flex items-center h-full relative w-full px-2", isCompact ? "justify-center" : "justify-around")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.special) {
            return (
              <Link key={item.name} href={item.href} className="relative flex items-center justify-center shrink-0 z-10">
                <motion.div
                  initial={false}
                  animate={{ 
                    y: isCompact ? 0 : -24, 
                    scale: isCompact ? 0.95 : 1
                  }}
                  whileHover={{ scale: isCompact ? 1.0 : 1.05 }}
                  whileTap={{ scale: isCompact ? 0.9 : 0.95 }}
                  className="bg-[#f14f4f] rounded-full p-4 flex items-center justify-center shadow-[0_0_20px_rgba(241,79,79,0.5)] border-4 border-[#000000]"
                >
                  <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </motion.div>
              </Link>
            );
          }

          return (
            <AnimatePresence key={item.name}>
              {!isCompact && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 64 }}
                  exit={{ opacity: 0, scale: 0.5, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center h-full shrink-0"
                >
                  <Link
                    href={item.href}
                    className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "flex flex-col items-center",
                        isActive ? "text-white" : "text-zinc-400"
                      )}
                    >
                      <Icon
                        className={cn("w-5 h-5", isActive ? "stroke-[#10b981]" : "")}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="text-xs font-black mt-1.5 tracking-wider">{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>
    </motion.nav>
  );
}
