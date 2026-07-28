-- =====================================================================
-- common 스키마 DDL
-- 실행 전 스키마 지정: 이 파일의 테이블은 common 스키마에 생성된다.
-- (dtmeta DB에 meta_manager 로 접속한 상태에서 실행)
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS common AUTHORIZATION meta_manager;
SET search_path TO common;

-- 권한관리
CREATE TABLE tb_com_auth
(
    AUT_OID   VARCHAR(32)   NOT NULL, -- 권한 OID
    AUT_ID    VARCHAR(32)   NULL,     -- 권한아이디
    AUT_NM    VARCHAR(128)  NULL,     -- 권한명
    AUT_DESC  VARCHAR(4000) NULL,     -- 권한설명
    PLTFRM_ID VARCHAR(32)   NULL,     -- 플랫폼아이디
    USE_YN    CHAR(1)       NULL,     -- 사용여부
    TYPE_CD   VARCHAR(32)   NULL,     -- 유형코드
    REG_DT    TIMESTAMP(0)  NULL,     -- 등록 일시
    REGR_ID   VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM   VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT    TIMESTAMP(0)  NULL,     -- 수정 일시
    AMDR_ID   VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM   VARCHAR(128)  NULL      -- 수정자 명
);

-- 권한관리
COMMENT ON TABLE tb_com_auth IS '권한관리';

-- 권한 OID
COMMENT ON COLUMN tb_com_auth.AUT_OID IS '권한 OID';

-- 권한아이디
COMMENT ON COLUMN tb_com_auth.AUT_ID IS '권한아이디';

-- 권한명
COMMENT ON COLUMN tb_com_auth.AUT_NM IS '권한명';

-- 권한설명
COMMENT ON COLUMN tb_com_auth.AUT_DESC IS '권한설명';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_auth.PLTFRM_ID IS '플랫폼아이디';

-- 사용여부
COMMENT ON COLUMN tb_com_auth.USE_YN IS '사용여부';

-- 유형코드
COMMENT ON COLUMN tb_com_auth.TYPE_CD IS '유형코드';

-- 등록 일시
COMMENT ON COLUMN tb_com_auth.REG_DT IS '등록 일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_auth.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_auth.REGR_NM IS '등록자 명';

-- 수정 일시
COMMENT ON COLUMN tb_com_auth.AMD_DT IS '수정 일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_auth.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_auth.AMDR_NM IS '수정자 명';

-- 권한관리 기본키
CREATE UNIQUE INDEX pk_tb_com_auth
    ON tb_com_auth
        ( -- 권한관리
         AUT_OID ASC NULLS LAST -- 권한 OID
            );

-- 권한관리 기본키
COMMENT ON INDEX pk_tb_com_auth IS '권한관리 기본키';

-- 권한관리
ALTER TABLE tb_com_auth
    ADD CONSTRAINT pk_tb_com_auth
        -- 권한관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_auth
    NOT DEFERRABLE;

-- 권한관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_auth ON tb_com_auth IS '권한관리 기본키';

-- 권한메뉴매핑
CREATE TABLE tb_com_authmenumap
(
    AUT_OID  VARCHAR(32) NOT NULL, -- 권한 OID
    MENU_OID VARCHAR(32) NOT NULL, -- 메뉴 OID
    READ_YN  CHAR(1)     NULL,     -- 읽기 여부
    WRITE_YN CHAR(1)     NULL,     -- 쓰기 여부
    AMD_YN   CHAR(1)     NULL,     -- 수정 여부
    DEL_YN   CHAR(1)     NULL      -- 삭제 여부
);

-- 권한메뉴매핑
COMMENT ON TABLE tb_com_authmenumap IS '권한메뉴매핑';

-- 권한 OID
COMMENT ON COLUMN tb_com_authmenumap.AUT_OID IS '권한 OID';

-- 메뉴 OID
COMMENT ON COLUMN tb_com_authmenumap.MENU_OID IS '메뉴 OID';

-- 읽기 여부
COMMENT ON COLUMN tb_com_authmenumap.READ_YN IS '읽기 여부';

-- 쓰기 여부
COMMENT ON COLUMN tb_com_authmenumap.WRITE_YN IS '쓰기 여부';

-- 수정 여부
COMMENT ON COLUMN tb_com_authmenumap.AMD_YN IS '수정 여부';

-- 삭제 여부
COMMENT ON COLUMN tb_com_authmenumap.DEL_YN IS '삭제 여부';

-- 권한메뉴매핑 기본키
CREATE UNIQUE INDEX pk_tb_com_authmenumap
    ON tb_com_authmenumap
        ( -- 권한메뉴매핑
         AUT_OID ASC NULLS LAST, -- 권한 OID
         MENU_OID ASC NULLS LAST -- 메뉴 OID
            );

-- 권한메뉴매핑 기본키
COMMENT ON INDEX pk_tb_com_authmenumap IS '권한메뉴매핑 기본키';

-- 권한메뉴매핑
ALTER TABLE tb_com_authmenumap
    ADD CONSTRAINT pk_tb_com_authmenumap
        -- 권한메뉴매핑 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_authmenumap
    NOT DEFERRABLE;

-- 권한메뉴매핑 기본키
COMMENT ON CONSTRAINT pk_tb_com_authmenumap ON tb_com_authmenumap IS '권한메뉴매핑 기본키';

-- 메뉴관리
CREATE TABLE tb_com_menu
(
    MENU_OID    VARCHAR(32)   NOT NULL, -- 메뉴 OID
    MENU_ID     VARCHAR(32)   NULL,     -- 메뉴아이디
    MENU_NM     VARCHAR(128)  NULL,     -- 메뉴명
    UP_MENU_OID VARCHAR(32)   NULL,     -- 상위메뉴OID
    MENU_DESC   VARCHAR(4000) NULL,     -- 메뉴설명
    MENU_TGT_CD VARCHAR(32)   NULL,     -- 메뉴대상코드
    USE_YN      CHAR(1)       NULL,     -- 사용여부
    URL         VARCHAR(512)  NULL,     -- URL
    URL_PARAM   VARCHAR(512)  NULL,     -- URL 파라미터
    TYPE_CD     VARCHAR(32)   NULL,     -- 유형코드
    PLTFRM_ID   VARCHAR(32)   NULL,     -- 플랫폼아이디
    ODRG        NUMERIC       NULL,     -- 순서
    POPUP_YN    CHAR(1)       NULL,     -- 팝업 여부
    POPUP_WDTH  NUMERIC       NULL,     -- 팝업 가로
    POPUP_HGHT  NUMERIC       NULL,     -- 팝업 높이
    ADMR_YN     CHAR(1)       NULL,     -- 관리자 여부
    MENU_ICON   VARCHAR(128)  NULL,     -- 메뉴 아이콘
    REG_DT      TIMESTAMP(0)  NULL,     -- 등록일시
    REGR_ID     VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM     VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT      TIMESTAMP(0)  NULL,     -- 수정일시
    AMDR_ID     VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM     VARCHAR(128)  NULL      -- 수정자 명
);

-- 메뉴관리
COMMENT ON TABLE tb_com_menu IS '메뉴관리';

-- 메뉴 OID
COMMENT ON COLUMN tb_com_menu.MENU_OID IS '메뉴 OID';

-- 메뉴아이디
COMMENT ON COLUMN tb_com_menu.MENU_ID IS '메뉴아이디';

-- 메뉴명
COMMENT ON COLUMN tb_com_menu.MENU_NM IS '메뉴명';

-- 상위메뉴OID
COMMENT ON COLUMN tb_com_menu.UP_MENU_OID IS '상위메뉴OID';

-- 메뉴설명
COMMENT ON COLUMN tb_com_menu.MENU_DESC IS '메뉴설명';

-- 메뉴대상코드
COMMENT ON COLUMN tb_com_menu.MENU_TGT_CD IS '메뉴대상코드';

-- 사용여부
COMMENT ON COLUMN tb_com_menu.USE_YN IS '사용여부';

-- URL
COMMENT ON COLUMN tb_com_menu.URL IS 'URL';

-- URL 파라미터
COMMENT ON COLUMN tb_com_menu.URL_PARAM IS 'URL 파라미터';

-- 유형코드
COMMENT ON COLUMN tb_com_menu.TYPE_CD IS '유형코드';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_menu.PLTFRM_ID IS '플랫폼아이디';

-- 순서
COMMENT ON COLUMN tb_com_menu.ODRG IS '순서';

-- 팝업 여부
COMMENT ON COLUMN tb_com_menu.POPUP_YN IS '팝업 여부';

-- 팝업 가로
COMMENT ON COLUMN tb_com_menu.POPUP_WDTH IS '팝업 가로';

-- 팝업 높이
COMMENT ON COLUMN tb_com_menu.POPUP_HGHT IS '팝업 높이';

-- 관리자 여부
COMMENT ON COLUMN tb_com_menu.ADMR_YN IS '관리자 여부';

-- 메뉴 아이콘
COMMENT ON COLUMN tb_com_menu.MENU_ICON IS '메뉴 아이콘';

-- 등록일시
COMMENT ON COLUMN tb_com_menu.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_menu.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_menu.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_menu.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_menu.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_menu.AMDR_NM IS '수정자 명';

-- 메뉴관리 기본키
CREATE UNIQUE INDEX pk_tb_com_menu
    ON tb_com_menu
        ( -- 메뉴관리
         MENU_OID ASC NULLS LAST -- 메뉴 OID
            );

-- 메뉴관리 기본키
COMMENT ON INDEX pk_tb_com_menu IS '메뉴관리 기본키';

-- 메뉴관리
ALTER TABLE tb_com_menu
    ADD CONSTRAINT pk_tb_com_menu
        -- 메뉴관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_menu
    NOT DEFERRABLE;

-- 메뉴관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_menu ON tb_com_menu IS '메뉴관리 기본키';

-- 사용자관리(인증서버로 사용안함)
CREATE TABLE tb_com_user
(
    USER_OID      VARCHAR(32)  NOT NULL, -- 사용자 OID
    USER_ID       VARCHAR(32)  NULL,     -- 사용자 아이디
    USER_NM       VARCHAR(128) NULL,     -- 사용자 명
    TEL_NO        VARCHAR(30)  NULL,     -- 전화번호
    EMAIL         VARCHAR(40)  NULL,     -- 이메일
    ADMR_YN       CHAR(1)      NULL,     -- 관리자 여부
    DEL_YN        CHAR(1)      NULL,     -- 삭제 여부
    LAST_LOGIN_DT TIMESTAMP(0) NULL,     -- 최종로그인일시
    PWD_CHG_DT    TIMESTAMP(0) NULL,     -- 비밀번호변경일시
    REG_DT        TIMESTAMP(0) NULL,     -- 등록일시
    REGR_ID       VARCHAR(32)  NULL,     -- 등록자 아이디
    REGR_NM       VARCHAR(128) NULL,     -- 등록자 명
    AMD_DT        TIMESTAMP(0) NULL,     -- 수정일시
    AMDR_ID       VARCHAR(32)  NULL,     -- 수정자 아이디
    AMDR_NM       VARCHAR(128) NULL      -- 수정자 명
);

-- 사용자관리(인증서버로 사용안함)
COMMENT ON TABLE tb_com_user IS '사용자관리(인증서버로 사용안함)';

-- 사용자 OID
COMMENT ON COLUMN tb_com_user.USER_OID IS '사용자 OID';

-- 사용자 아이디
COMMENT ON COLUMN tb_com_user.USER_ID IS '사용자 아이디';

-- 사용자 명
COMMENT ON COLUMN tb_com_user.USER_NM IS '사용자 명';

-- 전화번호
COMMENT ON COLUMN tb_com_user.TEL_NO IS '전화번호';

-- 이메일
COMMENT ON COLUMN tb_com_user.EMAIL IS '이메일';

-- 관리자 여부
COMMENT ON COLUMN tb_com_user.ADMR_YN IS '관리자 여부';

-- 삭제 여부
COMMENT ON COLUMN tb_com_user.DEL_YN IS '삭제 여부';

-- 최종로그인일시
COMMENT ON COLUMN tb_com_user.LAST_LOGIN_DT IS '최종로그인일시';

-- 비밀번호변경일시
COMMENT ON COLUMN tb_com_user.PWD_CHG_DT IS '비밀번호변경일시';

-- 등록일시
COMMENT ON COLUMN tb_com_user.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_user.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_user.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_user.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_user.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_user.AMDR_NM IS '수정자 명';

-- 사용자관리(인증서버로 사용안함) 기본키
CREATE UNIQUE INDEX pk_tb_com_user
    ON tb_com_user
        ( -- 사용자관리(인증서버로 사용안함)
         USER_OID ASC NULLS LAST -- 사용자 OID
            );

-- 사용자관리(인증서버로 사용안함) 기본키
COMMENT ON INDEX pk_tb_com_user IS '사용자관리(인증서버로 사용안함) 기본키';

-- 사용자관리(인증서버로 사용안함)
ALTER TABLE tb_com_user
    ADD CONSTRAINT pk_tb_com_user
        -- 사용자관리(인증서버로 사용안함) 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_user
    NOT DEFERRABLE;

-- 사용자관리(인증서버로 사용안함) 기본키
COMMENT ON CONSTRAINT pk_tb_com_user ON tb_com_user IS '사용자관리(인증서버로 사용안함) 기본키';

-- 권한사용자매핑
CREATE TABLE tb_com_authusermap
(
    AUT_OID  VARCHAR(32)  NOT NULL, -- 권한 OID
    USER_ID  VARCHAR(32)  NOT NULL, -- 사용자 아이디
    NICKNAME VARCHAR(128) NULL,     -- 별칭
    PHONE    VARCHAR(30)  NULL,     -- 전화번호
    EMAIL    VARCHAR(40)  NULL,     -- 이메일
    USER_OID VARCHAR(32)  NULL      -- 사용자 OID
);

-- 권한사용자매핑
COMMENT ON TABLE tb_com_authusermap IS '권한사용자매핑';

-- 권한 OID
COMMENT ON COLUMN tb_com_authusermap.AUT_OID IS '권한 OID';

-- 사용자 아이디
COMMENT ON COLUMN tb_com_authusermap.USER_ID IS '사용자 아이디';

-- 별칭
COMMENT ON COLUMN tb_com_authusermap.NICKNAME IS '별칭';

-- 전화번호
COMMENT ON COLUMN tb_com_authusermap.PHONE IS '전화번호';

-- 이메일
COMMENT ON COLUMN tb_com_authusermap.EMAIL IS '이메일';

-- 사용자 OID
COMMENT ON COLUMN tb_com_authusermap.USER_OID IS '사용자 OID';

-- 권한사용자매핑 기본키
CREATE UNIQUE INDEX pk_tb_com_authusermap
    ON tb_com_authusermap
        ( -- 권한사용자매핑
         AUT_OID ASC NULLS LAST, -- 권한 OID
         USER_ID ASC NULLS LAST -- 사용자 아이디
            );

-- 권한사용자매핑 기본키
COMMENT ON INDEX pk_tb_com_authusermap IS '권한사용자매핑 기본키';

-- 권한사용자매핑
ALTER TABLE tb_com_authusermap
    ADD CONSTRAINT pk_tb_com_authusermap
        -- 권한사용자매핑 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_authusermap
    NOT DEFERRABLE;

-- 권한사용자매핑 기본키
COMMENT ON CONSTRAINT pk_tb_com_authusermap ON tb_com_authusermap IS '권한사용자매핑 기본키';

-- 코드그룹관리
CREATE TABLE tb_com_codegroup
(
    CD_GRP_ID    VARCHAR(32)   NOT NULL, -- 코드그룹아이디
    CD_GRP_NM    VARCHAR(128)  NOT NULL, -- 코드그룹명
    CD_GRP_VAL   VARCHAR(128)  NULL,     -- 코드그룹값
    CD_GRP_DESC  VARCHAR(4000) NULL,     -- 코드그룹설명
    UP_CD_GRP_ID VARCHAR(32)   NOT NULL, -- 상위코드그룹아이디
    USE_YN       CHAR(1)       NOT NULL, -- 사용여부
    PLTFRM_ID    VARCHAR(32)   NOT NULL, -- 플랫폼아이디
    CD_TYPE      VARCHAR(32)   NULL,     -- 코드유형
    REG_DT       TIMESTAMP(0)  NULL,     -- 등록일시
    REGR_ID      VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM      VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT       TIMESTAMP(0)  NULL,     -- 수정일시
    AMDR_ID      VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM      VARCHAR(128)  NULL      -- 수정자 명
);

-- 코드그룹관리
COMMENT ON TABLE tb_com_codegroup IS '코드그룹관리';

-- 코드그룹아이디
COMMENT ON COLUMN tb_com_codegroup.CD_GRP_ID IS '코드그룹아이디';

-- 코드그룹명
COMMENT ON COLUMN tb_com_codegroup.CD_GRP_NM IS '코드그룹명';

-- 코드그룹값
COMMENT ON COLUMN tb_com_codegroup.CD_GRP_VAL IS '코드그룹값';

-- 코드그룹설명
COMMENT ON COLUMN tb_com_codegroup.CD_GRP_DESC IS '코드그룹설명';

-- 상위코드그룹아이디
COMMENT ON COLUMN tb_com_codegroup.UP_CD_GRP_ID IS '상위코드그룹아이디';

-- 사용여부
COMMENT ON COLUMN tb_com_codegroup.USE_YN IS '사용여부';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_codegroup.PLTFRM_ID IS '플랫폼아이디';

-- 코드유형
COMMENT ON COLUMN tb_com_codegroup.CD_TYPE IS '코드유형';

-- 등록일시
COMMENT ON COLUMN tb_com_codegroup.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_codegroup.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_codegroup.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_codegroup.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_codegroup.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_codegroup.AMDR_NM IS '수정자 명';

-- 코드그룹관리 기본키
CREATE UNIQUE INDEX pk_tb_com_codegroup
    ON tb_com_codegroup
        ( -- 코드그룹관리
         CD_GRP_ID ASC NULLS LAST -- 코드그룹아이디
            );

-- 코드그룹관리 기본키
COMMENT ON INDEX pk_tb_com_codegroup IS '코드그룹관리 기본키';

-- 코드그룹관리
ALTER TABLE tb_com_codegroup
    ADD CONSTRAINT pk_tb_com_codegroup
        -- 코드그룹관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_codegroup
    NOT DEFERRABLE;

-- 코드그룹관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_codegroup ON tb_com_codegroup IS '코드그룹관리 기본키';

-- 코드관리
CREATE TABLE tb_com_code
(
    CD_ID      VARCHAR(32)   NOT NULL, -- 코드 아이디
    CD_GRP_ID  VARCHAR(32)   NULL,     -- 코드그룹아이디
    CD_NM      VARCHAR(128)  NULL,     -- 코드명
    CD_VAL     VARCHAR(128)  NULL,     -- 코드값
    CD_DESC    VARCHAR(4000) NULL,     -- 코드설명
    UP_CD_ID   VARCHAR(32)   NULL,     -- 상위코드아이디
    USE_YN     CHAR(1)       NULL,     -- 사용여부
    ODRG       NUMERIC       NULL,     -- 순서
    REF_CD_NM  VARCHAR(128)  NULL,     -- 참조 코드 명
    REF_CD_VAL VARCHAR(128)  NULL,     -- 참조 코드 값
    REG_DT     TIMESTAMP(0)  NULL,     -- 등록일시
    REGR_ID    VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM    VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT     TIMESTAMP(0)  NULL,     -- 수정일시
    AMDR_ID    VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM    VARCHAR(128)  NULL      -- 수정자 명
);

-- 코드관리
COMMENT ON TABLE tb_com_code IS '코드관리';

-- 코드 아이디
COMMENT ON COLUMN tb_com_code.CD_ID IS '코드 아이디';

-- 코드그룹아이디
COMMENT ON COLUMN tb_com_code.CD_GRP_ID IS '코드그룹아이디';

-- 코드명
COMMENT ON COLUMN tb_com_code.CD_NM IS '코드명';

-- 코드값
COMMENT ON COLUMN tb_com_code.CD_VAL IS '코드값';

-- 코드설명
COMMENT ON COLUMN tb_com_code.CD_DESC IS '코드설명';

-- 상위코드아이디
COMMENT ON COLUMN tb_com_code.UP_CD_ID IS '상위코드아이디';

-- 사용여부
COMMENT ON COLUMN tb_com_code.USE_YN IS '사용여부';

-- 순서
COMMENT ON COLUMN tb_com_code.ODRG IS '순서';

-- 참조 코드 명
COMMENT ON COLUMN tb_com_code.REF_CD_NM IS '참조 코드 명';

-- 참조 코드 값
COMMENT ON COLUMN tb_com_code.REF_CD_VAL IS '참조 코드 값';

-- 등록일시
COMMENT ON COLUMN tb_com_code.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_code.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_code.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_code.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_code.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_code.AMDR_NM IS '수정자 명';

-- 코드관리 기본키
CREATE UNIQUE INDEX pk_tb_com_code
    ON tb_com_code
        ( -- 코드관리
         CD_ID ASC NULLS LAST -- 코드 아이디
            );

-- 코드관리 기본키
COMMENT ON INDEX pk_tb_com_code IS '코드관리 기본키';

-- 코드관리
ALTER TABLE tb_com_code
    ADD CONSTRAINT pk_tb_com_code
        -- 코드관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_code
    NOT DEFERRABLE;

-- 코드관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_code ON tb_com_code IS '코드관리 기본키';

-- API관리
CREATE TABLE tb_com_api
(
    API_OID     VARCHAR(32)   NOT NULL, -- APIOID
    API_GRP_OID VARCHAR(32)   NULL,     -- API그룹OID
    API_NM      VARCHAR(128)  NULL,     -- API명
    API_DESC    VARCHAR(4000) NULL,     -- API설명
    API_URL     VARCHAR(512)  NULL,     -- APIURL
    MTHD_CD     VARCHAR(32)   NULL,     -- 메소드코드
    USE_YN      CHAR(1)       NULL,     -- 사용여부
    REG_DT      TIMESTAMP(0)  NULL,     -- 등록일시
    REGR_ID     VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM     VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT      TIMESTAMP(0)  NULL,     -- 수정일시
    AMDR_ID     VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM     VARCHAR(128)  NULL      -- 수정자 명
);

-- API관리
COMMENT ON TABLE tb_com_api IS 'API관리';

-- APIOID
COMMENT ON COLUMN tb_com_api.API_OID IS 'APIOID';

-- API그룹OID
COMMENT ON COLUMN tb_com_api.API_GRP_OID IS 'API그룹OID';

-- API명
COMMENT ON COLUMN tb_com_api.API_NM IS 'API명';

-- API설명
COMMENT ON COLUMN tb_com_api.API_DESC IS 'API설명';

-- APIURL
COMMENT ON COLUMN tb_com_api.API_URL IS 'APIURL';

-- 메소드코드
COMMENT ON COLUMN tb_com_api.MTHD_CD IS '메소드코드';

-- 사용여부
COMMENT ON COLUMN tb_com_api.USE_YN IS '사용여부';

-- 등록일시
COMMENT ON COLUMN tb_com_api.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_api.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_api.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_api.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_api.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_api.AMDR_NM IS '수정자 명';

-- API관리 기본키
CREATE UNIQUE INDEX pk_tb_com_api
    ON tb_com_api
        ( -- API관리
         API_OID ASC NULLS LAST -- APIOID
            );

-- API관리 기본키
COMMENT ON INDEX pk_tb_com_api IS 'API관리 기본키';

-- API관리
ALTER TABLE tb_com_api
    ADD CONSTRAINT pk_tb_com_api
        -- API관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_api
    NOT DEFERRABLE;

-- API관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_api ON tb_com_api IS 'API관리 기본키';

-- API그룹관리
CREATE TABLE tb_com_apigroup
(
    API_GRP_OID  VARCHAR(32)   NOT NULL, -- API그룹OID
    API_GRP_NM   VARCHAR(128)  NULL,     -- API그룹명
    API_GRP_DESC VARCHAR(4000) NULL,     -- API집단설명
    USE_YN       CHAR(1)       NULL,     -- 사용여부
    PLTFRM_ID    VARCHAR(32)   NULL,     -- 플랫폼아이디
    REG_DT       TIMESTAMP(0)  NULL,     -- 등록일시
    REGR_ID      VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM      VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT       TIMESTAMP(0)  NULL,     -- 수정일시
    AMDR_ID      VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM      VARCHAR(128)  NULL      -- 수정자 명
);

-- API그룹관리
COMMENT ON TABLE tb_com_apigroup IS 'API그룹관리';

-- API그룹OID
COMMENT ON COLUMN tb_com_apigroup.API_GRP_OID IS 'API그룹OID';

-- API그룹명
COMMENT ON COLUMN tb_com_apigroup.API_GRP_NM IS 'API그룹명';

-- API집단설명
COMMENT ON COLUMN tb_com_apigroup.API_GRP_DESC IS 'API집단설명';

-- 사용여부
COMMENT ON COLUMN tb_com_apigroup.USE_YN IS '사용여부';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_apigroup.PLTFRM_ID IS '플랫폼아이디';

-- 등록일시
COMMENT ON COLUMN tb_com_apigroup.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_apigroup.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_apigroup.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_apigroup.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_apigroup.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_apigroup.AMDR_NM IS '수정자 명';

-- API그룹관리 기본키
CREATE UNIQUE INDEX pk_tb_com_apigroup
    ON tb_com_apigroup
        ( -- API그룹관리
         API_GRP_OID ASC NULLS LAST -- API그룹OID
            );

-- API그룹관리 기본키
COMMENT ON INDEX pk_tb_com_apigroup IS 'API그룹관리 기본키';

-- API그룹관리
ALTER TABLE tb_com_apigroup
    ADD CONSTRAINT pk_tb_com_apigroup
        -- API그룹관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_apigroup
    NOT DEFERRABLE;

-- API그룹관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_apigroup ON tb_com_apigroup IS 'API그룹관리 기본키';

-- 권한API매핑
CREATE TABLE tb_com_authapimap
(
    AUT_OID     VARCHAR(32) NOT NULL, -- 권한 OID
    API_GRP_OID VARCHAR(32) NOT NULL  -- API그룹OID
);

-- 권한API매핑
COMMENT ON TABLE tb_com_authapimap IS '권한API매핑';

-- 권한 OID
COMMENT ON COLUMN tb_com_authapimap.AUT_OID IS '권한 OID';

-- API그룹OID
COMMENT ON COLUMN tb_com_authapimap.API_GRP_OID IS 'API그룹OID';

-- 권한API매핑 기본키
CREATE UNIQUE INDEX pk_tb_com_authapimap
    ON tb_com_authapimap
        ( -- 권한API매핑
         AUT_OID ASC NULLS LAST, -- 권한 OID
         API_GRP_OID ASC NULLS LAST -- API그룹OID
            );

-- 권한API매핑 기본키
COMMENT ON INDEX pk_tb_com_authapimap IS '권한API매핑 기본키';

-- 권한API매핑
ALTER TABLE tb_com_authapimap
    ADD CONSTRAINT pk_tb_com_authapimap
        -- 권한API매핑 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_authapimap
    NOT DEFERRABLE;

-- 권한API매핑 기본키
COMMENT ON CONSTRAINT pk_tb_com_authapimap ON tb_com_authapimap IS '권한API매핑 기본키';

-- 플랫폼관리
CREATE TABLE tb_com_platform
(
    PLTFRM_ID          VARCHAR(32)   NOT NULL, -- 플랫폼아이디
    PLTFRM_NM          VARCHAR(128)  NULL,     -- 플랫폼명
    PLTFRM_DESC        VARCHAR(4000) NULL,     -- 플랫폼설명
    USE_YN             CHAR(1)       NULL,     -- 사용여부
    ODRG               NUMERIC       NULL,     -- 순서
    MAIN_SCRN_EXIST_YN CHAR(1)       NULL,     -- 주화면존재여부
    REG_DT             TIMESTAMP(0)  NULL,     -- 등록일시
    REGR_ID            VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM            VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT             TIMESTAMP(0)  NULL,     -- 수정일시
    AMDR_ID            VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM            VARCHAR(128)  NULL      -- 수정자 명
);

-- 플랫폼관리
COMMENT ON TABLE tb_com_platform IS '플랫폼관리';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_platform.PLTFRM_ID IS '플랫폼아이디';

-- 플랫폼명
COMMENT ON COLUMN tb_com_platform.PLTFRM_NM IS '플랫폼명';

-- 플랫폼설명
COMMENT ON COLUMN tb_com_platform.PLTFRM_DESC IS '플랫폼설명';

-- 사용여부
COMMENT ON COLUMN tb_com_platform.USE_YN IS '사용여부';

-- 순서
COMMENT ON COLUMN tb_com_platform.ODRG IS '순서';

-- 주화면존재여부
COMMENT ON COLUMN tb_com_platform.MAIN_SCRN_EXIST_YN IS '주화면존재여부';

-- 등록일시
COMMENT ON COLUMN tb_com_platform.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_platform.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_platform.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_platform.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_platform.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_platform.AMDR_NM IS '수정자 명';

-- 플랫폼관리 기본키
CREATE UNIQUE INDEX pk_tb_com_platform
    ON tb_com_platform
        ( -- 플랫폼관리
         PLTFRM_ID ASC NULLS LAST -- 플랫폼아이디
            );

-- 플랫폼관리 기본키
COMMENT ON INDEX pk_tb_com_platform IS '플랫폼관리 기본키';

-- 플랫폼관리
ALTER TABLE tb_com_platform
    ADD CONSTRAINT pk_tb_com_platform
        -- 플랫폼관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_platform
    NOT DEFERRABLE;

-- 플랫폼관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_platform ON tb_com_platform IS '플랫폼관리 기본키';

-- 게시판관리
CREATE TABLE tb_com_bbs
(
    BBS_OID         VARCHAR(32)  NOT NULL, -- 게시판고유번호
    BBS_NM          VARCHAR(128) NULL,     -- 게시판명
    BBS_CD          VARCHAR(32)  NULL,     -- 게시판코드
    USE_YN          CHAR(1)      NULL,     -- 사용여부
    REPL_USE_YN     CHAR(1)      NULL,     -- 댓글사용여부
    ATC_FILE_USE_YN CHAR(1)      NULL,     -- 첨부파일사용여부
    REG_DT          TIMESTAMP(6) NULL,     -- 등록일시
    REGR_ID         VARCHAR(32)  NULL,     -- 등록자 아이디
    REGR_NM         VARCHAR(128) NULL,     -- 등록자 명
    AMD_DT          TIMESTAMP(6) NULL,     -- 수정일시
    AMDR_ID         VARCHAR(32)  NULL,     -- 수정자 아이디
    AMDR_NM         VARCHAR(128) NULL,     -- 수정자 명
    PLTFRM_ID       VARCHAR(32)  NULL      -- 플랫폼아이디
);

-- 게시판관리
COMMENT ON TABLE tb_com_bbs IS '게시판관리';

-- 게시판고유번호
COMMENT ON COLUMN tb_com_bbs.BBS_OID IS '게시판고유번호';

-- 게시판명
COMMENT ON COLUMN tb_com_bbs.BBS_NM IS '게시판명';

-- 게시판코드
COMMENT ON COLUMN tb_com_bbs.BBS_CD IS '게시판코드';

-- 사용여부
COMMENT ON COLUMN tb_com_bbs.USE_YN IS '사용여부';

-- 댓글사용여부
COMMENT ON COLUMN tb_com_bbs.REPL_USE_YN IS '댓글사용여부';

-- 첨부파일사용여부
COMMENT ON COLUMN tb_com_bbs.ATC_FILE_USE_YN IS '첨부파일사용여부';

-- 등록일시
COMMENT ON COLUMN tb_com_bbs.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_bbs.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_bbs.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_bbs.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_bbs.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_bbs.AMDR_NM IS '수정자 명';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_bbs.PLTFRM_ID IS '플랫폼아이디';

-- 게시판관리 기본키
CREATE UNIQUE INDEX pk_tb_com_bbs
    ON tb_com_bbs
        ( -- 게시판관리
         BBS_OID ASC NULLS LAST -- 게시판고유번호
            );

-- 게시판관리 기본키
COMMENT ON INDEX pk_tb_com_bbs IS '게시판관리 기본키';

-- 게시판관리
ALTER TABLE tb_com_bbs
    ADD CONSTRAINT pk_tb_com_bbs
        -- 게시판관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_bbs
    NOT DEFERRABLE;

-- 게시판관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_bbs ON tb_com_bbs IS '게시판관리 기본키';

-- 게시글관리
CREATE TABLE tb_com_bbsposting
(
    PSTNG_OID     VARCHAR(32)   NOT NULL, -- 게시OID
    BBS_OID       VARCHAR(32)   NULL,     -- 게시판고유번호
    PSTNG_TITLE   VARCHAR(128)  NULL,     -- 게시제목
    PSTNG_SBST    VARCHAR(4000) NULL,     -- 게시내용
    RETV_NUM      NUMERIC       NULL,     -- 조회수
    PREV_PSTNG_YN CHAR(1)       NULL,     -- 선게시여부
    REG_DT        TIMESTAMP(6)  NULL,     -- 등록일시
    REGR_ID       VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM       VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT        TIMESTAMP(6)  NULL,     -- 수정일시
    AMDR_ID       VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM       VARCHAR(128)  NULL,     -- 수정자 명
    PLTFRM_ID     VARCHAR(32)   NULL      -- 플랫폼아이디
);

-- 게시글관리
COMMENT ON TABLE tb_com_bbsposting IS '게시글관리';

-- 게시OID
COMMENT ON COLUMN tb_com_bbsposting.PSTNG_OID IS '게시OID';

-- 게시판고유번호
COMMENT ON COLUMN tb_com_bbsposting.BBS_OID IS '게시판고유번호';

-- 게시제목
COMMENT ON COLUMN tb_com_bbsposting.PSTNG_TITLE IS '게시제목';

-- 게시내용
COMMENT ON COLUMN tb_com_bbsposting.PSTNG_SBST IS '게시내용';

-- 조회수
COMMENT ON COLUMN tb_com_bbsposting.RETV_NUM IS '조회수';

-- 선게시여부
COMMENT ON COLUMN tb_com_bbsposting.PREV_PSTNG_YN IS '선게시여부';

-- 등록일시
COMMENT ON COLUMN tb_com_bbsposting.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_bbsposting.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_bbsposting.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_bbsposting.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_bbsposting.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_bbsposting.AMDR_NM IS '수정자 명';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_bbsposting.PLTFRM_ID IS '플랫폼아이디';

-- 게시글관리 기본키
CREATE UNIQUE INDEX pk_tb_com_bbsposting
    ON tb_com_bbsposting
        ( -- 게시글관리
         PSTNG_OID ASC NULLS LAST -- 게시OID
            );

-- 게시글관리 기본키
COMMENT ON INDEX pk_tb_com_bbsposting IS '게시글관리 기본키';

-- 게시글관리
ALTER TABLE tb_com_bbsposting
    ADD CONSTRAINT pk_tb_com_bbsposting
        -- 게시글관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_bbsposting
    NOT DEFERRABLE;

-- 게시글관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_bbsposting ON tb_com_bbsposting IS '게시글관리 기본키';

-- 게시글댓글관리
CREATE TABLE tb_com_bbscomment
(
    CMMT_OID  VARCHAR(32)   NOT NULL, -- 댓글고유번호
    BBS_OID   VARCHAR(32)   NULL,     -- 게시판고유번호
    PSTNG_OID VARCHAR(32)   NULL,     -- 게시OID
    CMMT_SBST VARCHAR(4000) NULL,     -- 댓글내용
    REG_DT    TIMESTAMP(6)  NULL,     -- 등록일시
    REGR_ID   VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM   VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT    TIMESTAMP(6)  NULL,     -- 수정일시
    AMDR_ID   VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM   VARCHAR(128)  NULL      -- 수정자 명
);

-- 게시글댓글관리
COMMENT ON TABLE tb_com_bbscomment IS '게시글댓글관리';

-- 댓글고유번호
COMMENT ON COLUMN tb_com_bbscomment.CMMT_OID IS '댓글고유번호';

-- 게시판고유번호
COMMENT ON COLUMN tb_com_bbscomment.BBS_OID IS '게시판고유번호';

-- 게시OID
COMMENT ON COLUMN tb_com_bbscomment.PSTNG_OID IS '게시OID';

-- 댓글내용
COMMENT ON COLUMN tb_com_bbscomment.CMMT_SBST IS '댓글내용';

-- 등록일시
COMMENT ON COLUMN tb_com_bbscomment.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_bbscomment.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_bbscomment.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_bbscomment.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_bbscomment.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_bbscomment.AMDR_NM IS '수정자 명';

-- 게시글댓글관리 기본키
CREATE UNIQUE INDEX pk_tb_com_bbscomment
    ON tb_com_bbscomment
        ( -- 게시글댓글관리
         CMMT_OID ASC NULLS LAST -- 댓글고유번호
            );

-- 게시글댓글관리 기본키
COMMENT ON INDEX pk_tb_com_bbscomment IS '게시글댓글관리 기본키';

-- 게시글댓글관리
ALTER TABLE tb_com_bbscomment
    ADD CONSTRAINT pk_tb_com_bbscomment
        -- 게시글댓글관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_bbscomment
    NOT DEFERRABLE;

-- 게시글댓글관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_bbscomment ON tb_com_bbscomment IS '게시글댓글관리 기본키';

-- 첨부파일관리
CREATE TABLE tb_com_attachfile
(
    ATC_FILE_OID    VARCHAR(32)  NOT NULL, -- 첨부파일OID
    CONTS_OID       VARCHAR(32)  NULL,     -- 콘텐츠OID
    FILE_ORIGIN_NM  VARCHAR(128) NULL,     -- 파일원본명
    FILE_RESTO_NM   VARCHAR(128) NULL,     -- 파일보관명
    FILE_RESTO_PATH VARCHAR(512) NULL,     -- 파일보관경로
    FILE_SIZE       NUMERIC      NULL,     -- 파일크기
    BBS_OID         VARCHAR(32)  NULL      -- 게시판고유번호
);

-- 첨부파일관리
COMMENT ON TABLE tb_com_attachfile IS '첨부파일관리';

-- 첨부파일OID
COMMENT ON COLUMN tb_com_attachfile.ATC_FILE_OID IS '첨부파일OID';

-- 콘텐츠OID
COMMENT ON COLUMN tb_com_attachfile.CONTS_OID IS '콘텐츠OID';

-- 파일원본명
COMMENT ON COLUMN tb_com_attachfile.FILE_ORIGIN_NM IS '파일원본명';

-- 파일보관명
COMMENT ON COLUMN tb_com_attachfile.FILE_RESTO_NM IS '파일보관명';

-- 파일보관경로
COMMENT ON COLUMN tb_com_attachfile.FILE_RESTO_PATH IS '파일보관경로';

-- 파일크기
COMMENT ON COLUMN tb_com_attachfile.FILE_SIZE IS '파일크기';

-- 게시판고유번호
COMMENT ON COLUMN tb_com_attachfile.BBS_OID IS '게시판고유번호';

-- 첨부파일관리 기본키
CREATE UNIQUE INDEX pk_tb_com_attachfile
    ON tb_com_attachfile
        ( -- 첨부파일관리
         ATC_FILE_OID ASC NULLS LAST -- 첨부파일OID
            );

-- 첨부파일관리 기본키
COMMENT ON INDEX pk_tb_com_attachfile IS '첨부파일관리 기본키';

-- 첨부파일관리
ALTER TABLE tb_com_attachfile
    ADD CONSTRAINT pk_tb_com_attachfile
        -- 첨부파일관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_attachfile
    NOT DEFERRABLE;

-- 첨부파일관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_attachfile ON tb_com_attachfile IS '첨부파일관리 기본키';

-- 공지사항관리
CREATE TABLE tb_com_notice
(
    NTF_OID             VARCHAR(32)   NOT NULL, -- 공지사항고유번호
    NTF_TITLE           VARCHAR(128)  NULL,     -- 공지사항제목
    NTF_SBST            VARCHAR(4000) NULL,     -- 공지사항내용
    RETV_NUM            NUMERIC       NULL,     -- 조회수
    ADM_PRSN_NTF_YN     CHAR(1)       NULL,     -- 관리자공지여부
    PREV_NTF_YN         CHAR(1)       NULL,     -- 선공지여부
    MAIN_POPUP_YN       CHAR(1)       NULL,     -- 주요팝업여부
    POPUP_ST_DT         TIMESTAMP(6)  NULL,     -- 팝업시작일시
    POPUP_FNS_DT        TIMESTAMP(6)  NULL,     -- 팝업종료일시
    POPUP_WDTH          NUMERIC       NULL,     -- 팝업가로
    POPUP_HGHT          NUMERIC       NULL,     -- 팝업높이
    CLS_BUTT_INDC_YN    CHAR(1)       NULL,     -- 닫기버튼표시여부
    TODAY_POPUP_INDC_YN CHAR(1)       NULL,     -- 금일팝업표시여부
    REG_DT              TIMESTAMP(6)  NULL,     -- 등록일시
    REGR_ID             VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM             VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT              TIMESTAMP(6)  NULL,     -- 수정일시
    AMDR_ID             VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM             VARCHAR(128)  NULL,     -- 수정자 명
    PLTFRM_ID           VARCHAR(32)   NULL      -- 플랫폼아이디
);

-- 공지사항관리
COMMENT ON TABLE tb_com_notice IS '공지사항관리';

-- 공지사항고유번호
COMMENT ON COLUMN tb_com_notice.NTF_OID IS '공지사항고유번호';

-- 공지사항제목
COMMENT ON COLUMN tb_com_notice.NTF_TITLE IS '공지사항제목';

-- 공지사항내용
COMMENT ON COLUMN tb_com_notice.NTF_SBST IS '공지사항내용';

-- 조회수
COMMENT ON COLUMN tb_com_notice.RETV_NUM IS '조회수';

-- 관리자공지여부
COMMENT ON COLUMN tb_com_notice.ADM_PRSN_NTF_YN IS '관리자공지여부';

-- 선공지여부
COMMENT ON COLUMN tb_com_notice.PREV_NTF_YN IS '선공지여부';

-- 주요팝업여부
COMMENT ON COLUMN tb_com_notice.MAIN_POPUP_YN IS '주요팝업여부';

-- 팝업시작일시
COMMENT ON COLUMN tb_com_notice.POPUP_ST_DT IS '팝업시작일시';

-- 팝업종료일시
COMMENT ON COLUMN tb_com_notice.POPUP_FNS_DT IS '팝업종료일시';

-- 팝업가로
COMMENT ON COLUMN tb_com_notice.POPUP_WDTH IS '팝업가로';

-- 팝업높이
COMMENT ON COLUMN tb_com_notice.POPUP_HGHT IS '팝업높이';

-- 닫기버튼표시여부
COMMENT ON COLUMN tb_com_notice.CLS_BUTT_INDC_YN IS '닫기버튼표시여부';

-- 금일팝업표시여부
COMMENT ON COLUMN tb_com_notice.TODAY_POPUP_INDC_YN IS '금일팝업표시여부';

-- 등록일시
COMMENT ON COLUMN tb_com_notice.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_notice.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_notice.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_notice.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_notice.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_notice.AMDR_NM IS '수정자 명';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_notice.PLTFRM_ID IS '플랫폼아이디';

-- 공지사항관리 기본키
CREATE UNIQUE INDEX pk_tb_com_notice
    ON tb_com_notice
        ( -- 공지사항관리
         NTF_OID ASC NULLS LAST -- 공지사항고유번호
            );

-- 공지사항관리 기본키
COMMENT ON INDEX pk_tb_com_notice IS '공지사항관리 기본키';

-- 공지사항관리
ALTER TABLE tb_com_notice
    ADD CONSTRAINT pk_tb_com_notice
        -- 공지사항관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_notice
    NOT DEFERRABLE;

-- 공지사항관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_notice ON tb_com_notice IS '공지사항관리 기본키';

-- FAQ관리
CREATE TABLE tb_com_faq
(
    FAQ_OID   VARCHAR(32)   NOT NULL, -- FAQOID
    FAQ_TITLE VARCHAR(128)  NULL,     -- FAQ제목
    FAQ_QSTN  VARCHAR(4000) NULL,     -- FAQ질문
    FAQ_ANS   VARCHAR(4000) NULL,     -- FAQ답변
    RETV_NUM  NUMERIC       NULL,     -- 조회수
    REG_DT    TIMESTAMP(6)  NULL,     -- 등록일시
    REGR_ID   VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM   VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT    TIMESTAMP(6)  NULL,     -- 수정일시
    AMDR_ID   VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM   VARCHAR(128)  NULL,     -- 수정자 명
    PLTFRM_ID VARCHAR(32)   NULL      -- 플랫폼아이디
);

-- FAQ관리
COMMENT ON TABLE tb_com_faq IS 'FAQ관리';

-- FAQOID
COMMENT ON COLUMN tb_com_faq.FAQ_OID IS 'FAQOID';

-- FAQ제목
COMMENT ON COLUMN tb_com_faq.FAQ_TITLE IS 'FAQ제목';

-- FAQ질문
COMMENT ON COLUMN tb_com_faq.FAQ_QSTN IS 'FAQ질문';

-- FAQ답변
COMMENT ON COLUMN tb_com_faq.FAQ_ANS IS 'FAQ답변';

-- 조회수
COMMENT ON COLUMN tb_com_faq.RETV_NUM IS '조회수';

-- 등록일시
COMMENT ON COLUMN tb_com_faq.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_faq.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_faq.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_faq.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_faq.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_faq.AMDR_NM IS '수정자 명';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_faq.PLTFRM_ID IS '플랫폼아이디';

-- FAQ관리 기본키
CREATE UNIQUE INDEX pk_tb_com_faq
    ON tb_com_faq
        ( -- FAQ관리
         FAQ_OID ASC NULLS LAST -- FAQOID
            );

-- FAQ관리 기본키
COMMENT ON INDEX pk_tb_com_faq IS 'FAQ관리 기본키';

-- FAQ관리
ALTER TABLE tb_com_faq
    ADD CONSTRAINT pk_tb_com_faq
        -- FAQ관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_faq
    NOT DEFERRABLE;

-- FAQ관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_faq ON tb_com_faq IS 'FAQ관리 기본키';

-- QNA관리
CREATE TABLE tb_com_qna
(
    QNA_OID   VARCHAR(32)   NOT NULL, -- 질의응답고유번호
    QNA_TITLE VARCHAR(128)  NULL,     -- 질의응답제목
    QNA_QSTN  VARCHAR(4000) NULL,     -- 질의응답질문
    QNA_ANS   VARCHAR(4000) NULL,     -- 질의응답답변
    OTTP_YN   CHAR(1)       NULL,     -- 공개여부
    STTUS_CD  VARCHAR(32)   NULL,     -- 상태코드
    RETV_NUM  NUMERIC       NULL,     -- 조회수
    REG_DT    TIMESTAMP(6)  NULL,     -- QNA등록일시
    REGR_ID   VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM   VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT    TIMESTAMP(6)  NULL,     -- QNA수정일시
    AMDR_ID   VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM   VARCHAR(128)  NULL,     -- 수정자 명
    REG_DT2   TIMESTAMP(6)  NULL,     -- QNA답변등록일시
    REGR2_ID  VARCHAR(32)   NULL,     -- QNA답변등록자 아이디
    REGR2_NM  VARCHAR(128)  NULL,     -- QNA답변등록자 명
    PLTFRM_ID VARCHAR(32)   NULL      -- 플랫폼아이디
);

-- QNA관리
COMMENT ON TABLE tb_com_qna IS 'QNA관리';

-- 질의응답고유번호
COMMENT ON COLUMN tb_com_qna.QNA_OID IS '질의응답고유번호';

-- 질의응답제목
COMMENT ON COLUMN tb_com_qna.QNA_TITLE IS '질의응답제목';

-- 질의응답질문
COMMENT ON COLUMN tb_com_qna.QNA_QSTN IS '질의응답질문';

-- 질의응답답변
COMMENT ON COLUMN tb_com_qna.QNA_ANS IS '질의응답답변';

-- 공개여부
COMMENT ON COLUMN tb_com_qna.OTTP_YN IS '공개여부';

-- 상태코드
COMMENT ON COLUMN tb_com_qna.STTUS_CD IS '상태코드';

-- 조회수
COMMENT ON COLUMN tb_com_qna.RETV_NUM IS '조회수';

-- QNA등록일시
COMMENT ON COLUMN tb_com_qna.REG_DT IS 'QNA등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_qna.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_qna.REGR_NM IS '등록자 명';

-- QNA수정일시
COMMENT ON COLUMN tb_com_qna.AMD_DT IS 'QNA수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_qna.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_qna.AMDR_NM IS '수정자 명';

-- QNA답변등록일시
COMMENT ON COLUMN tb_com_qna.REG_DT2 IS 'QNA답변등록일시';

-- QNA답변등록자 아이디
COMMENT ON COLUMN tb_com_qna.REGR2_ID IS 'QNA답변등록자 아이디';

-- QNA답변등록자 명
COMMENT ON COLUMN tb_com_qna.REGR2_NM IS 'QNA답변등록자 명';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_qna.PLTFRM_ID IS '플랫폼아이디';

-- QNA관리 기본키
CREATE UNIQUE INDEX pk_tb_com_qna
    ON tb_com_qna
        ( -- QNA관리
         QNA_OID ASC NULLS LAST -- 질의응답고유번호
            );

-- QNA관리 기본키
COMMENT ON INDEX pk_tb_com_qna IS 'QNA관리 기본키';

-- QNA관리
ALTER TABLE tb_com_qna
    ADD CONSTRAINT pk_tb_com_qna
        -- QNA관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_qna
    NOT DEFERRABLE;

-- QNA관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_qna ON tb_com_qna IS 'QNA관리 기본키';

-- 이미지관리
CREATE TABLE tb_com_image
(
    IMG_OID     VARCHAR(32)   NOT NULL, -- 이미지고유번호
    IMG_NM      VARCHAR(128)  NULL,     -- 이미지명
    IMG_LNYD_NM VARCHAR(4000) NULL,     -- 이미지설명
    REG_DT      TIMESTAMP(6)  NULL,     -- 등록일시
    REGR_ID     VARCHAR(32)   NULL,     -- 등록자 아이디
    REGR_NM     VARCHAR(128)  NULL,     -- 등록자 명
    AMD_DT      TIMESTAMP(6)  NULL,     -- 수정일시
    AMDR_ID     VARCHAR(32)   NULL,     -- 수정자 아이디
    AMDR_NM     VARCHAR(128)  NULL,     -- 수정자 명
    PLTFRM_ID   VARCHAR(32)   NULL      -- 플랫폼아이디
);

-- 이미지관리
COMMENT ON TABLE tb_com_image IS '이미지관리';

-- 이미지고유번호
COMMENT ON COLUMN tb_com_image.IMG_OID IS '이미지고유번호';

-- 이미지명
COMMENT ON COLUMN tb_com_image.IMG_NM IS '이미지명';

-- 이미지설명
COMMENT ON COLUMN tb_com_image.IMG_LNYD_NM IS '이미지설명';

-- 등록일시
COMMENT ON COLUMN tb_com_image.REG_DT IS '등록일시';

-- 등록자 아이디
COMMENT ON COLUMN tb_com_image.REGR_ID IS '등록자 아이디';

-- 등록자 명
COMMENT ON COLUMN tb_com_image.REGR_NM IS '등록자 명';

-- 수정일시
COMMENT ON COLUMN tb_com_image.AMD_DT IS '수정일시';

-- 수정자 아이디
COMMENT ON COLUMN tb_com_image.AMDR_ID IS '수정자 아이디';

-- 수정자 명
COMMENT ON COLUMN tb_com_image.AMDR_NM IS '수정자 명';

-- 플랫폼아이디
COMMENT ON COLUMN tb_com_image.PLTFRM_ID IS '플랫폼아이디';

-- 이미지관리 기본키
CREATE UNIQUE INDEX pk_tb_com_image
    ON tb_com_image
        ( -- 이미지관리
         IMG_OID ASC NULLS LAST -- 이미지고유번호
            );

-- 이미지관리 기본키
COMMENT ON INDEX pk_tb_com_image IS '이미지관리 기본키';

-- 이미지관리
ALTER TABLE tb_com_image
    ADD CONSTRAINT pk_tb_com_image
        -- 이미지관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_image
    NOT DEFERRABLE;

-- 이미지관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_image ON tb_com_image IS '이미지관리 기본키';

-- 그룹관리
CREATE TABLE tb_com_group
(
    GRP_ID   VARCHAR(32)   NOT NULL, -- 그룹아이디
    GRP_NM   VARCHAR(128)  NULL,     -- 그룹명
    GRP_DESC VARCHAR(4000) NULL,     -- 그룹설명
    REG_DT   TIMESTAMP(0)  NULL,     -- 등록일시
    REGR_ID  VARCHAR(32)   NULL,     -- 등록자아이디
    REGR_NM  VARCHAR(128)  NULL,     -- 등록자명
    AMD_DT   TIMESTAMP(0)  NULL,     -- 수정일시
    AMDR_ID  VARCHAR(32)   NULL,     -- 수정자아이디
    AMDR_NM  VARCHAR(128)  NULL      -- 수정자명
);

-- 그룹관리
COMMENT ON TABLE tb_com_group IS '그룹관리';

-- 그룹아이디
COMMENT ON COLUMN tb_com_group.GRP_ID IS '그룹아이디';

-- 그룹명
COMMENT ON COLUMN tb_com_group.GRP_NM IS '그룹명';

-- 그룹설명
COMMENT ON COLUMN tb_com_group.GRP_DESC IS '그룹설명';

-- 등록일시
COMMENT ON COLUMN tb_com_group.REG_DT IS '등록일시';

-- 등록자아이디
COMMENT ON COLUMN tb_com_group.REGR_ID IS '등록자아이디';

-- 등록자명
COMMENT ON COLUMN tb_com_group.REGR_NM IS '등록자명';

-- 수정일시
COMMENT ON COLUMN tb_com_group.AMD_DT IS '수정일시';

-- 수정자아이디
COMMENT ON COLUMN tb_com_group.AMDR_ID IS '수정자아이디';

-- 수정자명
COMMENT ON COLUMN tb_com_group.AMDR_NM IS '수정자명';

-- 그룹관리 기본키
CREATE UNIQUE INDEX pk_tb_com_group
    ON tb_com_group
        ( -- 그룹관리
         GRP_ID ASC NULLS LAST -- 그룹아이디
            );

-- 그룹관리 기본키
COMMENT ON INDEX pk_tb_com_group IS '그룹관리 기본키';

-- 그룹관리
ALTER TABLE tb_com_group
    ADD CONSTRAINT pk_tb_com_group
        -- 그룹관리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_group
    NOT DEFERRABLE;

-- 그룹관리 기본키
COMMENT ON CONSTRAINT pk_tb_com_group ON tb_com_group IS '그룹관리 기본키';

-- 그룹사용자매핑
CREATE TABLE tb_com_groupusermap
(
    GRP_ID  VARCHAR(32) NOT NULL, -- 그룹아이디
    USER_ID VARCHAR(32) NOT NULL  -- 사용자아이디
);

-- 그룹사용자매핑
COMMENT ON TABLE tb_com_groupusermap IS '그룹사용자매핑';

-- 그룹아이디
COMMENT ON COLUMN tb_com_groupusermap.GRP_ID IS '그룹아이디';

-- 사용자아이디
COMMENT ON COLUMN tb_com_groupusermap.USER_ID IS '사용자아이디';

-- 그룹사용자매핑 기본키
CREATE UNIQUE INDEX pk_tb_com_groupusermap
    ON tb_com_groupusermap
        ( -- 그룹사용자매핑
         GRP_ID ASC NULLS LAST, -- 그룹아이디
         USER_ID ASC NULLS LAST -- 사용자아이디
            );

-- 그룹사용자매핑 기본키
COMMENT ON INDEX pk_tb_com_groupusermap IS '그룹사용자매핑 기본키';

-- 그룹사용자매핑
ALTER TABLE tb_com_groupusermap
    ADD CONSTRAINT pk_tb_com_groupusermap
        -- 그룹사용자매핑 기본키
        PRIMARY KEY
    USING INDEX pk_tb_com_groupusermap
    NOT DEFERRABLE;

-- 그룹사용자매핑 기본키
COMMENT ON CONSTRAINT pk_tb_com_groupusermap ON tb_com_groupusermap IS '그룹사용자매핑 기본키';
