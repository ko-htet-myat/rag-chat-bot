import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getDashboardData, DashboardView } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your AI bots, knowledge bases, and conversations.",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const data = await getDashboardData(session.user.id);

  return <DashboardView data={data} />;
}
