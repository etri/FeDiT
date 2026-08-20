'use client';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { Card } from '@e8ight/ui/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@e8ight/ui/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import { Item, ItemGroup, ItemTitle } from '@e8ight/ui/components/ui/item';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { cn } from '@e8ight/ui/utils/cn';
import { Braces, Check, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import { overlay } from 'overlay-kit';

import type { UnionSchemaItem } from '@/app/(app)/service/unite-twins/_types/unionSchema';

interface SchemaListPanelProps {
  items: UnionSchemaItem[];
  appliedSchemaIds: Set<string>;
  registeredSourceIds: Set<string>;
  onToggle: (item: UnionSchemaItem) => void;
}

export function SchemaListPanel({
  items,
  appliedSchemaIds,
  registeredSourceIds,
  onToggle,
}: SchemaListPanelProps) {
  return (
    <Card className="h-64 w-full shrink-0 gap-0 py-0 lg:h-auto lg:w-[320px] xl:w-[380px]">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-foreground text-sm font-bold tracking-[.03em]">
          스키마 선택
        </span>
        <Badge variant="secondary">{items.length} Available</Badge>
      </div>
      <Separator />
      <SchemaListBody
        items={items}
        appliedSchemaIds={appliedSchemaIds}
        registeredSourceIds={registeredSourceIds}
        onToggle={onToggle}
      />
    </Card>
  );
}

function SchemaListBody({
  items,
  appliedSchemaIds,
  registeredSourceIds,
  onToggle,
}: SchemaListPanelProps) {
  if (items.length === 0) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageOpen />
          </EmptyMedia>
          <EmptyTitle>담긴 스키마가 없습니다</EmptyTitle>
          <EmptyDescription>
            메타데이터 등록 페이지에서 디지털 트윈 객체를 담아주세요
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline" size="sm">
          <Link href="/metadata/registration">메타데이터 등록으로 이동</Link>
        </Button>
      </Empty>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <ItemGroup className="gap-0 p-2">
        {items.map((item) => {
          const isApplied = appliedSchemaIds.has(item.id);
          const isRegistered =
            !!item.digitalTwinId && registeredSourceIds.has(item.digitalTwinId);
          const propCount = item.schema?.properties
            ? Object.keys(item.schema.properties).length
            : 0;

          return (
            <Item
              key={item.id}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2.5',
                isApplied && 'bg-accent',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ItemTitle className="text-foreground truncate text-sm font-bold">
                    {item.name || item.title || 'Untitled'}
                  </ItemTitle>
                  {isApplied && (
                    <Check className="text-primary size-3.5 shrink-0" />
                  )}
                  {isRegistered && (
                    <Badge variant="secondary" className="shrink-0 font-bold">
                      등록됨
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {propCount} Properties · {item.digitalTwinId || 'No ID'}
                </p>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="스키마 JSON 보기"
                  onClick={() => openSchemaJsonDialog(item)}
                >
                  <Braces className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant={isApplied ? 'outline' : 'default'}
                  onClick={() => onToggle(item)}
                >
                  {isApplied ? 'Remove' : 'Add'}
                </Button>
              </div>
            </Item>
          );
        })}
      </ItemGroup>
    </ScrollArea>
  );
}

function SchemaJsonDialogBody({ item }: { item: UnionSchemaItem }) {
  return (
    <DialogContent className="flex max-h-[85svh] flex-col sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{item.name || item.title || 'Schema'}</DialogTitle>
        <DialogDescription>
          {item.digitalTwinId ? `${item.digitalTwinId} · ${item.id}` : item.id}
        </DialogDescription>
      </DialogHeader>
      <pre className="bg-muted max-h-[60vh] overflow-auto rounded-md p-3 font-mono text-xs break-words whitespace-pre-wrap">
        {JSON.stringify(item.schema, null, 2)}
      </pre>
    </DialogContent>
  );
}

function openSchemaJsonDialog(item: UnionSchemaItem) {
  overlay.open(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close()}>
      <SchemaJsonDialogBody item={item} />
    </Dialog>
  ));
}
