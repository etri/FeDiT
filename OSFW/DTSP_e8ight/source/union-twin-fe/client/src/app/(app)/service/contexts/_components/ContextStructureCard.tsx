import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@e8ight/ui/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@e8ight/ui/components/ui/item';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { Box, Database } from 'lucide-react';

import type { ContextModel } from '@/types/context';

interface ContextStructureCardProps {
  isCreate: boolean;
  isEdit: boolean;
  showDraftActions: boolean;
  modelEntries: ContextModel[];
  baseEntries: ContextModel[];
  onOpenPicker: () => void;
  onRemoveModel: (title: string) => void;
  onCancel: () => void;
  onCreate: () => void;
  onEditSave: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}

export function ContextStructureCard({
  isCreate,
  isEdit,
  showDraftActions,
  modelEntries,
  baseEntries,
  onOpenPicker,
  onRemoveModel,
  onCancel,
  onCreate,
  onEditSave,
  onStartEdit,
  onDelete,
}: ContextStructureCardProps) {
  return (
    <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="border-border border-b py-3">
        <CardTitle>Context structure</CardTitle>
        {isCreate || isEdit ? (
          <CardAction className="flex items-center gap-2">
            {isEdit ? <Badge variant="secondary">Editing</Badge> : null}
            <Button variant="outline" size="sm" onClick={onOpenPicker}>
              Add data models
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col">
            <div className="bg-muted/50 text-muted-foreground px-4 py-2 text-xs font-semibold">
              Linked data models ({modelEntries.length})
            </div>
            {modelEntries.length === 0 ? (
              <Empty className="rounded-none border-0 py-8">
                <EmptyHeader>
                  <EmptyTitle>No linked models</EmptyTitle>
                  {isCreate || isEdit ? (
                    <EmptyDescription className="text-xs">
                      Use Add data models.
                    </EmptyDescription>
                  ) : null}
                </EmptyHeader>
              </Empty>
            ) : (
              <ItemGroup className="gap-0 py-1">
                {modelEntries.map((data) => (
                  <Item
                    key={data.title}
                    role="listitem"
                    className="gap-2 px-4 py-1.5"
                  >
                    <ItemMedia variant="icon">
                      <Database className="text-muted-foreground size-4 shrink-0" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle
                        className="w-full min-w-0 truncate font-normal"
                        title={data.title}
                      >
                        {data.title}
                      </ItemTitle>
                    </ItemContent>
                    {isCreate || isEdit ? (
                      <ItemActions>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onRemoveModel(data.title)}
                        >
                          Remove
                        </Button>
                      </ItemActions>
                    ) : null}
                  </Item>
                ))}
              </ItemGroup>
            )}
            <Separator />
            <div className="bg-muted/50 text-muted-foreground px-4 py-2 text-xs font-semibold">
              Core entries ({baseEntries.length})
            </div>
            <ItemGroup className="text-muted-foreground gap-0 py-1">
              {baseEntries.map((data) => (
                <Item
                  key={data.title}
                  role="listitem"
                  className="gap-2 px-4 py-1.5"
                >
                  <ItemMedia variant="icon">
                    <Box className="size-4 shrink-0" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle
                      className="w-full min-w-0 truncate font-normal"
                      title={data.title}
                    >
                      {data.title}
                    </ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 border-t">
        {isEdit ? (
          <>
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onEditSave}>
              Save
            </Button>
          </>
        ) : (
          <>
            {isCreate ? (
              <>
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={onCreate}>
                  Create
                </Button>
              </>
            ) : null}
            {showDraftActions ? (
              <>
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  Delete
                </Button>
                <Button variant="outline" size="sm" onClick={onStartEdit}>
                  Edit
                </Button>
              </>
            ) : null}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
