"use client";

/**
 * GuildAnimations — Injects all guild CSS keyframes into the document head.
 * Called once at the page root.
 */
export function GuildAnimations() {
  return (
    <style>{`
      @keyframes guildFloatParticle {
        0%   { transform: translateY(0) scale(1); opacity: 0; }
        10%  { opacity: 0.85; }
        85%  { opacity: 0.6; }
        100% { transform: translateY(-320px) scale(0.2); opacity: 0; }
      }
      @keyframes guildCometSweep {
        0%   { transform: translateX(-100%); opacity: 0; }
        10%  { opacity: 1; }
        85%  { opacity: 0.8; }
        100% { transform: translateX(200%); opacity: 0; }
      }
      @keyframes guildElectric {
        0%,100% { opacity: 0; transform: scaleX(0.4); }
        50%     { opacity: 0.9; transform: scaleX(1); }
      }
      @keyframes guildSilverPulse {
        0%,100% { box-shadow: 0 0 8px rgba(203,213,225,0.25), 0 0 20px rgba(203,213,225,0.08); }
        50%     { box-shadow: 0 0 18px rgba(203,213,225,0.55), 0 0 40px rgba(203,213,225,0.18); }
      }
      @keyframes guildBronzeFlow {
        0%,100% { box-shadow: 0 0 10px rgba(205,127,50,0.35), 0 0 25px rgba(205,127,50,0.12); }
        50%     { box-shadow: 0 0 18px rgba(205,127,50,0.65), 0 0 45px rgba(205,127,50,0.22); }
      }
      @keyframes guildGoldGlow {
        0%,100% { box-shadow: 0 0 14px rgba(255,215,0,0.5), 0 0 35px rgba(255,215,0,0.2), 0 0 60px rgba(255,215,0,0.06); }
        50%     { box-shadow: 0 0 24px rgba(255,215,0,0.85), 0 0 55px rgba(255,215,0,0.35), 0 0 90px rgba(255,215,0,0.12); }
      }
      @keyframes guildPlatinumPulse {
        0%,100% { box-shadow: 0 0 15px rgba(20,184,166,0.5), 0 0 45px rgba(139,92,246,0.25), 0 0 70px rgba(20,184,166,0.08); }
        50%     { box-shadow: 0 0 28px rgba(20,184,166,0.8), 0 0 65px rgba(139,92,246,0.45), 0 0 110px rgba(20,184,166,0.15); }
      }
      @keyframes guildHeartbeat {
        0%,100% { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
        14%     { box-shadow: 0 0 28px rgba(239,68,68,0.95), 0 0 70px rgba(239,68,68,0.45), 0 0 110px rgba(239,68,68,0.12); }
        28%     { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
        42%     { box-shadow: 0 0 20px rgba(239,68,68,0.75), 0 0 55px rgba(239,68,68,0.35); }
        70%     { box-shadow: 0 0 10px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.15); }
      }
      @keyframes guildDiamondSpectral {
        0%   { box-shadow: 0 0 22px rgba(129,140,248,0.55), 0 0 60px rgba(125,211,252,0.2), 0 0 110px rgba(240,171,252,0.06); }
        33%  { box-shadow: 0 0 40px rgba(125,211,252,0.78), 0 0 90px rgba(240,171,252,0.32), 0 0 155px rgba(255,255,255,0.13); }
        66%  { box-shadow: 0 0 34px rgba(240,171,252,0.68), 0 0 78px rgba(129,140,248,0.34), 0 0 138px rgba(125,211,252,0.12); }
        100% { box-shadow: 0 0 22px rgba(129,140,248,0.55), 0 0 60px rgba(125,211,252,0.2), 0 0 110px rgba(240,171,252,0.06); }
      }
    `}</style>
  );
}
