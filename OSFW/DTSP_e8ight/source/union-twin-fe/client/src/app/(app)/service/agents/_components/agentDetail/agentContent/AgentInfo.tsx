import { useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { openConfirmDialog } from '@e8ight/ui/components/ui/confirm-dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@e8ight/ui/components/ui/resizable';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { toast } from '@e8ight/ui/components/ui/sonner';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useIsMobile } from '@e8ight/ui/hooks';
import { CircleStop, Info, Play, RotateCw, ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  agentQueries,
  useDeleteAgentMutation,
  usePatchAgentOperationMutation,
  usePutAgentMutation,
} from '@/apis/agent';
import AgentInfoTable from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentInfoTable';
import AgentModelInfoTable from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentModelInfoTable';
import AgentRightTable from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentRightTable';
import { openLogDialog } from '@/app/(app)/service/agents/_components/LogDialog';
import { DEFAULT_TOPIC } from '@/app/(app)/service/agents/_constants/kafkaAgent';
import {
  agentSchema,
  formatAgentIssues,
} from '@/app/(app)/service/agents/_schemas/agent.schema';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';

import type { Agent, AgentModel, AgentOperation } from '@/apis/agent';

function AgentInfo() {
  const agent = useAgentStore((state) => state.agent);
  const setAgent = useAgentStore((state) => state.setAgent);
  const agentModels = useAgentStore((state) => state.agentModel);
  const agentMode = useAgentStore((state) => state.agentMode);
  const setAgentMode = useAgentStore((state) => state.setAgentMode);
  const setAgentModel = useAgentStore((state) => state.setAgentModel);

  const [backupAgent, setBackupAgent] = useState<Agent | null>(null);
  const [backupModels, setBackupModels] = useState<AgentModel[] | null>(null);
  const isMobile = useIsMobile();

  const router = useRouter();
  const putAgentMutation = usePutAgentMutation();
  const deleteAgentMutation = useDeleteAgentMutation();
  const operationMutation = usePatchAgentOperationMutation();

  const isRunning = agent.status === 'RUN' || agent.status === 'HANG';

  async function handleOperation(operation: AgentOperation) {
    try {
      await operationMutation.mutateAsync({
        agentId: agent.id,
        agentName: agent.name,
        operation,
      });
      toast.success(`Agent ${operation} 요청이 완료되었습니다.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Agent ${operation} 실패`,
      );
    }
  }

  const handleEditMode = () => {
    setBackupAgent(agent);
    setBackupModels([...agentModels]);
    setAgent((prev) => ({
      ...prev,
      isCustomTopic: true,
      topic: DEFAULT_TOPIC,
    }));
    setAgentMode('edit');
  };

  const exitEditMode = () => {
    setBackupAgent(null);
    setBackupModels(null);
    setAgentMode('read');
  };

  const handleCancelEdit = () => {
    if (backupAgent) {
      setAgent(backupAgent);
    }
    if (backupModels) {
      setAgentModel(backupModels);
    }
    exitEditMode();
  };

  const handleSave = async () => {
    const result = agentSchema.safeParse(agent);
    if (!result.success) {
      toast.error(`Validation failed: ${formatAgentIssues(result.error)}`);
      return;
    }
    if (agent.isCustomConfig) {
      const confirmed = await openConfirmDialog({
        title: '직접 편집한 Config가 사라집니다',
        message:
          '이 Agent는 conf를 직접 편집한 상태입니다. 정보를 수정하면 conf가 재생성되어 편집 내용이 사라집니다. 계속하시겠습니까?',
        confirmText: '계속',
        cancelText: '취소',
      });
      if (!confirmed) return;
    }

    try {
      await putAgentMutation.mutateAsync({
        agentId: agent.id,
        agentName: agent.name,
        payload: { ...agent, isCustomTopic: true, models: agentModels },
        regenerateConfig: agent.isCustomConfig,
      });
      toast.success('Successfully updated.');
      exitEditMode();
    } catch {
      toast.error('Failed to update agent.');
    }
  };

  const handleDelete = async () => {
    const confirmed = await openConfirmDialog({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this agent?',
      confirmText: 'Delete',
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteAgentMutation.mutateAsync(agent.id);
      toast.success('Successfully deleted.');
      router.push('/service/agents');
    } catch {
      toast.error('Failed to delete agent.');
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {agentMode === 'edit' && (
        <div className="flex shrink-0 items-center">
          <Badge variant="default">Editing Configuration</Badge>
        </div>
      )}

      {agentMode === 'read' && isRunning && (
        <div className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs">
          <Info className="size-3.5 shrink-0" />
          <span>실행 중에는 수정/삭제할 수 없습니다. 먼저 중지하세요</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <ResizablePanelGroup
          direction={isMobile ? 'vertical' : 'horizontal'}
          className="min-h-0 flex-1"
        >
          <ResizablePanel defaultSize={45} minSize={30} className="min-h-0">
            <ScrollArea className="h-full [&>[data-slot=scroll-area-viewport]>div]:!block [&>[data-slot=scroll-area-viewport]>div]:min-w-0">
              <div className="space-y-3 pr-4">
                <h3 className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
                  Details
                </h3>
                <AgentInfoTable />

                <h3 className="text-muted-foreground pt-2 font-bold tracking-[0.07em] uppercase">
                  Models
                </h3>
                <AgentModelInfoTable />
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={55} minSize={30} className="min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-3 pl-4">
                <h3 className="text-muted-foreground font-bold tracking-[0.07em] uppercase">
                  Connection
                </h3>
                <AgentRightTable />
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex items-center gap-2">
          {agentMode === 'read' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={isRunning || operationMutation.isPending}
                onClick={() => handleOperation('run')}
              >
                <Play className="size-3.5" />
                Start
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!isRunning || operationMutation.isPending}
                onClick={() => handleOperation('stop')}
              >
                <CircleStop className="size-3.5" />
                Stop
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!isRunning || operationMutation.isPending}
                onClick={() => handleOperation('rerun')}
              >
                <RotateCw className="size-3.5" />
                Restart
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  void openLogDialog({
                    title: `${agent.name} Logs`,
                    modelTypes: agentModels.map((model) => model.modelType),
                    options: agentQueries.logs(agent.id),
                  })
                }
              >
                <ScrollText className="size-3.5" />
                Logs
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {agentMode === 'edit' ? (
            <>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={putAgentMutation.isPending}
              >
                {putAgentMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isRunning || deleteAgentMutation.isPending}
              >
                {deleteAgentMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  'Delete'
                )}
              </Button>
              <Button size="sm" disabled={isRunning} onClick={handleEditMode}>
                Edit Configuration
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgentInfo;
