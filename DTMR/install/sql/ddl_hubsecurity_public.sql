-- =====================================================================
-- hubsecurity DB (인증서버 keti-dt-security) DDL — public 스키마
-- 인증 서버가 사용하는 별도 DB. dtmeta 와 분리된 DB.
-- hubsecurity DB에 hubsecurity_manager 로 접속한 상태에서 실행한다.
-- =====================================================================
SET search_path TO public;

-- ---------------------------------------------------------------------
-- 1. 테이블
-- ---------------------------------------------------------------------

-- 롤(권한 그룹)
CREATE TABLE public.role
(
    role_id_pk  varchar(8)   NOT NULL,          -- 롤 아이디 (PK)
    role_name   varchar(30)  NULL,              -- 롤 명 (UNIQUE)
    role_type   varchar(12)  NOT NULL,          -- 롤 유형 (admin / general)
    description varchar(100) NULL,              -- 설명
    CONSTRAINT role_pkey          PRIMARY KEY (role_id_pk),
    CONSTRAINT role_role_name_key UNIQUE (role_name)
);

-- 사용자
CREATE TABLE public.users
(
    user_id_pk   varchar(20) NOT NULL,          -- 사용자 아이디 (PK)
    password     varchar(60) NOT NULL,          -- 비밀번호 (bcrypt 해시)
    nickname     varchar(20) NOT NULL,          -- 닉네임 (UNIQUE)
    name         varchar(20) NOT NULL,          -- 이름
    phone        varchar(11) NOT NULL,          -- 전화번호
    email        varchar(30) NOT NULL,          -- 이메일
    email_verify boolean     NOT NULL,          -- 이메일 인증 여부
    role         varchar(30) NOT NULL,          -- 롤 명 (FK -> role.role_name)
    user_state   varchar(1)  NOT NULL,          -- 사용자 상태
    CONSTRAINT users_pkey         PRIMARY KEY (user_id_pk),
    CONSTRAINT users_nickname_key UNIQUE (nickname)
    -- , CONSTRAINT users_email_key UNIQUE (email)   -- ※ 이메일 중복 금지 필요 시 주석 해제
);

-- OAuth 애플리케이션(클라이언트)
CREATE TABLE public.application
(
    application_id_pk  varchar(20)   NOT NULL,   -- 앱 아이디 (PK, client_id)
    application_fk1    varchar(20)   NOT NULL,   -- 소유 사용자 (FK -> users)
    application_name   varchar(30)   NOT NULL,   -- 앱 명
    application_secret varchar(32)   NOT NULL,   -- 앱 시크릿 (client_secret)
    redirect_uri       varchar(1000) NOT NULL,   -- 리다이렉트 URI
    scope              varchar(100)  NOT NULL,   -- 스코프
    is_trusted         boolean       NOT NULL,   -- 신뢰 앱 여부
    CONSTRAINT application_pkey PRIMARY KEY (application_id_pk)
);

-- 인가 코드(Authorization Code)
CREATE TABLE public.authcode
(
    authcode_fk1 varchar(20)  NOT NULL,          -- 앱 (FK -> application)
    authcode_fk2 varchar(20)  NOT NULL,          -- 사용자 (FK -> users)
    code         varchar(32)  NOT NULL,          -- 인가 코드
    redirect_uri varchar(200) NOT NULL           -- 리다이렉트 URI
);

-- 발급 토큰(Access / Refresh Token)
CREATE TABLE public.token
(
    token_fk1     varchar(20)  NOT NULL,         -- 앱 (FK -> application)
    token_fk2     varchar(20)  NULL,             -- 사용자 (FK -> users)
    token         varchar(900) NOT NULL,         -- 액세스 토큰
    issued_at     varchar(13)  NOT NULL,         -- 발급 시각(epoch ms)
    refresh_token varchar(128) NULL,             -- 리프레시 토큰
    expire_time   varchar(13)  NOT NULL,         -- 만료 시각(epoch ms)
    rexpire_time  varchar(13)  NULL              -- 리프레시 만료 시각(epoch ms)
);

-- 사용자-앱 매핑(인가 관계)
CREATE TABLE public.user_app_map
(
    user_app_map_fk1 varchar(20) NOT NULL,       -- 앱 (FK -> application)
    user_app_map_fk2 varchar(20) NOT NULL,       -- 사용자 (FK -> users)
    user_number      varchar(10) NOT NULL,       -- 사용자 번호
    is_authorized    boolean     NOT NULL,       -- 인가 여부
    CONSTRAINT user_app_map_constraint3 PRIMARY KEY (user_app_map_fk1, user_app_map_fk2)
);

-- 사용자 키스토어(JWT 서명용 키쌍)
CREATE TABLE public.keystore
(
    user_id_pk varchar(20)   NOT NULL,           -- 사용자 아이디 (PK, FK -> users)
    pub_key    varchar(500)  NOT NULL,           -- 공개키
    pri_key    varchar(2000) NOT NULL,           -- 개인키
    CONSTRAINT keystore_pkey PRIMARY KEY (user_id_pk)
);

-- 인증 코드(이메일/연락처 검증)
CREATE TABLE public.vericode
(
    vericode_fk1 varchar(20)  NOT NULL,          -- 사용자 (FK -> users)
    vericode_fk2 varchar(30)  NOT NULL,          -- 대상(이메일/연락처)
    vericode     varchar(32)  NOT NULL,          -- 인증 코드
    method       varchar(5)   NOT NULL,          -- 검증 방식
    expire_time  timestamp(0) NOT NULL           -- 만료 시각
);

-- 세션(express-session)
CREATE TABLE public.session
(
    sid    varchar      NOT NULL,                -- 세션 ID (PK)
    sess   json         NOT NULL,                -- 세션 데이터(JSON)
    expire timestamp(6) NOT NULL,                -- 만료 시각
    CONSTRAINT session_constraint1 PRIMARY KEY (sid)
);

-- ---------------------------------------------------------------------
-- 2. 외래 키 (모두 ON UPDATE CASCADE ON DELETE CASCADE)
-- ---------------------------------------------------------------------

ALTER TABLE public.users
    ADD CONSTRAINT users_constraint1        FOREIGN KEY (role)             REFERENCES public.role(role_name)              ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.application
    ADD CONSTRAINT application_constraint1   FOREIGN KEY (application_fk1)  REFERENCES public.users(user_id_pk)            ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.authcode
    ADD CONSTRAINT authcode_constraint1      FOREIGN KEY (authcode_fk1)     REFERENCES public.application(application_id_pk) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT authcode_constraint2      FOREIGN KEY (authcode_fk2)     REFERENCES public.users(user_id_pk)            ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.token
    ADD CONSTRAINT token_constraint1         FOREIGN KEY (token_fk1)        REFERENCES public.application(application_id_pk) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT token_constraint2         FOREIGN KEY (token_fk2)        REFERENCES public.users(user_id_pk)            ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.user_app_map
    ADD CONSTRAINT user_app_map_constraint1  FOREIGN KEY (user_app_map_fk1) REFERENCES public.application(application_id_pk) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT user_app_map_constraint2  FOREIGN KEY (user_app_map_fk2) REFERENCES public.users(user_id_pk)            ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.keystore
    ADD CONSTRAINT keystore_constraint1      FOREIGN KEY (user_id_pk)       REFERENCES public.users(user_id_pk)            ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.vericode
    ADD CONSTRAINT vericode_constraint1      FOREIGN KEY (vericode_fk1)     REFERENCES public.users(user_id_pk)            ON UPDATE CASCADE ON DELETE CASCADE;
