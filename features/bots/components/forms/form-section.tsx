import type { ReactNode } from "react";
import { cn } from "cn";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormSectionProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
  onHeaderClick?: () => void;
  children?: ReactNode;
}

export function FormSection({
  title,
  description,
  icon,
  action,
  headerClassName,
  titleClassName,
  descriptionClassName,
  contentClassName = "space-y-4",
  onHeaderClick,
  children,
}: FormSectionProps) {
  return (
    <Card>
      <CardHeader
        className={cn(headerClassName, onHeaderClick && "cursor-pointer select-none")}
        onClick={onHeaderClick}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-2">
            {icon}
            <div>
              <CardTitle className={titleClassName}>{title}</CardTitle>
              {description ? (
                <CardDescription className={descriptionClassName}>
                  {description}
                </CardDescription>
              ) : null}
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      {children ? <CardContent className={contentClassName}>{children}</CardContent> : null}
    </Card>
  );
}