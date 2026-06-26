import type * as React from 'react';
import { AppSidebar } from '@/components/shared/sidebar/app-sidebar';
import { SiteHeader } from '@/components/shared/sidebar/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export function AppShell({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
