"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Trash,
  Loading01Icon,
} from "@hugeicons/core-free-icons";

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
import { deleteDocumentAction } from "../actions/delete-document.action";
import { formatFileSize } from "@/lib/documents/process-document";

export interface DocumentRowItem {
  id: string;
  name: string;
  sourceType: string;
  mimeType: string | null;
  size: number | null;
  status: "pending" | "processing" | "ready" | "failed";
  chunksCount: number;
  createdAt: string;
}

interface DocumentListTableProps {
  documents: DocumentRowItem[];
  knowledgeBaseId: string;
}

export function DocumentListTable({
  documents,
  knowledgeBaseId,
}: DocumentListTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<DocumentRowItem | null>(null);

  const { executeAsync, isExecuting } = useAction(deleteDocumentAction, {
    onSuccess: () => {
      toast.success(`"${deleteTarget?.name}" deleted successfully`);
      setDeleteTarget(null);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to delete document.");
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await executeAsync({
      id: deleteTarget.id,
      knowledgeBaseId,
    });
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <HugeiconsIcon icon={File01Icon} size={18} />
        </div>
        <div className="mt-3 text-sm font-medium text-foreground">
          No documents uploaded yet
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Use the dropzone above to upload documents for this knowledge base.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Chunks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      <HugeiconsIcon
                        icon={File01Icon}
                        size={15}
                        className="text-indigo-400 shrink-0"
                      />
                      <span className="truncate max-w-xs">{doc.name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatFileSize(doc.size)}
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {doc.chunksCount} {doc.chunksCount === 1 ? "chunk" : "chunks"}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 capitalize font-medium ${
                        doc.status === "ready"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : doc.status === "processing"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {doc.createdAt}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Delete ${doc.name}`}
                      onClick={() => setDeleteTarget(doc)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                    >
                      <HugeiconsIcon icon={Trash} size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              and all of its extracted text chunks and vector embeddings.
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
