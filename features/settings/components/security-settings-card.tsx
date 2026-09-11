"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "../validations";

export function SecuritySettingsCard() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      revokeOtherSessions: true,
    },
  });

  const onSubmit = async (values: ChangePasswordInput) => {
    setIsLoading(true);
    try {
      // Better Auth client changePassword method
      const { error } = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: values.revokeOtherSessions,
      });

      if (error) {
        toast.error(error.message || "Failed to update password. Check current password.");
        return;
      }

      toast.success("Password updated successfully!");
      reset();
      setIsChangingPassword(false);
    } catch {
      toast.error("An unexpected error occurred while changing password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsChangingPassword(false);
  };

  return (
    <Card className="rounded-xl border border-border/70 bg-card/60 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isChangingPassword ? (
          /* Collapsed View matching design mockup 2 */
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">
                Ensure your account is using a secure password
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPassword(true)}
              className="h-8 rounded-lg bg-card/80 border-border/70 text-xs font-medium text-foreground hover:bg-muted"
            >
              Change Password
            </Button>
          </div>
        ) : (
          /* Expanded Form matching design mockup 3 */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in-50 duration-200">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="current-password" className="text-xs font-medium text-muted-foreground">
                Current Password
              </FieldLabel>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••••••"
                disabled={isLoading}
                className="h-10 bg-background/50 border-border/70 text-foreground"
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {errors.currentPassword.message}
                </p>
              )}
            </Field>

            <Field className="space-y-1.5">
              <FieldLabel htmlFor="new-password" className="text-xs font-medium text-muted-foreground">
                New Password
              </FieldLabel>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••••••"
                disabled={isLoading}
                className="h-10 bg-background/50 border-border/70 text-foreground"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </Field>

            <Field className="space-y-1.5">
              <FieldLabel htmlFor="confirm-new-password" className="text-xs font-medium text-muted-foreground">
                Confirm New Password
              </FieldLabel>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="••••••••••••"
                disabled={isLoading}
                className="h-10 bg-background/50 border-border/70 text-foreground"
                {...register("confirmNewPassword")}
              />
              {errors.confirmNewPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmNewPassword.message}
                </p>
              )}
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 h-9 rounded-lg text-sm"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleCancel}
                className="bg-card/80 border-border/70 text-foreground hover:bg-muted text-sm h-9 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
