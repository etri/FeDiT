import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@e8ight/ui/components/ui/tabs';

import DataModelStatistics from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/statisticsTabPanel/DataModelStatistics';
import SourceStatistics from '@/app/(app)/service/statistics/_components/statisticsContent/statisticsTabPage/statisticsTabPanel/SourceStatistics';
import {
  useStatisticsStore,
  TabList,
} from '@/app/(app)/service/statistics/_stores';

import type { StatisticsTab } from '@/app/(app)/service/statistics/_types';

function StatisticsTabPage() {
  const currentTab = useStatisticsStore((s) => s.currentTab);
  const setCurrentTab = useStatisticsStore((s) => s.setCurrentTab);
  const clickable = useStatisticsStore((s) => s.clickable);

  return (
    <Tabs
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      value={currentTab}
      onValueChange={(v) => clickable && setCurrentTab(v)}
    >
      <div className="border-border border-b">
        <TabsList
          variant="line"
          className="grid w-full max-w-[420px] grid-cols-2 p-0"
        >
          {TabList.map((tabItem: StatisticsTab) => (
            <TabsTrigger
              key={tabItem.tabPath}
              value={tabItem.tabPath}
              disabled={!clickable}
              className="block min-w-0 truncate rounded-none px-1 pt-0 pb-3 text-left"
            >
              {tabItem.tabName}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="DataModelStatistics" className="min-h-0 flex-1 pt-4">
        <div className="border-border bg-background flex h-full min-h-0 flex-1 gap-4 overflow-hidden rounded-2xl border p-4">
          <DataModelStatistics />
        </div>
      </TabsContent>

      <TabsContent
        value="DataModelSourceStatistics"
        className="min-h-0 flex-1 pt-4"
      >
        <div className="border-border bg-background flex h-full min-h-0 flex-1 gap-4 overflow-hidden rounded-2xl border p-4">
          <SourceStatistics />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default StatisticsTabPage;
