'use client';

import {
  SidebarInset,
  SidebarProvider,
} from '@e8ight/ui/components/ui/sidebar';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { MobileTopBar } from '@/components/layout/MobileTopBar';

export function InnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <MobileTopBar />
        <div className="relative min-h-0 flex-1 overflow-auto">{children}</div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
