import type { DigitalTwinObjectPayload } from '@/lib/iframe/types';

interface AddToCartMessage {
  type: 'ADD_TO_CART';
  payload: DigitalTwinObjectPayload;
}

export function isAddToCartMessage(data: unknown): data is AddToCartMessage {
  if (data === null || typeof data !== 'object') return false;
  const message = data as { type?: unknown; payload?: unknown };
  if (message.type !== 'ADD_TO_CART') return false;
  if (message.payload === null || typeof message.payload !== 'object') {
    return false;
  }
  const payload = message.payload as { dtoid?: unknown; name?: unknown };
  return (
    typeof payload.dtoid === 'string' &&
    payload.dtoid.length > 0 &&
    typeof payload.name === 'string'
  );
}
