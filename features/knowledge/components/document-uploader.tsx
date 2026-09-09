"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CloudUploadIcon,
  File01Icon,
  Cancel01Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { uploadDocumentAction } from "../actions/upload-document.action";
import { formatFileSize } from "@/lib/documents/process-document";

interface DocumentUploaderProps {
  knowledgeBaseId: string;
}

export function DocumentUploader({ knowledgeBaseId }: DocumentUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failedCount = 0;

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("knowledgeBaseId", knowledgeBaseId);
      formData.append("file", file);

      try {
        const res = await uploadDocumentAction(formData);
        if (res.success) {
          successCount++;
        } else {
          failedCount++;
          toast.error(`Failed to upload ${file.name}: ${res.error}`);
        }
      } catch {
        failedCount++;
        toast.error(`Error uploading ${file.name}`);
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(
        `Successfully uploaded and processed ${successCount} document${
          successCount > 1 ? "s" : ""
        }!`,
      );
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } else if (failedCount > 0) {
      toast.error("Failed to upload selected documents. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-border/80 bg-card/20 hover:border-indigo-500/40 hover:bg-card/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.pdf,.json,.csv,.log,.html"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          <HugeiconsIcon icon={CloudUploadIcon} size={24} />
        </div>

        <div className="text-sm font-semibold text-foreground">
          Upload documents to this knowledge base
        </div>

        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Drag and drop your PDF, Markdown, TXT, CSV, or JSON files here, or click to browse.
        </p>

        <div className="mt-3 text-[11px] text-muted-foreground/70">
          Supported formats: .pdf, .txt, .md, .csv, .json (up to 10MB per file)
        </div>
      </div>

      {/* Selected file queue */}
      {selectedFiles.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-foreground">
            <span>Selected Files ({selectedFiles.length})</span>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => setSelectedFiles([])}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Clear All
            </button>
          </div>

          <div className="divide-y divide-border/60 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate mr-3">
                  <HugeiconsIcon
                    icon={File01Icon}
                    size={14}
                    className="text-indigo-400 shrink-0"
                  />
                  <span className="font-medium text-foreground truncate">
                    {file.name}
                  </span>
                  <span className="text-muted-foreground text-[11px] shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => handleRemoveFile(idx)}
                  className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              disabled={isUploading}
              onClick={handleUpload}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs"
            >
              {isUploading ? (
                <>
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    size={14}
                    className="mr-1.5 animate-spin"
                  />
                  Processing & Chunking...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CloudUploadIcon} size={14} />
                  Upload & Process {selectedFiles.length} File{selectedFiles.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
