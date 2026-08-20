import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@e8ight/ui/components/ui/input-group';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import { Search } from 'lucide-react';

export function ModelAsideSkeleton() {
  const rowKeys = Array.from({ length: 12 }, (_, rowNumber) => rowNumber + 1);

  return (
    <aside className="bg-background border-border flex h-full min-h-0 flex-col border-r">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-foreground text-sm font-bold tracking-[.03em]">
              Data Model
            </h2>
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="mt-3">
            <InputGroup className="pointer-events-none opacity-60">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search..." readOnly tabIndex={-1} />
            </InputGroup>
          </div>
          <Separator className="mt-4" />
        </div>
        <div className="min-h-0 flex-1 pt-3">
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {rowKeys.map((rowKey) => (
              <li key={rowKey} className="px-2 py-1.5">
                <Skeleton className="h-6 w-full" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
