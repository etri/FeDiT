import { useState } from 'react';

import { TableCell, TableRow } from '@e8ight/ui/components/ui/table';
import { ChevronDown, ChevronUp } from 'lucide-react';

import ModelAttributeRowContainer from '@/app/(app)/service/agents/_components/agentDetail/agentContent/ModelAttributeRowContainer';

interface AgentModelInfoTableRowProps {
  modelType: string;
  context: string;
}

function AgentModelInfoTableRow({
  modelType,
  context,
}: AgentModelInfoTableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <>
      <TableRow onClick={handleToggle} className="cursor-pointer">
        <TableCell className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronUp className="size-3 transition-transform duration-200" />
          ) : (
            <ChevronDown className="size-3 transition-transform duration-200" />
          )}
          <span>{modelType}</span>
        </TableCell>
        <TableCell className="wrap-anywhere whitespace-normal">
          {context}
        </TableCell>
      </TableRow>
      {isExpanded && <ModelAttributeRowContainer modelType={modelType} />}
    </>
  );
}

export default AgentModelInfoTableRow;
