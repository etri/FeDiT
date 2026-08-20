'use client';

import { Fragment, useEffect } from 'react';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@e8ight/ui/components/ui/command';
import { Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getVisibleSections } from '@/components/layout/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCommandPaletteStore } from '@/stores/useCommandPaletteStore';

import type { NavigationItem } from '@/components/layout/types';
import type { LucideIcon } from 'lucide-react';

interface PaletteEntry {
  title: string;
  href: string;
  icon: LucideIcon;
  parent?: string;
}

interface PaletteGroup {
  label: string;
  entries: PaletteEntry[];
}

export function CommandPalette() {
  const router = useRouter();
  const open = useCommandPaletteStore((state) => state.open);
  const setOpen = useCommandPaletteStore((state) => state.setOpen);
  const toggle = useCommandPaletteStore((state) => state.toggle);
  const { isAdmin } = useCurrentUser();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isPaletteShortcut =
        event.key?.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
      if (!isPaletteShortcut) return;
      event.preventDefault();
      toggle();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const groups: PaletteGroup[] = getVisibleSections(isAdmin)
    .map((section) => ({
      label: section.label ?? '바로가기',
      entries: collectEntries(section.items),
    }))
    .filter((group) => group.entries.length > 0);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="이동"
      description="페이지를 검색해 빠르게 이동합니다."
    >
      <Command>
        <CommandInput placeholder="이동할 페이지를 검색하세요..." />
        <CommandList>
          <CommandEmpty>일치하는 항목이 없습니다.</CommandEmpty>
          {groups.map((group, index) => (
            <Fragment key={group.label}>
              {index > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading={group.label}>
                {group.entries.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <CommandItem
                      key={entry.href}
                      value={`${entry.parent ?? ''} ${entry.title}`}
                      onSelect={() => handleSelect(entry.href)}
                    >
                      <Icon />
                      <span>{entry.title}</span>
                      {entry.parent ? (
                        <span className="text-muted-foreground ml-auto text-xs">
                          {entry.parent}
                        </span>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Fragment>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

function collectEntries(
  items: NavigationItem[],
  parent?: NavigationItem,
): PaletteEntry[] {
  return items.flatMap((item) => {
    if (item.items?.length) {
      return collectEntries(item.items, item);
    }
    if (!item.href) return [];
    const icon = item.icon ?? parent?.icon ?? Circle;
    return [
      {
        title: item.title,
        href: item.href,
        icon,
        parent: parent?.title,
      },
    ];
  });
}
