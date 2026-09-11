"use client";

import * as React from "react";

import { NavMain } from "@/components/layouts/sidebar/nav-main";
import { NavUser } from "@/components/layouts/sidebar/nav-user";
import { TeamSwitcher } from "@/components/layouts/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { MENUS } from "../menus";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {MENUS.map((menu) => (
          <NavMain menu={menu} key={menu.title} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
