import { useId, useState } from 'react';

import { Badge } from '@e8ight/ui/components/ui/badge';
import { Button } from '@e8ight/ui/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@e8ight/ui/components/ui/command';
import { Input } from '@e8ight/ui/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@e8ight/ui/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { Spinner } from '@e8ight/ui/components/ui/spinner';
import { useInfiniteQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';

import { entityQueries } from '@/apis/entity';
import { modelUrnToType } from '@/app/(app)/service/entities/_utils/buildEntityPayload';

const TARGET_PAGE_LIMIT = 100;

interface RelationshipTargetPickerProps {
  contextId: string;
  modelTypes: string[];
  value: string[];
  onChange: (next: string[]) => void;
}

function TargetEntityList({
  contextId,
  targetType,
  selected,
  onToggle,
}: {
  contextId: string;
  targetType: string;
  selected: string[];
  onToggle: (entityId: string) => void;
}) {
  const { data, isPending, isError } = useInfiniteQuery({
    ...entityQueries.list({
      contextId,
      modelId: targetType,
      isDynamic: false,
      pageLimit: TARGET_PAGE_LIMIT,
      searchInfo: { criteriaInfoList: [] },
      requestConfig: {
        headers: { Link: `<${contextId}>` },
        params: { type: targetType, limit: TARGET_PAGE_LIMIT },
      },
    }),
    retry: false,
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner className="text-muted-foreground size-4" />
      </div>
    );
  }
  if (isError) {
    return <CommandEmpty>엔티티 목록을 불러오지 못했습니다.</CommandEmpty>;
  }
  const entities = data.pages.flatMap((page) => page.entities);
  return (
    <CommandList>
      {entities.length === 0 ? (
        <CommandEmpty>
          &apos;{targetType}&apos; 엔티티가 없습니다. 아래에 URN을 직접
          입력하세요.
        </CommandEmpty>
      ) : (
        <CommandGroup>
          {entities.map((entity) => {
            const isSelected = selected.includes(entity.entityId);
            return (
              <CommandItem
                key={entity.entityId}
                value={entity.entityId}
                onSelect={() => onToggle(entity.entityId)}
              >
                <Check
                  className={cn(
                    'size-4',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="truncate font-mono text-xs">
                  {entity.entityId}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      )}
    </CommandList>
  );
}

export function RelationshipTargetPicker({
  contextId,
  modelTypes,
  value,
  onChange,
}: RelationshipTargetPickerProps) {
  const manualId = useId();
  const candidateTypes = modelTypes.map(modelUrnToType);
  const [targetType, setTargetType] = useState(candidateTypes[0] ?? '');
  const [customType, setCustomType] = useState('');
  const [manualUrn, setManualUrn] = useState('');
  const [open, setOpen] = useState(false);

  const effectiveType = candidateTypes.length > 0 ? targetType : customType;

  const toggle = (entityId: string) => {
    onChange(
      value.includes(entityId)
        ? value.filter((id) => id !== entityId)
        : [...value, entityId],
    );
  };

  const addManual = () => {
    const urn = manualUrn.trim();
    if (urn === '' || value.includes(urn)) return;
    onChange([...value, urn]);
    setManualUrn('');
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {candidateTypes.length > 0 ? (
          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="대상 모델" />
            </SelectTrigger>
            <SelectContent>
              {candidateTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            placeholder="대상 모델 Type (예: PohangAtmosphere)"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
          />
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="justify-between font-normal"
              disabled={effectiveType === ''}
            >
              <span className="text-muted-foreground truncate">
                {value.length > 0
                  ? `${value.length}개 선택됨`
                  : '대상 엔티티 선택'}
              </span>
              <ChevronsUpDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0" align="start">
            <Command>
              <CommandInput placeholder="엔티티 ID 검색" />
              {effectiveType !== '' && (
                <TargetEntityList
                  key={effectiveType}
                  contextId={contextId}
                  targetType={effectiveType}
                  selected={value}
                  onToggle={toggle}
                />
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={manualId}
          className="font-mono text-xs"
          placeholder="urn:ngsi-ld:{Type}:{id} 직접 입력"
          value={manualUrn}
          onChange={(e) => setManualUrn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addManual();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="URN 추가"
          onClick={addManual}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((urn) => (
            <Badge key={urn} variant="secondary" className="gap-1 font-mono">
              <span className="max-w-[260px] truncate">{urn}</span>
              <button
                type="button"
                aria-label={`${urn} 제거`}
                className="hover:text-destructive"
                onClick={() => toggle(urn)}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
