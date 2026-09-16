"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading01Icon, Plus, Trash } from "@hugeicons/core-free-icons";

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
import { deleteKnowledgeBaseAction } from "../actions";
import type { KnowledgeBaseItem } from "../types";
import { KnowledgeBaseCard } from "./knowledge-base-card";
import { NewKnowledgeBaseCard } from "./new-knowledge-base-card";

interface KnowledgeBaseListProps {
  knowledgeBases: KnowledgeBaseItem[];
}

export function KnowledgeBaseList({ knowledgeBases }: KnowledgeBaseListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseItem | null>(
    null,
  );

  const { executeAsync, isExecuting } = useAction(deleteKnowledgeBaseAction, {
    onSuccess: () => {
      toast.success(
        `"${deleteTarget?.name ?? "Knowledge Base"}" deleted successfully`,
      );
      setDeleteTarget(null);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError ||
          "Failed to delete knowledge base. Please try again.",
      );
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await executeAsync({ id: deleteTarget.id });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage documents used by your AI bots.
          </p>
        </div>

        <Button
          render={<Link href="/knowledge/create" />}
          nativeButton={false}
        >
          <HugeiconsIcon icon={Plus} size={16} />
          Add Knowledge Base
        </Button>
      </div>

      {/* Grid of Knowledge Bases */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {knowledgeBases.map((kb) => (
          <KnowledgeBaseCard
            key={kb.id}
            knowledgeBase={kb}
            onDelete={setDeleteTarget}
          />
        ))}

        <NewKnowledgeBaseCard />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isExecuting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Trash} size={16} />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Knowledge Base?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              and all of its uploaded documents, chunks, and vector embeddings.
              This action cannot be undone.
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
                    size={14}
                    className="mr-1.5 animate-spin"
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
