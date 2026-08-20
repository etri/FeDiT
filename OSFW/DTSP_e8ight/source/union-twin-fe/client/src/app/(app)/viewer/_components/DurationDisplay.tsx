import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';

interface DurationDisplayProps {
  durationInSeconds: number | null;
  isVisible: boolean;
}

export function DurationDisplay({
  durationInSeconds,
  isVisible,
}: DurationDisplayProps) {
  if (!isVisible) {
    return (
      <Card className="min-h-[100px] shrink-0">
        <CardHeader>
          <Skeleton className="h-[27px] w-1/3 text-lg font-medium" />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center pb-4">
          <Skeleton className="m-auto my-1 h-10 w-2/5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-[100px] shrink-0">
      <CardHeader>
        <CardTitle className="text-foreground text-sm font-bold tracking-[.03em]">
          ⏱️ 로딩 시간
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center pb-4">
        <p className="text-foreground text-center font-sans text-sm font-bold">
          {durationInSeconds !== null && `${durationInSeconds} 초`}
        </p>
      </CardContent>
    </Card>
  );
}
