import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import { ADMIN_COOKIE, isValidAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Site Control Room",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
  return <AdminDashboard />;
}
