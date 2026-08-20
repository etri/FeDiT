// 이 저장소의 워크스페이스 + 공통 스코프
const scopes = [
  'client', // apps: Next.js 클라이언트
  'server', // apps: NestJS 서버
  'ui', // packages/ui
  'root', // 루트 설정 파일
  'deps', // 의존성 변경
  'docker', // Dockerfile, docker-compose
  'ci', // CI 파이프라인
];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새로운 기능
        'fix', // 버그 수정
        'hotfix', // 급한 버그 수정
        'docs', // 문서 변경
        'style', // 코드 포맷팅, 세미콜론 누락 등
        'refactor', // 코드 리팩토링
        'perf', // 성능 개선
        'test', // 테스트 추가/수정
        'chore', // 빌드 프로세스, 의존성 등
        'ci', // CI 설정 변경
        'build', // 빌드 시스템 변경
        'revert', // 이전 커밋 되돌리기
      ],
    ],
    'scope-enum': [2, 'always', scopes],
    'scope-empty': [2, 'never'], // scope는 필수
    'subject-case': [0], // 비활성화
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
