"use client";

import { useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { CreateBotInput } from "../../validations";
import { FormSection } from "./form-section";

interface GeneralInformationSectionProps {
  disabled: boolean;
}

export function GeneralInformationSection({ disabled }: GeneralInformationSectionProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateBotInput>();

  return (
    <FormSection
      title="General Information"
      description="Basic identity details that help you and your users identify this bot."
    >
      <Field>
        <FieldLabel htmlFor="bot-name">
          Bot Name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="bot-name"
          placeholder="e.g. Customer Support Bot"
          disabled={disabled}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="bot-description">
          Description (Optional)
        </FieldLabel>
        <Input
          id="bot-description"
          placeholder="e.g. Handles customer questions regarding billing and account setup"
          disabled={disabled}
          {...register("description")}
        />
        <FieldDescription>
          Brief summary displayed on your dashboard cards.
        </FieldDescription>
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </Field>
    </FormSection>
  );
}