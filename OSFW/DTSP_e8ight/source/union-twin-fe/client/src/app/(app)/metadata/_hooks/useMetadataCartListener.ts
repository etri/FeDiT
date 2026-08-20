'use client';

import { useEffect, useRef } from 'react';

import { toast } from '@e8ight/ui/components/ui/sonner';

import { isAddToCartMessage } from '@/lib/iframe/guards';
import { getRegisteredOrigins } from '@/lib/iframe/registry';
import {
  cartItemLabel,
  useMetadataCartStore,
} from '@/stores/useMetadataCartStore';

import type { DigitalTwinObjectPayload } from '@/lib/iframe/types';
import type { MetadataCartItem } from '@/stores/useMetadataCartStore';

const ECHO_WINDOW_MS = 1500;

function toCartItem(payload: DigitalTwinObjectPayload): MetadataCartItem {
  return {
    dtoid: payload.dtoid,
    name: payload.name,
    description: payload.description,
    digitalTwinId: payload.digitalTwinId,
    schemaInformation: payload.digitalTwinObjectData?.schemaInformation,
  };
}

export function useMetadataCartListener(): void {
  const addItem = useMetadataCartStore((state) => state.addItem);
  const lastSeenRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!getRegisteredOrigins().has(event.origin)) return;

      const data = event.data as { type?: unknown } | null | undefined;
      if (data?.type !== 'ADD_TO_CART') return;

      if (!isAddToCartMessage(data)) {
        console.warn('[iframe] invalid ADD_TO_CART payload', data);
        toast.error('담기 데이터 형식이 올바르지 않습니다');
        return;
      }

      const { dtoid } = data.payload;
      const now = Date.now();
      const last = lastSeenRef.current.get(dtoid);
      if (last && now - last < ECHO_WINDOW_MS) return;
      lastSeenRef.current.set(dtoid, now);

      const item = toCartItem(data.payload);
      const added = addItem(item);
      if (added) {
        toast.success(`'${cartItemLabel(item)}'을(를) 장바구니에 담았습니다`);
      } else {
        toast.info('이미 담긴 객체입니다');
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addItem]);
}
