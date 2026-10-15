'use client';

import { useDeferredValue, useEffect, useState } from 'react';

import { useDebounce } from '@e8ight/ui/hooks';
import { ErrorBoundary, Suspense } from '@suspensive/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { useParams } from 'next/navigation';

import { agentQueries } from '@/apis/agent';
import { AgentAsideSkeleton } from '@/app/(app)/service/agents/_components/agentAside/AgentAsideSkeleton';
import { openIngestFlowGuideDialog } from '@/app/(app)/service/agents/_components/IngestFlowGuideDialog';
import {
  AGENT_STATUS_CLASS,
  AGENT_STATUS_VARIANT,
} from '@/app/(app)/service/agents/_constants/agentStatus';
import { NavigationAside } from '@/components/common/NavigationAside';
import { QueryErrorFallback } from '@/components/common/QueryErrorFallback';
import { usePagination } from '@/hooks/usePagination';

import type { AgentListItem } from '@/apis/agent';
import type { UsePaginationResult } from '@/hooks/usePagination';

const LIST_COUNT = 10;

interface AgentAsideProps {
  onOpenNewAgent: () => void;
}

interface AgentAsideListProps {
  agentName: string | undefined;
  searchWord: string;
  onSearchChange: (value: string) => void;
  debouncedWord: string;
  pagination: UsePaginationResult;
  onTotalPagesChange: (totalPages: number) => void;
  onOpenNewAgent: () => void;
}

function AgentAsideList({
  agentName,
  searchWord,
  onSearchChange,
  debouncedWord,
  pagination,
  onTotalPagesChange,
  onOpenNewAgent,
}: AgentAsideListProps) {
  const deferredPage = useDeferredValue(pagination.page);
  const deferredWord = useDeferredValue(debouncedWord);

  const { data: agentPage } = useSuspenseQuery({
    ...agentQueries.list({
      curPage: deferredPage - 1,
      size: LIST_COUNT,
      name: deferredWord || undefined,
    }),
  });

  useEffect(() => {
    onTotalPagesChange(agentPage.totalPage || 1);
  }, [agentPage, onTotalPagesChange]);

  return (
    <NavigationAside
      title="Agent"
      description="Configure your agents"
      items={agentPage.data.map((item: AgentListItem) => ({
        key: String(item.id),
        to: `/service/agents/${encodeURIComponent(item.name)}`,
        active: item.name === agentName,
        title: item.name,
        primaryText: item.name,
        badge: {
          label: item.status,
          variant: AGENT_STATUS_VARIANT[item.status] ?? 'secondary',
          className: AGENT_STATUS_CLASS[item.status],
        },
      }))}
      searchValue={searchWord}
      onSearchChange={onSearchChange}
      newAction={{
        label: 'New',
        title: 'Add new agent',
        onClick: onOpenNewAgent,
      }}
      secondaryNewAction={{
        title: '수집 설정 가이드',
        ariaLabel: '수집 설정 가이드 열기',
        icon: <BookOpen className="size-4" />,
        onClick: () => void openIngestFlowGuideDialog(),
      }}
      pagination={pagination}
    />
  );
}

function AgentAside({ onOpenNewAgent }: AgentAsideProps) {
  const { agentName: rawAgentName } = useParams<{ agentName: string }>();
  const agentName = rawAgentName ? decodeURIComponent(rawAgentName) : undefined;

  const [searchWord, setSearchWord] = useState('');
  const debouncedWord = useDebounce(searchWord, 300);
  const [totalPages, setTotalPages] = useState(1);

  const pagination = usePagination(totalPages, debouncedWord);

  return (
    <ErrorBoundary fallback={<QueryErrorFallback />}>
      <Suspense clientOnly fallback={<AgentAsideSkeleton />}>
        <AgentAsideList
          agentName={agentName}
          searchWord={searchWord}
          onSearchChange={setSearchWord}
          debouncedWord={debouncedWord}
          pagination={pagination}
          onTotalPagesChange={setTotalPages}
          onOpenNewAgent={onOpenNewAgent}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

export default AgentAside;
