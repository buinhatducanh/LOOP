/**
 * Page Visibility Config
 * Dùng để tạm ẩn/hiện các trang public.
 *
 * Đặt biến môi trường trong Vercel Dashboard:
 *   NEXT_PUBLIC_FEATURE_TEAM_ACADEMY_VISIBLE=false  → Ẩn Team + Academy
 *   (mặc định true nếu không set)
 */

const FEATURE_TEAM_ACADEMY_VISIBLE =
  process.env.NEXT_PUBLIC_FEATURE_TEAM_ACADEMY_VISIBLE !== "false";

/** Team page (/[locale]/team) có visible không */
export const isTeamPageVisible = FEATURE_TEAM_ACADEMY_VISIBLE;

/** Academy page (/[locale]/academy) có visible không */
export const isAcademyPageVisible = FEATURE_TEAM_ACADEMY_VISIBLE;
