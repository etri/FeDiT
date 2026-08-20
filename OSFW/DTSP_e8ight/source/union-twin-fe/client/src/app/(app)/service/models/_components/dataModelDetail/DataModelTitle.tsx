import { Badge } from '@e8ight/ui/components/ui/badge';

function DataModelTitle({
  id,
  uri,
  isReady,
}: {
  id: string;
  uri: string;
  isReady: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <h2 className="text-foreground truncate text-xl font-semibold">{id}</h2>
      <span className="text-muted-foreground truncate text-xs">{uri}</span>
      {isReady && <Badge variant="secondary">Ready</Badge>}
    </div>
  );
}

export default DataModelTitle;
