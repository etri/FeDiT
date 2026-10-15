import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@e8ight/ui/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { cn } from 'cn';

import { getPageItems } from '@/hooks/usePagination';
import { NOTICE_PAGE_SIZE_VALUES } from '@/types/noticeboard';

import type { PaginationMeta } from '@/types/admin';

interface PaginationFooterProps {
  meta: PaginationMeta;
  page: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  className?: string;
  controlsClassName?: string;
}

export function PaginationFooter({
  meta,
  page,
  size,
  onPageChange,
  onSizeChange,
  className,
  controlsClassName,
}: PaginationFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className={cn('flex items-center', controlsClassName)}>
        <p className="text-muted-foreground text-sm">
          전체 {meta.total}건 중 {(meta.page - 1) * meta.size + 1}-
          {Math.min(meta.page * meta.size, meta.total)}
        </p>
        <Select
          value={String(size)}
          onValueChange={(v) => onSizeChange(Number(v))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTICE_PAGE_SIZE_VALUES.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}건
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text=""
              className={cn(page <= 1 && 'pointer-events-none opacity-50')}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page - 1);
              }}
            />
          </PaginationItem>
          {getPageItems(page, meta.totalPages).map((item, i) => {
            if (item === 'ellipsis') {
              return (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(item);
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
              className={cn(
                page >= meta.totalPages && 'pointer-events-none opacity-50',
              )}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
