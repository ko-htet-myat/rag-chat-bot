import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getConversations } from "@/features/conversations";
import { ConversationsList } from "@/features/conversations";

export const metadata = {
  title: "Conversations",
};

export default async function ConversationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const data = session
    ? await getConversations(session.user.id)
    : { conversations: [], bots: [] };

  return <ConversationsList data={data} />;
}
