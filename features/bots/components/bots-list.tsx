"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bot,
  Grid,
  List,
  Loading01Icon,
  Plus,
  Trash,
} from "@hugeicons/core-free-icons";
import { deleteBotAction } from "@/features/bots/actions/delete-bot.action";
import { GridView } from "./bots-grid-view";
import { ListView } from "./bots-list-view";

export interface BotItem {
  id: string;
  name: string;
  description: string | null;
  model: string;
  status: "active" | "inactive";
  conversations: number;
  updatedAt: string;
}

interface BotsListProps {
  bots: BotItem[];
}

export function BotsList({ bots }: BotsListProps) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<BotItem | null>(null);

  const { executeAsync, isExecuting } = useAction(deleteBotAction, {
    onSuccess: () => {
      toast.success(`"${deleteTarget?.name ?? "Bot"}" deleted successfully`);
      setDeleteTarget(null);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError || "Failed to delete bot. Please try again.",
      );
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await executeAsync({ id: deleteTarget.id });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Bots
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage your AI chatbots.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-secondary/60 p-1">
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "grid"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <HugeiconsIcon icon={Grid} size={16} />
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "list"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <HugeiconsIcon icon={List} size={16} />
            </button>
          </div>
          <Button render={<Link href="/bots/create" />} nativeButton={false}>
            <HugeiconsIcon icon={Plus} size={16} />
            Create Bot
          </Button>
        </div>
      </div>

      {bots.length === 0 ? (
        <EmptyState />
      ) : view === "grid" ? (
        <GridView bots={bots} />
      ) : (
        <ListView bots={bots} onDelete={setDeleteTarget} />
      )}

      {/* Delete dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isExecuting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Trash} size={12} />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Bot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              and all associated configuration, knowledge bases, and
              conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExecuting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isExecuting}
              onClick={handleDelete}
            >
              {isExecuting ? (
                <>
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    size={12}
                    className="animate-spin mr-1"
                  />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <HugeiconsIcon icon={Bot} size={12} />
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">No bots yet</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          Create your first AI chatbot to get started.
        </div>
      </div>
      <Button render={<Link href="/bots/create" />} nativeButton={false}>
        <HugeiconsIcon icon={Plus} size={12} />
        Create Bot
      </Button>
    </div>
  );
}
