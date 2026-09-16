import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getUserBots, getOrCreateWidgetConfig } from "@/features/widget";
import { WidgetView } from "@/features/widget/components/widget-view";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Website Widget",
  description: "Configure how your chatbot appears on your website.",
};

interface WidgetPageProps {
  searchParams: Promise<{
    botId?: string;
  }>;
}

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const resolvedSearchParams = await searchParams;
  const bots = await getUserBots(session.user.id);

  if (bots.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Website Widget
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure how your chatbot appears on your website.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary mb-4">
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No bots created yet
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            You need at least one bot before configuring and deploying your
            website chat widget.
          </p>
          <div className="mt-5">
            <Button
              render={<Link href="/bots/create" />}
              nativeButton={false}
            >
              Create your first bot
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Selected bot or default to first
  const selectedBotId =
    resolvedSearchParams.botId &&
    bots.some((b) => b.id === resolvedSearchParams.botId)
      ? resolvedSearchParams.botId
      : bots[0].id;

  const widgetConfig = await getOrCreateWidgetConfig(
    selectedBotId,
    session.user.id,
  );

  if (!widgetConfig) {
    redirect("/widget");
  }

  return (
    <WidgetView
      key={selectedBotId}
      bots={bots}
      initialConfig={widgetConfig}
      selectedBotId={selectedBotId}
    />
  );
}
