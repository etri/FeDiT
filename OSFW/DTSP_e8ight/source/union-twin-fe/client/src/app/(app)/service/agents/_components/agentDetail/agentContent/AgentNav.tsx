'use client';

import { Tabs, TabsList, TabsTrigger } from '@e8ight/ui/components/ui/tabs';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

function AgentNav() {
  const pages = [
    { name: 'Agent Info', path: 'agent-info' },
    { name: 'Translator', path: 'translator' },
  ];

  const rawParams = useParams<{ agentName: string }>();
  const agentName = rawParams.agentName
    ? decodeURIComponent(rawParams.agentName)
    : undefined;
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'agent-info';

  const resolvedValue = pages.some((p) => p.path === tab) ? tab : 'agent-info';

  return (
    <div className="w-full overflow-x-auto">
      <Tabs value={resolvedValue}>
        <TabsList
          variant="line"
          className="h-8 w-full rounded-none border-0 bg-transparent p-0 sm:w-fit"
        >
          {pages.map((item) => {
            const to = agentName
              ? `/service/agents/${encodeURIComponent(agentName)}?tab=${item.path}`
              : '/service/agents';
            return (
              <TabsTrigger key={item.path} value={item.path} asChild>
                <Link href={to} className="w-full justify-center sm:w-[232px]">
                  {item.name}
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}

export default AgentNav;
