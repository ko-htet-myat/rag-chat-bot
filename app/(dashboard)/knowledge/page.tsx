import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getKnowledgeBases } from "@/features/knowledge/queries/knowledge-bases.query";
import { KnowledgeBaseList } from "@/features/knowledge/components/knowledge-base-list";

export const metadata = {
  title: "Knowledge Base",
};

export default async function KnowledgePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const knowledgeBases = session
    ? await getKnowledgeBases(session.user.id)
    : [];

  return <KnowledgeBaseList knowledgeBases={knowledgeBases} />;
}
