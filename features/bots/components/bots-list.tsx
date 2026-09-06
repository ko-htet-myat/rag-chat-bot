"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "cn";

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
import { Bot, Grid, List, Plus, Trash } from "@hugeicons/core-free-icons";
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
  const [view, setView] = useState<"grid" | "list">("grid");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-300 px-2 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
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
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <HugeiconsIcon icon={Grid} size={12} />
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "list"
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <HugeiconsIcon icon={List} size={12} />
            </button>
          </div>
          <Button render={<Link href="/bots/create" />} nativeButton={false}>
            <HugeiconsIcon icon={Plus} size={12} />
            Create Bot
          </Button>
        </div>
      </div>

      {bots.length === 0 ? (
        <EmptyState />
      ) : view === "grid" ? (
        <GridView bots={bots} onDelete={setDeleteTarget} />
      ) : (
        <ListView bots={bots} onDelete={setDeleteTarget} />
      )}

      {/* Delete dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
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
                {deleteTarget}
              </span>{" "}
              and all associated configuration, knowledge bases, and
              conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
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
