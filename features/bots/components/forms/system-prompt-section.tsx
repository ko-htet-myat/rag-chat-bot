"use client";

import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sparkles } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

import type { CreateBotInput } from "../../validations";
import { PROMPT_PRESETS } from "../../constants";
import { FormSection } from "./form-section";

interface SystemPromptSectionProps {
  disabled: boolean;
}

export function SystemPromptSection({ disabled }: SystemPromptSectionProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CreateBotInput>();

  function applyPreset(promptText: string, presetTitle: string) {
    setValue("systemPrompt", promptText, { shouldValidate: true });
    toast.info(`Applied "${presetTitle}" preset prompt`);
  }

  return (
    <FormSection
      title="System Prompt & Persona"
      description="Define your chatbot's behavior, instructions, boundaries, and tone of voice."
    >
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Sparkles} size={14} className="text-primary" />
          <span>Quick Persona Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_PRESETS.map((preset) => (
            <Button
              key={preset.title}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => applyPreset(preset.prompt, preset.title)}
            >
              {preset.title}
            </Button>
          ))}
        </div>
      </div>

      <Field>
        <FieldLabel htmlFor="system-prompt">
          Instructions <span className="text-destructive">*</span>
        </FieldLabel>
        <Textarea
          id="system-prompt"
          rows={8}
          placeholder="You are a helpful assistant..."
          className=" text-xs leading-relaxed"
          disabled={disabled}
          {...register("systemPrompt")}
        />
        <FieldDescription>
          Markdown syntax is supported. Be specific with rules, formatting
          constraints, and domain boundaries.
        </FieldDescription>
        {errors.systemPrompt && (
          <p className="text-xs text-destructive">
            {errors.systemPrompt.message}
          </p>
        )}
      </Field>
    </FormSection>
  );
}
