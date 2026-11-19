import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLogin from "@/components/admin-login";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  if (isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin");
  return <AdminLogin />;
}
