"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Zap, Info, MapPin, Check, ArrowRight, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { SHOP_ITEMS, purchaseItem, getInventory } from "@/lib/economy";
import { ShopItemIcon } from "@/components/ShopItemIcon";

export default function ShopPage() {
  const [level, setLevel] = useState<number>(1);
  const [balance, setBalance] = useState<number>(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseMsg, setPurchaseMsg] = useState<{text: string, isError: boolean} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = getCurrentUser();
      if (!user) return;
      try {
        const { data } = await supabase.from('users').select('level, eco_credits').eq('name', user).single();
        if (data) {
          setLevel(data.level);
          setBalance(data.eco_credits || 0);
          setInventory(getInventory());
        }
      } catch (e) {
        console.error("Failed to fetch user level for shop", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePurchase = async (item: any) => {
    if (inventory.includes(item.id)) {
      setPurchaseMsg({ text: "You already own this item!", isError: true });
      setTimeout(() => setPurchaseMsg(null), 3000);
      return;
    }
    
    if (balance < item.price) {
      setPurchaseMsg({ text: "Not enough Eco Credits!", isError: true });
      setTimeout(() => setPurchaseMsg(null), 3000);
      return;
    }

    const success = await purchaseItem(balance, item);
    if (success) {
      setBalance(prev => prev - item.price);
      setInventory(getInventory());
      setPurchaseMsg({ text: `Successfully unlocked ${item.name}!`, isError: false });
      setTimeout(() => setPurchaseMsg(null), 3000);
    } else {
      setPurchaseMsg({ text: "Purchase failed.", isError: true });
      setTimeout(() => setPurchaseMsg(null), 3000);
    }
  };

  const getItemMeta = (id: string) => {
    switch (id) {
      case "aura_gold":
        return {
          category: "AURA COSMETIC",
          tagColor: "text-amber-400 bg-amber-400/10 border-amber-400/25",
          plinthBg: "bg-gradient-to-b from-[#1a1406] to-[#0c0a04] border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.2)]",
          glowColor: "from-amber-500/10 to-transparent",
        };
      case "aura_cyber":
        return {
          category: "KINETIC FEED FX",
          tagColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/25",
          plinthBg: "bg-gradient-to-b from-[#051616] to-[#020b08] border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.2)]",
          glowColor: "from-cyan-500/10 to-transparent",
        };
      case "title_terminator":
        return {
          category: "TACTICAL TITLE",
          tagColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
          plinthBg: "bg-gradient-to-b from-[#0a1518] to-[#04080c] border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.2)]",
          glowColor: "from-emerald-500/10 to-transparent",
        };
      case "title_sovereign":
        return {
          category: "SOVEREIGN TITLE",
          tagColor: "text-amber-300 bg-amber-300/10 border-amber-300/25",
          plinthBg: "bg-gradient-to-b from-[#1c1507] to-[#0d0903] border-amber-400/35 shadow-[0_0_25px_rgba(251,191,36,0.25)]",
          glowColor: "from-amber-400/10 to-transparent",
        };
      case "boost_xp":
        return {
          category: "MULTIPLIER CORE",
          tagColor: "text-purple-400 bg-purple-400/10 border-purple-400/25",
          plinthBg: "bg-gradient-to-b from-[#170a24] to-[#080312] border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.2)]",
          glowColor: "from-purple-500/10 to-transparent",
        };
      default:
        return {
          category: "CIVIC ITEM",
          tagColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
          plinthBg: "bg-black/60 border-white/10",
          glowColor: "from-emerald-500/10 to-transparent",
        };
    }
  };

  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto flex flex-col pt-safe-header pb-[calc(env(safe-area-inset-bottom)+8rem)] max-w-md mx-auto relative z-10 selection:bg-emerald-500 selection:text-black">
      
      <AnimatePresence>
        {purchaseMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-12 left-4 right-4 z-50 flex justify-center pointer-events-none"
          >
            <div className={cn(
              "px-5 py-2.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl border flex items-center space-x-2.5 text-xs font-bold",
              purchaseMsg.isError 
                ? "bg-red-500/15 border-red-500/40 text-red-300" 
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{purchaseMsg.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Title */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start justify-center mt-2 space-y-1 w-full max-w-[calc(100%-150px)]"
      >
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>CIVIC REWARDS VAULT</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
          Eco Store
        </h1>
        <p className="text-zinc-400 text-xs font-medium">Redeem your hard-earned credits.</p>
      </motion.div>

      {/* Luxury Bullion Balance Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-[2rem] border border-[#d4af37]/35 bg-gradient-to-b from-[#181408]/90 via-[#0f0c05]/95 to-[#080703] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(212,175,55,0.08)] flex justify-between items-center relative overflow-hidden"
      >
        {/* Specular Top Rim */}
        <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-[#fbbf24]/50 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-mono text-[#fbbf24] font-extrabold uppercase tracking-[0.2em] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
            <span>GUARDIAN TREASURY</span>
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-white tracking-tight">
              {loading ? '...' : balance}
            </span>
            <span className="text-sm font-mono font-bold text-[#fbbf24] uppercase tracking-wide">
              Eco Credits
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 font-medium">
            +10 Credits awarded per level advancement
          </p>
        </div>

        {/* Medallion Coin Ornament */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#fbbf24]/20 via-[#d4af37]/10 to-transparent border border-[#fbbf24]/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <circle cx="16" cy="16" r="13" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="16" cy="16" r="10" fill="#fbbf24" fillOpacity="0.2" stroke="#fbbf24" strokeWidth="1.5" />
              <path d="M16 10 L 17.5 14.5 L 22 16 L 17.5 17.5 L 16 22 L 14.5 17.5 L 10 16 L 14.5 14.5 Z" fill="#ffffff" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Info Notice */}
      <div className="bg-[#10b981]/5 border border-[#10b981]/15 rounded-2xl p-3.5 flex items-start space-x-3">
        <Info className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
          Eco Credits are non-transferable civic honors. Keep South Bengaluru clean to unlock exclusive visual auras and ward prestige titles.
        </p>
      </div>

      {/* Featured Items List */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-black text-white uppercase tracking-wider font-mono">
            Featured Cosmetics
          </h2>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">5 AVAILABLE</span>
        </div>

        {SHOP_ITEMS.map((item, i) => {
          const isOwned = inventory.includes(item.id);
          const canAfford = balance >= item.price;
          const meta = getItemMeta(item.id);
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + (i * 0.08) }}
              className="p-4 rounded-[1.75rem] border border-white/[0.08] bg-[#070b09]/90 backdrop-blur-2xl flex flex-col relative overflow-hidden group shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
            >
              {/* Subtle Ambient Hover Glow */}
              <div className={cn(
                "absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity duration-500 group-hover:opacity-75",
                meta.glowColor
              )} />

              {/* Item Header & Category Tag */}
              <div className="flex items-center justify-between mb-2.5 relative z-10">
                <span className={cn(
                  "text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border uppercase",
                  meta.tagColor
                )}>
                  {meta.category}
                </span>

                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[11px] font-mono font-bold text-white">
                  <span className="text-[#fbbf24]">✦</span>
                  <span>{item.price}</span>
                  <span className="text-zinc-500 text-[9px]">CREDITS</span>
                </div>
              </div>

              {/* Item Content Row */}
              <div className="flex items-center space-x-3.5 relative z-10">
                {/* Precision Handcrafted Vector Icon Plinth */}
                <div className={cn(
                  "w-16 h-16 rounded-[1.25rem] flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-105",
                  meta.plinthBg
                )}>
                  <ShopItemIcon itemId={item.id} className="w-9 h-9" />
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-extrabold text-[15px] leading-snug tracking-tight truncate">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="mt-3.5 relative z-10">
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={isOwned || loading}
                  className={cn(
                    "w-full py-2.5 px-4 rounded-xl text-xs font-black tracking-wide flex items-center justify-center space-x-2 transition-all cursor-pointer",
                    isOwned 
                      ? "bg-white/[0.03] text-zinc-500 border border-white/[0.05] cursor-default"
                      : canAfford
                        ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-black shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-[0.98]"
                        : "bg-white/[0.03] text-zinc-500 border border-white/[0.06] cursor-not-allowed"
                  )}
                >
                  {isOwned ? (
                    <span className="flex items-center gap-1.5 text-emerald-400/80 font-mono">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>EQUIPPED IN WARD</span>
                    </span>
                  ) : canAfford ? (
                    <>
                      <span>UNLOCK FOR {item.price} CREDITS</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.8]" />
                    </>
                  ) : (
                    <span>NEED {item.price} CREDITS ({item.price - balance} MORE)</span>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
