import type { ReactNode } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import { Empty, EmptyTitle } from '@e8ight/ui/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@e8ight/ui/components/ui/input-group';
import {
  Item,
  ItemActions,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@e8ight/ui/components/ui/item';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@e8ight/ui/components/ui/pagination';
import { ScrollArea } from '@e8ight/ui/components/ui/scroll-area';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { cn } from '@e8ight/ui/utils/cn';
import {
  ChevronsLeft,
  ChevronsRight,
  Database,
  Plus,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';

import type { UsePaginationResult } from '@/hooks/usePagination';

interface NavigationAsideAction {
  label?: string;
  title: string;
  ariaLabel?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

interface NavigationAsideBadge {
  label: string;
  variant?: React.ComponentProps<typeof Badge>['variant'];
  className?: string;
}

interface NavigationAsideItem {
  key: React.Key;
  active: boolean;
  primaryText: string;
  to: string;
  title?: string;
  secondaryText?: string;
  badge?: NavigationAsideBadge;
  icon?: ReactNode;
}

interface NavigationAsideProps {
  title: string;
  items?: NavigationAsideItem[];
  children?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  description?: string;
  newAction?: NavigationAsideAction;
  secondaryNewAction?: NavigationAsideAction;
  pagination?: UsePaginationResult;
}

function NavigationAsideListItem({
  item,
}: {
  item: Omit<NavigationAsideItem, 'key'>;
}) {
  const content = (
    <>
      <ItemMedia
        variant="icon"
        className="text-muted-foreground bg-transparent"
      >
        {item.icon ?? <Database className="size-4 shrink-0" />}
      </ItemMedia>
      <div className="min-w-0 flex-1">
        <ItemTitle
          className={cn(
            'w-full min-w-0 truncate',
            item.active ? 'font-medium' : 'font-normal',
          )}
        >
          {item.primaryText}
        </ItemTitle>
      </div>
      {(item.badge || item.secondaryText) && (
        <ItemActions className="ml-auto shrink-0">
          {item.badge && (
            <Badge
              variant={item.badge.variant ?? 'secondary'}
              className={item.badge.className}
            >
              {item.badge.label}
            </Badge>
          )}
          {item.secondaryText && (
            <span className="text-muted-foreground text-xs">
              {item.secondaryText}
            </span>
          )}
        </ItemActions>
      )}
    </>
  );

  const itemClassName = cn(
    'gap-2 rounded-md border-transparent px-2 py-1.5',
    item.active ? 'bg-accent' : 'hover:bg-muted',
  );

  return (
    <Item asChild size="xs" className={itemClassName}>
      <Link href={item.to} title={item.title}>
        {content}
      </Link>
    </Item>
  );
}

function AsidePagination({ pagination }: { pagination: UsePaginationResult }) {
  if (pagination.pageItems.length === 0) {
    return null;
  }

  let ellipsisCount = 0;

  return (
    <div className="border-border shrink-0 border-t pt-3">
      <Pagination>
        <PaginationContent className="flex-wrap justify-center">
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="First page"
              className={
                !pagination.canGoBackward
                  ? 'pointer-events-none opacity-50'
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                if (!pagination.canGoBackward) {
                  return;
                }
                pagination.goToFirst();
              }}
            >
              <ChevronsLeft className="size-4" />
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text=""
              className={
                !pagination.canGoBackward
                  ? 'pointer-events-none opacity-50'
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                if (!pagination.canGoBackward) {
                  return;
                }
                pagination.goToPrevious();
              }}
            />
          </PaginationItem>
          {pagination.pageItems.map((item) => {
            if (item === 'ellipsis') {
              ellipsisCount += 1;
              return (
                <PaginationItem key={`ellipsis-${ellipsisCount}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            return (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === pagination.page}
                  onClick={(e) => {
                    e.preventDefault();
                    pagination.goToPage(item);
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              href="#"
              text=""
              className={
                !pagination.canGoForward
                  ? 'pointer-events-none opacity-50'
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                if (!pagination.canGoForward) {
                  return;
                }
                pagination.goToNext();
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label="Last page"
              className={
                !pagination.canGoForward
                  ? 'pointer-events-none opacity-50'
                  : undefined
              }
              onClick={(e) => {
                e.preventDefault();
                if (!pagination.canGoForward) {
                  return;
                }
                pagination.goToLast();
              }}
            >
              <ChevronsRight className="size-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export function NavigationAside({
  title,
  items = [],
  children,
  searchValue,
  onSearchChange,
  description,
  newAction,
  secondaryNewAction,
  pagination,
}: NavigationAsideProps) {
  const hasSearch = searchValue !== undefined && onSearchChange !== undefined;
  const hasCustomContent = children !== undefined;

  const renderAsideAction = (action: NavigationAsideAction) => {
    const iconNode = action.icon ?? (
      <Plus className={action.label ? 'size-3.5' : 'size-4'} />
    );
    const isIconOnly = !action.label;
    const accessibleName = action.ariaLabel ?? action.title;

    return (
      <Button
        variant="outline"
        size={isIconOnly ? 'icon' : 'sm'}
        title={action.title}
        aria-label={accessibleName}
        type="button"
        onClick={action.onClick}
      >
        {iconNode}
        {action.label ? action.label : null}
      </Button>
    );
  };

  const renderNewActions = () => {
    if (!newAction && !secondaryNewAction) {
      return null;
    }

    return (
      <div className="flex shrink-0 items-center gap-1.5">
        {newAction ? renderAsideAction(newAction) : null}
        {secondaryNewAction ? renderAsideAction(secondaryNewAction) : null}
      </div>
    );
  };
  const renderContent = () => {
    if (hasCustomContent) {
      return children;
    }

    if (items.length === 0) {
      return (
        <Empty className="border-0 bg-transparent">
          <EmptyTitle>No Data</EmptyTitle>
        </Empty>
      );
    }

    return (
      <ItemGroup className="gap-0.5">
        {items.map((item) => (
          <NavigationAsideListItem key={item.key} item={item} />
        ))}
      </ItemGroup>
    );
  };

  return (
    <aside className="bg-background border-border flex h-full min-h-0 flex-col border-r">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-foreground text-sm font-bold tracking-[.03em]">
              {title}
            </h2>
            {description ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {description}
              </p>
            ) : null}
            {renderNewActions()}
          </div>
          {hasSearch ? (
            <div className="mt-3">
              <InputGroup>
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchValue ? (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => onSearchChange('')}
                    >
                      <X />
                    </InputGroupButton>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
            </div>
          ) : null}
          <Separator className="mt-4" />
        </div>
        <div className="min-h-0 flex-1 pt-3">
          <ScrollArea className="h-full w-full pr-1 [&>[data-slot=scroll-area-viewport]>div]:!block">
            {renderContent()}
          </ScrollArea>
        </div>
        {pagination && items.length > 0 ? (
          <AsidePagination pagination={pagination} />
        ) : null}
      </div>
    </aside>
  );
}
