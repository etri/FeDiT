import axios from 'axios';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다',
  ACCOUNT_DEACTIVATED: '비활성화된 계정입니다. 관리자에게 문의하세요',
  ACCOUNT_DELETION_REQUESTED:
    '탈퇴 요청이 접수된 계정입니다. 철회를 원하시면 관리자에게 문의하세요',
  ADMIN_CANNOT_REQUEST_DELETION:
    '관리자 계정은 탈퇴할 수 없습니다. 다른 관리자에게 권한 변경을 요청하세요',
  INVALID_CURRENT_PASSWORD: '현재 비밀번호가 올바르지 않습니다',
  SAME_AS_CURRENT_PASSWORD: '현재 비밀번호와 다른 비밀번호를 사용해주세요',
  PASSWORD_CHANGED: '비밀번호가 변경되었습니다. 다시 로그인해주세요',
  INVALID_REFRESH_TOKEN: '세션이 만료되었습니다. 다시 로그인해주세요',
  EMAIL_ALREADY_REGISTERED: '이미 등록된 이메일입니다',
  INVALID_INPUT: '입력값을 확인해주세요',
};

const DEFAULT_MESSAGE = '오류가 발생했습니다. 다시 시도해주세요';

export function getAuthErrorMessage(input: unknown): string {
  if (typeof input === 'string') {
    return ERROR_MESSAGES[input] ?? DEFAULT_MESSAGE;
  }
  if (axios.isAxiosError(input)) {
    const code =
      input.response?.data?.error?.errorCode ?? input.response?.data?.errorCode;
    if (typeof code === 'string' && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
  }
  return DEFAULT_MESSAGE;
}
