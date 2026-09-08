"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Book02Icon,
  Bot,
  Loading01Icon,
  Plus,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";

import { createKnowledgeBaseAction } from "../actions";
import {
  createKnowledgeBaseSchema,
  type CreateKnowledgeBaseInput,
} from "../validations";
import type { UserBotOption } from "../types";

interface CreateKnowledgeBaseFormProps {
  bots: UserBotOption[];
}

export function CreateKnowledgeBaseForm({ bots }: CreateKnowledgeBaseFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateKnowledgeBaseInput>({
    resolver: zodResolver(createKnowledgeBaseSchema),
    defaultValues: {
      name: "",
      description: "",
      botId: bots.length === 1 ? bots[0].id : "",
    },
  });

  const { executeAsync, isExecuting } = useAction(createKnowledgeBaseAction, {
    onSuccess: ({ data }) => {
      toast.success("Knowledge base created successfully!");
      if (data?.knowledgeBase?.id) {
        router.push(`/knowledge/${data.knowledgeBase.id}`);
      } else {
        router.push("/knowledge");
      }
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError);
      } else if (error.validationErrors) {
        toast.error("Please check the form for validation errors.");
      } else {
        toast.error("Failed to create knowledge base. Please try again.");
      }
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to Knowledge Bases
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            New Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure a knowledge repository to provide custom context for your bot.
          </p>
        </div>
        <div className="hidden sm:flex size-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
          <HugeiconsIcon icon={Book02Icon} size={24} />
        </div>
      </div>

      {bots.length === 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 text-amber-500">
              <HugeiconsIcon icon={Bot} size={20} />
              <CardTitle className="text-amber-500">No Bots Found</CardTitle>
            </div>
            <CardDescription className="text-amber-200/80">
              Knowledge bases must be attached to an AI bot. Please create a bot first
              before adding a knowledge base.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button render={<Link href="/bots/create" />} nativeButton={false}>
              <HugeiconsIcon icon={Plus} size={14} />
              Create a Bot First
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <form onSubmit={onSubmit}>
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="text-base font-semibold text-foreground">
                Knowledge Base Details
              </CardTitle>
              <CardDescription>
                Provide identity and target bot information. You will be able to upload documents in the next step.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Name field */}
              <Field>
                <FieldLabel htmlFor="kb-name">
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="kb-name"
                  placeholder="e.g. Company Documentation, Product FAQ, Developer Docs"
                  disabled={isExecuting}
                  className="rounded-xl"
                  {...register("name")}
                />
                <FieldDescription>
                  A descriptive title for this collection of documents.
                </FieldDescription>
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </Field>

              {/* Description field */}
              <Field>
                <FieldLabel htmlFor="kb-description">
                  Description (Optional)
                </FieldLabel>
                <Textarea
                  id="kb-description"
                  placeholder="e.g. Internal company policies, procedures, and support guidelines."
                  disabled={isExecuting}
                  className="min-h-[100px] rounded-xl"
                  {...register("description")}
                />
                <FieldDescription>
                  Explain what documents or topics are covered in this knowledge base.
                </FieldDescription>
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </Field>

              {/* Target Bot Selection */}
              <Field>
                <FieldLabel htmlFor="kb-bot">
                  Target Bot <span className="text-destructive">*</span>
                </FieldLabel>
                <NativeSelect
                  id="kb-bot"
                  className="w-full"
                  disabled={isExecuting}
                  {...register("botId")}
                >
                  <option value="">-- Select a bot to attach this knowledge base --</option>
                  {bots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </NativeSelect>
                <FieldDescription>
                  The bot that will access and use documents from this knowledge base.
                </FieldDescription>
                {errors.botId && (
                  <p className="text-xs text-destructive">{errors.botId.message}</p>
                )}
              </Field>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border/70 pt-5">
              <Button
                type="button"
                variant="outline"
                disabled={isExecuting}
                render={<Link href="/knowledge" />}
                nativeButton={false}
              >
                Cancel
              </Button>

              <button
                type="submit"
                disabled={isExecuting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <HugeiconsIcon
                      icon={Loading01Icon}
                      size={14}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Plus} size={14} />
                    Create Knowledge Base
                  </>
                )}
              </button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}
