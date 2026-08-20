'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@e8ight/ui/components/ui/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@e8ight/ui/components/ui/item';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@e8ight/ui/components/ui/popover';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@e8ight/ui/components/ui/sidebar';
import { ArrowRight, PackageOpen, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';

import {
  cartItemLabel,
  useMetadataCartStore,
} from '@/stores/useMetadataCartStore';

export function MetadataCartMenu() {
  const { state } = useSidebar();
  const items = useMetadataCartStore((s) => s.items);
  const removeItem = useMetadataCartStore((s) => s.removeItem);
  const [isHydrated, setIsHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null;

  return (
    <SidebarMenuItem>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <SidebarMenuButton tooltip={`장바구니 ${items.length}개`}>
            <ShoppingCart className="size-4 shrink-0" />
            <span className="truncate transition-opacity delay-100 duration-150 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0">
              장바구니
            </span>
            {items.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto h-5 px-1.5 group-data-[collapsible=icon]:hidden"
              >
                {items.length}
              </Badge>
            )}
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          side={state === 'collapsed' ? 'right' : 'top'}
          align="start"
          sideOffset={8}
          className="w-72 p-2"
        >
          <div className="text-muted-foreground mb-2 px-2 font-bold tracking-[0.07em] uppercase">
            장바구니 ({items.length})
          </div>
          <ItemGroup className="max-h-64 gap-0.5 overflow-y-auto">
            {items.length === 0 && (
              <Empty className="gap-0 py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageOpen />
                  </EmptyMedia>
                  <EmptyTitle>장바구니가 비어 있습니다</EmptyTitle>
                  <EmptyDescription>담긴 객체가 없습니다</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {items.map((item) => (
              <Item
                key={item.dtoid}
                role="listitem"
                className="hover:bg-accent gap-2 px-2 py-1.5"
              >
                <ItemContent className="min-w-0 gap-0">
                  <ItemTitle className="font-normal">
                    {cartItemLabel(item)}
                  </ItemTitle>
                  <ItemDescription className="line-clamp-1 text-xs">
                    {item.dtoid}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={`${cartItemLabel(item)} 제거`}
                    onClick={() => removeItem(item.dtoid)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-2 w-full gap-2"
          >
            <Link href="/service/unite-twins" onClick={() => setOpen(false)}>
              단일 트윈 통합으로 이동
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
