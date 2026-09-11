"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "../actions/update-profile.action";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "../validations";

interface ProfileSettingsCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function ProfileSettingsCard({ user }: ProfileSettingsCardProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(user.image ?? "");
  const [showAvatarInput, setShowAvatarInput] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name ?? "",
      image: user.image ?? "",
    },
  });

  const { executeAsync, isExecuting } = useAction(updateProfileAction, {
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError);
      } else if (error.validationErrors) {
        toast.error("Please check the form for errors.");
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    await executeAsync(values);
  };

  const initials = (watch("name") || user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="rounded-xl border border-border/70 bg-card/60 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <Avatar className="size-16 rounded-2xl bg-indigo-500/20 text-indigo-400 font-semibold text-lg border border-indigo-500/30">
            <AvatarImage
              src={avatarUrl || undefined}
              alt={user.name}
              className="rounded-2xl"
            />
            <AvatarFallback className="rounded-2xl bg-indigo-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg bg-card/80 border-border/70 text-xs font-medium text-foreground hover:bg-muted"
              onClick={() => setShowAvatarInput(!showAvatarInput)}
            >
              Change Avatar
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF · Max 2 MB
            </p>
          </div>
        </div>

        {showAvatarInput && (
          <Field className="space-y-1.5 animate-in fade-in-50 duration-200">
            <FieldLabel htmlFor="profile-image" className="text-xs font-medium text-muted-foreground">
              Avatar Image URL
            </FieldLabel>
            <Input
              id="profile-image"
              placeholder="https://example.com/avatar.png"
              disabled={isExecuting}
              className="h-10 bg-background/50 border-border/70 text-foreground"
              {...register("image", {
                onChange: (e) => setAvatarUrl(e.target.value),
              })}
            />
            {errors.image && (
              <p className="text-xs text-destructive">{errors.image.message}</p>
            )}
          </Field>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name Field */}
          <Field className="space-y-1.5">
            <FieldLabel htmlFor="full-name" className="text-xs font-medium text-muted-foreground">
              Full Name
            </FieldLabel>
            <Input
              id="full-name"
              placeholder="Your full name"
              disabled={isExecuting}
              className="h-10 bg-background/50 border-border/70 text-foreground"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </Field>

          {/* Email Address Field (Disabled/Read-only) */}
          <Field className="space-y-1.5">
            <FieldLabel htmlFor="email-address" className="text-xs font-medium text-muted-foreground">
              Email Address
            </FieldLabel>
            <Input
              id="email-address"
              value={user.email}
              readOnly
              disabled
              className="h-10 bg-background/30 border-border/50 text-muted-foreground cursor-not-allowed opacity-80"
            />
            <FieldDescription className="text-xs text-muted-foreground/80">
              Email cannot be changed. Contact support if needed.
            </FieldDescription>
          </Field>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isExecuting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5"
            >
              {isExecuting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
