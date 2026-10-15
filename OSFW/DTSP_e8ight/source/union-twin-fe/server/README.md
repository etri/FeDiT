# Union Twin 서버

Union Twin 애플리케이션의 NestJS REST API 백엔드.

- **포트:** `4000`
- **API prefix:** `/api`
- **Swagger UI:** `http://localhost:4000/api/docs`

> 부트스트랩, 전역 가드, 인증, 에러 코드는 이 README에 정리돼 있다.
> 클라이언트 연동(BFF 경계, 인증 핸드셰이크, API 표면)은 [`../client/README.md`](../client/README.md) 참고.

---

## 기술 스택

| 구분          | 라이브러리                          |
| ------------- | ----------------------------------- |
| 프레임워크    | NestJS 11                           |
| DB            | PostgreSQL + TypeORM                |
| 인증          | Passport JWT (access + refresh)     |
| 검증          | class-validator / class-transformer |
| 문서          | @nestjs/swagger                     |
| 비밀번호 해시 | bcrypt                              |

---

## 시작하기

### 사전 준비

- Node.js ≥ 22.13
- PostgreSQL

### 환경 변수

이 디렉터리에 `.env`를 만든다. 키 목록은 `.env.sample` 참고.

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=union_twin

# JWT — `openssl rand -base64 48`로 생성
JWT_SECRET=your-jwt-secret

# CORS 허용 origin (쉼표 구분)
CORS_ORIGIN=http://localhost:3000

# 미설정 시 4000
PORT=4000

# 초기 관리자(admin@e8ight.co.kr) 비밀번호. 비우면 관리자 시드를 건너뛴다.
ADMIN_SEED_PASSWORD=
```

> `synchronize`는 모든 환경에서 꺼져 있다. 스키마 변경은 마이그레이션으로만 이뤄지고,
> 부팅 시 자동 적용된다 — 아래 [DB 마이그레이션](#db-마이그레이션) 참고.

### 실행

```bash
pnpm dev          # 개발 (watch)
pnpm build        # 프로덕션 빌드
pnpm start        # 빌드 결과 실행
```

---

## DB 마이그레이션

`src/migrations/`의 파일이 스키마의 **유일한 진실**이다. 부팅 시 자동 적용되고
(`migrationsRun: true`), `src/database-baseline.ts`가 `synchronize: true` 시절에 만들어진
구 DB를 자동으로 베이스라인한다.

```bash
pnpm migration:generate src/migrations/<Name>   # 엔티티 수정 후 diff 생성
pnpm migration:run                              # 수동 적용 (부팅 시 자동 적용과 동일)
pnpm migration:revert                           # 마지막 하나 되돌리기
```

세 스크립트 모두 `src/data-source.ts`의 DataSource를 쓰므로 이 디렉터리의 `.env`가
로컬 DB를 가리켜야 한다. 로컬 Postgres는 `pnpm dev:db`로 띄운다.

- **생성은 항상 `migration:generate`로 한다.** 엔티티를 고친 뒤 diff를 뽑고, 생성된
  SQL을 커밋 전에 읽어본다. 손으로 쓴 마이그레이션은 엔티티와 어긋나기 쉽다.
- **컬럼 rename은 generate가 drop + add로 뽑는다** — 그대로 두면 데이터가 날아간다.
  생성된 파일을 `ALTER TABLE ... RENAME COLUMN`으로 직접 고쳐야 한다.
- 이미 배포된 마이그레이션은 수정하지 않는다. 되돌릴 일이 생기면 새 마이그레이션을 얹는다.

---

## 디렉터리 구조

```
src/
├── main.ts               # 부트스트랩: prefix(/api), ValidationPipe, 필터/인터셉터, Swagger, CORS, helmet
├── app.module.ts         # 루트 모듈. TypeORM 설정 + 부팅 시 마이그레이션 자동 실행
├── data-source.ts        # TypeORM CLI용 DataSource (migration:generate/run)
├── database-baseline.ts  # 구 DB 자동 베이스라인
├── migrations/           # 스키마 마이그레이션 (단일 진실)
├── auth/                 # JWT 인증, 토큰 회전, 회원가입/로그인
├── users/                # 유저 CRUD (ADMIN)
├── roles/                # 역할 관리 (ADMIN)
├── boards/               # 게시판 엔티티만 (모듈도 컨트롤러도 없음)
├── notices/              # 공지 CRUD, 발행/고정
├── organizations/        # 조직 목록
└── common/
    ├── decorators/       # @Public, @Roles, @CurrentUser
    ├── guards/           # JwtAuthGuard, RolesGuard (전역)
    ├── filters/          # HttpExceptionFilter (전역)
    ├── interceptors/     # LoggingInterceptor (전역, 요청 로깅 + x-request-id)
    ├── constants/        # Role enum, PG 에러 코드 등
    └── dto/              # 공통 DTO (페이지네이션 등)
```

---

## 인증 / 인가

모든 라우트는 기본적으로 전역 `JwtAuthGuard` + `RolesGuard`로 보호된다.

- `@Public()` — 두 가드를 모두 우회 (register, login, refresh, 공지 공개 조회 등)
- `@Roles('ADMIN')` — `req.user.role === 'ADMIN'` 추가 검사

> **권한(permission) 시스템은 없다.** 인가는 **역할 이름**으로만 판단한다. 역할은 3개가
> 시드되지만, 컨트롤러에서 실제로 요구하는 역할은 `ADMIN` 뿐이다.

### 토큰 사양

- **알고리즘(access):** HS256, `JWT_SECRET`으로 서명
- **Access:** `15m` (`auth.module.ts`의 `signOptions`)
- **Refresh:** `7d` (`auth.service.ts`). 서명 없는 불투명 랜덤 문자열(`randomBytes(48)`)이라 payload가 없다.
- **Access payload:** `{ sub: userId, email, role, pwd_iat }` — `pwd_iat`는 비밀번호 변경 시각으로,
  비밀번호 변경 이후 발급된 기존 토큰을 무효화하는 데 쓴다.
- **저장:** 리프레시 토큰은 `refresh_tokens`에 **SHA-256 해시로만** 저장한다. 원본은 DB에
  닿지 않으므로 스냅샷이 유출돼도 재사용 불가.
- **회전(rotation):** `/refresh` 성공 시마다 제시된 토큰을 폐기하고 새 토큰을 발급한다.
- **비활성 유저:** `user.isActive === false`면 `/refresh` 거부.
- **로그아웃 / 비밀번호 변경:** 해당 유저의 활성 리프레시 토큰을 **전부** 폐기한다.

### 다중 기기 / 다중 로그인

`login()`은 **기존 세션을 폐기하지 않는다** — 로그인할 때마다 새 리프레시 토큰을 추가만 한다.
따라서 같은 계정(예: 공용 관리자 계정)으로 **여러 사람이 여러 기기에서 동시에 로그인**할 수
있다.

### 요청 속도 제한(throttle)

전역 `ThrottlerGuard`(`app.module.ts`)가 60초당 120회로 막고, 인증 계열 라우트는
`@Throttle`로 더 좁게 잡는다.

| 라우트                              | 한도          |
| ----------------------------------- | ------------- |
| `POST /api/auth/register`           | 1시간당 10회  |
| `POST /api/auth/login`              | 60초당 10회   |
| `POST /api/auth/refresh`            | 60초당 30회   |
| `POST /api/auth/me/password`        | 60초당 10회   |
| `POST /api/auth/me/deletion-request`| 60초당 10회   |

> **버킷은 사용자별이 아니다.** 트래커는 IP이고, 프런트(Next.js BFF)가 모든 백엔드 요청을
> `fetch`로 중계하면서 `X-Forwarded-For`를 붙이지 않는다. `main.ts`가
> `trust proxy: 'uniquelocal'`을 켜 두었어도 전달된 헤더가 없으므로 백엔드가 보는 IP는
> **BFF 컨테이너 하나**다. 즉 위 한도는 전체 사용자가 공유한다. 사용자 단위로 조이려면
> BFF가 원 IP를 전달하게 하거나, 트래커를 email/유저 기준으로 바꿔야 한다.

---

## API 레퍼런스

모든 경로에 `/api` prefix가 붙는다. 보호된 엔드포인트는 `Authorization: Bearer <accessToken>` 필요.

### 인증 — `/api/auth`

| Method | Path           | Auth   | 설명                                    |
| ------ | -------------- | ------ | --------------------------------------- |
| POST   | `/register`            | Public | 회원가입 (VIEWER 역할로 생성)           |
| POST   | `/login`               | Public | 로그인, access + refresh 토큰 반환      |
| POST   | `/refresh`             | Public | 리프레시 토큰으로 토큰 재발급 (회전)    |
| POST   | `/logout`              | JWT    | 해당 유저의 모든 리프레시 토큰 폐기     |
| GET    | `/me`                  | JWT    | 내 프로필 조회                          |
| PATCH  | `/me`                  | JWT    | 내 프로필 수정                          |
| POST   | `/me/password`         | JWT    | 비밀번호 변경 (모든 리프레시 토큰 폐기) |
| POST   | `/me/deletion-request` | JWT    | 회원탈퇴 요청 — 비밀번호 확인 후 계정 비활성화 + `deletionRequestedAt` 기록 + 모든 리프레시 토큰 폐기. ADMIN 역할은 403. |

**login / refresh 응답** (래퍼 없이 그대로 반환)

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "3hF9...",
  "user": { "id": "...", "email": "...", "name": "...", "role": "ADMIN" }
}
```

### 유저 — `/api/users`

모두 **ADMIN** 역할 필요. 단건 조회 엔드포인트는 없다 — 목록에서 읽는다.

| Method | Path             | 설명                |
| ------ | ---------------- | ------------------- |
| GET    | `/`              | 목록 (페이지네이션) |
| POST   | `/`              | 유저 생성           |
| PATCH  | `/:id`           | 필드 / 역할 수정. `isActive: true`로 재활성화하면 `deactivatedAt`과 `deletionRequestedAt` 초기화 (= 탈퇴 요청 거부) |
| DELETE | `/:id`           | 비활성화 (소프트). 자기 자신은 403 |
| DELETE | `/:id/permanent` | 완전 삭제 (하드). 탈퇴 요청 승인에도 사용. 자기 자신은 403 |

페이지네이션 쿼리(모두 선택): `page`(기본 1), `size`(기본 10, 최대 100), `sortBy`, `sortOrder`(`ASC`|`DESC`), `search`, `pendingDeletion`(`true`면 탈퇴 요청 대기 유저만)

### 역할 — `/api/roles`

**ADMIN** 역할 필요. 역할은 시드로만 만들어지므로 읽기 하나뿐이다 — 생성/수정/삭제
엔드포인트도, 권한 엔드포인트도 없다.

| Method | Path | 설명      |
| ------ | ---- | --------- |
| GET    | `/`  | 전체 목록 |

### 공지 — `/api/notices`

| Method | Path           | Auth   | 설명                                       |
| ------ | -------------- | ------ | ------------------------------------------ |
| GET    | `/`            | Public | 발행 공지 목록 (페이지네이션, 고정글 우선) |
| GET    | `/admin`       | ADMIN  | 전체 공지 목록 (status 필터)               |
| GET    | `/admin/:id`   | ADMIN  | 공지 상세 (미발행 포함, `viewCount` 증가 없음) |
| GET    | `/:id`         | Public | 발행 공지 상세 (`viewCount` 증가). 미발행이면 404 |
| POST   | `/`            | ADMIN  | 공지 생성 (자동 발행, 기본 NOTICE 게시판)  |
| PATCH  | `/:id`         | ADMIN  | 제목/내용 수정                             |
| DELETE | `/:id`         | ADMIN  | 삭제                                       |
| PATCH  | `/:id/publish` | ADMIN  | 발행 토글                                  |
| PATCH  | `/:id/pin`     | ADMIN  | 고정 토글                                  |

`:id`는 전부 `ParseUUIDPipe`를 통과한다 — UUID가 아니면 핸들러에 닿기 전에 400이다.
`/admin/:id`가 `/:id`보다 **위에** 선언돼 있어 `/notices/admin/<uuid>`가 공개 상세로
샐 일은 없다.

공지 응답의 `author`는 `id`, `name`, `email` 세 컬럼만 담는다. 조인이
`addSelect(['author.id', 'author.name', 'author.email'])`로 고정돼 있어 나머지 유저
필드는 공개 응답으로 나가지 않는다.

게시판(`boards`)은 엔티티만 있고 컨트롤러가 없다 — 공지가 붙을 기본 `공지사항`
게시판을 시드가 만들 뿐, HTTP로 노출되는 게시판 CRUD는 없다.

**목록 쿼리 파라미터**

| 파라미터    | 타입                                                   | 기본값                       |
| ----------- | ------------------------------------------------------ | ---------------------------- |
| `page`      | number                                                 | `1`                          |
| `size`      | number (최대 100)                                      | `10`                         |
| `status`    | `published` \| `unpublished` \| `all`                  | `/admin`은 `all`, 공개는 고정 |
| `sortBy`    | `title` \| `viewCount` \| `createdAt` \| `isPublished` | `createdAt`                  |
| `sortOrder` | `ASC` \| `DESC`                                        | `DESC`                       |

`status`가 실제로 먹는 곳은 `GET /admin` 하나뿐이다. 공개 목록(`GET /`)은 넘어온
`status`를 버리고 `published`로 덮어쓰므로, 쿼리로 미발행 공지를 끌어낼 수 없다.

결과는 항상 고정글 우선, 그다음 `sortBy` 순으로 정렬된다.

### 조직 — `/api/organizations`

| Method | Path | Auth  | 설명      |
| ------ | ---- | ----- | --------- |
| GET    | `/`  | ADMIN | 조직 목록 |

---

## 응답 형식

성공 응답을 감싸는 전역 인터셉터는 **없다.** 엔드포인트마다 자체 형태로 반환한다.

- **목록:** `{ "data": [ ... ], "meta": { "page", "size", "total", "totalPages" } }`
- **단건:** 객체를 그대로 반환
- **login / refresh:** `{ accessToken, refreshToken, user }`

**에러** — `HttpExceptionFilter`가 전역으로 아래 형태로 통일한다.

```json
{
  "data": null,
  "error": {
    "statusCode": 404,
    "errorCode": null,
    "message": "Notice not found",
    "type": "NotFoundException",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

`errorCode`는 서비스가 의미 있는 코드(`INVALID_CREDENTIALS` 등)를 넣은 경우에만 채워지고,
그 외에는 `null`이다.

---

## 시드 데이터

모듈 초기화(`OnModuleInit`) 시 자동 적용된다.

| 시드                | 생성 내용                                                                               |
| ------------------- | --------------------------------------------------------------------------------------- |
| `RolesSeed`         | 역할 3개: ADMIN, EDITOR, VIEWER                                                         |
| `OrganizationsSeed` | 이에이트(E8), 한국전자통신연구원, 한국과학기술원                                        |
| `AdminSeed`         | 관리자 `admin@e8ight.co.kr` (ADMIN). 비밀번호는 `ADMIN_SEED_PASSWORD`, 미설정 시 건너뜀 |
| `NoticesService`    | 기본 `공지사항`(NOTICE) 게시판이 없으면 생성                                            |

> **운영에서는 최초 로그인 후 기본 관리자 비밀번호를 변경할 것.**

---

## 배포

부팅 시 마이그레이션이 자동 실행되므로 배포할 때 별도의 DB 작업은 없다.
이미지 빌드/배포 경로가 환경별로 다르다.

| 환경                           | 빌드/배포                                             | 레지스트리             | compose 파일              |
| ------------------------------ | ----------------------------------------------------- | ---------------------- | ------------------------- |
| **223 (내부망)**               | Jenkins CI가 `main` 푸시 시 자동 빌드 → 223 자동 배포 | `docker-registry:12000`  | `docker-compose.yml`      |
| **제주 (service.fedit.or.kr)** | **CI 대상 아님 — 수동 빌드/푸시/풀**                  | `docker-registry:52000` | `docker-compose-jeju.yml` |

> **왜 수동인가:** Jenkins CI는 이미지를 **내부망 레지스트리(`docker-registry:12000`)에만** push하고
> **223 서버에만** 배포한다(레포 루트 `Jenkinsfile` 의 `NEXUS_REPO`·`DEPLOY_SERVER`). 제주는 다른
> 네트워크의 별도 레지스트리(`docker-registry:52000`)를 쓰므로 CI가 전혀 건드리지 않는다 — 제주에
> 대해서는 빌드·push도, 배포(CD)도 하지 않는다. 따라서 `main`에 머지해도 제주 이미지는 갱신되지
> 않고, 아래처럼 직접 빌드·push·pull 해야 한다.

```bash
# 레포 루트에서 (Dockerfile이 turbo prune을 루트 기준으로 수행)
docker build --platform linux/amd64 \
  --target union-twin-be --build-arg PKG=@workspace/union-twin-be \
  -t docker-registry:52000/union-twin-be:latest .
docker push docker-registry:52000/union-twin-be:latest

# 제주 서버에서
docker compose -f docker-compose-jeju.yml pull union-twin-be
docker compose -f docker-compose-jeju.yml up -d union-twin-be
```
