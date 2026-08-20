import { Card, CardContent } from '@e8ight/ui/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { PanelsTopLeft } from 'lucide-react';

interface PanelPlaceholderProps {
  title: string;
  description: string;
}

export function PanelPlaceholder({
  title,
  description,
}: PanelPlaceholderProps) {
  return (
    <div className="bg-muted/20 flex h-full min-h-0 flex-col p-4">
      <Card size="sm" className="min-h-0 flex-1">
        <CardContent className="flex min-h-0 flex-1 items-center justify-center p-6">
          <Empty className="border-border max-w-md border bg-transparent">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PanelsTopLeft className="size-4" />
              </EmptyMedia>
              <EmptyTitle>{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
