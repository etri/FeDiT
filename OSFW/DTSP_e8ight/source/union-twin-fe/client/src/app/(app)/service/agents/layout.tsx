'use client';

import type { ReactNode } from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { useIsMobile } from '@e8ight/ui/hooks';
import { useRouter } from 'next/navigation';

import AgentAside from '@/app/(app)/service/agents/_components/agentAside/AgentAside';
import { openAddAgentDialog } from '@/app/(app)/service/agents/_components/agentDetail/agentAddNew/AddAgentDialog';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleOpenNewAgent = async () => {
    const agentName = await openAddAgentDialog();
    if (!agentName) return;
    router.replace(
      `/service/agents/${encodeURIComponent(agentName)}?tab=agent-info`,
    );
  };

  return (
    <ResizablePanelGroup
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="bg-background h-full min-h-0 w-full"
    >
      <ResizablePanel
        defaultSize={isMobile ? 45 : 20}
        minSize={isMobile ? 35 : 15}
        maxSize={isMobile ? 60 : 30}
        className="flex min-h-0 min-w-0 flex-col"
      >
        <AgentAside onOpenNewAgent={handleOpenNewAgent} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        defaultSize={isMobile ? 55 : 80}
        className="flex min-h-0 min-w-0 flex-col"
      >
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
