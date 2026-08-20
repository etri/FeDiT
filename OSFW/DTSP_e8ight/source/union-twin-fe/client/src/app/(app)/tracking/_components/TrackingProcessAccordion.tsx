import { useState } from 'react';

import ProcessPanel from '@/app/(app)/tracking/_components/ProcessPanel';

import type { TrckProcInfo } from '@/app/(app)/tracking/_types/trackingProcessForm';

interface TrackingProcessAccordionProps {
  processes: TrckProcInfo[];
  onProcessChange: (
    index: number,
    updater: (current: TrckProcInfo) => TrckProcInfo,
  ) => void;
  fieldErrors: Record<string, boolean>;
  onRemoveProcess: (index: number) => void;
}

function TrackingProcessAccordion({
  processes,
  onProcessChange,
  fieldErrors,
  onRemoveProcess,
}: TrackingProcessAccordionProps) {
  const [expandedPanels, setExpandedPanels] = useState<number[]>([]);

  const togglePanel = (index: number) => {
    setExpandedPanels((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleFieldChange = (index: number, field: string, value: unknown) => {
    onProcessChange(index, (current) => {
      if (!field.includes('.')) {
        return { ...current, [field]: value };
      }

      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        return {
          ...current,
          [parent]: {
            ...(current[parent as keyof typeof current] as unknown as Record<
              string,
              unknown
            >),
            [child]: value,
          },
        };
      }

      if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        const parentValue = current[
          parent as keyof typeof current
        ] as unknown as Record<string, unknown> | undefined;
        return {
          ...current,
          [parent]: {
            ...parentValue,
            [child]: {
              ...((parentValue?.[child] as Record<string, unknown>) || {}),
              [grandchild]: value,
            },
          },
        };
      }

      return current;
    });
  };

  const getProcessErrors = (index: number) => {
    const processErrors: Record<string, boolean> = {};
    Object.entries(fieldErrors).forEach(([key, hasError]) => {
      if (key.endsWith(`-${index}`)) {
        processErrors[key.replace(`-${index}`, '')] = hasError;
      }
    });
    return processErrors;
  };

  return (
    <>
      {processes.map((process, index) => (
        <ProcessPanel
          key={process.trckPrcIdtifier || `process-${index}`}
          process={process}
          fieldErrors={getProcessErrors(index)}
          isExpanded={expandedPanels.includes(index)}
          onToggle={() => togglePanel(index)}
          onRemove={() => onRemoveProcess(index)}
          onFieldChange={(field, value) =>
            handleFieldChange(index, field, value)
          }
        />
      ))}
    </>
  );
}

export default TrackingProcessAccordion;
