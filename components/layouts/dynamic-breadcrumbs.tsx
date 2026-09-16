"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Crumb {
  label: string;
  href?: string;
}

function getCrumbsForPath(pathname: string): Crumb[] {
  if (!pathname || pathname === "/") {
    return [{ label: "Dashboard" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];

  if (segments[0] === "bots") {
    crumbs.push({ label: "Bots", href: "/bots" });

    if (segments[1] === "create") {
      crumbs.push({ label: "Create Bot" });
    } else if (segments[1]) {
      const botId = segments[1];
      if (segments[2] === "edit") {
        crumbs.push({ label: "Bot Details", href: `/bots/${botId}` });
        crumbs.push({ label: "Edit" });
      } else {
        crumbs.push({ label: "Bot Details" });
      }
    }
  } else if (segments[0] === "knowledge") {
    crumbs.push({ label: "Knowledge Base", href: "/knowledge" });

    if (segments[1] === "create") {
      crumbs.push({ label: "New Knowledge Base" });
    } else if (segments[1]) {
      crumbs.push({ label: "Documents" });
    }
  } else if (segments[0] === "conversations") {
    crumbs.push({ label: "Conversations", href: "/conversations" });

    if (segments[1]) {
      crumbs.push({ label: "Conversation Thread" });
    }
  } else if (segments[0] === "widget") {
    crumbs.push({ label: "Website Widget" });
  } else if (segments[0] === "settings") {
    crumbs.push({ label: "Settings" });
  } else {
    // Fallback for any other route
    segments.forEach((seg, i) => {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const formatted = seg.charAt(0).toUpperCase() + seg.slice(1);
      if (i === segments.length - 1) {
        crumbs.push({ label: formatted });
      } else {
        crumbs.push({ label: formatted, href });
      }
    });
  }

  return crumbs;
}

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = getCrumbsForPath(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <span key={crumb.label + index} className="inline-flex items-center gap-1.5 sm:gap-2.5">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage className="text-foreground font-medium text-xs sm:text-sm">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={crumb.href} />}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
