import { Button } from '@e8ight/ui/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { overlay } from 'overlay-kit';

import { AgentFormSections } from '@/app/(app)/service/agents/_components/agentDetail/agentAddNew/AgentFormSections';
import { useSubmitNewAgent } from '@/app/(app)/service/agents/_hooks/useSubmitNewAgent';
import {
  AgentStoreProvider,
  useAgentStore,
} from '@/app/(app)/service/agents/_stores/useAgentStore';

function AddAgentDialogBody({
  onClose,
}: {
  onClose: (result?: string) => void;
}) {
  const agentData = useAgentStore((s) => s.agent);
  const { submit, isPending } = useSubmitNewAgent();

  const handleSave = () => submit(() => onClose(agentData.name));

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex w-full flex-1 flex-col overflow-auto">
          <div className="flex w-full max-w-none flex-col gap-6 pb-8">
            <AgentFormSections />
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose()}
            disabled={isPending}
          >
            Cancel
          </Button>
        </DialogClose>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? <Spinner className="size-4" /> : 'Save Agent'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function openAddAgentDialog() {
  return overlay.openAsync<string | undefined>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(undefined)}>
      <AgentStoreProvider initialState={{ agentMode: 'add' }}>
        <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
            <DialogDescription>
              Configure the agent details, connection settings, and linked
              models before saving.
            </DialogDescription>
          </DialogHeader>
          <AddAgentDialogBody onClose={close} />
        </DialogContent>
      </AgentStoreProvider>
    </Dialog>
  ));
}
