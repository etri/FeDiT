import { useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from '@e8ight/ui/components/ui/item';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@e8ight/ui/components/ui/table';

import AgentModelInfoTableRow from '@/app/(app)/service/agents/_components/agentDetail/agentContent/AgentModelInfoTableRow';
import ModelManagerModal from '@/app/(app)/service/agents/_components/agentDetail/agentContent/ModelManagerModal';
import { useAgentStore } from '@/app/(app)/service/agents/_stores/useAgentStore';

function AgentModelInfoTable() {
  const agentModel = useAgentStore((state) => state.agentModel);
  const agentMode = useAgentStore((state) => state.agentMode);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-3">
      {agentMode !== 'read' && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            Manage Models
          </Button>
          {agentModel.length > 0 && (
            <span className="text-muted-foreground text-xs">
              {agentModel.length} model{agentModel.length !== 1 && 's'} linked
            </span>
          )}
        </div>
      )}

      {agentModel.length === 0 ? (
        <Empty className="border-border rounded-lg border py-8">
          <EmptyHeader>
            <EmptyTitle>No models linked</EmptyTitle>
            <EmptyDescription>
              Click &quot;Manage Models&quot; to add context and data-model
              pairs.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : agentMode === 'add' ? (
        <ItemGroup className="divide-border border-border gap-0 divide-y rounded-lg border">
          {agentModel.map((item) => (
            <Item
              key={item.modelType + item.context}
              role="listitem"
              className="gap-3 px-4"
            >
              <Badge variant="secondary" className="shrink-0">
                {item.modelType}
              </Badge>
              <ItemContent className="min-w-0">
                <ItemDescription className="truncate text-xs">
                  {item.context}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model Type</TableHead>
              <TableHead>Context URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentModel.map((item) => (
              <AgentModelInfoTableRow
                key={item.modelType + item.context}
                modelType={item.modelType}
                context={item.context}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <ModelManagerModal open={isModalOpen} onClose={setIsModalOpen} />
    </div>
  );
}

export default AgentModelInfoTable;
