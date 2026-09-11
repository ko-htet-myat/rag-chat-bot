import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getConversationDetail } from "@/features/conversations/queries/conversation-detail.query";
import { ConversationDetail } from "@/features/conversations/components/conversation-detail";

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ConversationDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { title: "Conversation" };

  const data = await getConversationDetail(id, session.user.id);
  if (!data) return { title: "Conversation Not Found" };

  return { title: `${data.conversation.title} | ${data.bot.name}` };
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const data = await getConversationDetail(id, session.user.id);

  if (!data) {
    notFound();
  }

  return <ConversationDetail data={data} />;
}
