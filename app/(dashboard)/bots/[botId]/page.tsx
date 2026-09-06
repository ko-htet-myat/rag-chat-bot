import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getBotDetail } from "@/features/bots/queries/bot-detail.query";
import { BotDetailView } from "@/features/bots/components/bot-detail/bot-detail-view";

interface BotDetailPageProps {
  params: Promise<{
    botId: string;
  }>;
}

export async function generateMetadata({
  params,
}: BotDetailPageProps): Promise<Metadata> {
  const { botId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { title: "Bot Details" };
  }

  const data = await getBotDetail(botId, session.user.id);
  if (!data) {
    return { title: "Bot Not Found" };
  }

  return {
    title: `${data.bot.name} | Bot Overview`,
  };
}

export default async function BotDetailPage({ params }: BotDetailPageProps) {
  const { botId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const data = await getBotDetail(botId, session.user.id);

  if (!data) {
    notFound();
  }

  return <BotDetailView data={data} />;
}
