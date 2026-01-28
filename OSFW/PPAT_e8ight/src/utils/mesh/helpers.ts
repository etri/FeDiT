/**
 * ArrayBuffer를 Base64 문자열로 변환
 * @param buffer ArrayBuffer 데이터
 * @returns Base64로 인코딩된 문자열
 * @note Mesh 파일 데이터 변환에 사용됨
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}