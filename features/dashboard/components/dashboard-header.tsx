import Link from "next/link";
import { Plus } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { buttonVariants } from "@/components/ui/button";

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
        <Link
          href="/bots/create"
          className={buttonVariants({
            className:
              "inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors",
          })}
        >
          <HugeiconsIcon icon={Plus} size={16} strokeWidth={2.5} />
          <span>Create Bot</span>
        </Link>
      </div>
    </div>
  );
}
