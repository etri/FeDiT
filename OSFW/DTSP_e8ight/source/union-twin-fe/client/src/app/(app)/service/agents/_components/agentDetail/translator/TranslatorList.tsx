import { useState } from 'react';

import TranslatorDetail from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslatorDetail';
import { TranslatorHeader } from '@/app/(app)/service/agents/_components/agentDetail/translator/TranslatorHeader';

import type { AgentModel } from '@/apis/agent';
import type { TranslatorType } from '@/apis/translator/translator.types';

interface TranslatorListProps {
  translators: TranslatorType[];
  modelInfoList: AgentModel[];
}

export function TranslatorList({
  translators,
  modelInfoList,
}: TranslatorListProps) {
  const [activeTabId, setActiveTabId] = useState<null | number>(
    translators[0]?.id ?? null,
  );
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="space-y-2 pr-2">
      {translators.map((translator) => (
        <div
          key={translator.id}
          className="border-border overflow-hidden rounded-lg border"
        >
          <TranslatorHeader
            translator={translator}
            isEdit={editingId === translator.id}
            isActive={activeTabId === translator.id}
            onChangeTabToggle={() =>
              setActiveTabId((prev) =>
                prev === translator.id ? null : translator.id,
              )
            }
          />
          {activeTabId === translator.id && (
            <TranslatorDetail
              translator={translator}
              modelInfoList={modelInfoList}
              isEdit={editingId === translator.id}
              onChangeIsEdit={() =>
                setEditingId((prev) =>
                  prev === translator.id ? null : translator.id,
                )
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
