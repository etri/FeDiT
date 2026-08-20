import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

interface TimeDisplayProps {
  label: string;
  dateTime: {
    hour: string;
    minute: string;
    second: string;
    dayPeriod: string;
  } | null;
  isVisible: boolean;
}

export function TimeDisplay({ label, dateTime, isVisible }: TimeDisplayProps) {
  return (
    <Card className="min-h-[100px]">
      {dateTime && isVisible ? (
        <>
          <CardHeader>
            <CardTitle className="text-foreground text-sm font-bold tracking-[.03em]">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center pb-3">
            <p className="text-foreground text-center text-sm font-bold">
              {dateTime.hour}:{dateTime.minute}:{dateTime.second}{' '}
              {dateTime.dayPeriod}
            </p>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader>
            <Skeleton className="h-[27px] w-1/3 text-lg font-medium" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center pb-3">
            <Skeleton className="m-auto my-1 h-10 w-2/5" />
          </CardContent>
        </>
      )}
    </Card>
  );
}
