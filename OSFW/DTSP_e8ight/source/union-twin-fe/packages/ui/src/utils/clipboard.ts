/**
 * 클립보드에 텍스트를 복사하는 유틸리티 함수
 * HTTPS/HTTP 환경에 관계없이 동작하며, 내부적으로 적절한 방법을 선택합니다.
 *
 * @param text - 클립보드에 복사할 텍스트
 * @returns Promise<boolean> - 복사 성공 여부
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // HTTPS 환경에서 navigator.clipboard 사용
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // HTTPS가 아닌 환경에서 대체 방법 사용
      return fallbackCopyToClipboard(text);
    }
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    // navigator.clipboard 실패 시 대체 방법 시도
    return fallbackCopyToClipboard(text);
  }
};

/**
 * HTTPS가 아닌 환경에서 사용하는 대체 클립보드 복사 함수
 * @param text - 클립보드에 복사할 텍스트
 * @returns boolean - 복사 성공 여부
 */
const fallbackCopyToClipboard = (text: string): boolean => {
  try {
    // 임시 textarea 요소 생성
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);

    // 텍스트 선택 및 복사
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');

    // 임시 요소 제거
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('대체 클립보드 복사 실패:', error);
    return false;
  }
};
