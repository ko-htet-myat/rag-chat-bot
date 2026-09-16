"use client";

import { ProfileSettingsCard } from "./profile-settings-card";
import { SecuritySettingsCard } from "./security-settings-card";
import { DangerZoneCard } from "./danger-zone-card";

interface SettingsViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function SettingsView({ user }: SettingsViewProps) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        <ProfileSettingsCard user={user} />
        <SecuritySettingsCard />
        <DangerZoneCard />
      </div>
    </div>
  );
}
