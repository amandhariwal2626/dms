'use client';

import * as React from 'react';
import { Command, KeyRound, ScrollText, Shield, Users } from 'lucide-react';

import { NavUsersAccess } from './nav-users-access';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const data = {
  navUsersAccess: [
    {
      title: 'Users',
      url: '/users',
      icon: Users,
      items: [
        {
          title: 'All Users',
          url: '/users',
        },
        {
          title: 'Invitations',
          url: '/users/invitations',
        },
        {
          title: 'Teams',
          url: '/users/teams',
        },
      ],
    },
    {
      title: 'Roles',
      url: '/roles',
      icon: Shield,
      items: [
        {
          title: 'All Roles',
          url: '/roles',
        },
        {
          title: 'Role Assignments',
          url: '/roles/role-assignments',
        },
      ],
    },
    {
      title: 'Permissions',
      url: '/permissions',
      icon: KeyRound,
      items: [
        {
          title: 'Permission Sets',
          url: '/permissions',
        },
        {
          title: 'Resource Access',
          url: '/permissions/resource-access',
        },
      ],
    },
    {
      title: 'Audit Log',
      url: '/audit-log',
      icon: ScrollText,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Acme Inc</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavUsersAccess items={data.navUsersAccess} />
      </SidebarContent>
    </Sidebar>
  );
}
