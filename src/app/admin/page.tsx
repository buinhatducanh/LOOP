/**
 * Admin Root Page — LOOP Solutions
 * Redirects /admin → /admin/overview
 */
import { redirect } from "next/navigation";

export default function AdminRootPage() {
  redirect("/admin/overview");
}
