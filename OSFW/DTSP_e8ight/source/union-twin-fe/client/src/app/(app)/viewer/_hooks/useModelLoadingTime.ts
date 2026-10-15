'use client';

import { useEffect, useState } from 'react';

import { formatDateParts } from '@/app/(app)/viewer/_utils/date';
import { useRuntimeConfig } from '@/components/providers/RuntimeConfigProvider';
import { getEmbeddedApp } from '@/lib/iframe/registry';

interface UseModelLoadingTimeResult {
  isModelLoaded: boolean;
  startDateTime: ReturnType<typeof formatDateParts>;
  endDateTime: ReturnType<typeof formatDateParts> | null;
  durationInSeconds: number | null;
  handleModelLoadComplete: () => void;
  resetLoadingTime: () => void;
}

export function useModelLoadingTime(
  selectedModel: string,
): UseModelLoadingTimeResult {
  const { viewerAppUrl } = useRuntimeConfig();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [startTime, setStartTime] = useState<Date>(() => new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [durationInSeconds, setDurationInSeconds] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const { origin } = getEmbeddedApp('viewer', viewerAppUrl || undefined);
    if (!origin) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== origin) return;
      if (event.data !== `모델 로딩 완료 : ${selectedModel}`) return;

      const completeTime = new Date();
      setEndTime(completeTime);
      const duration = (completeTime.getTime() - startTime.getTime()) / 1000;
      setDurationInSeconds(parseFloat(duration.toFixed(2)));
      setIsModelLoaded(true);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedModel, startTime, viewerAppUrl]);

  function handleModelLoadComplete() {
    setIsModelLoaded(true);
  }

  function resetLoadingTime() {
    setIsModelLoaded(false);
    setStartTime(new Date());
    setEndTime(null);
    setDurationInSeconds(null);
  }

  const startDateTime = formatDateParts(startTime);
  const endDateTime = endTime ? formatDateParts(endTime) : null;

  return {
    isModelLoaded,
    startDateTime,
    endDateTime,
    durationInSeconds,
    handleModelLoadComplete,
    resetLoadingTime,
  };
}
