import Link from "next/link";
import { Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back 👋 Manage your AI bots, knowledge bases and conversations.
        </p>
      </div>

      <div>
        <Button render={<Link href="/bots/create" />} nativeButton={false}>
          <HugeiconsIcon icon={Plus} size={16} strokeWidth={2.5} />
          <span>Create Bot</span>
        </Button>
      </div>
    </div>
  );
}
