'use client';

import { SidebarTrigger } from '@e8ight/ui/components/ui/sidebar';
import { Boxes, Search } from 'lucide-react';
import Link from 'next/link';

import { useCommandPaletteStore } from '@/stores/useCommandPaletteStore';

export function MobileTopBar() {
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border/60 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur md:hidden">
      <SidebarTrigger className="size-9" />
      <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
        <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
          <Boxes className="size-4" />
        </div>
        <span className="truncate text-sm font-semibold">연합트윈</span>
      </Link>
      <button
        type="button"
        onClick={() => openCommandPalette(true)}
        aria-label="이동..."
        className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-md transition-colors"
      >
        <Search className="size-4" />
      </button>
    </header>
  );
}
