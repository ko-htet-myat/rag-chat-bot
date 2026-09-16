import { AppSidebar } from "@/components/layouts/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DynamicBreadcrumbs } from "@/components/layouts/dynamic-breadcrumbs";
import { ThemeToggle } from "@/components/layouts/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-[height] ease-linear">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="h-4 data-[orientation=vertical]:h-4"
            />
            <div className="min-w-0 overflow-hidden">
              <DynamicBreadcrumbs />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
