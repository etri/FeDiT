'use client';

import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@e8ight/ui/components/ui/select';
import { useSearchParams } from 'next/navigation';

import { DurationDisplay } from '@/app/(app)/viewer/_components/DurationDisplay';
import { ModelInformation } from '@/app/(app)/viewer/_components/ModelInformation';
import { TimeDisplay } from '@/app/(app)/viewer/_components/TimeDisplay';
import {
  DEFAULT_MODEL_ID,
  MODEL_NAMES,
} from '@/app/(app)/viewer/_constants/modelNames';
import { useModelLoadingTime } from '@/app/(app)/viewer/_hooks/useModelLoadingTime';
import { StatusOverlay } from '@/components/common/StatusOverlay';
import { EmbeddedApp } from '@/components/embedded/EmbeddedApp';

export function ViewerContent() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);

  const searchParams = useSearchParams();
  const tourId = searchParams.get('tour_id') || selectedModel;

  const {
    isModelLoaded,
    startDateTime,
    endDateTime,
    durationInSeconds,
    handleModelLoadComplete,
    resetLoadingTime,
  } = useModelLoadingTime(selectedModel);

  function handleModelChange(newModelId: string) {
    setSelectedModel(newModelId);
    resetLoadingTime();
  }

  return (
    <div className="bg-muted relative flex min-h-full w-full flex-col lg:h-full lg:overflow-hidden">
      <StatusOverlay isVisible={!isModelLoaded} blur />

      <div className="flex w-full flex-col gap-4 p-4 lg:h-full lg:flex-row lg:overflow-hidden">
        <div className="flex min-h-0 grow flex-col gap-4">
          <div className="flex shrink-0 items-center gap-4">
            <label
              htmlFor="model-select"
              className="text-foreground text-sm font-bold"
            >
              모델 선택:
            </label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger id="model-select" className="bg-background w-48">
                <SelectValue placeholder="모델 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODEL_NAMES).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {id} - {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-h-[60svh] flex-1 lg:min-h-0">
            <EmbeddedApp
              appId="viewer"
              title="iframe testing"
              params={{ tour_id: selectedModel }}
              onLoad={handleModelLoadComplete}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto lg:w-[360px] xl:w-[540px]">
          <ModelInformation is3DModelLoaded={isModelLoaded} tourId={tourId} />
          <TimeDisplay
            label="⏱️ 로딩 시작 시간"
            dateTime={startDateTime}
            isVisible={isModelLoaded}
          />
          <TimeDisplay
            label="⏱️ 로딩 완료 시간"
            dateTime={endDateTime}
            isVisible={isModelLoaded}
          />
          <DurationDisplay
            durationInSeconds={durationInSeconds}
            isVisible={isModelLoaded}
          />
        </div>
      </div>
    </div>
  );
}
