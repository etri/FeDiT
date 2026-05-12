/**
 * feditUtil.js
 *
 * FEDIT 연동 통합 유틸 — iframe 부모(FEDIT) 검출 + postMessage 전송 + 장바구니 활성 여부.
 * env: VUE_APP_FEDIT_HOST (콤마 구분, 예: service.fedit.or.kr,stg.fedit.or.kr)
 *
 * Cart 연동 가이드 형식:
 * {
 *   type: 'ADD_TO_CART',
 *   payload: {
 *     jsonSchema: Object,      // 필수 - DO의 getDataMapFromMetadataSet 응답
 *     dtOid: 'DO ID',          // 필수 - 디지털트윈 객체 ID
 *     dtOname: 'DO 이름',       // 필수 - 디지털트윈 객체 이름
 *     digitalTwinId: 'DT ID',  // 선택 - 상위 디지털트윈 ID
 *     dtname: 'DT 이름'         // 선택 - 상위 디지털트윈 이름
 *   }
 * }
 */
import { computed } from 'vue';

// env 의 FEDIT 허용 호스트 (콤마 구분)
const FEDIT_HOSTS = (process.env.VUE_APP_FEDIT_HOST || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

// 메시지 타입 정의
export const MESSAGE_TYPES = {
  ADD_TO_CART: 'ADD_TO_CART',
};

/** iframe 환경인지 (제네릭) */
export function isIframeMode() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // cross-origin iframe
  }
}

/**
 * 부모(iframe 호출자) 호스트명 추출.
 * window.location.ancestorOrigins 우선 (Chrome/Edge/Safari)
 * 없으면 document.referrer fallback (Firefox 등)
 * iframe 이 아니면 null.
 */
function getParentHost() {
  if (window.parent === window) return null;
  const ancestors = window.location.ancestorOrigins;
  if (ancestors && ancestors.length > 0) {
    try {
      return new URL(ancestors[0]).hostname;
    } catch (e) { /* ignore */ }
  }
  const referrer = document.referrer || '';
  if (referrer) {
    try {
      return new URL(referrer).hostname;
    } catch (e) { /* ignore */ }
  }
  return null;
}

/** 부모(iframe 호출자) origin 전체. postMessage targetOrigin 용. */
function getParentOrigin() {
  if (window.parent === window) return null;
  const ancestors = window.location.ancestorOrigins;
  if (ancestors && ancestors.length > 0) return ancestors[0];
  const referrer = document.referrer || '';
  if (referrer) {
    try {
      return new URL(referrer).origin;
    } catch (e) { /* ignore */ }
  }
  return null;
}

/**
 * 부모가 FEDIT 호스트인지.
 * env 가 비어 있으면 항상 false.
 */
export function isFeditParent() {
  if (FEDIT_HOSTS.length === 0) return false;
  const host = getParentHost();
  if (!host) return false;
  return FEDIT_HOSTS.some((h) => host === h || host.endsWith('.' + h));
}

/**
 * FEDIT 부모 origin 추출 (postMessage targetOrigin 용).
 * 부모가 FEDIT 가 아니면 null.
 */
export function getFeditTargetOrigin() {
  if (!isFeditParent()) return null;
  return getParentOrigin();
}

/**
 * 부모 창으로 메시지 전송.
 * targetOrigin 필수 — 보안상 와일드카드('*') 금지. 정확한 origin 명시.
 * (이전에는 default '*' 였으나 메시지 가로채기 위험으로 제거)
 */
export function sendToParent(type, payload, targetOrigin) {
  if (!targetOrigin || targetOrigin === '*') {
    console.error('[postMessage] targetOrigin 필수, 와일드카드 금지');
    return false;
  }
  const message = { type, payload };
  try {
    window.parent.postMessage(message, targetOrigin);
    console.log('[postMessage] 전송:', message, '→', targetOrigin);
    return true;
  } catch (e) {
    console.error('[postMessage] 실패:', e);
    return false;
  }
}

/**
 * 장바구니에 DO(Digital Twin Object) 추가.
 * FEDIT 부모가 아니면 전송 차단.
 */
export function addToCart({ jsonSchema, digitalTwinId }) {
  if (!jsonSchema) {
    console.error('[addToCart] jsonSchema 필수');
    return false;
  }
  const targetOrigin = getFeditTargetOrigin();
  if (!targetOrigin) {
    console.error('[addToCart] FEDIT 부모 origin 확인 실패 — 메시지 전송 차단');
    return false;
  }
  const payload = jsonSchema;
  if (digitalTwinId) payload.digitalTwinId = digitalTwinId;
  return sendToParent(MESSAGE_TYPES.ADD_TO_CART, payload, targetOrigin);
}

/** JSON 값 파싱 (헬퍼) */
export function parseJsonValue(val) {
  if (typeof val === 'object' && val !== null) return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Vue Composition API 용 — 장바구니 활성 여부 computed.
 * 사용 예: const { isCartEnabled } = useFeditCart();
 */
export function useFeditCart() {
  const isCartEnabled = computed(() => isFeditParent());
  return { isCartEnabled };
}

export default {
  MESSAGE_TYPES,
  isIframeMode,
  isFeditParent,
  getFeditTargetOrigin,
  sendToParent,
  addToCart,
  parseJsonValue,
  useFeditCart,
};
