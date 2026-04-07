/**
 * Admin Login Page — DEPRECATED
 *
 * Staff login now lives at: /{locale}/nhan-vien
 * This page redirects there to preserve any direct bookmarks.
 *
 * Note: The footer StaffLoginSection logs in via API directly
 * and navigates to /admin/overview — this page is only a fallback
 * for direct /admin/login URL access.
 */
import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/vi/nhan-vien");
}
