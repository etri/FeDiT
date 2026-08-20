import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@e8ight/ui/components/ui/input-group';
import { Skeleton } from '@e8ight/ui/components/ui/skeleton';
import { Search } from 'lucide-react';

export function AttributeAsideSkeleton() {
  const rowKeys = Array.from({ length: 10 }, (_, rowNumber) => rowNumber + 1);

  return (
    <aside className="bg-muted border-border flex h-full flex-col overflow-hidden border-r p-4">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Attribute</h2>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="shrink-0 py-2">
        <InputGroup className="pointer-events-none opacity-60">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search..." readOnly tabIndex={-1} />
        </InputGroup>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="bg-background border-border min-h-0 flex-1 overflow-auto rounded border">
          <ul className="m-0 list-none p-0">
            {rowKeys.map((rowKey) => (
              <li key={rowKey} className="px-2 py-1">
                <Skeleton className="h-8 w-full" />
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2 flex shrink-0 justify-center gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </aside>
  );
}
