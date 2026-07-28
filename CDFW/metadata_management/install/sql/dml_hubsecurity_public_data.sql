-- =====================================================================
-- hubsecurity DB (인증서버 keti-dt-security) 초기 데이터 (DML)
-- 실행 전제: ddl_hubsecurity_public.sql 로 테이블 생성 완료.
-- hubsecurity DB에 hubsecurity_manager 로 접속한 상태에서 실행한다.
--
-- ★ 최소 필수: System_Admin 롤 + admin 계정 + security 앱 (없으면 로그인/토큰 발급 불가)
--   그 아래는 테스트용 롤/계정/앱 (필요 시 사용).
--
-- ▷ __WEB_SERVER_URL__ 를 실제 웹서버 주소로 치환할 것. 예) http://203.0.113.10:8084
--   security 앱의 redirect_uri 는 웹의 VUE_APP_N2M_REDIRECT_URI 와 완전히 같아야 한다.
--   (인증서버가 프로토콜/호스트/포트/경로를 정확히 비교하므로 상대경로는 로그인 실패)
--     sed -i 's|__WEB_SERVER_URL__|http://203.0.113.10:8084|g' dml_hubsecurity_public_data.sql
-- =====================================================================
SET search_path TO public;

-- ---------------------------------------------------------------------
-- 1. 롤(권한 그룹)
-- ---------------------------------------------------------------------
INSERT INTO role (role_id_pk, role_name, role_type, description) VALUES
  ('1DSFJ3J8', 'System_Admin',     'admin',   ''),   -- ★필수
  ('FgV40CZ8', 'Marketplace_User', 'general', ''),
  ('2Dda1TZa', 'DataCoreUI_Admin', 'general', ''),
  ('Ze3eAs7U', 'DataCoreUI_User',  'general', ''),
  ('MwwoWNJ',  'Analytics_User',   'general', ''),
  ('wYow8949', 'Matadata_Admin',   'admin',   ''),   -- 원본 표기 그대로 (Matadata)
  ('EV90cY86', 'Matadata_User',    'general', '');

-- ---------------------------------------------------------------------
-- 2. 사용자 (password 는 bcrypt 해시)
-- ---------------------------------------------------------------------
-- ★필수: 시스템 관리자 계정
INSERT INTO users (user_id_pk, password, nickname, name, phone, email, email_verify, role, user_state) VALUES
  ('admin', '$2b$10$tI5pZFK5bosaqUY65LcKzOOgl9cJXg/0tGpvN53X7.BAqk7ttz1uu',
   'admin', 'admin', '01012545678', 'admin@test.com', 'f', 'System_Admin', 'A');

-- 테스트용 계정
INSERT INTO users (user_id_pk, password, nickname, name, phone, email, email_verify, role, user_state) VALUES
  ('n2m_iot',      '$2b$10$i2sH4ZoPE9PurF20XBvU1e2iwOtJYyuSWKCYrxtYrBNuNUZ/xNAjC', '엔투엠1',        '엔투엠1',          '01022221111', 'n2m@test.com',        'f', 'System_Admin',   'A'),
  ('meta_tester1', '$2b$10$nYZSFtGhnPbmJNhXLA9r7eRZSMo0ZW8xzfLyPAMHdP1oobn.Hh4EO', '메타데이터제공자1', '제공자테스터',     '01012341234', 'meta_tester1@test.com', 'f', 'Marketplace_User', 'A'),
  ('meta_tester2', '$2b$10$nYZSFtGhnPbmJNhXLA9r7eRZSMo0ZW8xzfLyPAMHdP1oobn.Hh4EO', '메타데이터관리자2', '관리자테스터',     '01012341111', 'meta_tester2@test.com', 'f', 'Marketplace_User', 'A'),
  ('meta_tester3', '$2b$10$nYZSFtGhnPbmJNhXLA9r7eRZSMo0ZW8xzfLyPAMHdP1oobn.Hh4EO', '메타데이터조회자3', '조회자테스터',     '01012342222', 'meta_tester3@test.com', 'f', 'Marketplace_User', 'A'),
  ('meta_tester4', '$2b$10$nYZSFtGhnPbmJNhXLA9r7eRZSMo0ZW8xzfLyPAMHdP1oobn.Hh4EO', '메타데이터사용자4', '기본사용자테스터', '01012341112', 'meta_tester4@test.com', 'f', 'Marketplace_User', 'A'),
  ('meta_admin',   '$2b$10$.obZFaKlfAlLa3V5H6KlWOMzOrjai5L8O/jcDdKVCDUHjWv2wxBaq', '메타시스템관리자', '메타시스템관리자', '01011221100', 'meta_admin@test.com',   'f', 'Matadata_Admin',   'A'),
  ('keti_dt',      '$2b$10$gh1sfcJ/flJtXiIGbNO7KeGFBfPTU9RA3NwpNO7dcelzD7DFjfdxC', 'keti_dt',        '케티',            '01012341236', 'keti1@test.com',        'f', 'Matadata_Admin',   'A');

-- ---------------------------------------------------------------------
-- 3. OAuth 애플리케이션
--    ※ redirect_uri 호스트는 실제 Web 서버 주소로 바꾼다. (환경변수화 대상)
-- ---------------------------------------------------------------------
-- ★필수: security 앱
INSERT INTO application (application_id_pk, application_fk1, application_name, application_secret, redirect_uri, scope, is_trusted) VALUES
  ('3eRofhrl6wPWauX2u0GT', 'admin', 'security', 'yFu9svjeJvCY3PLkkpFYF1CvWo7McL7F', '__WEB_SERVER_URL__/redirect', 'read', 't');

-- 테스트/로컬 개발용 앱
INSERT INTO application (application_id_pk, application_fk1, application_name, application_secret, redirect_uri, scope, is_trusted) VALUES
  ('cviCJSrhs3aUBDLzOv5r', 'meta_admin', 'metalocal', 'vpAKZWYY5GuccI2fZJe3bsAiMta0n1E3', 'http://localhost:8084/redirect', 'read', 't');
