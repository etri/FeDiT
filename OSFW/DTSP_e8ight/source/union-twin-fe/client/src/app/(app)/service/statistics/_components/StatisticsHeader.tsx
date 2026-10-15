import { Button } from '@e8ight/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@e8ight/ui/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';

import { statisticsQueries } from '@/apis/statistics';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';
import {
  getDate,
  getRangeBefore,
  isToday,
  TREND_RANGE_DAYS,
} from '@/app/(app)/service/statistics/_utils';

const StatisticsCalendar = dynamic(
  () => import('@/app/(app)/service/statistics/_components/StatisticsCalendar'),
  { ssr: false },
);

function StatisticsHeader() {
  const date = useStatisticsStore((s) => s.currentDate);
  const setCurrentDate = useStatisticsStore((s) => s.setCurrentDate);

  const live = isToday(date);
  const currentWeek = getRangeBefore(date, TREND_RANGE_DAYS);
  const { dataUpdatedAt } = useQuery({
    ...statisticsQueries.total({ date }),
    notifyOnChangeProps: ['dataUpdatedAt'],
  });

  const shiftDate = (offset: number) =>
    setCurrentDate(getDate(new Date(`${date}T00:00:00`), offset));

  return (
    <header className="border-border flex flex-none flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-foreground text-xl font-semibold">
          Entity Statistics
        </h1>
        {live ? (
          <>
            <span className="border-primary/40 bg-primary/10 text-primary flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-[0.07em] uppercase">
              <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              Live
            </span>
            <span className="text-muted-foreground text-xs">
              {dataUpdatedAt
                ? `Updated ${dayjs(dataUpdatedAt).format('HH:mm:ss')} · auto-refresh 30s`
                : 'Auto-refresh 30s'}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground text-xs">
            {dayjs(date).format('dddd, MMMM D, YYYY')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground mr-1 text-xs">
          7-day window · {currentWeek.startDate} – {currentWeek.endDate}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Previous day"
          onClick={() => shiftDate(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Calendar className="size-4" />
              {live ? 'Today, ' : ''}
              {dayjs(date).format('MMM D, YYYY')}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] p-4">
            <StatisticsCalendar />
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Next day"
          disabled={live}
          onClick={() => shiftDate(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </header>
  );
}

export default StatisticsHeader;
