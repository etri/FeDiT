import dynamic from 'next/dynamic';

const StatisticsCalendar = dynamic(
  () =>
    import('@/app/(app)/service/statistics/_components/statisticsAside/Calendar'),
  { ssr: false },
);

function StatisticsAside() {
  return (
    <aside className="border-border bg-background w-full flex-none border-b xl:h-full xl:w-[320px] xl:border-r xl:border-b-0">
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-border border-b px-4 py-3">
          <h2 className="text-foreground text-sm font-bold tracking-[.03em]">
            Statistics
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <StatisticsCalendar />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default StatisticsAside;
