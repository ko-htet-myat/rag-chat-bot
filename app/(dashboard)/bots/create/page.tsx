import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateBotForm } from "@/features/bots/components/forms/create-bot-form";

export const metadata = {
  title: "Create Bot",
  description: "Create and configure a new AI chatbot.",
};

export default async function BotCreatePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in?callbackURL=/bots/create");
  }

  return <CreateBotForm />;
}
