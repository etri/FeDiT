import { Calendar } from '@e8ight/ui/components/ui/calendar';
import dayjs from 'dayjs';

import { useStatisticsStore } from '@/app/(app)/service/statistics/_stores';

function StatisticsCalendar() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const storedDateStr = useStatisticsStore((s) => s.currentDate);
  const setStoredDate = useStatisticsStore((s) => s.setCurrentDate);
  const setSelectedItems = useStatisticsStore((s) => s.setSelectedItems);
  const toggleClickable = useStatisticsStore((s) => s.clickable);
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
    if (!date || !toggleClickable) {
      return;
    }

    setStoredDate(dayjs(date).format('YYYY-MM-DD'));
    setSelectedItems({ dataModel: '', provider: '' });
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
        selected={selectedDate}
        onSelect={handleSelectDate}
        timeZone={timeZone}
        className="w-full rounded-lg border [--cell-size:--spacing(9)]"
      />
    </div>
  );
}

export default StatisticsCalendar;
