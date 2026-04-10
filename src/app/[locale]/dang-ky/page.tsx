import { redirect } from "next/navigation";

/**
 * Redirect /dang-ky → /dang-nhap (register tab is auto-selected via useEffect).
 * The unified auth page at /dang-nhap handles both login + register via tabs.
 */
export default function RegisterPage() {
  redirect("/dang-nhap");
}
