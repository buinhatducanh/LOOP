import { ok, handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * GET /api/admin/rank-effects/mock-reference
 * Frozen FE mock reference to verify DB migration accuracy against original FE data.
 */
export async function GET(_req: NextRequest) {
  try {
    await requirePermission("effects", "read");

    const effects = [
      { id: "eff-1", name: "Particle Glow cơ bản", type: "particle", unlockRank: "iron", unlockLevel: 1, enabled: true, rarity: "common", preview: "✨", cssConfig: "count: 5; opacity: 0.3; speed: 3s" },
      { id: "eff-2", name: "Border Gradient", type: "border", unlockRank: "bronze", unlockLevel: 15, enabled: true, rarity: "common", preview: "◈", cssConfig: "rotation: 360deg; speed: 3s; width: 2px" },
      { id: "eff-3", name: "Silver Shimmer", type: "glow", unlockRank: "silver", unlockLevel: 35, enabled: true, rarity: "rare", preview: "◇", cssConfig: "shimmer: true; speed: 2s; color: #CBD5E1" },
      { id: "eff-4", name: "Gold Aura", type: "aura", unlockRank: "gold", unlockLevel: 55, enabled: true, rarity: "rare", preview: "★", cssConfig: "radius: 40px; pulse: true; color: #FFD700" },
      { id: "eff-5", name: "Platinum Trail", type: "trail", unlockRank: "platinum", unlockLevel: 75, enabled: true, rarity: "epic", preview: "❋", cssConfig: "length: 8; fade: 0.5s; color: #14B8A6" },
      { id: "eff-6", name: "Ruby Fire Particles", type: "particle", unlockRank: "ruby", unlockLevel: 85, enabled: true, rarity: "epic", preview: "♦", cssConfig: "count: 15; color: #EF4444; gravity: -0.5" },
      { id: "eff-7", name: "Diamond Holographic", type: "aura", unlockRank: "diamond", unlockLevel: 95, enabled: true, rarity: "legendary", preview: "✦", cssConfig: "holographic: true; rainbow: true; speed: 4s" },
      { id: "eff-8", name: "Cosmic Badge", type: "badge", unlockRank: "diamond", unlockLevel: 100, enabled: true, rarity: "legendary", preview: "🌟", cssConfig: "badge: cosmic; animated: true; glow: rainbow" },
      { id: "eff-9", name: "Neon Pulse Border", type: "border", unlockRank: "gold", unlockLevel: 60, enabled: true, rarity: "rare", preview: "💫", cssConfig: "neon: true; pulse: 1.5s; color: #3B82F6" },
      { id: "eff-10", name: "Matrix Rain", type: "particle", unlockRank: "platinum", unlockLevel: 80, enabled: false, rarity: "epic", preview: "🌧", cssConfig: "style: matrix; speed: fast; color: #22C55E" },
      { id: "eff-11", name: "Bronze Ember", type: "particle", unlockRank: "bronze", unlockLevel: 20, enabled: true, rarity: "common", preview: "🔥", cssConfig: "count: 8; color: #CD7F32; rise: true; speed: 2.5s" },
      { id: "eff-12", name: "Iron Shield Pulse", type: "border", unlockRank: "iron", unlockLevel: 5, enabled: true, rarity: "common", preview: "🛡", cssConfig: "style: shield; vibrate: 0.2s; color: #9CA3AF" },
    ];

    const overrides = [
      { memberId: 1, memberName: "Kai Tanaka", effectId: "eff-7", visible: true, selectedByMember: true },
      { memberId: 1, memberName: "Kai Tanaka", effectId: "eff-8", visible: true, selectedByMember: true },
      { memberId: 1, memberName: "Kai Tanaka", effectId: "eff-6", visible: false, selectedByMember: false },
      { memberId: 7, memberName: "Akira Sato", effectId: "eff-7", visible: true, selectedByMember: true },
      { memberId: 3, memberName: "Ryo Hashimoto", effectId: "eff-5", visible: true, selectedByMember: true },
    ];

    return ok({
      version: "fe-mock-reference-v1",
      source: "FE/src/app/store/loopStore.ts (INIT_EFFECTS, INIT_OVERRIDES)",
      effects,
      overrides,
    });
  } catch (error) {
    return handleError(error);
  }
}
