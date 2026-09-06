"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
        >
          {/* <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            {activeTeam.logo}
          </div> */}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Inno Chat Bot</span>
            <span className="truncate text-xs">Enterprise</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
