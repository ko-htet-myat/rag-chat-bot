"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Loading01Icon,
  Trash,
} from "@hugeicons/core-free-icons";

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
import { updateBotAction } from "@/features/bots/actions/update-bot.action";
import { deleteBotAction } from "@/features/bots/actions/delete-bot.action";
import {
  updateBotSchema,
  type UpdateBotInput,
} from "@/features/bots/validations";

import { GeneralInformationSection } from "./general-information-section";
import { ModelSelectionSection } from "./model-selection-section";
import { SystemPromptSection } from "./system-prompt-section";
import { AdvancedParametersSection } from "./advanced-parameters-section";

interface EditBotFormProps {
  bot: {
    id: string;
    name: string;
    description: string | null;
    systemPrompt: string;
    modelProvider: "openrouter";
    model: string;
    temperature: number;
    maxTokens: number | null;
  };
}

export function EditBotForm({ bot }: EditBotFormProps) {
  const router = useRouter();

  const form = useForm<UpdateBotInput>({
    resolver: zodResolver(updateBotSchema),
    defaultValues: {
      id: bot.id,
      name: bot.name,
      description: bot.description || "",
      systemPrompt: bot.systemPrompt,
      modelProvider: bot.modelProvider,
      model: bot.model,
      temperature: bot.temperature,
      maxTokens: bot.maxTokens || 4096,
    },
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const {
    executeAsync: executeUpdate,
    isExecuting: isUpdating,
    reset: resetUpdate,
  } = useAction(updateBotAction, {
    onSuccess: () => {
      toast.success("Bot updated successfully!");
      form.reset(form.getValues());
      resetUpdate();
      router.push(`/bots/${bot.id}`);
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError);
      } else if (error.validationErrors) {
        toast.error("Please check the form for validation errors.");
      } else {
        toast.error("Failed to update bot. Please try again.");
      }
    },
    onSettled: () => {
      resetUpdate();
    },
  });

  const {
    executeAsync: executeDelete,
    isExecuting: isDeleting,
    reset: resetDelete,
  } = useAction(deleteBotAction, {
    onSuccess: () => {
      toast.success(`"${bot.name}" deleted successfully!`);
      resetDelete();
      router.push("/bots");
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError || "Failed to delete bot. Please try again.",
      );
    },
    onSettled: () => {
      resetDelete();
    },
  });

  const isBusy = isUpdating || isDeleting;

  const submitForm = form.handleSubmit(async (data) => {
    await executeUpdate(data);
  });

  const handleDelete = async () => {
    await executeDelete({ id: bot.id });
  };

  return (
    <FormProvider {...form}>
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2">
          <Link
            href={`/bots/${bot.id}`}
            className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            Back to {bot.name}
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Edit Bot
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Update your AI chatbot&apos;s identity, system instructions, and LLM configuration.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                render={<Link href={`/bots/${bot.id}`} />}
                nativeButton={false}
              >
                Cancel
              </Button>
              <Button type="button" disabled={isBusy} onClick={submitForm}>
                {isUpdating ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading01Icon}
                      size={14}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Form sections */}
        <form onSubmit={submitForm} className="space-y-6">
          <GeneralInformationSection disabled={isBusy} />
          <ModelSelectionSection disabled={isBusy} />
          <SystemPromptSection disabled={isBusy} />
          <AdvancedParametersSection disabled={isBusy} />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              render={<Link href={`/bots/${bot.id}`} />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isUpdating ? (
                <>
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    size={14}
                    className="animate-spin"
                  />
                  Saving Changes...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-12 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-destructive">
                Danger Zone
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Permanently delete this bot along with all of its conversations,
                messages, and connected configuration.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={() => setDeleteConfirmOpen(true)}
              className="gap-2"
            >
              <HugeiconsIcon icon={Trash} size={14} />
              Delete Bot
            </Button>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setDeleteConfirmOpen(false);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={Trash} size={14} />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this bot? This action cannot be
                undone and will permanently erase all settings, conversations,
                and knowledge associations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading01Icon}
                      size={12}
                      className="animate-spin mr-1"
                    />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </FormProvider>
  );
}
