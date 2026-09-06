"use client";

import React, { useState, useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WidgetDeploymentSectionProps {
  publicKey: string;
  enabled: boolean;
}

export function WidgetDeploymentSection({
  publicKey,
  enabled,
}: WidgetDeploymentSectionProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // useSyncExternalStore: SSR snapshot returns null, client snapshot returns real origin.
  // This guarantees server and client render identical initial HTML (no hydration mismatch)
  // and avoids calling setState inside an effect.
  const origin = useSyncExternalStore(
    () => () => {},                         // subscribe: no external changes, noop unsubscribe
    () => window.location.origin,           // getSnapshot (client)
    () => null,                             // getServerSnapshot (SSR)
  );

  const scriptSnippet =
    origin !== null
      ? `<script\n  src="${origin}/widget.js"\n  data-public-key="${publicKey}"\n  data-api-base="${origin}"\n  async>\n</script>`
      : `<script\n  src="YOUR_DOMAIN/widget.js"\n  data-public-key="${publicKey}"\n  data-api-base="YOUR_DOMAIN"\n  async>\n</script>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(scriptSnippet);
      setCopiedCode(true);
      toast.success("Embed code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code to clipboard");
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopiedKey(true);
      toast.success("Public key copied to clipboard!");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast.error("Failed to copy public key to clipboard");
    }
  };

  // Mask public key for display: e.g. pk_live_a7f3b2c8••••••••
  const maskedKey = React.useMemo(() => {
    if (!publicKey) return "pk_live_••••••••••••••••";
    if (publicKey.startsWith("pk_live_")) {
      const prefix = publicKey.slice(0, 16);
      return `${prefix}••••••••`;
    }
    const prefix = publicKey.slice(0, 8);
    return `${prefix}••••••••`;
  }, [publicKey]);

  return (
    <div className="space-y-6">
      {/* 1. Install on your website Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Install on your website
          </h3>
          <p className="text-xs text-muted-foreground">
            Copy this code and paste it before the closing{" "}
            <code className="rounded bg-secondary/80 px-1.5 py-0.5 font-mono text-[11px] text-indigo-400">
              &lt;/body&gt;
            </code>{" "}
            tag.
          </p>
        </div>

        {/* Script Code Block */}
        <div className="relative rounded-xl border border-border/70 bg-[#0b0e1a] p-4 sm:p-5">
          <div className="absolute right-3.5 top-3.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-secondary hover:text-white"
            >
              <HugeiconsIcon
                icon={copiedCode ? Tick01Icon : Copy01Icon}
                size={14}
                className={copiedCode ? "text-emerald-400" : "text-slate-400"}
              />
              {copiedCode ? "Copied" : "Copy Code"}
            </button>
          </div>

          <pre className="overflow-x-auto pr-24 font-mono text-xs sm:text-sm leading-relaxed text-slate-300">
            <code>{scriptSnippet}</code>
          </pre>
        </div>
      </div>

      {/* 2. Status and Public Key Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Widget Status Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Widget Status
            </h4>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold",
                enabled ? "text-emerald-400" : "text-slate-400",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  enabled
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : "bg-slate-500",
                )}
              />
              {enabled ? "Active" : "Inactive"}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground leading-normal">
            {enabled
              ? "Your widget is live and accepting conversations."
              : "Your widget is disabled and will not appear to website visitors."}
          </p>
        </div>

        {/* Public Key Card */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-xs">
          <h4 className="text-sm font-semibold text-foreground">Public Key</h4>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border/70 bg-[#0d0f1b] px-3.5 py-2.5">
            <span className="font-mono text-xs sm:text-sm tracking-wide text-indigo-300 select-all">
              {maskedKey}
            </span>
            <button
              type="button"
              onClick={handleCopyKey}
              title="Copy Public Key"
              className="ml-2 inline-flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <HugeiconsIcon
                icon={copiedKey ? Tick01Icon : Copy01Icon}
                size={15}
                className={copiedKey ? "text-emerald-400" : "text-slate-400"}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
