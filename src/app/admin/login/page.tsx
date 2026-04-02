/**
 * Admin Login Page — DEPRECATED
 *
 * Unified login now lives at: /{locale}/dang-nhap
 * This page redirects there to preserve any direct bookmarks.
 */
import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/vi/dang-nhap");
}
