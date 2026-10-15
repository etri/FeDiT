import { useState } from 'react';

import { Calendar } from '@e8ight/ui/components/ui/calendar';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { statisticsQueries } from '@/apis/statistics';
import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';

function StatisticsCalendar() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const storedDateStr = useStatisticsStore((s) => s.currentDate);
  const setStoredDate = useStatisticsStore((s) => s.setCurrentDate);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    dayjs(storedDateStr || undefined)
      .startOf('month')
      .toDate(),
  );

  const { data: collectedDates } = useQuery(
    statisticsQueries.collectionDates({
      year: dayjs(visibleMonth).year(),
      month: dayjs(visibleMonth).month() + 1,
    }),
  );

  const collectedDays = (collectedDates ?? []).map((collectedDate) =>
    dayjs(collectedDate).toDate(),
  );
  const selectedDate = storedDateStr
    ? dayjs(storedDateStr).toDate()
    : undefined;
  const selectedDateLabel = storedDateStr
    ? dayjs(storedDateStr).format('dddd, MMMM D')
    : 'Select a date';
  const selectedDateMeta = storedDateStr
    ? dayjs(storedDateStr).format('YYYY-MM-DD')
    : 'Choose a highlighted day';

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) {
      return;
    }

    setStoredDate(dayjs(date).format('YYYY-MM-DD'));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-1">
        <p className="text-foreground text-sm font-bold">{selectedDateLabel}</p>
        <p className="text-muted-foreground text-sm">{selectedDateMeta}</p>
      </div>

      <Calendar
        mode="single"
        captionLayout="dropdown"
        startMonth={new Date(2020, 0, 1)}
        endMonth={new Date()}
        month={visibleMonth}
        onMonthChange={setVisibleMonth}
        selected={selectedDate}
        onSelect={handleSelectDate}
        modifiers={{ collected: collectedDays }}
        modifiersClassNames={{
          collected:
            'after:bg-primary after:absolute after:bottom-1 after:left-1/2 after:z-20 after:size-1 after:-translate-x-1/2 after:rounded-full',
        }}
        timeZone={timeZone}
        className="w-full rounded-lg border [--cell-size:--spacing(9)]"
      />

      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <span className="bg-primary size-1.5 rounded-full" />
        {collectedDays.length} collected{' '}
        {collectedDays.length === 1 ? 'day' : 'days'} in{' '}
        {dayjs(visibleMonth).format('MMMM YYYY')}
      </div>
    </div>
  );
}

export default StatisticsCalendar;
