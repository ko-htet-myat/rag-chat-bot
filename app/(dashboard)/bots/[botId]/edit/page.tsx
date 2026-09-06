import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bots } from "@/db/schema";
import { EditBotForm } from "@/features/bots/components/forms/edit-bot-form";

export const metadata = {
  title: "Edit Bot",
};

interface EditBotPageProps {
  params: Promise<{
    botId: string;
  }>;
}

export default async function EditBotPage({ params }: EditBotPageProps) {
  const { botId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.userId, session.user.id)));

  if (!bot) {
    notFound();
  }

  return <EditBotForm bot={bot} />;
}
