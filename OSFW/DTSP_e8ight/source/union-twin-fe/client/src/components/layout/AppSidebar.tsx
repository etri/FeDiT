'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@e8ight/ui/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@e8ight/ui/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@e8ight/ui/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@e8ight/ui/components/ui/sidebar';
import { cn } from '@e8ight/ui/utils/cn';
import {
  Boxes,
  ChevronRight,
  CircleUserRound,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import { useLogoutMutation } from '@/apis/auth';
import { MetadataCartMenu } from '@/components/layout/MetadataCartMenu';
import {
  getNavigationPath,
  getVisibleSections,
} from '@/components/layout/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCommandPaletteStore } from '@/stores/useCommandPaletteStore';

import type { UserProfile } from '@/apis/auth';
import type { NavigationItem } from '@/components/layout/types';

const ACTIVE_RAIL_CLASS =
  'before:bg-primary before:absolute relative data-active:before:top-1/2 data-active:before:left-0 data-active:before:h-5 data-active:before:w-[3px] data-active:before:-translate-y-1/2 data-active:before:rounded-r-full';

const SECTION_LABEL_CLASS =
  'text-sidebar-foreground/60 font-bold tracking-[0.07em] uppercase';

const COLLAPSE_FADE_CLASS =
  'transition-opacity duration-150 delay-100 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0';

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { user: currentUser, isAdmin } = useCurrentUser();
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);

  const sections = useMemo(() => getVisibleSections(isAdmin), [isAdmin]);

  useEffect(() => {
    const next = findExpandedKeys(
      pathname,
      sections.flatMap((s) => s.items),
    );
    setExpandedItems((prev) => (setsEqual(prev, next) ? prev : next));
  }, [pathname, sections]);

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  function toggleExpand(itemKey: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  }

  function renderPopoverItems(items: NavigationItem[]) {
    return (
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          if (!item.href) return null;
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                isActive(pathname, item)
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-foreground',
              )}
            >
              {ItemIcon ? (
                <ItemIcon className="text-muted-foreground size-3.5" />
              ) : null}
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  function renderSubItem(item: NavigationItem) {
    const active = isActive(pathname, item);
    if (!item.href) return null;
    return (
      <SidebarMenuSubItem key={itemKey(item)}>
        <SidebarMenuSubButton asChild isActive={active}>
          <Link href={item.href} className="min-w-0 flex-1">
            <span className="truncate">{item.title}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  function renderMenuItem(item: NavigationItem) {
    const key = itemKey(item);
    const active = isActive(pathname, item);
    const ItemIcon = item.icon;

    if (!item.items?.length) {
      if (!item.href) return null;
      return (
        <SidebarMenuItem key={key}>
          <SidebarMenuButton
            asChild
            isActive={active}
            tooltip={item.title}
            className={ACTIVE_RAIL_CLASS}
          >
            <Link href={item.href}>
              {ItemIcon ? <ItemIcon className="size-4" /> : null}
              <span className={cn('truncate', COLLAPSE_FADE_CLASS)}>
                {item.title}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    if (isCollapsed) {
      return (
        <SidebarMenuItem key={key}>
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton
                isActive={active}
                tooltip={item.title}
                className={ACTIVE_RAIL_CLASS}
              >
                {ItemIcon ? <ItemIcon className="size-4 shrink-0" /> : null}
                <span className={cn('truncate', COLLAPSE_FADE_CLASS)}>
                  {item.title}
                </span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-60 p-2"
            >
              <div className="text-muted-foreground mb-2 px-2 font-bold tracking-[0.07em] uppercase">
                {item.title}
              </div>
              {renderPopoverItems(item.items ?? [])}
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      );
    }

    return (
      <Collapsible
        key={key}
        open={expandedItems.has(key)}
        onOpenChange={() => toggleExpand(key)}
        className="group/collapsible"
        suppressHydrationWarning
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              isActive={active}
              tooltip={item.title}
              className={ACTIVE_RAIL_CLASS}
            >
              {ItemIcon ? <ItemIcon className="size-4 shrink-0" /> : null}
              <span className={cn('truncate', COLLAPSE_FADE_CLASS)}>
                {item.title}
              </span>
              <ChevronRight className="text-sidebar-foreground/60 ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent suppressHydrationWarning>
            <SidebarMenuSub className="mr-0 border-l-0 pr-0">
              {item.items?.map(renderSubItem)}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border border-r">
      <SidebarHeader className="border-sidebar-border/60 gap-2 border-b">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            href="/"
            className="hover:bg-sidebar-accent flex h-12 min-w-0 flex-1 items-center gap-3 rounded-md p-2 group-data-[collapsible=icon]:hidden"
          >
            <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Boxes className="size-5" />
            </div>
            <div className="grid min-w-0 flex-1 gap-0.5 leading-none">
              <span className="truncate text-sm font-semibold">연합트윈</span>
              <span className="text-sidebar-foreground/60 truncate text-xs">
                프레임워크
              </span>
            </div>
          </Link>
          <CollapseToggle />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="이동... ⌘K"
              onClick={() => openCommandPalette(true)}
              className="bg-sidebar-accent/40 text-sidebar-foreground/60 hover:text-sidebar-foreground border-sidebar-border/60 border group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent"
            >
              <Search />
              <span className={COLLAPSE_FADE_CLASS}>이동...</span>
              <kbd className="bg-sidebar text-sidebar-foreground/60 ml-auto rounded border px-1.5 py-0.5 font-mono font-medium group-data-[collapsible=icon]:hidden">
                ⌘K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label ?? 'pinned'}>
            {section.label ? (
              <SidebarGroupLabel className={SECTION_LABEL_CLASS}>
                {section.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>{section.items.map(renderMenuItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border/60 border-t pt-2">
        <SidebarMenu>
          <MetadataCartMenu />
          <SidebarMenuItem>
            <ThemeMenu />
          </SidebarMenuItem>
          {currentUser ? (
            <SidebarMenuItem>
              <UserMenu user={currentUser} />
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function CollapseToggle() {
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === 'collapsed';
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const label = collapsed ? '사이드바 펼치기' : '사이드바 접기';

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={label}
      title={label}
      className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground flex size-8 shrink-0 items-center justify-center rounded-md transition-colors [&>svg]:size-4"
    >
      <Icon />
    </button>
  );
}

function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton tooltip="테마">
          <Sun className="size-4 shrink-0 dark:hidden" />
          <Moon className="hidden size-4 shrink-0 dark:block" />
          <span className={cn('truncate', COLLAPSE_FADE_CLASS)}>테마</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={state === 'collapsed' ? 'right' : 'top'}
        align="start"
        className="w-40"
      >
        <DropdownMenuLabel>테마</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun />
            라이트
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon />
            다크
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor />
            시스템
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user }: { user: UserProfile }) {
  const router = useRouter();
  const { state } = useSidebar();
  const logoutMutation = useLogoutMutation();
  const isAdmin = user.role.name === 'ADMIN';
  const roleLabel = isAdmin ? '관리자' : user.role.name;

  async function handleLogout() {
    await logoutMutation.mutateAsync().catch(() => {});
    router.replace('/signin');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          tooltip={`${user.name} · ${roleLabel}`}
          className="data-[state=open]:bg-sidebar-accent"
        >
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              isAdmin
                ? 'bg-primary text-primary-foreground'
                : 'bg-sidebar-accent text-sidebar-accent-foreground',
            )}
          >
            {isAdmin ? (
              <ShieldCheck className="size-4" />
            ) : (
              <CircleUserRound className="size-4" />
            )}
          </div>
          <div
            className={cn(
              'grid min-w-0 flex-1 text-left leading-tight',
              COLLAPSE_FADE_CLASS,
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium">{user.name}</span>
              {isAdmin ? (
                <Badge variant="default" className="h-5 shrink-0 px-1.5">
                  관리자
                </Badge>
              ) : null}
            </div>
            <span className="text-sidebar-foreground/60 truncate text-xs">
              {user.email}
            </span>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={state === 'collapsed' ? 'right' : 'top'}
        align="start"
        className="w-56"
      >
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings />내 계정
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut />
          {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function itemKey(item: NavigationItem): string {
  return item.href ?? item.title;
}

function isPathMatch(pathname: string, href: string): boolean {
  const path = getNavigationPath(href);
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isActive(pathname: string, item: NavigationItem): boolean {
  if (item.href && isPathMatch(pathname, item.href)) return true;
  return item.items?.some((child) => isActive(pathname, child)) ?? false;
}

function findExpandedKeys(
  pathname: string,
  items: NavigationItem[],
): Set<string> {
  const keys = new Set<string>();

  for (const item of items) {
    if (!item.items?.length) continue;
    if (item.items.some((child) => isActive(pathname, child))) {
      keys.add(itemKey(item));
      for (const key of findExpandedKeys(pathname, item.items)) {
        keys.add(key);
      }
    }
  }

  return keys;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) {
    if (!b.has(v)) return false;
  }
  return true;
}
