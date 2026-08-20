import { Spinner } from '@e8ight/ui/components/ui/spinner';

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner className="text-muted-foreground size-6" />
    </div>
  );
}
