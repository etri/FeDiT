'use client';

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@e8ight/ui/components/ui/collapsible';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { Separator } from '@e8ight/ui/components/ui/separator';
import { ChevronDown, X } from 'lucide-react';

import { VALUE_TYPES } from '@/app/(app)/service/unite-twins/_constants';

import type { UnionModelFormValues } from '@/app/(app)/service/unite-twins/_schemas/union-model.schema';

interface PropertyGroupSectionProps {
  title: string;
  subtitle: string;
  count: number;
  items: { index: number; field: { id: string } }[];
  register: UseFormRegister<UnionModelFormValues>;
  watch: UseFormWatch<UnionModelFormValues>;
  setValue: UseFormSetValue<UnionModelFormValues>;
  onRemove: (index: number) => void;
}

export function PropertyGroupSection({
  title,
  subtitle,
  count,
  items,
  register,
  watch,
  setValue,
  onRemove,
}: PropertyGroupSectionProps) {
  return (
    <Collapsible defaultOpen>
      <div className="border-border rounded-lg border">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="min-w-0">
            <span className="text-foreground block truncate text-sm font-bold">
              {title}
            </span>
            {subtitle && (
              <p className="text-muted-foreground truncate text-xs">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline">{count}</Badge>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <ChevronDown className="size-4 transition-transform [[data-state=open]>&]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <Separator />
          <div className="p-3">
            <div className="text-muted-foreground mb-1.5 hidden grid-cols-[minmax(0,1.3fr)_120px_minmax(0,1.2fr)_minmax(0,1fr)_28px] gap-2 px-2 font-bold tracking-[0.07em] uppercase xl:grid">
              <span>Name</span>
              <span>Type</span>
              <span>Title</span>
              <span>Provider</span>
              <span className="sr-only">삭제</span>
            </div>
            <div className="space-y-1.5">
              {items.map(({ index, field }) => (
                <div
                  key={field.id}
                  className="hover:bg-muted/50 grid grid-cols-1 items-center gap-2 rounded-md px-2 py-1 xl:grid-cols-[minmax(0,1.3fr)_120px_minmax(0,1.2fr)_minmax(0,1fr)_28px]"
                >
                  <Input
                    aria-label="속성 이름"
                    {...register(`properties.${index}.name`)}
                  />
                  <Select
                    value={watch(`properties.${index}.valueType`)}
                    onValueChange={(v) =>
                      setValue(`properties.${index}.valueType`, v)
                    }
                  >
                    <SelectTrigger className="w-full" aria-label="속성 타입">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VALUE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label="속성 표시명"
                    placeholder="표시명"
                    {...register(`properties.${index}.title`)}
                  />
                  <Input
                    aria-label="속성 제공자"
                    placeholder="제공자"
                    {...register(`properties.${index}.provider`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="속성 삭제"
                    className="text-muted-foreground/60 hover:text-destructive justify-self-end"
                    onClick={() => onRemove(index)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
