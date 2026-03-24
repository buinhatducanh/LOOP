"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RANKS, RankKey, getRankColor, getRankLabel, getRankSymbol } from "./teamRanks";

// ── Rank tier ordering ───────────────────────────────────────────────────────
const RANK_ORDER: RankKey[] = ["iron", "bronze", "silver", "gold", "platinum", "ruby", "diamond"];

interface RankUpgradeNotificationProps {
  visible: boolean;
  memberName: string;
  previousRank: RankKey;
  newRank: RankKey;
  newLevel: number;
  onClose: () => void;
  autoCloseMs?: number;
}

export function RankUpgradeNotification({
  visible,
  memberName,
  previousRank,
  newRank,
  newLevel,
  onClose,
  autoCloseMs = 5000,
}: RankUpgradeNotificationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onClose, autoCloseMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, autoCloseMs, onClose]);

  const newCfg = RANKS[newRank];
  const oldCfg = RANKS[previousRank];
  const isUpgraded = RANK_ORDER.indexOf(newRank) > RANK_ORDER.indexOf(previousRank);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="rank-upgrade"
          initial={{ opacity: 0, y: -80, scale: 0.7, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -40, scale: 0.85, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-6 left-1/2 z-[9999] pointer-events-none"
          style={{ marginLeft: "-50%", width: 380, maxWidth: "95vw" }}
        >
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #0A0F1E 0%, #111827 100%)",
              border: `1.5px solid ${newCfg.color}60`,
              boxShadow: `0 0 40px ${newCfg.glowColor}, 0 0 80px ${newCfg.color}20, 0 20px 60px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Background glow shimmer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${newCfg.color}18 0%, transparent 70%)`,
              }}
            />

            {/* Floating particles for rank-up only */}
            {isUpgraded && <UpgradeParticles color={newCfg.color} />}

            {/* Content */}
            <div className="relative p-4 flex items-center gap-4">
              {/* Rank emblem */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${newCfg.gradientFrom}33, ${newCfg.gradientTo}33)`,
                  border: `1.5px solid ${newCfg.color}50`,
                  boxShadow: `0 0 20px ${newCfg.glowColor}`,
                }}
              >
                <motion.span
                  key={newRank}
                  initial={{ scale: 0, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
                  style={{
                    fontSize: 28,
                    lineHeight: 1,
                    filter: `drop-shadow(0 0 8px ${newCfg.color})`,
                  }}
                >
                  {newCfg.symbol}
                </motion.span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-0.5"
                  style={{
                    color: newCfg.color,
                    fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
                    letterSpacing: "0.2em",
                  }}
                >
                  {isUpgraded ? "✦ RANK UPGRADE ✦" : "RANK SYNCED"}
                </div>
                <div
                  className="text-sm font-semibold text-white truncate"
                  style={{ fontFamily: "var(--font-cinzel), Cinzel, serif" }}
                >
                  {memberName}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {/* Old rank */}
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      color: oldCfg.color,
                      background: `${oldCfg.color}15`,
                      border: `1px solid ${oldCfg.color}30`,
                      fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
                      fontWeight: 600,
                    }}
                  >
                    {oldCfg.symbol} {oldCfg.label}
                  </span>
                  <span style={{ color: "#475569", fontSize: 12 }}>→</span>
                  {/* New rank */}
                  <motion.span
                    key={newRank + "-label"}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      color: newCfg.color,
                      background: `${newCfg.color}18`,
                      border: `1px solid ${newCfg.color}50`,
                      fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
                      fontWeight: 700,
                    }}
                  >
                    {newCfg.symbol} {newCfg.label}
                  </motion.span>
                  {/* Level */}
                  <span
                    className="text-xs"
                    style={{
                      color: "#64748B",
                      fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
                    }}
                  >
                    LVL {newLevel}
                  </span>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748B",
                  fontSize: 14,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#64748B";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                }}
              >
                ✕
              </button>
            </div>

            {/* Progress bar countdown */}
            <div className="relative h-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="absolute left-0 top-0 h-full"
                style={{
                  background: `linear-gradient(90deg, ${newCfg.gradientFrom}, ${newCfg.gradientTo})`,
                  boxShadow: `0 0 6px ${newCfg.color}`,
                }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoCloseMs / 1000, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Upgrade particle burst ─────────────────────────────────────────────────────
function UpgradeParticles({ color }: { color: string }) {
  const particles = [
    { x: "10%", delay: "0s", dur: "1.4s" },
    { x: "30%", delay: "0.15s", dur: "1.8s" },
    { x: "50%", delay: "0.08s", dur: "1.5s" },
    { x: "70%", delay: "0.22s", dur: "1.6s" },
    { x: "90%", delay: "0.05s", dur: "1.3s" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.x,
            width: 3,
            height: 3,
            backgroundColor: color,
            boxShadow: `0 0 6px 1px ${color}`,
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: color,
              animation: `guildFloatParticle ${p.dur} ${p.delay} ease-out infinite`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Hook: show rank upgrade when LP changes ────────────────────────────────────
import { useState } from "react";
import type { RankData } from "@/hooks/useRank";

interface UseRankUpgradeOptions {
  memberId: string;
  /** Callback when a rank change is detected — call with previousRank + newRank */
  onRankChange?: (prev: RankKey, next: RankKey, newLevel: number) => void;
}

export function useRankUpgrade(memberId: string, onRankChange?: UseRankUpgradeOptions["onRankChange"]) {
  const [notification, setNotification] = useState<{
    visible: boolean;
    memberName: string;
    previousRank: RankKey;
    newRank: RankKey;
    newLevel: number;
  } | null>(null);

  function checkForUpgrade(
    memberName: string,
    prevData: RankData | null,
    newData: RankData | null
  ) {
    if (!newData) return;
    const prevRank = prevData?.rank ?? "iron";
    const newRank = newData.rank;
    if (prevRank !== newRank) {
      setNotification({
        visible: true,
        memberName,
        previousRank: prevRank,
        newRank,
        newLevel: newData.level,
      });
      onRankChange?.(prevRank, newRank, newData.level);
    }
  }

  function closeNotification() {
    setNotification((n) => n ? { ...n, visible: false } : null);
  }

  return { notification, checkForUpgrade, closeNotification };
}
