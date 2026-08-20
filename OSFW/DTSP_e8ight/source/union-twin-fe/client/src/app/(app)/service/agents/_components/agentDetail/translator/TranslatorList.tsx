import { useState } from 'react';

import TranslatorDetail from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslatorDetail';
import { TranslatorHeader } from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslatorHeader';

import type { TranslatorType } from '@/apis/translator/translator.types';

interface TranslatorListProps {
  translators: TranslatorType[];
}

export function TranslatorList({ translators }: TranslatorListProps) {
  const [activeTabId, setActiveTabId] = useState<null | number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="space-y-2 pr-2">
      {translators.map((translator, idx) => (
        <div
          key={translator.id}
          className="border-border overflow-hidden rounded-lg border"
        >
          <TranslatorHeader
            translator={translator}
            isEdit={editingId === idx}
            isActive={activeTabId === idx}
            onChangeTabToggle={() =>
              setActiveTabId((prev) => (prev === idx ? null : idx))
            }
          />
          {activeTabId === idx && (
            <TranslatorDetail
              translator={translator}
              isEdit={editingId === idx}
              onChangeIsEdit={() =>
                setEditingId((prev) => (prev === idx ? null : idx))
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
