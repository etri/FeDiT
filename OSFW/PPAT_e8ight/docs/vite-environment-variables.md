# 📚 Vite 환경 변수 완전 가이드

> 이 문서는 Vite 프로젝트에서 환경 변수를 사용하는 방법과 베스트 프랙티스를 설명합니다.

## 목차
1. [환경 변수란?](#환경-변수란)
2. [Vite에서 환경 변수 사용법](#vite에서-환경-변수-사용법)
3. [환경별 설정 파일](#환경별-설정-파일)
4. [사용하는 이유](#사용하는-이유)
5. [실제 활용 예시](#실제-활용-예시)
6. [빌드 시 처리 과정](#빌드-시-처리-과정)
7. [주의사항](#주의사항)
8. [실전 팁](#실전-팁)

---

## 🎯 환경 변수란?

환경 변수는 애플리케이션 외부에서 설정하는 구성 값으로, 코드를 수정하지 않고도 동작을 변경할 수 있게 해주는 메커니즘입니다.

### 현재 프로젝트 예시
```bash
# .env 파일
VITE_API_BASE_URL=http://localhost:8080/api

# src/services/api/config.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};
```

---

## 🔧 Vite에서 환경 변수 사용법

### 1. VITE_ 접두사 규칙

Vite는 보안상의 이유로 `VITE_` 접두사가 붙은 환경 변수만 클라이언트 코드에서 접근 가능하도록 제한합니다.

```bash
# ✅ 올바른 사용 - VITE_ 접두사 필수
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=My Application
VITE_APP_VERSION=1.0.0

# ❌ 잘못된 사용 - 클라이언트에서 접근 불가
API_BASE_URL=http://localhost:8080/api  # 접근 불가!
SECRET_KEY=mysecret                      # 접근 불가!
DATABASE_URL=postgresql://...            # 접근 불가!
```

### 2. import.meta.env로 접근

Vite는 `import.meta.env` 객체를 통해 환경 변수에 접근합니다.

```typescript
// 환경 변수 직접 접근
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// 기본값 설정 (환경 변수가 없을 때 대비)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Vite 내장 환경 변수
console.log(import.meta.env.MODE);  // 'development' or 'production'
console.log(import.meta.env.DEV);   // true in development
console.log(import.meta.env.PROD);  // true in production
console.log(import.meta.env.SSR);   // true if server-side rendering
```

### 3. TypeScript 타입 정의

TypeScript를 사용하는 경우, 환경 변수의 타입을 정의하면 자동 완성과 타입 체크가 가능합니다.

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  // 더 많은 환경 변수들...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 🌍 환경별 설정 파일

### 파일 우선순위

Vite는 다음 순서로 환경 변수 파일을 로드합니다:

```bash
.env                # 모든 환경에서 로드
.env.local          # 모든 환경에서 로드, git ignore 대상
.env.[mode]         # 특정 모드에서만 로드
.env.[mode].local   # 특정 모드에서만 로드, git ignore 대상
```

### 환경별 파일 구성 예시

```bash
# .env - 기본 설정
VITE_APP_TITLE=My Application
VITE_APP_VERSION=1.0.0

# .env.development - 개발 환경
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=debug

# .env.production - 프로덕션 환경
VITE_API_BASE_URL=https://api.myapp.com/api
VITE_ENABLE_DEBUG=false
VITE_LOG_LEVEL=error

# .env.staging - 스테이징 환경
VITE_API_BASE_URL=https://staging-api.myapp.com/api
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=warn

# .env.local - 로컬 개발자 설정 (git ignore)
VITE_API_BASE_URL=http://192.168.1.100:8080/api
VITE_DEVELOPER_MODE=true
```

### 커스텀 모드 실행

```json
// package.json
{
  "scripts": {
    "dev": "vite",                                    // development 모드
    "build": "vite build",                            // production 모드
    "build:staging": "vite build --mode staging",     // staging 모드
    "preview": "vite preview"
  }
}
```

---

## 🔒 사용하는 이유

### 1️⃣ 보안 강화

민감한 정보를 소스 코드에서 분리하여 보안을 강화합니다.

```javascript
// ❌ 나쁜 예: API 키가 코드에 하드코딩
const API_KEY = "sk-1234567890abcdef";  // GitHub에 노출됨!
const DB_PASSWORD = "admin123";          // 보안 위험!

// ✅ 좋은 예: 환경 변수 사용
const API_KEY = import.meta.env.VITE_API_KEY;
// 실제 값은 .env.local에만 저장 (git ignore)
```

### 2️⃣ 환경별 쉬운 전환

각 환경에 맞는 설정을 코드 수정 없이 적용할 수 있습니다.

```bash
# 개발자 A의 로컬 환경
VITE_API_BASE_URL=http://localhost:3000/api

# 개발자 B의 로컬 환경
VITE_API_BASE_URL=http://localhost:5000/api

# QA 테스트 서버
VITE_API_BASE_URL=https://qa.myapp.com/api

# 스테이징 서버
VITE_API_BASE_URL=https://staging.myapp.com/api

# 프로덕션 서버
VITE_API_BASE_URL=https://api.myapp.com/api
```

### 3️⃣ 코드 수정 없이 설정 변경

배포 환경에서 코드 변경 없이 설정만 바꿀 수 있습니다.

```typescript
// 코드는 동일하게 유지
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  // 환경 변수만 변경하면 자동으로 반영됨
};
```

### 4️⃣ 팀 협업 개선

팀원들이 각자의 개발 환경에 맞게 설정할 수 있습니다.

```bash
# .env.example (Git에 커밋 - 템플릿 역할)
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=My Application
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X

# .env.local (Git ignore - 개인 설정)
VITE_API_BASE_URL=http://my-local-server:3000/api
VITE_GOOGLE_ANALYTICS_ID=UA-123456789-1
VITE_DEVELOPER_MODE=true
```

---

## 💡 실제 활용 예시

### 1. API 서비스 설정

```typescript
// src/services/api/client.ts
import axios from 'axios';
import { API_CONFIG } from './config';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// 개발 환경에서만 요청 로그 출력
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use(config => {
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
}

export default apiClient;
```

### 2. 조건부 기능 활성화

```typescript
// src/utils/analytics.ts
export function initAnalytics() {
  // 프로덕션 환경에서만 Google Analytics 활성화
  if (import.meta.env.PROD && import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
    // Google Analytics 초기화
    gtag('config', import.meta.env.VITE_GOOGLE_ANALYTICS_ID);
  }
}

// src/utils/logger.ts
export class Logger {
  private logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
  
  debug(...args: any[]) {
    if (this.logLevel === 'debug') {
      console.log('[DEBUG]', ...args);
    }
  }
  
  error(...args: any[]) {
    console.error('[ERROR]', ...args);
    
    // 프로덕션에서는 에러 추적 서비스로 전송
    if (import.meta.env.PROD) {
      // Sentry.captureException(...);
    }
  }
}
```

### 3. 동적 설정 관리

```typescript
// src/config/app.config.ts
export const APP_CONFIG = {
  // 앱 기본 정보
  title: import.meta.env.VITE_APP_TITLE || 'My App',
  version: import.meta.env.VITE_APP_VERSION || '0.0.0',
  
  // API 설정
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },
  
  // 기능 토글
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    enableExperimentalFeatures: import.meta.env.VITE_ENABLE_EXPERIMENTAL === 'true',
  },
  
  // 외부 서비스 키
  services: {
    googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  }
};
```

### 4. 환경별 라우팅

```typescript
// src/router/index.ts
import { createRouter } from 'vue-router';

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
];

// 개발 환경에서만 디버그 라우트 추가
if (import.meta.env.DEV) {
  routes.push({ 
    path: '/debug', 
    component: () => import('./pages/Debug.vue') 
  });
}

export const router = createRouter({ routes });
```

---

## ⚙️ 빌드 시 처리 과정

### 개발 모드 (npm run dev)

개발 서버는 실시간으로 .env 파일을 읽고 환경 변수를 제공합니다.

```javascript
// 개발 중 코드
console.log(import.meta.env.VITE_API_BASE_URL);
// 브라우저 콘솔: "http://localhost:8080/api"

// 파일 수정 시 자동 리로드
// .env 파일 변경 → 서버 재시작 필요
// 소스 코드 변경 → HMR로 자동 반영
```

### 프로덕션 빌드 (npm run build)

빌드 시 환경 변수가 실제 값으로 치환됩니다.

```javascript
// 빌드 전 소스 코드
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// 빌드 후 번들 파일
const apiUrl = "https://api.myapp.com/api";
```

### 빌드 최적화

Vite는 사용되지 않는 환경 변수는 번들에 포함시키지 않아 번들 크기를 최적화합니다.

```javascript
// 조건부 코드 제거 (Tree Shaking)
if (import.meta.env.DEV) {
  // 프로덕션 빌드에서는 이 블록이 완전히 제거됨
  console.log('Debug mode enabled');
}
```

---

## 📋 주의사항

### ⚠️ 민감한 정보 노출 방지

VITE_ 접두사가 붙은 모든 환경 변수는 클라이언트 번들에 포함됩니다.

```bash
# ❌ 절대 하지 말아야 할 것
VITE_DATABASE_PASSWORD=admin123     # 클라이언트에 노출됨!
VITE_SECRET_KEY=supersecret         # 위험!
VITE_PRIVATE_API_KEY=sk-123456      # 보안 위반!

# ✅ 안전한 사용
VITE_PUBLIC_API_URL=https://api.example.com     # 공개 가능
VITE_APP_NAME=My Application                    # 공개 가능
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X        # 공개 가능
```

### 🔄 환경 변수 변경 시

환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다.

```bash
# 1. .env 파일 수정
# 2. 현재 개발 서버 중지 (Ctrl+C)
# 3. 개발 서버 재시작
npm run dev
```

### 📝 Git 관리

```bash
# .gitignore
.env.local          # 개인 설정
.env.*.local        # 환경별 개인 설정
.env.production     # 프로덕션 보안 정보

# Git에 커밋해야 할 파일
.env.example        # 환경 변수 템플릿
.env.development    # 개발 환경 기본값
```

---

## 🚀 실전 팁

### 1. 환경 변수 검증

앱 시작 시 필수 환경 변수를 검증합니다.

```typescript
// src/utils/validateEnv.ts
export function validateEnv() {
  const required = [
    'VITE_API_BASE_URL',
    'VITE_APP_TITLE',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}

// src/main.ts
import { validateEnv } from './utils/validateEnv';

// 앱 시작 전 환경 변수 검증
validateEnv();
```

### 2. 다중 API 엔드포인트 관리

```typescript
// src/config/api.endpoints.ts
const API_ENDPOINTS = {
  main: import.meta.env.VITE_API_BASE_URL,
  auth: import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_BASE_URL,
  media: import.meta.env.VITE_MEDIA_API_URL || import.meta.env.VITE_API_BASE_URL,
  websocket: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
};

export default API_ENDPOINTS;
```

### 3. 환경별 빌드 스크립트

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "dev:mock": "VITE_USE_MOCK=true vite",
    "build:dev": "vite build --mode development",
    "build:staging": "vite build --mode staging",
    "build:prod": "vite build --mode production",
    "preview": "vite preview",
    "preview:prod": "vite preview --mode production"
  }
}
```

### 4. 런타임 환경 변수 (고급)

빌드 후에도 환경 변수를 변경할 수 있도록 설정:

```html
<!-- index.html -->
<script>
  // 서버에서 동적으로 주입되는 설정
  window.__RUNTIME_CONFIG__ = {
    apiUrl: '%VITE_API_BASE_URL%',
    appVersion: '%VITE_APP_VERSION%'
  };
</script>
```

```typescript
// src/config/runtime.ts
export function getRuntimeConfig(key: string) {
  // 런타임 설정 우선, 없으면 빌드 시 설정 사용
  return window.__RUNTIME_CONFIG__?.[key] || import.meta.env[`VITE_${key.toUpperCase()}`];
}
```

---

## 🔍 트러블슈팅

### 환경 변수가 undefined로 나오는 경우

1. **VITE_ 접두사 확인**
   ```bash
   # ✅ VITE_로 시작
   VITE_API_URL=...
   ```

2. **개발 서버 재시작**
   ```bash
   # .env 파일 수정 후 반드시 재시작
   npm run dev
   ```

3. **파일명 및 위치 확인**
   ```
   프로젝트 루트/
   ├── .env
   ├── .env.local
   ├── src/
   └── package.json
   ```

### 타입 에러가 발생하는 경우

```typescript
// src/vite-env.d.ts에 타입 정의 추가
interface ImportMetaEnv {
  readonly VITE_NEW_VARIABLE: string;
}
```

### 빌드 환경과 개발 환경이 다른 경우

```javascript
// 현재 모드 확인
console.log('Current mode:', import.meta.env.MODE);
console.log('Is Dev?', import.meta.env.DEV);
console.log('Is Prod?', import.meta.env.PROD);
```

---

## 📚 참고 자료

- [Vite 공식 문서 - 환경 변수와 모드](https://vitejs.dev/guide/env-and-mode.html)
- [프로젝트 API 서비스 구현](../src/services/api/README.md)
- [프로젝트 설정 가이드](./configuration-guide.md)

---

## 🤝 기여하기

이 문서에 대한 개선 사항이나 제안이 있으시면 이슈를 생성하거나 PR을 보내주세요.

---

*마지막 업데이트: 2024년*