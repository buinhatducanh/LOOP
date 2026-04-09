/**
 * Member Stats Panel Config API
 * GET  /api/admin/settings/member-stats  → get MemberStatsPanelConfig
 * POST /api/admin/settings/member-stats  → upsert config
 */
import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const SETTING_KEY = "member_stats_config";

export interface MemberStatsConfig {
  enabled: boolean;
  defaultMemberId: string | null;
  showXpBar: boolean;
  showLpBalances: boolean;
  showRankHistory: boolean;
  showSkills: boolean;
  showMissions: boolean;
  showAchievements: boolean;
  autoDismissSeconds: number; // 0 = never
  positionMode: "click" | "center";
}

const DEFAULT_CONFIG: MemberStatsConfig = {
  enabled: true,
  defaultMemberId: null,
  showXpBar: true,
  showLpBalances: true,
  showRankHistory: true,
  showSkills: true,
  showMissions: true,
  showAchievements: true,
  autoDismissSeconds: 0,
  positionMode: "center",
};

export async function GET(_req: NextRequest) {
  try {
    const session = await requirePermission("settings", "read");

    const setting = await prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting) {
      return ok(DEFAULT_CONFIG);
    }

    const config = JSON.parse(setting.value) as Partial<MemberStatsConfig>;
    return ok({ ...DEFAULT_CONFIG, ...config });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
    const body = await req.json() as Partial<MemberStatsConfig>;

    // Validate
    if (body.autoDismissSeconds !== undefined && (typeof body.autoDismissSeconds !== "number" || body.autoDismissSeconds < 0)) {
      return NextResponse.json({ error: "autoDismissSeconds must be a non-negative number" }, { status: 400 });
    }
    if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    const config: MemberStatsConfig = {
      enabled: body.enabled ?? DEFAULT_CONFIG.enabled,
      defaultMemberId: body.defaultMemberId ?? DEFAULT_CONFIG.defaultMemberId,
      showXpBar: body.showXpBar ?? DEFAULT_CONFIG.showXpBar,
      showLpBalances: body.showLpBalances ?? DEFAULT_CONFIG.showLpBalances,
      showRankHistory: body.showRankHistory ?? DEFAULT_CONFIG.showRankHistory,
      showSkills: body.showSkills ?? DEFAULT_CONFIG.showSkills,
      showMissions: body.showMissions ?? DEFAULT_CONFIG.showMissions,
      showAchievements: body.showAchievements ?? DEFAULT_CONFIG.showAchievements,
      autoDismissSeconds: body.autoDismissSeconds ?? DEFAULT_CONFIG.autoDismissSeconds,
      positionMode: body.positionMode ?? DEFAULT_CONFIG.positionMode,
    };

    const value = JSON.stringify(config);
    const result = await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value, group: "ui" },
      create: { key: SETTING_KEY, value, group: "ui" },
    });

    return ok(result, 201);
  } catch (error) {
    return handleError(error);
  }
}
