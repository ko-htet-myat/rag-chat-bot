"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { cn } from "cn";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Bot,
  Brain02Icon,
  CheckmarkCircle02Icon,
  Database01Icon,
  Loading01Icon,
  Plus,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { BotAvatar } from "@/features/bots/components/bot-detail/bot-avatar";
import { createKnowledgeBaseAction } from "../actions";
import {
  createKnowledgeBaseSchema,
  type CreateKnowledgeBaseInput,
} from "../validations";
import type { UserBotOption } from "../types";

interface CreateKnowledgeBaseFormProps {
  bots: UserBotOption[];
}

const EMBEDDING_SPECS = [
  {
    icon: Brain02Icon,
    iconBg: "bg-pink-500/15",
    iconColor: "text-pink-400",
    label: "Embedding Model",
    name: "Text Embedding 3 Small",
    badge: "openai/text-embedding-3-small",
  },
  {
    icon: Database01Icon,
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
    label: "Vector Storage",
    name: "PostgreSQL + pgvector",
    badge: "Semantic similarity search",
  },
  {
    icon: Search01Icon,
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
    label: "Retrieval",
    name: "RAG Pipeline",
    badge: "Top-k chunks injected into context",
  },
];

export function CreateKnowledgeBaseForm({
  bots,
}: CreateKnowledgeBaseFormProps) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<CreateKnowledgeBaseInput>({
    resolver: zodResolver(createKnowledgeBaseSchema),
    defaultValues: {
      name: "",
      description: "",
      botId: bots.length === 1 ? bots[0].id : "",
    },
  });

  const {
    executeAsync,
    isExecuting,
    reset: resetAction,
  } = useAction(createKnowledgeBaseAction, {
    onSuccess: ({ data }) => {
      toast.success("Knowledge base created successfully!");
      resetForm();
      resetAction();
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
    onSettled: () => {
      resetAction();
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    await executeAsync(data);
  });

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Header — aligned with bot create form */}
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/knowledge"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back to Knowledge Bases
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              New Knowledge Base
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure a knowledge repository to provide custom context for
              your bot.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isExecuting}
              render={<Link href="/knowledge" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isExecuting} onClick={onSubmit}>
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
            </Button>
          </div>
        </div>
      </div>

      {bots.length === 0 ? (
        /* Empty state */
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-3 text-amber-500">
              <HugeiconsIcon icon={Bot} size={20} />
              <CardTitle className="text-amber-500">No Bots Found</CardTitle>
            </div>
            <CardDescription className="text-amber-200/80">
              Knowledge bases must be attached to an AI bot. Please create a bot
              first before adding a knowledge base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/bots/create" />} nativeButton={false}>
              <HugeiconsIcon icon={Plus} size={14} />
              Create a Bot First
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {/* ── Card 1: Basic Information ── */}
          <Card>
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="text-base font-semibold text-foreground">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <Field>
                <FieldLabel htmlFor="kb-name">
                  Name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="kb-name"
                  placeholder="e.g. Company Documentation"
                  disabled={isExecuting}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </Field>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="kb-description">Description</FieldLabel>
                <Textarea
                  id="kb-description"
                  placeholder="What kind of documents will this knowledge base contain?"
                  disabled={isExecuting}
                  className="min-h-[110px]"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </Field>
            </CardContent>
          </Card>

          {/* ── Card 2: Connect to Bot ── */}
          <Card>
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="text-base font-semibold text-foreground">
                Connect to Bot
              </CardTitle>
              <CardDescription>
                Select the bot that will use this knowledge base
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Controller
                name="botId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2.5">
                    {bots.map((bot) => {
                      const isSelected = field.value === bot.id;
                      return (
                        <button
                          key={bot.id}
                          type="button"
                          disabled={isExecuting}
                          onClick={() => field.onChange(bot.id)}
                          className={cn(
                            "flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                              : "border-border bg-card hover:border-border/80 hover:bg-muted/40",
                          )}
                        >
                          <BotAvatar size="sm" />
                          <span
                            className={cn(
                              "flex-1 text-sm font-medium",
                              isSelected
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground",
                            )}
                          >
                            {bot.name}
                          </span>
                          {isSelected ? (
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              size={18}
                              className="shrink-0 text-primary"
                            />
                          ) : (
                            <span className="size-[18px] shrink-0 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              {errors.botId && (
                <p className="text-xs text-destructive">
                  {errors.botId.message}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                You can connect this knowledge base to additional bots from Bot
                Settings later.
              </p>
            </CardContent>
          </Card>

          {/* ── Card 3: Embedding & Storage ── */}
          <Card>
            <CardHeader className="border-b border-border/70 pb-5">
              <CardTitle className="text-base font-semibold text-foreground">
                Embedding &amp; Storage
              </CardTitle>
            </CardHeader>

            <CardContent className="divide-y divide-border/50">
              {EMBEDDING_SPECS.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-2 last:pb-2"
                >
                  {/* Icon + Label */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        spec.iconBg,
                      )}
                    >
                      <HugeiconsIcon
                        icon={spec.icon}
                        size={20}
                        className={spec.iconColor}
                      />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        {spec.label}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {spec.name}
                      </p>
                    </div>
                  </div>

                  {/* Badge */}
                  <span className="shrink-0 rounded-lg bg-muted/60 px-3 py-1 font-mono text-xs text-muted-foreground">
                    {spec.badge}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Footer Actions — aligned with bot create form footer ── */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Button
              variant="outline"
              type="button"
              disabled={isExecuting}
              render={<Link href="/knowledge" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    size={14}
                    className="animate-spin"
                  />
                  Creating Knowledge Base...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Plus} size={14} />
                  Create Knowledge Base
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
