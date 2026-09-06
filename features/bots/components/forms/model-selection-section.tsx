"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { CreateBotInput } from "../../validations";
import { POPULAR_MODELS } from "../../constants";
import { FormSection } from "./form-section";
import { ModelCard } from "./model-card";

interface ModelSelectionSectionProps {
  disabled: boolean;
}

export function ModelSelectionSection({ disabled }: ModelSelectionSectionProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreateBotInput>();
  const [isCustomModel, setIsCustomModel] = useState(false);

  const currentModel = watch("model");

  function toggleCustomModel() {
    setIsCustomModel((prev) => {
      const next = !prev;
      setValue(
        "model",
        next
          ? ""
          : (POPULAR_MODELS[0]?.id ?? "openai/gpt-4o-mini"),
        { shouldValidate: true },
      );
      return next;
    });
  }

  return (
    <FormSection
      title="Model Selection"
      description="Choose an AI model powered by OpenRouter or specify a custom model identifier."
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleCustomModel}
        >
          {isCustomModel ? "Pick from Popular" : "Enter Custom Model"}
        </Button>
      }
    >
      {!isCustomModel ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_MODELS.map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              isSelected={currentModel === m.id}
              onSelect={() => setValue("model", m.id, { shouldValidate: true })}
            />
          ))}
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor="custom-model">
            Custom OpenRouter Model Identifier{" "}
            <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="custom-model"
            placeholder="e.g. meta-llama/llama-3.1-8b-instruct or deepseek/deepseek-r1"
            disabled={disabled}
            {...register("model")}
          />
          <FieldDescription>
            Enter any model ID available on{" "}
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              OpenRouter
            </a>
            .
          </FieldDescription>
        </Field>
      )}

      {errors.model && (
        <p className="text-xs text-destructive">{errors.model.message}</p>
      )}
    </FormSection>
  );
}