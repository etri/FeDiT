'use client';

import type * as React from 'react';

import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';

import { cn } from '../../utils/cn';

type ScrollAreaProps = React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /** Ref forwarded to the scrollable Viewport (for measuring scroll/client size). */
  viewportRef?: React.Ref<HTMLDivElement>;
  /** Scroll handler bound to the Viewport. */
  onViewportScroll?: React.UIEventHandler<HTMLDivElement>;
  /** Which scrollbars to render. Defaults to vertical for backward compatibility. */
  scrollbars?: 'vertical' | 'horizontal' | 'both';
  /**
   * 렌더링되는 scrollbar에 추가로 넘길 props.
   *
   * Radix는 scrollbar 위치(bottom/left/right)를 inline style로 주지만
   * 넘긴 style을 마지막에 spread하므로 여기서 덮어쓸 수 있다.
   * 오버레이가 viewport 일부를 가릴 때 scrollbar를 보이는 영역 안으로
   * 밀어 넣는 용도.
   */
  scrollBarProps?: {
    vertical?: React.ComponentProps<typeof ScrollBar>;
    horizontal?: React.ComponentProps<typeof ScrollBar>;
  };
};

function ScrollArea({
  className,
  children,
  viewportRef,
  onViewportScroll,
  scrollbars = 'vertical',
  scrollBarProps,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        onScroll={onViewportScroll}
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {scrollbars !== 'horizontal' && (
        <ScrollBar orientation="vertical" {...scrollBarProps?.vertical} />
      )}
      {scrollbars !== 'vertical' && (
        <ScrollBar orientation="horizontal" {...scrollBarProps?.horizontal} />
      )}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
