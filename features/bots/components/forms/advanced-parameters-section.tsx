"use client";

import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { SlidersHorizontalIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

import type { CreateBotInput } from "../../validations";
import { FormSection } from "./form-section";

interface AdvancedParametersSectionProps {
  disabled: boolean;
}

export function AdvancedParametersSection({
  disabled,
}: AdvancedParametersSectionProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<CreateBotInput>();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentTemperature =
    useWatch({
      control,
      name: "temperature",
      defaultValue: 0.7,
    }) ?? 0.7;

  return (
    <FormSection
      title="Advanced Parameters"
      description="Fine-tune model temperature and response token limits."
      icon={
        <HugeiconsIcon
          icon={SlidersHorizontalIcon}
          size={16}
          className="text-muted-foreground"
        />
      }
      titleClassName="text-sm"
      descriptionClassName="text-xs"
      contentClassName="space-y-6 pt-2"
      onHeaderClick={() => setShowAdvanced((prev) => !prev)}
      action={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
        >
          {showAdvanced ? "Hide" : "Show"}
        </Button>
      }
    >
      {showAdvanced && (
        <>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="temperature">Temperature</FieldLabel>
              <span className=" text-xs font-semibold text-primary">
                {currentTemperature.toFixed(2)}
              </span>
            </div>
            <Controller
              control={control}
              name="temperature"
              render={({ field }) => (
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  value={[field.value ?? 0.7]}
                  onValueChange={(val) => {
                    const nextVal = Array.isArray(val) ? val[0] : val;
                    field.onChange(Number(nextVal?.toFixed(2) ?? 0.7));
                  }}
                  className="py-2"
                />
              )}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>0.0 (Strict & Deterministic)</span>
              <span>1.0 (Balanced)</span>
              <span>2.0 (Creative & Varied)</span>
            </div>
            {errors.temperature && (
              <p className="text-xs text-destructive">
                {errors.temperature.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="max-tokens">Max Tokens</FieldLabel>
            <Input
              id="max-tokens"
              type="number"
              min={1}
              max={32768}
              placeholder="4096"
              disabled={disabled}
              {...register("maxTokens", {
                setValueAs: (v) =>
                  v === "" || v === undefined ? null : Number(v),
              })}
            />
            <FieldDescription>
              Maximum length of the generated response (leave blank or default
              to 4096).
            </FieldDescription>
            {errors.maxTokens && (
              <p className="text-xs text-destructive">
                {errors.maxTokens.message}
              </p>
            )}
          </Field>
        </>
      )}
    </FormSection>
  );
}
