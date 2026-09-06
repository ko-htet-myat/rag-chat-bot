import Link from "next/link";

import { Button } from "@/components/ui/button";

interface CancelBotButtonProps {
  disabled?: boolean;
}

export function CancelBotButton({ disabled }: CancelBotButtonProps) {
  return (
    <Button
      variant="outline"
      type="button"
      disabled={disabled}
      render={<Link href="/bots" />}
      nativeButton={false}
    >
      Cancel
    </Button>
  );
}