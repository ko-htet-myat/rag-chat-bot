"use client";

import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createBotAction } from "@/features/bots/actions/create-bot.action";
import {
  createBotSchema,
  type CreateBotInput,
} from "@/features/bots/validations";
import {
  POPULAR_MODELS,
  PROMPT_PRESETS,
} from "@/features/bots/constants";

import { CreateBotFormHeader } from "./create-bot-form-header";
import { CreateBotFormFooter } from "./create-bot-form-footer";
import { GeneralInformationSection } from "./general-information-section";
import { ModelSelectionSection } from "./model-selection-section";
import { SystemPromptSection } from "./system-prompt-section";
import { AdvancedParametersSection } from "./advanced-parameters-section";

export function CreateBotForm() {
  const router = useRouter();

  const form = useForm<CreateBotInput>({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      name: "",
      description: "",
      systemPrompt:
        PROMPT_PRESETS[0]?.prompt ??
        "You are a helpful and polite AI customer assistant.",
      modelProvider: "openrouter",
      model: POPULAR_MODELS[0]?.id ?? "openai/gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096,
    },
  });

  const { executeAsync, isExecuting } = useAction(createBotAction, {
    onSuccess: () => {
      toast.success("Bot created successfully!");
      router.push("/bots");
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError);
      } else if (error.validationErrors) {
        toast.error("Please check the form for validation errors.");
      } else {
        toast.error("Failed to create bot. Please try again.");
      }
    },
  });

  const submitForm = form.handleSubmit(async (data) => {
    await executeAsync(data);
  });

  return (
    <FormProvider {...form}>
      <div className="mx-auto w-full max-w-4xl px-2 py-6 sm:px-6 sm:py-8">
        <CreateBotFormHeader
          isExecuting={isExecuting}
          onSubmit={submitForm}
        />

        <form onSubmit={submitForm} className="space-y-6">
          <GeneralInformationSection disabled={isExecuting} />
          <ModelSelectionSection disabled={isExecuting} />
          <SystemPromptSection disabled={isExecuting} />
          <AdvancedParametersSection disabled={isExecuting} />
          <CreateBotFormFooter isExecuting={isExecuting} />
        </form>
      </div>
    </FormProvider>
  );
}