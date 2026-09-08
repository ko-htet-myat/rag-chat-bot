import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserBots } from "@/features/knowledge/queries/knowledge-bases.query";
import { CreateKnowledgeBaseForm } from "@/features/knowledge/components/create-knowledge-base-form";

export const metadata = {
  title: "New Knowledge Base",
  description: "Create and configure a new knowledge base for your AI bot.",
};

export default async function KnowledgeCreatePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in?callbackURL=/knowledge/create");
  }

  const bots = await getUserBots(session.user.id);

  return <CreateKnowledgeBaseForm bots={bots} />;
}
