-- =====================================================================
-- dtmeta 스키마 DDL
-- 실행 전 스키마 지정: 이 파일의 테이블은 dtmeta 스키마에 생성된다.
-- (dtmeta DB에 meta_manager 로 접속한 상태에서 실행)
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS dtmeta AUTHORIZATION meta_manager;
SET search_path TO dtmeta;

-- =====================================================================
-- 시퀀스
-- ID 채번용. 'D' + EXTRACT(EPOCH) + LPAD(NEXTVAL, 자리수, '0') 형태로 조합된다.
-- 자리수를 넘기면 LPAD 가 잘라내므로 자리수에 맞춰 CYCLE 하도록 MAXVALUE 를 둔다.
-- =====================================================================

-- 메타데이터/변경이력 (6자리)
CREATE SEQUENCE IF NOT EXISTS seq_tb_meta_data
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999
    START 1
    CACHE 1
    CYCLE;

-- 분류 (6자리)
CREATE SEQUENCE IF NOT EXISTS seq_tb_meta_category
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 999999
    START 1
    CACHE 1
    CYCLE;

-- 속성정의/모델속성/에이전트 (4자리)
CREATE SEQUENCE IF NOT EXISTS seq_tb_meta_common
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999
    START 1
    CACHE 1
    CYCLE;

-- RDF 네임스페이스/클래스/속성/매핑 (4자리)
CREATE SEQUENCE IF NOT EXISTS seq_tb_rdf_common
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999
    START 1
    CACHE 1
    CYCLE;

-- PAT/알림 (4자리와 6자리 혼용이라 좁은 쪽인 4자리에 맞춤)
CREATE SEQUENCE IF NOT EXISTS seq_tb_portal_common
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9999
    START 1
    CACHE 1
    CYCLE;

-- 국가코드
CREATE TABLE tb_portal_countrycode
(
    CNTRY_CD              VARCHAR(2)   NOT NULL, -- 국가 코드
    CNTRY_NM              VARCHAR(128) NOT NULL, -- 국가 명
    CNTRY_ENG_NM          VARCHAR(128) NULL,     -- 국가 영문 명
    CNTRY_NUMB            VARCHAR(3)   NULL,     -- 국가 숫자
    CNTRY_ALPHA3          VARCHAR(3)   NULL,     -- 국가 알파3
    CNTRY_ALPHA2          VARCHAR(2)   NULL,     -- 국가 알파2
    CNTRY_DATA_STTUS_MTCD VARCHAR(64)  NULL,     -- 국가 데이터 상태 메타코드
    CNTRY_REGR_ID         VARCHAR(32)  NULL,     -- 국가 등록자 아이디
    CNTRY_REGR_NM         VARCHAR(128) NULL,     -- 국가 등록자 명
    CNTRY_REG_DT          TIMESTAMP(6) NULL,     -- 국가 등록 일시
    CNTRY_AMDR_ID         VARCHAR(32)  NULL,     -- 국가 수정자 아이디
    CNTRY_AMDR_NM         VARCHAR(128) NULL,     -- 국가 수정자 명
    CNTRY_AMD_DT          TIMESTAMP(6) NULL      -- 국가 수정 일시
);

-- 국가코드
COMMENT ON TABLE tb_portal_countrycode IS '국가코드';

-- 국가 코드
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_CD IS '국가 코드';

-- 국가 명
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_NM IS '국가 명';

-- 국가 영문 명
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_ENG_NM IS '국가 영문 명';

-- 국가 숫자
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_NUMB IS '국가 숫자';

-- 국가 알파3
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_ALPHA3 IS '국가 알파3';

-- 국가 알파2
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_ALPHA2 IS '국가 알파2';

-- 국가 데이터 상태 메타코드
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_DATA_STTUS_MTCD IS '국가 데이터 상태 메타코드';

-- 국가 등록자 아이디
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_REGR_ID IS '국가 등록자 아이디';

-- 국가 등록자 명
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_REGR_NM IS '국가 등록자 명';

-- 국가 등록 일시
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_REG_DT IS '국가 등록 일시';

-- 국가 수정자 아이디
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_AMDR_ID IS '국가 수정자 아이디';

-- 국가 수정자 명
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_AMDR_NM IS '국가 수정자 명';

-- 국가 수정 일시
COMMENT ON COLUMN tb_portal_countrycode.CNTRY_AMD_DT IS '국가 수정 일시';

-- 국가코드 기본키
CREATE UNIQUE INDEX pk_tb_portal_countrycode
    ON tb_portal_countrycode
        ( -- 국가코드
         CNTRY_CD ASC NULLS LAST -- 국가 코드
            );

-- 국가코드 기본키
COMMENT ON INDEX pk_tb_portal_countrycode IS '국가코드 기본키';

-- 국가코드
ALTER TABLE tb_portal_countrycode
    ADD CONSTRAINT pk_tb_portal_countrycode
        -- 국가코드 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_countrycode
    NOT DEFERRABLE;

-- 국가코드 기본키
COMMENT ON CONSTRAINT pk_tb_portal_countrycode ON tb_portal_countrycode IS '국가코드 기본키';

-- 사용자별알림
CREATE TABLE tb_portal_notifc
(
    NOTIFC_ID            VARCHAR(64)   NOT NULL, -- 알림 아이디
    USER_ID              VARCHAR(32)   NOT NULL, -- 사용자 아이디
    NOTIFC_MSG           VARCHAR(4000) NOT NULL, -- 알림 메시지
    NOTIFC_LINK_URL      VARCHAR(512)  NULL,     -- 알림 링크 URL
    NOTIFC_TYPE_ID       VARCHAR(32)   NULL,     -- 알림 유형 아이디
    NOTIFC_RQTR_DIV_MTCD VARCHAR(64)   NULL,     -- 알림 요청자 구분 메타코드
    NOTIFC_RQTR_ID       VARCHAR(32)   NULL,     -- 알림 요청자 아이디
    NOTIFC_RQTR_NM       VARCHAR(128)  NULL,     -- 알림 요청자 명
    NOTIFC_REG_DT        TIMESTAMP(6)  NOT NULL  -- 알림 등록 일시
);

-- 사용자별알림
COMMENT ON TABLE tb_portal_notifc IS '사용자별알림';

-- 알림 아이디
COMMENT ON COLUMN tb_portal_notifc.NOTIFC_ID IS '알림 아이디';

-- 사용자 아이디
COMMENT ON COLUMN tb_portal_notifc.USER_ID IS '사용자 아이디';

-- 알림 메시지
COMMENT ON COLUMN tb_portal_notifc.NOTIFC_MSG IS '알림 메시지';

-- 알림 링크 URL
COMMENT ON COLUMN tb_portal_notifc.NOTIFC_LINK_URL IS '알림 링크 URL';

-- 알림 유형 아이디
COMMENT ON COLUMN tb_portal_notifc.NOTIFC_TYPE_ID IS '알림 유형 아이디';

-- 알림 요청자 구분 메타코드
COMMENT ON COLUMN tb_portal_notifc.NOTIFC_RQTR_DIV_MTCD IS '알림 요청자 구분 메타코드';

-- 알림 요청자 아이디
COMMENT ON COLUMN tb_portal_notifc.NOTIFC_RQTR_ID IS '알림 요청자 아이디';

-- 알림 요청자 명
COMMENT ON COLUMN tb_portal_notifc.NOTIFC_RQTR_NM IS '알림 요청자 명';

-- 알림 등록 일시
COMMENT ON COLUMN tb_portal_notifc.NOTIFC_REG_DT IS '알림 등록 일시';

-- 사용자별알림 기본키
CREATE UNIQUE INDEX pk_tb_portal_notifc
    ON tb_portal_notifc
        ( -- 사용자별알림
         NOTIFC_ID ASC NULLS LAST -- 알림 아이디
            );

-- 사용자별알림 기본키
COMMENT ON INDEX pk_tb_portal_notifc IS '사용자별알림 기본키';

-- 사용자별알림
ALTER TABLE tb_portal_notifc
    ADD CONSTRAINT pk_tb_portal_notifc
        -- 사용자별알림 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_notifc
    NOT DEFERRABLE;

-- 사용자별알림 기본키
COMMENT ON CONSTRAINT pk_tb_portal_notifc ON tb_portal_notifc IS '사용자별알림 기본키';

-- 대리인(사용안함)
CREATE TABLE tb_meta_agent
(
    AGNT_ID               VARCHAR(32)   NOT NULL, -- 대리인 아이디
    AGNT_NM               VARCHAR(128)  NOT NULL, -- 대리인 명
    AGNT_MODEL_ID         VARCHAR(64)   NULL,     -- 대리인 모델 아이디
    MEDATA_SET_STTUS_MTCD VARCHAR(64)   NOT NULL, -- 메타데이터셋 상태 메타코드
    AGNT_DESC             VARCHAR(1000) NULL,     -- 대리인 설명
    AGNT_ENG_NM           VARCHAR(128)  NULL,     -- 대리인 영문 명
    AGNT_ENG_DESC         VARCHAR(1000) NULL,     -- 대리인 영문 설명
    AGNT_TEL_NO           VARCHAR(30)   NULL,     -- 대리인 전화 번호
    AGNT_HPAGE            VARCHAR(512)  NULL,     -- 대리인 홈페이지
    AGNT_REGR_ID          VARCHAR(32)   NULL,     -- 대리인 등록자 아이디
    AGNT_REGR_NM          VARCHAR(128)  NULL,     -- 대리인 등록자 명
    AGNT_REG_DT           TIMESTAMP(6)  NULL,     -- 대리인 등록 일시
    AGNT_AMDR_ID          VARCHAR(32)   NULL,     -- 대리인 수정자 아이디
    AGNT_AMDR_NM          VARCHAR(128)  NULL,     -- 대리인 수정자 명
    AGNT_AMD_DT           TIMESTAMP(6)  NULL      -- 대리인 수정 일시
);

-- 대리인(사용안함)
COMMENT ON TABLE tb_meta_agent IS '대리인(사용안함)';

-- 대리인 아이디
COMMENT ON COLUMN tb_meta_agent.AGNT_ID IS '대리인 아이디';

-- 대리인 명
COMMENT ON COLUMN tb_meta_agent.AGNT_NM IS '대리인 명';

-- 대리인 모델 아이디
COMMENT ON COLUMN tb_meta_agent.AGNT_MODEL_ID IS '대리인 모델 아이디';

-- 메타데이터셋 상태 메타코드
COMMENT ON COLUMN tb_meta_agent.MEDATA_SET_STTUS_MTCD IS '메타데이터셋 상태 메타코드';

-- 대리인 설명
COMMENT ON COLUMN tb_meta_agent.AGNT_DESC IS '대리인 설명';

-- 대리인 영문 명
COMMENT ON COLUMN tb_meta_agent.AGNT_ENG_NM IS '대리인 영문 명';

-- 대리인 영문 설명
COMMENT ON COLUMN tb_meta_agent.AGNT_ENG_DESC IS '대리인 영문 설명';

-- 대리인 전화 번호
COMMENT ON COLUMN tb_meta_agent.AGNT_TEL_NO IS '대리인 전화 번호';

-- 대리인 홈페이지
COMMENT ON COLUMN tb_meta_agent.AGNT_HPAGE IS '대리인 홈페이지';

-- 대리인 등록자 아이디
COMMENT ON COLUMN tb_meta_agent.AGNT_REGR_ID IS '대리인 등록자 아이디';

-- 대리인 등록자 명
COMMENT ON COLUMN tb_meta_agent.AGNT_REGR_NM IS '대리인 등록자 명';

-- 대리인 등록 일시
COMMENT ON COLUMN tb_meta_agent.AGNT_REG_DT IS '대리인 등록 일시';

-- 대리인 수정자 아이디
COMMENT ON COLUMN tb_meta_agent.AGNT_AMDR_ID IS '대리인 수정자 아이디';

-- 대리인 수정자 명
COMMENT ON COLUMN tb_meta_agent.AGNT_AMDR_NM IS '대리인 수정자 명';

-- 대리인 수정 일시
COMMENT ON COLUMN tb_meta_agent.AGNT_AMD_DT IS '대리인 수정 일시';

-- 대리인(사용안함) 기본키
CREATE UNIQUE INDEX pk_tb_meta_agent
    ON tb_meta_agent
        ( -- 대리인(사용안함)
         AGNT_ID ASC NULLS LAST -- 대리인 아이디
            );

-- 대리인(사용안함) 기본키
COMMENT ON INDEX pk_tb_meta_agent IS '대리인(사용안함) 기본키';

-- 대리인(사용안함)
ALTER TABLE tb_meta_agent
    ADD CONSTRAINT pk_tb_meta_agent
        -- 대리인(사용안함) 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_agent
    NOT DEFERRABLE;

-- 대리인(사용안함) 기본키
COMMENT ON CONSTRAINT pk_tb_meta_agent ON tb_meta_agent IS '대리인(사용안함) 기본키';

-- 카테고리
CREATE TABLE tb_meta_category
(
    CTGRY_ID              VARCHAR(32)   NOT NULL, -- 카테고리 아이디
    UP_CTGRY_ID           VARCHAR(32)   NULL,     -- 상위 카테고리 아이디
    CTGRY_NM              VARCHAR(128)  NOT NULL, -- 카테고리 명
    CTGRY_RDF_CNCPT_NM    VARCHAR(128)  NOT NULL, -- 카테고리 RDF 개념 명
    CTGRY_DATA_STTUS_MTCD VARCHAR(64)   NOT NULL, -- 카테고리 데이터 상태 메타코드
    CTGRY_SORT_ODRG       NUMERIC(5,0)  NOT NULL, -- 카테고리 정렬 순서
    CTGRY_DESC            VARCHAR(1000) NULL,     -- 카테고리 설명
    CTGRY_ENG_NM          VARCHAR(128)  NULL,     -- 카테고리 영문 명
    CTGRY_ENG_DESC        VARCHAR(1000) NULL,     -- 카테고리 영문 설명
    CTGRY_MAPPG_CD        VARCHAR(32)   NULL,     -- 카테고리 매핑 코드
    CNTRY_CD              VARCHAR(2)    NULL,     -- 국가 코드
    CTGRY_TYPE_MTCD       VARCHAR(64)   NULL,     -- 카테고리 유형 메타코드
    CTGRY_REGR_ID         VARCHAR(32)   NULL,     -- 카테고리 등록자 아이디
    CTGRY_REGR_NM         VARCHAR(128)  NULL,     -- 카테고리 등록자 명
    CTGRY_REG_DT          TIMESTAMP(6)  NULL,     -- 카테고리 등록 일시
    CTGRY_AMDR_ID         VARCHAR(32)   NULL,     -- 카테고리 수정자 아이디
    CTGRY_AMD_DT          TIMESTAMP(6)  NULL,     -- 카테고리 수정 일시
    CTGRY_AMDR_NM         VARCHAR(128)  NULL      -- 카테고리 수정자 명
);

-- 카테고리
COMMENT ON TABLE tb_meta_category IS '카테고리';

-- 카테고리 아이디
COMMENT ON COLUMN tb_meta_category.CTGRY_ID IS '카테고리 아이디';

-- 상위 카테고리 아이디
COMMENT ON COLUMN tb_meta_category.UP_CTGRY_ID IS '상위 카테고리 아이디';

-- 카테고리 명
COMMENT ON COLUMN tb_meta_category.CTGRY_NM IS '카테고리 명';

-- 카테고리 RDF 개념 명
COMMENT ON COLUMN tb_meta_category.CTGRY_RDF_CNCPT_NM IS '카테고리 RDF 개념 명';

-- 카테고리 데이터 상태 메타코드
COMMENT ON COLUMN tb_meta_category.CTGRY_DATA_STTUS_MTCD IS '카테고리 데이터 상태 메타코드';

-- 카테고리 정렬 순서
COMMENT ON COLUMN tb_meta_category.CTGRY_SORT_ODRG IS '카테고리 정렬 순서';

-- 카테고리 설명
COMMENT ON COLUMN tb_meta_category.CTGRY_DESC IS '카테고리 설명';

-- 카테고리 영문 명
COMMENT ON COLUMN tb_meta_category.CTGRY_ENG_NM IS '카테고리 영문 명';

-- 카테고리 영문 설명
COMMENT ON COLUMN tb_meta_category.CTGRY_ENG_DESC IS '카테고리 영문 설명';

-- 카테고리 매핑 코드
COMMENT ON COLUMN tb_meta_category.CTGRY_MAPPG_CD IS '카테고리 매핑 코드';

-- 국가 코드
COMMENT ON COLUMN tb_meta_category.CNTRY_CD IS '국가 코드';

-- 카테고리 유형 메타코드
COMMENT ON COLUMN tb_meta_category.CTGRY_TYPE_MTCD IS '카테고리 유형 메타코드';

-- 카테고리 등록자 아이디
COMMENT ON COLUMN tb_meta_category.CTGRY_REGR_ID IS '카테고리 등록자 아이디';

-- 카테고리 등록자 명
COMMENT ON COLUMN tb_meta_category.CTGRY_REGR_NM IS '카테고리 등록자 명';

-- 카테고리 등록 일시
COMMENT ON COLUMN tb_meta_category.CTGRY_REG_DT IS '카테고리 등록 일시';

-- 카테고리 수정자 아이디
COMMENT ON COLUMN tb_meta_category.CTGRY_AMDR_ID IS '카테고리 수정자 아이디';

-- 카테고리 수정 일시
COMMENT ON COLUMN tb_meta_category.CTGRY_AMD_DT IS '카테고리 수정 일시';

-- 카테고리 수정자 명
COMMENT ON COLUMN tb_meta_category.CTGRY_AMDR_NM IS '카테고리 수정자 명';

-- 카테고리 기본키
CREATE UNIQUE INDEX pk_tb_meta_category
    ON tb_meta_category
        ( -- 카테고리
         CTGRY_ID ASC NULLS LAST -- 카테고리 아이디
            );

-- 카테고리 기본키
COMMENT ON INDEX pk_tb_meta_category IS '카테고리 기본키';

-- 카테고리 유니크 인덱스
CREATE UNIQUE INDEX uk_tb_meta_category
    ON tb_meta_category
        ( -- 카테고리
         CTGRY_RDF_CNCPT_NM ASC NULLS LAST -- 카테고리 RDF 개념 명
            );

-- 카테고리 유니크 인덱스
COMMENT ON INDEX uk_tb_meta_category IS '카테고리 유니크 인덱스';

-- 카테고리
ALTER TABLE tb_meta_category
    ADD CONSTRAINT pk_tb_meta_category
        -- 카테고리 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_category
    NOT DEFERRABLE;

-- 카테고리 기본키
COMMENT ON CONSTRAINT pk_tb_meta_category ON tb_meta_category IS '카테고리 기본키';

-- 카테고리
ALTER TABLE tb_meta_category
    ADD CONSTRAINT uk_tb_meta_category -- 카테고리 유니크 제약
        UNIQUE
    USING INDEX uk_tb_meta_category
    NOT DEFERRABLE;

-- 카테고리 유니크 제약
COMMENT ON CONSTRAINT uk_tb_meta_category ON tb_meta_category IS '카테고리 유니크 제약';

-- 메타데이터
CREATE TABLE tb_meta_data
(
    MEDATA_ID      VARCHAR(32) NOT NULL, -- 메타데이터 아이디
    MEDATA_SET_ID  VARCHAR(32) NOT NULL, -- 메타데이터셋 아이디
    PRPTY_ID       VARCHAR(64) NOT NULL, -- 프라퍼티 아이디
    VAL_MODEL_ID   VARCHAR(64) NOT NULL, -- 값 모델 아이디
    MODEL_PRPTY_ID VARCHAR(32) NULL,     -- 모델 프라퍼티 아이디
    LANG_MTCD      VARCHAR(64) NULL,     -- 언어 메타코드
    MEDATA_VAL     TEXT        NULL,     -- 메타데이터 값
    GEODATA_VAL    GEOMETRY    NULL      -- 지리데이터 값
);

-- 메타데이터
COMMENT ON TABLE tb_meta_data IS '메타데이터';

-- 메타데이터 아이디
COMMENT ON COLUMN tb_meta_data.MEDATA_ID IS '메타데이터 아이디';

-- 메타데이터셋 아이디
COMMENT ON COLUMN tb_meta_data.MEDATA_SET_ID IS '메타데이터셋 아이디';

-- 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_data.PRPTY_ID IS '프라퍼티 아이디';

-- 값 모델 아이디
COMMENT ON COLUMN tb_meta_data.VAL_MODEL_ID IS '값 모델 아이디';

-- 모델 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_data.MODEL_PRPTY_ID IS '모델 프라퍼티 아이디';

-- 언어 메타코드
COMMENT ON COLUMN tb_meta_data.LANG_MTCD IS '언어 메타코드';

-- 메타데이터 값
COMMENT ON COLUMN tb_meta_data.MEDATA_VAL IS '메타데이터 값';

-- 지리데이터 값
COMMENT ON COLUMN tb_meta_data.GEODATA_VAL IS '지리데이터 값';

-- 메타데이터 기본키
CREATE UNIQUE INDEX pk_tb_meta_data
    ON tb_meta_data
        ( -- 메타데이터
         MEDATA_ID ASC NULLS LAST -- 메타데이터 아이디
            );

-- 메타데이터 기본키
COMMENT ON INDEX pk_tb_meta_data IS '메타데이터 기본키';

-- 메타데이터
ALTER TABLE tb_meta_data
    ADD CONSTRAINT pk_tb_meta_data
        -- 메타데이터 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_data
    NOT DEFERRABLE;

-- 메타데이터 기본키
COMMENT ON CONSTRAINT pk_tb_meta_data ON tb_meta_data IS '메타데이터 기본키';

-- 메타데이터변경이력
CREATE TABLE tb_meta_datachghst
(
    MEDATA_CHG_HST_ID  VARCHAR(32)  NOT NULL, -- 메타데이터 변경 이력 아이디
    MEDATA_SET_ID      VARCHAR(32)  NOT NULL, -- 메타데이터셋 아이디
    PRPTY_ID           VARCHAR(64)  NOT NULL, -- 프라퍼티 아이디
    VAL_MODEL_ID       VARCHAR(64)  NOT NULL, -- 값 모델 아이디
    MEDATA_ID          VARCHAR(32)  NULL,     -- 메타데이터 아이디
    CHG_HST_DIV_MTCD   VARCHAR(64)  NOT NULL, -- 변경 이력 구분 메타코드
    CHG_AFTR_RVSN      INT4         NOT NULL, -- 변경 후 리비젼
    CHG_AFTR_LANG_MTCD VARCHAR(64)  NULL,     -- 변경 후 언어 메타코드
    CHG_AFTR_VAL       TEXT         NULL,     -- 변경 후 값
    CHG_AFTR_GEO_VAL   GEOMETRY     NULL,     -- 변경 후 지리 값
    CHG_HST_REGR_ID    VARCHAR(32)  NULL,     -- 변경 이력 등록자 아이디
    CHG_HST_REGR_NM    VARCHAR(128) NULL,     -- 변경 이력 등록자 명
    CHG_HST_REG_DT     TIMESTAMP(6) NOT NULL  -- 변경 이력 등록 일시
);

-- 메타데이터변경이력
COMMENT ON TABLE tb_meta_datachghst IS '메타데이터변경이력';

-- 메타데이터 변경 이력 아이디
COMMENT ON COLUMN tb_meta_datachghst.MEDATA_CHG_HST_ID IS '메타데이터 변경 이력 아이디';

-- 메타데이터셋 아이디
COMMENT ON COLUMN tb_meta_datachghst.MEDATA_SET_ID IS '메타데이터셋 아이디';

-- 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_datachghst.PRPTY_ID IS '프라퍼티 아이디';

-- 값 모델 아이디
COMMENT ON COLUMN tb_meta_datachghst.VAL_MODEL_ID IS '값 모델 아이디';

-- 메타데이터 아이디
COMMENT ON COLUMN tb_meta_datachghst.MEDATA_ID IS '메타데이터 아이디';

-- 변경 이력 구분 메타코드
COMMENT ON COLUMN tb_meta_datachghst.CHG_HST_DIV_MTCD IS '변경 이력 구분 메타코드';

-- 변경 후 리비젼
COMMENT ON COLUMN tb_meta_datachghst.CHG_AFTR_RVSN IS '변경 후 리비젼';

-- 변경 후 언어 메타코드
COMMENT ON COLUMN tb_meta_datachghst.CHG_AFTR_LANG_MTCD IS '변경 후 언어 메타코드';

-- 변경 후 값
COMMENT ON COLUMN tb_meta_datachghst.CHG_AFTR_VAL IS '변경 후 값';

-- 변경 후 지리 값
COMMENT ON COLUMN tb_meta_datachghst.CHG_AFTR_GEO_VAL IS '변경 후 지리 값';

-- 변경 이력 등록자 아이디
COMMENT ON COLUMN tb_meta_datachghst.CHG_HST_REGR_ID IS '변경 이력 등록자 아이디';

-- 변경 이력 등록자 명
COMMENT ON COLUMN tb_meta_datachghst.CHG_HST_REGR_NM IS '변경 이력 등록자 명';

-- 변경 이력 등록 일시
COMMENT ON COLUMN tb_meta_datachghst.CHG_HST_REG_DT IS '변경 이력 등록 일시';

-- 메타데이터변경이력 기본키
CREATE UNIQUE INDEX pk_tb_meta_datachghst
    ON tb_meta_datachghst
        ( -- 메타데이터변경이력
         MEDATA_CHG_HST_ID ASC NULLS LAST -- 메타데이터 변경 이력 아이디
            );

-- 메타데이터변경이력 기본키
COMMENT ON INDEX pk_tb_meta_datachghst IS '메타데이터변경이력 기본키';

-- 메타데이터변경이력 인덱스
CREATE INDEX ix_tb_meta_datachghst
    ON tb_meta_datachghst
        ( -- 메타데이터변경이력
         MEDATA_SET_ID ASC NULLS LAST, -- 메타데이터셋 아이디
         CHG_HST_REG_DT ASC NULLS LAST -- 변경 이력 등록 일시
            );

-- 메타데이터변경이력 인덱스
COMMENT ON INDEX ix_tb_meta_datachghst IS '메타데이터변경이력 인덱스';

-- 메타데이터변경이력
ALTER TABLE tb_meta_datachghst
    ADD CONSTRAINT pk_tb_meta_datachghst
        -- 메타데이터변경이력 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_datachghst
    NOT DEFERRABLE;

-- 메타데이터변경이력 기본키
COMMENT ON CONSTRAINT pk_tb_meta_datachghst ON tb_meta_datachghst IS '메타데이터변경이력 기본키';

-- 메타데이터셋
CREATE TABLE tb_meta_dataset
(
    MEDATA_SET_ID         VARCHAR(32)   NOT NULL, -- 메타데이터셋 아이디
    MODEL_ID              VARCHAR(64)   NOT NULL, -- 모델 아이디
    MEDATA_SET_NM         VARCHAR(128)  NOT NULL, -- 메타데이터셋 명
    MEDATA_SET_LOGIC_NM   VARCHAR(128)  NULL,     -- 메타데이터셋 논리 명
    MEDATA_SET_DESC       VARCHAR(1000) NULL,     -- 메타데이터셋 설명
    MEDATA_SET_STTUS_MTCD VARCHAR(64)   NOT NULL, -- 메타데이터셋 상태 메타코드
    MEDATA_SET_STTUS_WHY  VARCHAR(1000) NULL,     -- 메타데이터셋 상태 사유
    MEDATA_SET_NWST_RVSN  INT4          NOT NULL, -- 메타데이터셋 최신 리비젼
    MEDATA_SET_REGR_ID    VARCHAR(32)   NULL,     -- 메타데이터셋 등록자 아이디
    MEDATA_SET_REGR_NM    VARCHAR(128)  NULL,     -- 메타데이터셋 등록자 명
    MEDATA_SET_REG_DT     TIMESTAMP(6)  NOT NULL, -- 메타데이터셋 등록 일시
    MEDATA_SET_AMDR_ID    VARCHAR(32)   NULL,     -- 메타데이터셋 수정자 아이디
    MEDATA_SET_AMDR_NM    VARCHAR(128)  NULL,     -- 메타데이터셋 수정자 명
    MEDATA_SET_AMD_DT     TIMESTAMP(6)  NULL,     -- 메타데이터셋 수정 일시
    ID_SCHM_CNTRY_CD      VARCHAR(2)    NULL,     -- 식별체계 국가 코드
    ID_SCHM_TYPE          VARCHAR(32)   NULL,     -- 식별체계 유형
    ID_SCHM_CD            VARCHAR(32)   NULL,     -- 식별체계 코드
    ID_SCHM_CD2           VARCHAR(32)   NULL,     -- 식별체계 코드2
    ORIGIN_ID             VARCHAR(64)   NULL      -- 원본 아이디
);

-- 메타데이터셋
COMMENT ON TABLE tb_meta_dataset IS '메타데이터셋';

-- 메타데이터셋 아이디
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_ID IS '메타데이터셋 아이디';

-- 모델 아이디
COMMENT ON COLUMN tb_meta_dataset.MODEL_ID IS '모델 아이디';

-- 메타데이터셋 명
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_NM IS '메타데이터셋 명';

-- 메타데이터셋 논리 명
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_LOGIC_NM IS '메타데이터셋 논리 명';

-- 메타데이터셋 설명
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_DESC IS '메타데이터셋 설명';

-- 메타데이터셋 상태 메타코드
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_STTUS_MTCD IS '메타데이터셋 상태 메타코드';

-- 메타데이터셋 상태 사유
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_STTUS_WHY IS '메타데이터셋 상태 사유';

-- 메타데이터셋 최신 리비젼
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_NWST_RVSN IS '메타데이터셋 최신 리비젼';

-- 메타데이터셋 등록자 아이디
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_REGR_ID IS '메타데이터셋 등록자 아이디';

-- 메타데이터셋 등록자 명
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_REGR_NM IS '메타데이터셋 등록자 명';

-- 메타데이터셋 등록 일시
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_REG_DT IS '메타데이터셋 등록 일시';

-- 메타데이터셋 수정자 아이디
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_AMDR_ID IS '메타데이터셋 수정자 아이디';

-- 메타데이터셋 수정자 명
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_AMDR_NM IS '메타데이터셋 수정자 명';

-- 메타데이터셋 수정 일시
COMMENT ON COLUMN tb_meta_dataset.MEDATA_SET_AMD_DT IS '메타데이터셋 수정 일시';

-- 식별체계 국가 코드
COMMENT ON COLUMN tb_meta_dataset.ID_SCHM_CNTRY_CD IS '식별체계 국가 코드';

-- 식별체계 유형
COMMENT ON COLUMN tb_meta_dataset.ID_SCHM_TYPE IS '식별체계 유형';

-- 식별체계 코드
COMMENT ON COLUMN tb_meta_dataset.ID_SCHM_CD IS '식별체계 코드';

-- 식별체계 코드2
COMMENT ON COLUMN tb_meta_dataset.ID_SCHM_CD2 IS '식별체계 코드2';

-- 원본 아이디
COMMENT ON COLUMN tb_meta_dataset.ORIGIN_ID IS '원본 아이디';

-- 메타데이터셋 기본키
CREATE UNIQUE INDEX pk_tb_meta_dataset
    ON tb_meta_dataset
        ( -- 메타데이터셋
         MEDATA_SET_ID ASC NULLS LAST -- 메타데이터셋 아이디
            );

-- 메타데이터셋 기본키
COMMENT ON INDEX pk_tb_meta_dataset IS '메타데이터셋 기본키';

-- 메타데이터셋
ALTER TABLE tb_meta_dataset
    ADD CONSTRAINT pk_tb_meta_dataset
        -- 메타데이터셋 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_dataset
    NOT DEFERRABLE;

-- 메타데이터셋 기본키
COMMENT ON CONSTRAINT pk_tb_meta_dataset ON tb_meta_dataset IS '메타데이터셋 기본키';

-- 키워드
CREATE TABLE tb_meta_keyword
(
    KYWRD_NORM       VARCHAR(128) NOT NULL, -- 키워드 정규화
    KYWRD_DISP       VARCHAR(128) NOT NULL, -- 키워드 디스플레이
    KYWRD_INFLUX_TAG VARCHAR(128) NOT NULL, -- 키워드 influx 태그
    KYWRD_LANG_MTCD  VARCHAR(64)  NOT NULL, -- 키워드 언어 메타코드
    KYWRD_RECNT_DT   TIMESTAMP(6) NOT NULL, -- 키워드 최근 일시
    KYWRD_REG_DT     TIMESTAMP(6) NOT NULL  -- 키워드 등록 일시
);

-- 키워드
COMMENT ON TABLE tb_meta_keyword IS '키워드';

-- 키워드 정규화
COMMENT ON COLUMN tb_meta_keyword.KYWRD_NORM IS '키워드 정규화';

-- 키워드 디스플레이
COMMENT ON COLUMN tb_meta_keyword.KYWRD_DISP IS '키워드 디스플레이';

-- 키워드 influx 태그
COMMENT ON COLUMN tb_meta_keyword.KYWRD_INFLUX_TAG IS '키워드 influx 태그';

-- 키워드 언어 메타코드
COMMENT ON COLUMN tb_meta_keyword.KYWRD_LANG_MTCD IS '키워드 언어 메타코드';

-- 키워드 최근 일시
COMMENT ON COLUMN tb_meta_keyword.KYWRD_RECNT_DT IS '키워드 최근 일시';

-- 키워드 등록 일시
COMMENT ON COLUMN tb_meta_keyword.KYWRD_REG_DT IS '키워드 등록 일시';

-- 키워드 기본키
CREATE UNIQUE INDEX pk_tb_meta_keyword
    ON tb_meta_keyword
        ( -- 키워드
         KYWRD_NORM ASC NULLS LAST -- 키워드 정규화
            );

-- 키워드 기본키
COMMENT ON INDEX pk_tb_meta_keyword IS '키워드 기본키';

-- 키워드
ALTER TABLE tb_meta_keyword
    ADD CONSTRAINT pk_tb_meta_keyword
        -- 키워드 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_keyword
    NOT DEFERRABLE;

-- 키워드 기본키
COMMENT ON CONSTRAINT pk_tb_meta_keyword ON tb_meta_keyword IS '키워드 기본키';

-- 메타데이터모델
CREATE TABLE tb_meta_model
(
    MODEL_ID                 VARCHAR(64)   NOT NULL, -- 모델 아이디
    UP_MODEL_ID              VARCHAR(64)   NULL,     -- 상위 모델 아이디
    TYPE_MODEL_ID            VARCHAR(64)   NULL,     -- 유형 모델 아이디
    MODEL_NM                 VARCHAR(64)   NOT NULL, -- 모델 명
    MODEL_LOGIC_NM           VARCHAR(128)  NULL,     -- 모델 논리 명
    MODEL_DESC               VARCHAR(1000) NULL,     -- 모델 설명
    MODEL_DATA_STTUS_MTCD    VARCHAR(64)   NOT NULL, -- 모델 데이터 상태 메타코드
    MODEL_SORT_ODRG          NUMERIC(5,0)  NULL,     -- 모델 정렬 순서
    MODEL_TYPE_MTCD          VARCHAR(64)   NOT NULL, -- 모델 유형 메타코드
    ABSTRT_MODEL_YN          CHAR(1)       NOT NULL, -- 추상 모델 여부
    STRUCTD_MODEL_YN         CHAR(1)       NOT NULL, -- 정형 모델 여부
    STRUCTD_MODEL_SCHMA_MTCD VARCHAR(64)   NULL,     -- 정형 모델 스키마 메타코드
    MODEL_DATA_URI           VARCHAR(512)  NULL,     -- 모델 데이터 URI
    MODEL_DATA_ID_PFIX       VARCHAR(4)    NULL,     -- 모델 데이터 아이디 프리픽스
    DATA_TYPE_MTCD           VARCHAR(64)   NULL,     -- 데이터 유형 메타코드
    DATA_TYPE_VAL_EXAM       VARCHAR(1000) NULL,     -- 데이터 유형 값 예제
    MTCD_GRP_ID              VARCHAR(32)   NULL,     -- 메타코드그룹 아이디
    USE_LANG_MTCD            VARCHAR(64)   NULL,     -- 사용 언어 메타코드
    MODEL_REGR_ID            VARCHAR(32)   NULL,     -- 모델 등록자 아이디
    MODEL_REGR_NM            VARCHAR(128)  NULL,     -- 모델 등록자 명
    MODEL_REG_DT             TIMESTAMP(6)  NULL,     -- 모델 등록 일시
    MODEL_AMDR_ID            VARCHAR(32)   NULL,     -- 모델 수정자 아이디
    MODEL_AMDR_NM            VARCHAR(128)  NULL,     -- 모델 수정자 명
    MODEL_AMD_DT             TIMESTAMP(6)  NULL      -- 모델 수정 일시
);

-- 메타데이터모델
COMMENT ON TABLE tb_meta_model IS '메타데이터모델';

-- 모델 아이디
COMMENT ON COLUMN tb_meta_model.MODEL_ID IS '모델 아이디';

-- 상위 모델 아이디
COMMENT ON COLUMN tb_meta_model.UP_MODEL_ID IS '상위 모델 아이디';

-- 유형 모델 아이디
COMMENT ON COLUMN tb_meta_model.TYPE_MODEL_ID IS '유형 모델 아이디';

-- 모델 명
COMMENT ON COLUMN tb_meta_model.MODEL_NM IS '모델 명';

-- 모델 논리 명
COMMENT ON COLUMN tb_meta_model.MODEL_LOGIC_NM IS '모델 논리 명';

-- 모델 설명
COMMENT ON COLUMN tb_meta_model.MODEL_DESC IS '모델 설명';

-- 모델 데이터 상태 메타코드
COMMENT ON COLUMN tb_meta_model.MODEL_DATA_STTUS_MTCD IS '모델 데이터 상태 메타코드';

-- 모델 정렬 순서
COMMENT ON COLUMN tb_meta_model.MODEL_SORT_ODRG IS '모델 정렬 순서';

-- 모델 유형 메타코드
COMMENT ON COLUMN tb_meta_model.MODEL_TYPE_MTCD IS '모델 유형 메타코드';

-- 추상 모델 여부
COMMENT ON COLUMN tb_meta_model.ABSTRT_MODEL_YN IS '추상 모델 여부';

-- 정형 모델 여부
COMMENT ON COLUMN tb_meta_model.STRUCTD_MODEL_YN IS '정형 모델 여부';

-- 정형 모델 스키마 메타코드
COMMENT ON COLUMN tb_meta_model.STRUCTD_MODEL_SCHMA_MTCD IS '정형 모델 스키마 메타코드';

-- 모델 데이터 URI
COMMENT ON COLUMN tb_meta_model.MODEL_DATA_URI IS '모델 데이터 URI';

-- 모델 데이터 아이디 프리픽스
COMMENT ON COLUMN tb_meta_model.MODEL_DATA_ID_PFIX IS '모델 데이터 아이디 프리픽스';

-- 데이터 유형 메타코드
COMMENT ON COLUMN tb_meta_model.DATA_TYPE_MTCD IS '데이터 유형 메타코드';

-- 데이터 유형 값 예제
COMMENT ON COLUMN tb_meta_model.DATA_TYPE_VAL_EXAM IS '데이터 유형 값 예제';

-- 메타코드그룹 아이디
COMMENT ON COLUMN tb_meta_model.MTCD_GRP_ID IS '메타코드그룹 아이디';

-- 사용 언어 메타코드
COMMENT ON COLUMN tb_meta_model.USE_LANG_MTCD IS '사용 언어 메타코드';

-- 모델 등록자 아이디
COMMENT ON COLUMN tb_meta_model.MODEL_REGR_ID IS '모델 등록자 아이디';

-- 모델 등록자 명
COMMENT ON COLUMN tb_meta_model.MODEL_REGR_NM IS '모델 등록자 명';

-- 모델 등록 일시
COMMENT ON COLUMN tb_meta_model.MODEL_REG_DT IS '모델 등록 일시';

-- 모델 수정자 아이디
COMMENT ON COLUMN tb_meta_model.MODEL_AMDR_ID IS '모델 수정자 아이디';

-- 모델 수정자 명
COMMENT ON COLUMN tb_meta_model.MODEL_AMDR_NM IS '모델 수정자 명';

-- 모델 수정 일시
COMMENT ON COLUMN tb_meta_model.MODEL_AMD_DT IS '모델 수정 일시';

-- 메타데이터모델 기본키
CREATE UNIQUE INDEX pk_tb_meta_model
    ON tb_meta_model
        ( -- 메타데이터모델
         MODEL_ID ASC NULLS LAST -- 모델 아이디
            );

-- 메타데이터모델 기본키
COMMENT ON INDEX pk_tb_meta_model IS '메타데이터모델 기본키';

-- 메타데이터모델 유니크 인덱스
CREATE UNIQUE INDEX uk_tb_meta_model
    ON tb_meta_model
        ( -- 메타데이터모델
         MODEL_NM ASC NULLS LAST -- 모델 명
            );

-- 메타데이터모델 유니크 인덱스
COMMENT ON INDEX uk_tb_meta_model IS '메타데이터모델 유니크 인덱스';

-- 메타데이터모델
ALTER TABLE tb_meta_model
    ADD CONSTRAINT pk_tb_meta_model
        -- 메타데이터모델 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_model
    NOT DEFERRABLE;

-- 메타데이터모델 기본키
COMMENT ON CONSTRAINT pk_tb_meta_model ON tb_meta_model IS '메타데이터모델 기본키';

-- 메타데이터모델
ALTER TABLE tb_meta_model
    ADD CONSTRAINT uk_tb_meta_model -- 메타데이터모델 유니크 제약
        UNIQUE
    USING INDEX uk_tb_meta_model
    NOT DEFERRABLE;

-- 메타데이터모델 유니크 제약
COMMENT ON CONSTRAINT uk_tb_meta_model ON tb_meta_model IS '메타데이터모델 유니크 제약';

-- 메타데이터모델프라퍼티
CREATE TABLE tb_meta_modelproperty
(
    MODEL_PRPTY_ID        VARCHAR(32)   NOT NULL, -- 모델 프라퍼티 아이디
    MODEL_ID              VARCHAR(64)   NOT NULL, -- 모델 아이디
    PRPTY_ID              VARCHAR(64)   NOT NULL, -- 프라퍼티 아이디
    MODEL_PRPTY_MAND_MTCD VARCHAR(64)   NOT NULL, -- 모델 프라퍼티 필수 메타코드
    MODEL_PRPTY_SORT_ODRG NUMERIC(5,0)  NULL,     -- 모델 프라퍼티 정렬 순서
    MODEL_PRPTY_VAL_EXAM  VARCHAR(1000) NULL,     -- 모델 프라퍼티 값 예제
    TBL_COLN_MAPPG_NM     VARCHAR(128)  NULL,     -- 테이블 컬럼 매핑 명
    STD_MODEL_ID          VARCHAR(64)   NULL,     -- 표준 모델 아이디
    MODEL_PRPTY_DEL_YN    CHAR(1)       NOT NULL, -- 모델 프라퍼티 삭제 여부
    MODEL_PRPTY_DELR_ID   VARCHAR(32)   NULL,     -- 모델 프라퍼티 삭제자 아이디
    MODEL_PRPTY_DELR_NM   VARCHAR(128)  NULL,     -- 모델 프라퍼티 삭제자 명
    MODEL_PRPTY_DEL_DT    TIMESTAMP(6)  NULL,     -- 모델 프라퍼티 삭제 일시
    MODEL_PRPTY_DEL_WHY   VARCHAR(1000) NULL,     -- 모델 프라퍼티 삭제 사유
    MODEL_PRPTY_REGR_ID   VARCHAR(32)   NULL,     -- 모델 프라퍼티 등록자 아이디
    MODEL_PRPTY_REGR_NM   VARCHAR(128)  NULL,     -- 모델 프라퍼티 등록자 명
    MODEL_PRPTY_REG_DT    TIMESTAMP(6)  NULL,     -- 모델 프라퍼티 등록 일시
    MODEL_PRPTY_AMDR_ID   VARCHAR(32)   NULL,     -- 모델 프라퍼티 수정자 아이디
    MODEL_PRPTY_AMDR_NM   VARCHAR(128)  NULL,     -- 모델 프라퍼티 수정자 명
    MODEL_PRPTY_AMD_DT    TIMESTAMP(6)  NULL      -- 모델 프라퍼티 수정 일시
);

-- 메타데이터모델프라퍼티
COMMENT ON TABLE tb_meta_modelproperty IS '메타데이터모델프라퍼티';

-- 모델 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_ID IS '모델 프라퍼티 아이디';

-- 모델 아이디
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_ID IS '모델 아이디';

-- 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_modelproperty.PRPTY_ID IS '프라퍼티 아이디';

-- 모델 프라퍼티 필수 메타코드
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_MAND_MTCD IS '모델 프라퍼티 필수 메타코드';

-- 모델 프라퍼티 정렬 순서
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_SORT_ODRG IS '모델 프라퍼티 정렬 순서';

-- 모델 프라퍼티 값 예제
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_VAL_EXAM IS '모델 프라퍼티 값 예제';

-- 테이블 컬럼 매핑 명
COMMENT ON COLUMN tb_meta_modelproperty.TBL_COLN_MAPPG_NM IS '테이블 컬럼 매핑 명';

-- 표준 모델 아이디
COMMENT ON COLUMN tb_meta_modelproperty.STD_MODEL_ID IS '표준 모델 아이디';

-- 모델 프라퍼티 삭제 여부
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_DEL_YN IS '모델 프라퍼티 삭제 여부';

-- 모델 프라퍼티 삭제자 아이디
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_DELR_ID IS '모델 프라퍼티 삭제자 아이디';

-- 모델 프라퍼티 삭제자 명
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_DELR_NM IS '모델 프라퍼티 삭제자 명';

-- 모델 프라퍼티 삭제 일시
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_DEL_DT IS '모델 프라퍼티 삭제 일시';

-- 모델 프라퍼티 삭제 사유
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_DEL_WHY IS '모델 프라퍼티 삭제 사유';

-- 모델 프라퍼티 등록자 아이디
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_REGR_ID IS '모델 프라퍼티 등록자 아이디';

-- 모델 프라퍼티 등록자 명
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_REGR_NM IS '모델 프라퍼티 등록자 명';

-- 모델 프라퍼티 등록 일시
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_REG_DT IS '모델 프라퍼티 등록 일시';

-- 모델 프라퍼티 수정자 아이디
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_AMDR_ID IS '모델 프라퍼티 수정자 아이디';

-- 모델 프라퍼티 수정자 명
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_AMDR_NM IS '모델 프라퍼티 수정자 명';

-- 모델 프라퍼티 수정 일시
COMMENT ON COLUMN tb_meta_modelproperty.MODEL_PRPTY_AMD_DT IS '모델 프라퍼티 수정 일시';

-- 메타데이터모델프라퍼티 기본키
CREATE UNIQUE INDEX pk_tb_meta_modelproperty
    ON tb_meta_modelproperty
        ( -- 메타데이터모델프라퍼티
         MODEL_PRPTY_ID ASC NULLS LAST -- 모델 프라퍼티 아이디
            );

-- 메타데이터모델프라퍼티 기본키
COMMENT ON INDEX pk_tb_meta_modelproperty IS '메타데이터모델프라퍼티 기본키';

-- 메타데이터모델프라퍼티
ALTER TABLE tb_meta_modelproperty
    ADD CONSTRAINT pk_tb_meta_modelproperty
        -- 메타데이터모델프라퍼티 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_modelproperty
    NOT DEFERRABLE;

-- 메타데이터모델프라퍼티 기본키
COMMENT ON CONSTRAINT pk_tb_meta_modelproperty ON tb_meta_modelproperty IS '메타데이터모델프라퍼티 기본키';

-- 메타데이터프라퍼티
CREATE TABLE tb_meta_property
(
    PRPTY_ID              VARCHAR(64)   NOT NULL, -- 프라퍼티 아이디
    UP_PRPTY_ID           VARCHAR(64)   NULL,     -- 상위 프라퍼티 아이디
    PRPTY_NM              VARCHAR(64)   NOT NULL, -- 프라퍼티 명
    PRPTY_LOGIC_NM        VARCHAR(128)  NULL,     -- 프라퍼티 논리 명
    PRPTY_DESC            VARCHAR(1000) NULL,     -- 프라퍼티 설명
    PRPTY_DATA_STTUS_MTCD VARCHAR(64)   NOT NULL, -- 프라퍼티 데이터 상태 메타코드
    PRPTY_SORT_ODRG       NUMERIC(5,0)  NULL,     -- 프라퍼티 정렬 순서
    CNT_PRPTY_YN          CHAR(1)       NOT NULL, -- 개수 프라퍼티 여부
    CNT_MODEL_ID          VARCHAR(64)   NULL,     -- 개수 모델 아이디
    DATA_ARRAY_YN         CHAR(1)       NOT NULL, -- 데이터 배열 여부
    PRPTY_SCRN_INDC_YN    CHAR(1)       NOT NULL, -- 프라퍼티 화면 표시 여부
    PRPTY_REGR_ID         VARCHAR(32)   NULL,     -- 프라퍼티 등록자 아이디
    PRPTY_REGR_NM         VARCHAR(128)  NULL,     -- 프라퍼티 등록자 명
    PRPTY_REG_DT          TIMESTAMP(6)  NULL,     -- 프라퍼티 등록 일시
    PRPTY_AMDR_ID         VARCHAR(32)   NULL,     -- 프라퍼티 수정자 아이디
    PRPTY_AMDR_NM         VARCHAR(128)  NULL,     -- 프라퍼티 수정자 명
    PRPTY_AMD_DT          TIMESTAMP(6)  NULL      -- 프라퍼티 수정 일시
);

-- 메타데이터프라퍼티
COMMENT ON TABLE tb_meta_property IS '메타데이터프라퍼티';

-- 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_property.PRPTY_ID IS '프라퍼티 아이디';

-- 상위 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_property.UP_PRPTY_ID IS '상위 프라퍼티 아이디';

-- 프라퍼티 명
COMMENT ON COLUMN tb_meta_property.PRPTY_NM IS '프라퍼티 명';

-- 프라퍼티 논리 명
COMMENT ON COLUMN tb_meta_property.PRPTY_LOGIC_NM IS '프라퍼티 논리 명';

-- 프라퍼티 설명
COMMENT ON COLUMN tb_meta_property.PRPTY_DESC IS '프라퍼티 설명';

-- 프라퍼티 데이터 상태 메타코드
COMMENT ON COLUMN tb_meta_property.PRPTY_DATA_STTUS_MTCD IS '프라퍼티 데이터 상태 메타코드';

-- 프라퍼티 정렬 순서
COMMENT ON COLUMN tb_meta_property.PRPTY_SORT_ODRG IS '프라퍼티 정렬 순서';

-- 개수 프라퍼티 여부
COMMENT ON COLUMN tb_meta_property.CNT_PRPTY_YN IS '개수 프라퍼티 여부';

-- 개수 모델 아이디
COMMENT ON COLUMN tb_meta_property.CNT_MODEL_ID IS '개수 모델 아이디';

-- 데이터 배열 여부
COMMENT ON COLUMN tb_meta_property.DATA_ARRAY_YN IS '데이터 배열 여부';

-- 프라퍼티 화면 표시 여부
COMMENT ON COLUMN tb_meta_property.PRPTY_SCRN_INDC_YN IS '프라퍼티 화면 표시 여부';

-- 프라퍼티 등록자 아이디
COMMENT ON COLUMN tb_meta_property.PRPTY_REGR_ID IS '프라퍼티 등록자 아이디';

-- 프라퍼티 등록자 명
COMMENT ON COLUMN tb_meta_property.PRPTY_REGR_NM IS '프라퍼티 등록자 명';

-- 프라퍼티 등록 일시
COMMENT ON COLUMN tb_meta_property.PRPTY_REG_DT IS '프라퍼티 등록 일시';

-- 프라퍼티 수정자 아이디
COMMENT ON COLUMN tb_meta_property.PRPTY_AMDR_ID IS '프라퍼티 수정자 아이디';

-- 프라퍼티 수정자 명
COMMENT ON COLUMN tb_meta_property.PRPTY_AMDR_NM IS '프라퍼티 수정자 명';

-- 프라퍼티 수정 일시
COMMENT ON COLUMN tb_meta_property.PRPTY_AMD_DT IS '프라퍼티 수정 일시';

-- 메타데이터프라퍼티 기본키
CREATE UNIQUE INDEX pk_tb_meta_property
    ON tb_meta_property
        ( -- 메타데이터프라퍼티
         PRPTY_ID ASC NULLS LAST -- 프라퍼티 아이디
            );

-- 메타데이터프라퍼티 기본키
COMMENT ON INDEX pk_tb_meta_property IS '메타데이터프라퍼티 기본키';

-- 메타데이터프라퍼티 유니크 인덱스
CREATE UNIQUE INDEX uk_tb_meta_property
    ON tb_meta_property
        ( -- 메타데이터프라퍼티
         PRPTY_NM ASC NULLS LAST -- 프라퍼티 명
            );

-- 메타데이터프라퍼티 유니크 인덱스
COMMENT ON INDEX uk_tb_meta_property IS '메타데이터프라퍼티 유니크 인덱스';

-- 메타데이터프라퍼티
ALTER TABLE tb_meta_property
    ADD CONSTRAINT pk_tb_meta_property
        -- 메타데이터프라퍼티 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_property
    NOT DEFERRABLE;

-- 메타데이터프라퍼티 기본키
COMMENT ON CONSTRAINT pk_tb_meta_property ON tb_meta_property IS '메타데이터프라퍼티 기본키';

-- 메타데이터프라퍼티
ALTER TABLE tb_meta_property
    ADD CONSTRAINT uk_tb_meta_property -- 메타데이터프라퍼티 유니크 제약
        UNIQUE
    USING INDEX uk_tb_meta_property
    NOT DEFERRABLE;

-- 메타데이터프라퍼티 유니크 제약
COMMENT ON CONSTRAINT uk_tb_meta_property ON tb_meta_property IS '메타데이터프라퍼티 유니크 제약';

-- 메타데이터프라퍼티정의
CREATE TABLE tb_meta_propertydefine
(
    PRPTY_DEF_ID      VARCHAR(32)   NOT NULL, -- 프라퍼티 정의 아이디
    PRPTY_ID          VARCHAR(64)   NOT NULL, -- 프라퍼티 아이디
    DOMN_MODEL_ID     VARCHAR(64)   NOT NULL, -- 도메인 모델 아이디
    RANGE_MODEL_ID    VARCHAR(64)   NOT NULL, -- 범위 모델 아이디
    RANGE_MTCD_GRP_ID VARCHAR(32)   NULL,     -- 범위 메타코드그룹 아이디
    REF_PRPTY_ID      VARCHAR(64)   NULL,     -- 참조 프라퍼티 아이디
    PRPTY_DEF_CHG_YN  CHAR(1)       NOT NULL, -- 프라퍼티 정의 변경 여부
    PRPTY_DEF_CHGR_ID VARCHAR(32)   NULL,     -- 프라퍼티 정의 변경자 아이디
    PRPTY_DEF_CHGR_NM VARCHAR(128)  NULL,     -- 프라퍼티 정의 변경자 명
    PRPTY_DEF_CHG_DT  TIMESTAMP(6)  NULL,     -- 프라퍼티 정의 변경 일시
    PRPTY_DEF_CHG_WHY VARCHAR(1000) NULL,     -- 프라퍼티 정의 변경 사유
    PRPTY_DEF_REGR_ID VARCHAR(32)   NULL,     -- 프라퍼티 정의 등록자 아이디
    PRPTY_DEF_REGR_NM VARCHAR(128)  NULL,     -- 프라퍼티 정의 등록자 명
    PRPTY_DEF_REG_DT  TIMESTAMP(6)  NULL,     -- 프라퍼티 정의 등록 일시
    PRPTY_DEF_AMDR_ID VARCHAR(32)   NULL,     -- 프라퍼티 정의 수정자 아이디
    PRPTY_DEF_AMDR_NM VARCHAR(128)  NULL,     -- 프라퍼티 정의 수정자 명
    PRPTY_DEF_AMD_DT  TIMESTAMP(6)  NULL      -- 프라퍼티 정의 수정 일시
);

-- 메타데이터프라퍼티정의
COMMENT ON TABLE tb_meta_propertydefine IS '메타데이터프라퍼티정의';

-- 프라퍼티 정의 아이디
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_ID IS '프라퍼티 정의 아이디';

-- 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_ID IS '프라퍼티 아이디';

-- 도메인 모델 아이디
COMMENT ON COLUMN tb_meta_propertydefine.DOMN_MODEL_ID IS '도메인 모델 아이디';

-- 범위 모델 아이디
COMMENT ON COLUMN tb_meta_propertydefine.RANGE_MODEL_ID IS '범위 모델 아이디';

-- 범위 메타코드그룹 아이디
COMMENT ON COLUMN tb_meta_propertydefine.RANGE_MTCD_GRP_ID IS '범위 메타코드그룹 아이디';

-- 참조 프라퍼티 아이디
COMMENT ON COLUMN tb_meta_propertydefine.REF_PRPTY_ID IS '참조 프라퍼티 아이디';

-- 프라퍼티 정의 변경 여부
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_CHG_YN IS '프라퍼티 정의 변경 여부';

-- 프라퍼티 정의 변경자 아이디
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_CHGR_ID IS '프라퍼티 정의 변경자 아이디';

-- 프라퍼티 정의 변경자 명
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_CHGR_NM IS '프라퍼티 정의 변경자 명';

-- 프라퍼티 정의 변경 일시
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_CHG_DT IS '프라퍼티 정의 변경 일시';

-- 프라퍼티 정의 변경 사유
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_CHG_WHY IS '프라퍼티 정의 변경 사유';

-- 프라퍼티 정의 등록자 아이디
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_REGR_ID IS '프라퍼티 정의 등록자 아이디';

-- 프라퍼티 정의 등록자 명
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_REGR_NM IS '프라퍼티 정의 등록자 명';

-- 프라퍼티 정의 등록 일시
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_REG_DT IS '프라퍼티 정의 등록 일시';

-- 프라퍼티 정의 수정자 아이디
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_AMDR_ID IS '프라퍼티 정의 수정자 아이디';

-- 프라퍼티 정의 수정자 명
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_AMDR_NM IS '프라퍼티 정의 수정자 명';

-- 프라퍼티 정의 수정 일시
COMMENT ON COLUMN tb_meta_propertydefine.PRPTY_DEF_AMD_DT IS '프라퍼티 정의 수정 일시';

-- 메타데이터프라퍼티정의 기본키
CREATE UNIQUE INDEX pk_tb_meta_propertydefine
    ON tb_meta_propertydefine
        ( -- 메타데이터프라퍼티정의
         PRPTY_DEF_ID ASC NULLS LAST -- 프라퍼티 정의 아이디
            );

-- 메타데이터프라퍼티정의 기본키
COMMENT ON INDEX pk_tb_meta_propertydefine IS '메타데이터프라퍼티정의 기본키';

-- 메타데이터프라퍼티정의
ALTER TABLE tb_meta_propertydefine
    ADD CONSTRAINT pk_tb_meta_propertydefine
        -- 메타데이터프라퍼티정의 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_propertydefine
    NOT DEFERRABLE;

-- 메타데이터프라퍼티정의 기본키
COMMENT ON CONSTRAINT pk_tb_meta_propertydefine ON tb_meta_propertydefine IS '메타데이터프라퍼티정의 기본키';

-- RDF클래스
CREATE TABLE tb_rdf_class
(
    RDF_CLASS_ID       VARCHAR(32)   NOT NULL, -- RDF 클래스 아이디
    RDF_NMSP_ID        VARCHAR(32)   NOT NULL, -- RDF 네임스페이스 아이디
    RDF_CLASS_NM       VARCHAR(128)  NOT NULL, -- RDF 클래스 명
    RDF_CLASS_LOGIC_NM VARCHAR(128)  NULL,     -- RDF 클래스 논리 명
    RDF_CLASS_DESC     VARCHAR(1000) NULL,     -- RDF 클래스 설명
    RDF_FORM_MTCDS     VARCHAR(1000) NULL,     -- RDF 형식 메타코드들
    UP_RDF_CLASS_ID    VARCHAR(32)   NULL,     -- 상위 RDF 클래스 아이디
    RDF_CLASS_REGR_ID  VARCHAR(32)   NULL,     -- RDF 클래스 등록자 아이디
    RDF_CLASS_REGR_NM  VARCHAR(128)  NULL,     -- RDF 클래스 등록자 명
    RDF_CLASS_REG_DT   TIMESTAMP(6)  NULL,     -- RDF 클래스 등록 일시
    RDF_CLASS_AMDR_ID  VARCHAR(32)   NULL,     -- RDF 클래스 수정자 아이디
    RDF_CLASS_AMDR_NM  VARCHAR(128)  NULL,     -- RDF 클래스 수정자 명
    RDF_CLASS_AMD_DT   TIMESTAMP(6)  NULL      -- RDF 클래스 수정 일시
);

-- RDF클래스
COMMENT ON TABLE tb_rdf_class IS 'RDF클래스';

-- RDF 클래스 아이디
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_ID IS 'RDF 클래스 아이디';

-- RDF 네임스페이스 아이디
COMMENT ON COLUMN tb_rdf_class.RDF_NMSP_ID IS 'RDF 네임스페이스 아이디';

-- RDF 클래스 명
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_NM IS 'RDF 클래스 명';

-- RDF 클래스 논리 명
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_LOGIC_NM IS 'RDF 클래스 논리 명';

-- RDF 클래스 설명
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_DESC IS 'RDF 클래스 설명';

-- RDF 형식 메타코드들
COMMENT ON COLUMN tb_rdf_class.RDF_FORM_MTCDS IS 'RDF 형식 메타코드들';

-- 상위 RDF 클래스 아이디
COMMENT ON COLUMN tb_rdf_class.UP_RDF_CLASS_ID IS '상위 RDF 클래스 아이디';

-- RDF 클래스 등록자 아이디
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_REGR_ID IS 'RDF 클래스 등록자 아이디';

-- RDF 클래스 등록자 명
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_REGR_NM IS 'RDF 클래스 등록자 명';

-- RDF 클래스 등록 일시
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_REG_DT IS 'RDF 클래스 등록 일시';

-- RDF 클래스 수정자 아이디
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_AMDR_ID IS 'RDF 클래스 수정자 아이디';

-- RDF 클래스 수정자 명
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_AMDR_NM IS 'RDF 클래스 수정자 명';

-- RDF 클래스 수정 일시
COMMENT ON COLUMN tb_rdf_class.RDF_CLASS_AMD_DT IS 'RDF 클래스 수정 일시';

-- RDF클래스 기본키
CREATE UNIQUE INDEX pk_tb_rdf_class
    ON tb_rdf_class
        ( -- RDF클래스
         RDF_CLASS_ID ASC NULLS LAST -- RDF 클래스 아이디
            );

-- RDF클래스 기본키
COMMENT ON INDEX pk_tb_rdf_class IS 'RDF클래스 기본키';

-- RDF클래스 유니크 인덱스
CREATE UNIQUE INDEX uk_tb_rdf_class
    ON tb_rdf_class
        ( -- RDF클래스
         RDF_NMSP_ID ASC NULLS LAST, -- RDF 네임스페이스 아이디
         RDF_CLASS_NM ASC NULLS LAST -- RDF 클래스 명
            );

-- RDF클래스 유니크 인덱스
COMMENT ON INDEX uk_tb_rdf_class IS 'RDF클래스 유니크 인덱스';

-- RDF클래스
ALTER TABLE tb_rdf_class
    ADD CONSTRAINT pk_tb_rdf_class
        -- RDF클래스 기본키
        PRIMARY KEY
    USING INDEX pk_tb_rdf_class
    NOT DEFERRABLE;

-- RDF클래스 기본키
COMMENT ON CONSTRAINT pk_tb_rdf_class ON tb_rdf_class IS 'RDF클래스 기본키';

-- RDF클래스
ALTER TABLE tb_rdf_class
    ADD CONSTRAINT uk_tb_rdf_class -- RDF클래스 유니크 제약
        UNIQUE
    USING INDEX uk_tb_rdf_class
    NOT DEFERRABLE;

-- RDF클래스 유니크 제약
COMMENT ON CONSTRAINT uk_tb_rdf_class ON tb_rdf_class IS 'RDF클래스 유니크 제약';

-- RDF매핑
CREATE TABLE tb_rdf_mapping
(
    RDF_MAPPG_ID              VARCHAR(32)  NOT NULL, -- RDF 매핑 아이디
    RDF_FORM_MTCD             VARCHAR(64)  NOT NULL, -- RDF 형식 메타코드
    TYPE_MODEL_ID             VARCHAR(64)  NOT NULL, -- 유형 모델 아이디
    RDF_MAPPG_NM              VARCHAR(128) NULL,     -- RDF 매핑 명
    RDF_MAPPG_DATA_STTUS_MTCD VARCHAR(64)  NOT NULL, -- RDF 매핑 데이터 상태 메타코드
    RDF_MAPPG_REGR_ID         VARCHAR(32)  NULL,     -- RDF 매핑 등록자 아이디
    RDF_MAPPG_REGR_NM         VARCHAR(128) NULL,     -- RDF 매핑 등록자 명
    RDF_MAPPG_REG_DT          TIMESTAMP(6) NULL,     -- RDF 매핑 등록 일시
    RDF_MAPPG_AMDR_ID         VARCHAR(32)  NULL,     -- RDF 매핑 수정자 아이디
    RDF_MAPPG_AMDR_NM         VARCHAR(128) NULL,     -- RDF 매핑 수정자 명
    RDF_MAPPG_AMD_DT          TIMESTAMP(6) NULL      -- RDF 매핑 수정 일시
);

-- RDF매핑
COMMENT ON TABLE tb_rdf_mapping IS 'RDF매핑';

-- RDF 매핑 아이디
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_ID IS 'RDF 매핑 아이디';

-- RDF 형식 메타코드
COMMENT ON COLUMN tb_rdf_mapping.RDF_FORM_MTCD IS 'RDF 형식 메타코드';

-- 유형 모델 아이디
COMMENT ON COLUMN tb_rdf_mapping.TYPE_MODEL_ID IS '유형 모델 아이디';

-- RDF 매핑 명
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_NM IS 'RDF 매핑 명';

-- RDF 매핑 데이터 상태 메타코드
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_DATA_STTUS_MTCD IS 'RDF 매핑 데이터 상태 메타코드';

-- RDF 매핑 등록자 아이디
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_REGR_ID IS 'RDF 매핑 등록자 아이디';

-- RDF 매핑 등록자 명
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_REGR_NM IS 'RDF 매핑 등록자 명';

-- RDF 매핑 등록 일시
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_REG_DT IS 'RDF 매핑 등록 일시';

-- RDF 매핑 수정자 아이디
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_AMDR_ID IS 'RDF 매핑 수정자 아이디';

-- RDF 매핑 수정자 명
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_AMDR_NM IS 'RDF 매핑 수정자 명';

-- RDF 매핑 수정 일시
COMMENT ON COLUMN tb_rdf_mapping.RDF_MAPPG_AMD_DT IS 'RDF 매핑 수정 일시';

-- RDF매핑 기본키
CREATE UNIQUE INDEX pk_tb_rdf_mapping
    ON tb_rdf_mapping
        ( -- RDF매핑
         RDF_MAPPG_ID ASC NULLS LAST -- RDF 매핑 아이디
            );

-- RDF매핑 기본키
COMMENT ON INDEX pk_tb_rdf_mapping IS 'RDF매핑 기본키';

-- RDF매핑
ALTER TABLE tb_rdf_mapping
    ADD CONSTRAINT pk_tb_rdf_mapping
        -- RDF매핑 기본키
        PRIMARY KEY
    USING INDEX pk_tb_rdf_mapping
    NOT DEFERRABLE;

-- RDF매핑 기본키
COMMENT ON CONSTRAINT pk_tb_rdf_mapping ON tb_rdf_mapping IS 'RDF매핑 기본키';

-- RDF매핑모델
CREATE TABLE tb_rdf_mappingmodel
(
    RDF_MAPPG_MODEL_ID      VARCHAR(32)  NOT NULL, -- RDF 매핑 모델 아이디
    RDF_MAPPG_ID            VARCHAR(32)  NOT NULL, -- RDF 매핑 아이디
    RDF_CLASS_ID            VARCHAR(32)  NOT NULL, -- RDF 클래스 아이디
    RDF_REP_MODEL_YN        CHAR(1)      NOT NULL, -- RDF 대표 모델 여부
    RDF_COND_ODRG           NUMERIC(5,0) NOT NULL, -- RDF 조건 순서
    COND_MODEL_ID           VARCHAR(64)  NULL,     -- 조건 모델 아이디
    RDF_MAPPG_MODEL_REGR_ID VARCHAR(32)  NULL,     -- RDF 매핑 모델 등록자 아이디
    RDF_MAPPG_MODEL_REGR_NM VARCHAR(128) NULL,     -- RDF 매핑 모델 등록자 명
    RDF_MAPPG_MODEL_REG_DT  TIMESTAMP(6) NULL,     -- RDF 매핑 모델 등록 일시
    RDF_MAPPG_MODEL_AMDR_ID VARCHAR(32)  NULL,     -- RDF 매핑 모델 수정자 아이디
    RDF_MAPPG_MODEL_AMDR_NM VARCHAR(128) NULL,     -- RDF 매핑 모델 수정자 명
    RDF_MAPPG_MODEL_AMD_DT  TIMESTAMP(6) NULL      -- RDF 매핑 모델 수정 일시
);

-- RDF매핑모델
COMMENT ON TABLE tb_rdf_mappingmodel IS 'RDF매핑모델';

-- RDF 매핑 모델 아이디
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_MAPPG_MODEL_ID IS 'RDF 매핑 모델 아이디';

-- RDF 매핑 아이디
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_MAPPG_ID IS 'RDF 매핑 아이디';

-- RDF 클래스 아이디
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_CLASS_ID IS 'RDF 클래스 아이디';

-- RDF 대표 모델 여부
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_REP_MODEL_YN IS 'RDF 대표 모델 여부';

-- RDF 조건 순서
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_COND_ODRG IS 'RDF 조건 순서';

-- 조건 모델 아이디
COMMENT ON COLUMN tb_rdf_mappingmodel.COND_MODEL_ID IS '조건 모델 아이디';

-- RDF 매핑 모델 등록자 아이디
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_MAPPG_MODEL_REGR_ID IS 'RDF 매핑 모델 등록자 아이디';

-- RDF 매핑 모델 등록자 명
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_MAPPG_MODEL_REGR_NM IS 'RDF 매핑 모델 등록자 명';

-- RDF 매핑 모델 등록 일시
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_MAPPG_MODEL_REG_DT IS 'RDF 매핑 모델 등록 일시';

-- RDF 매핑 모델 수정자 아이디
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_MAPPG_MODEL_AMDR_ID IS 'RDF 매핑 모델 수정자 아이디';

-- RDF 매핑 모델 수정자 명
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_MAPPG_MODEL_AMDR_NM IS 'RDF 매핑 모델 수정자 명';

-- RDF 매핑 모델 수정 일시
COMMENT ON COLUMN tb_rdf_mappingmodel.RDF_MAPPG_MODEL_AMD_DT IS 'RDF 매핑 모델 수정 일시';

-- RDF매핑모델 기본키
CREATE UNIQUE INDEX pk_tb_rdf_mappingmodel
    ON tb_rdf_mappingmodel
        ( -- RDF매핑모델
         RDF_MAPPG_MODEL_ID ASC NULLS LAST -- RDF 매핑 모델 아이디
            );

-- RDF매핑모델 기본키
COMMENT ON INDEX pk_tb_rdf_mappingmodel IS 'RDF매핑모델 기본키';

-- RDF매핑모델
ALTER TABLE tb_rdf_mappingmodel
    ADD CONSTRAINT pk_tb_rdf_mappingmodel
        -- RDF매핑모델 기본키
        PRIMARY KEY
    USING INDEX pk_tb_rdf_mappingmodel
    NOT DEFERRABLE;

-- RDF매핑모델 기본키
COMMENT ON CONSTRAINT pk_tb_rdf_mappingmodel ON tb_rdf_mappingmodel IS 'RDF매핑모델 기본키';

-- RDF매핑규칙
CREATE TABLE tb_rdf_mappingrule
(
    RDF_MAPPG_RULE_ID     VARCHAR(32)  NOT NULL, -- RDF 매핑 규칙 아이디
    RDF_MAPPG_MODEL_ID    VARCHAR(32)  NOT NULL, -- RDF 매핑 모델 아이디
    RDF_MAPPG_RULE_ODRG   NUMERIC(5,0) NOT NULL, -- RDF 매핑 규칙 순서
    UP_RDF_MAPPG_RULE_ID  VARCHAR(32)  NOT NULL, -- 상위 RDF 매핑 규칙 아이디
    RDF_PRPTY_ID          VARCHAR(32)  NOT NULL, -- RDF 프라퍼티 아이디
    OBJT_DATA_MAPPG_YN    CHAR(1)      NOT NULL, -- 목적어 데이터 매핑 여부
    OBJT_RDF_CLASS_ID     VARCHAR(32)  NULL,     -- 목적어 RDF 클래스 아이디
    OBJT_LITERAL_YN       CHAR(1)      NOT NULL, -- 목적어 리터럴 여부
    OBJT_PRPTY_ID         VARCHAR(64)  NULL,     -- 목적어 프라퍼티 아이디
    OBJT_RDF_MAPPG_ID     VARCHAR(32)  NULL,     -- 목적어 RDF 매핑 아이디
    RDF_MAPPG_RULE_REG_DT TIMESTAMP(6) NULL,     -- RDF 매핑 규칙 등록 일시
    RDF_MAPPG_RULE_AMD_DT TIMESTAMP(6) NULL      -- RDF 매핑 규칙 수정 일시
);

-- RDF매핑규칙
COMMENT ON TABLE tb_rdf_mappingrule IS 'RDF매핑규칙';

-- RDF 매핑 규칙 아이디
COMMENT ON COLUMN tb_rdf_mappingrule.RDF_MAPPG_RULE_ID IS 'RDF 매핑 규칙 아이디';

-- RDF 매핑 모델 아이디
COMMENT ON COLUMN tb_rdf_mappingrule.RDF_MAPPG_MODEL_ID IS 'RDF 매핑 모델 아이디';

-- RDF 매핑 규칙 순서
COMMENT ON COLUMN tb_rdf_mappingrule.RDF_MAPPG_RULE_ODRG IS 'RDF 매핑 규칙 순서';

-- 상위 RDF 매핑 규칙 아이디
COMMENT ON COLUMN tb_rdf_mappingrule.UP_RDF_MAPPG_RULE_ID IS '상위 RDF 매핑 규칙 아이디';

-- RDF 프라퍼티 아이디
COMMENT ON COLUMN tb_rdf_mappingrule.RDF_PRPTY_ID IS 'RDF 프라퍼티 아이디';

-- 목적어 데이터 매핑 여부
COMMENT ON COLUMN tb_rdf_mappingrule.OBJT_DATA_MAPPG_YN IS '목적어 데이터 매핑 여부';

-- 목적어 RDF 클래스 아이디
COMMENT ON COLUMN tb_rdf_mappingrule.OBJT_RDF_CLASS_ID IS '목적어 RDF 클래스 아이디';

-- 목적어 리터럴 여부
COMMENT ON COLUMN tb_rdf_mappingrule.OBJT_LITERAL_YN IS '목적어 리터럴 여부';

-- 목적어 프라퍼티 아이디
COMMENT ON COLUMN tb_rdf_mappingrule.OBJT_PRPTY_ID IS '목적어 프라퍼티 아이디';

-- 목적어 RDF 매핑 아이디
COMMENT ON COLUMN tb_rdf_mappingrule.OBJT_RDF_MAPPG_ID IS '목적어 RDF 매핑 아이디';

-- RDF 매핑 규칙 등록 일시
COMMENT ON COLUMN tb_rdf_mappingrule.RDF_MAPPG_RULE_REG_DT IS 'RDF 매핑 규칙 등록 일시';

-- RDF 매핑 규칙 수정 일시
COMMENT ON COLUMN tb_rdf_mappingrule.RDF_MAPPG_RULE_AMD_DT IS 'RDF 매핑 규칙 수정 일시';

-- RDF매핑규칙 기본키
CREATE UNIQUE INDEX pk_tb_rdf_mappingrule
    ON tb_rdf_mappingrule
        ( -- RDF매핑규칙
         RDF_MAPPG_RULE_ID ASC NULLS LAST -- RDF 매핑 규칙 아이디
            );

-- RDF매핑규칙 기본키
COMMENT ON INDEX pk_tb_rdf_mappingrule IS 'RDF매핑규칙 기본키';

-- RDF매핑규칙
ALTER TABLE tb_rdf_mappingrule
    ADD CONSTRAINT pk_tb_rdf_mappingrule
        -- RDF매핑규칙 기본키
        PRIMARY KEY
    USING INDEX pk_tb_rdf_mappingrule
    NOT DEFERRABLE;

-- RDF매핑규칙 기본키
COMMENT ON CONSTRAINT pk_tb_rdf_mappingrule ON tb_rdf_mappingrule IS 'RDF매핑규칙 기본키';

-- RDF네임스페이스
CREATE TABLE tb_rdf_namespace
(
    RDF_NMSP_ID        VARCHAR(32)  NOT NULL, -- RDF 네임스페이스 아이디
    RDF_NMSP_PFIX      VARCHAR(32)  NOT NULL, -- RDF 네임스페이스 프리픽스
    RDF_NMSP_URI       VARCHAR(512) NOT NULL, -- RDF 네임스페이스 URI
    RDF_NMSP_APLY_MTCD VARCHAR(64)  NULL,     -- RDF 네임스페이스 적용 메타코드
    RDF_NMSP_REGR_ID   VARCHAR(32)  NULL,     -- RDF 네임스페이스 등록자 아이디
    RDF_NMSP_REGR_NM   VARCHAR(128) NULL,     -- RDF 네임스페이스 등록자 명
    RDF_NMSP_REG_DT    TIMESTAMP(6) NULL,     -- RDF 네임스페이스 등록 일시
    RDF_NMSP_AMDR_ID   VARCHAR(32)  NULL,     -- RDF 네임스페이스 수정자 아이디
    RDF_NMSP_AMDR_NM   VARCHAR(128) NULL,     -- RDF 네임스페이스 수정자 명
    RDF_NMSP_AMD_DT    TIMESTAMP(6) NULL      -- RDF 네임스페이스 수정 일시
);

-- RDF네임스페이스
COMMENT ON TABLE tb_rdf_namespace IS 'RDF네임스페이스';

-- RDF 네임스페이스 아이디
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_ID IS 'RDF 네임스페이스 아이디';

-- RDF 네임스페이스 프리픽스
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_PFIX IS 'RDF 네임스페이스 프리픽스';

-- RDF 네임스페이스 URI
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_URI IS 'RDF 네임스페이스 URI';

-- RDF 네임스페이스 적용 메타코드
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_APLY_MTCD IS 'RDF 네임스페이스 적용 메타코드';

-- RDF 네임스페이스 등록자 아이디
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_REGR_ID IS 'RDF 네임스페이스 등록자 아이디';

-- RDF 네임스페이스 등록자 명
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_REGR_NM IS 'RDF 네임스페이스 등록자 명';

-- RDF 네임스페이스 등록 일시
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_REG_DT IS 'RDF 네임스페이스 등록 일시';

-- RDF 네임스페이스 수정자 아이디
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_AMDR_ID IS 'RDF 네임스페이스 수정자 아이디';

-- RDF 네임스페이스 수정자 명
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_AMDR_NM IS 'RDF 네임스페이스 수정자 명';

-- RDF 네임스페이스 수정 일시
COMMENT ON COLUMN tb_rdf_namespace.RDF_NMSP_AMD_DT IS 'RDF 네임스페이스 수정 일시';

-- RDF네임스페이스 기본키
CREATE UNIQUE INDEX pk_tb_rdf_namespace
    ON tb_rdf_namespace
        ( -- RDF네임스페이스
         RDF_NMSP_ID ASC NULLS LAST -- RDF 네임스페이스 아이디
            );

-- RDF네임스페이스 기본키
COMMENT ON INDEX pk_tb_rdf_namespace IS 'RDF네임스페이스 기본키';

-- RDF네임스페이스 유니크 인덱스
CREATE UNIQUE INDEX uk_tb_rdf_namespace
    ON tb_rdf_namespace
        ( -- RDF네임스페이스
         RDF_NMSP_PFIX ASC NULLS LAST -- RDF 네임스페이스 프리픽스
            );

-- RDF네임스페이스 유니크 인덱스
COMMENT ON INDEX uk_tb_rdf_namespace IS 'RDF네임스페이스 유니크 인덱스';

-- RDF네임스페이스 유니크 인덱스2
CREATE UNIQUE INDEX uk_tb_rdf_namespace2
    ON tb_rdf_namespace
        ( -- RDF네임스페이스
         RDF_NMSP_URI ASC NULLS LAST -- RDF 네임스페이스 URI
            );

-- RDF네임스페이스 유니크 인덱스2
COMMENT ON INDEX uk_tb_rdf_namespace2 IS 'RDF네임스페이스 유니크 인덱스2';

-- RDF네임스페이스
ALTER TABLE tb_rdf_namespace
    ADD CONSTRAINT pk_tb_rdf_namespace
        -- RDF네임스페이스 기본키
        PRIMARY KEY
    USING INDEX pk_tb_rdf_namespace
    NOT DEFERRABLE;

-- RDF네임스페이스 기본키
COMMENT ON CONSTRAINT pk_tb_rdf_namespace ON tb_rdf_namespace IS 'RDF네임스페이스 기본키';

-- RDF네임스페이스
ALTER TABLE tb_rdf_namespace
    ADD CONSTRAINT uk_tb_rdf_namespace -- RDF네임스페이스 유니크 제약
        UNIQUE
    USING INDEX uk_tb_rdf_namespace
    NOT DEFERRABLE;

-- RDF네임스페이스 유니크 제약
COMMENT ON CONSTRAINT uk_tb_rdf_namespace ON tb_rdf_namespace IS 'RDF네임스페이스 유니크 제약';

-- RDF네임스페이스
ALTER TABLE tb_rdf_namespace
    ADD CONSTRAINT uk_tb_rdf_namespace2 -- RDF네임스페이스 유니크 제약2
        UNIQUE
    USING INDEX uk_tb_rdf_namespace2
    NOT DEFERRABLE;

-- RDF네임스페이스 유니크 제약2
COMMENT ON CONSTRAINT uk_tb_rdf_namespace2 ON tb_rdf_namespace IS 'RDF네임스페이스 유니크 제약2';

-- RDF프라퍼티
CREATE TABLE tb_rdf_property
(
    RDF_PRPTY_ID       VARCHAR(32)   NOT NULL, -- RDF 프라퍼티 아이디
    RDF_NMSP_ID        VARCHAR(32)   NOT NULL, -- RDF 네임스페이스 아이디
    RDF_PRPTY_NM       VARCHAR(128)  NOT NULL, -- RDF 프라퍼티 명
    RDF_PRPTY_LOGIC_NM VARCHAR(128)  NULL,     -- RDF 프라퍼티 논리 명
    RDF_PRPTY_DESC     VARCHAR(1000) NULL,     -- RDF 프라퍼티 설명
    RDF_FORM_MTCDS     VARCHAR(1000) NULL,     -- RDF 형식 메타코드들
    UP_RDF_PRPTY_ID    VARCHAR(32)   NULL,     -- 상위 RDF 프라퍼티 아이디
    RDF_PRPTY_REGR_ID  VARCHAR(32)   NULL,     -- RDF 프라퍼티 등록자 아이디
    RDF_PRPTY_REGR_NM  VARCHAR(128)  NULL,     -- RDF 프라퍼티 등록자 명
    RDF_PRPTY_REG_DT   TIMESTAMP(6)  NULL,     -- RDF 프라퍼티 등록 일시
    RDF_PRPTY_AMDR_ID  VARCHAR(32)   NULL,     -- RDF 프라퍼티 수정자 아이디
    RDF_PRPTY_AMDR_NM  VARCHAR(128)  NULL,     -- RDF 프라퍼티 수정자 명
    RDF_PRPTY_AMD_DT   TIMESTAMP(6)  NULL      -- RDF 프라퍼티 수정 일시
);

-- RDF프라퍼티
COMMENT ON TABLE tb_rdf_property IS 'RDF프라퍼티';

-- RDF 프라퍼티 아이디
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_ID IS 'RDF 프라퍼티 아이디';

-- RDF 네임스페이스 아이디
COMMENT ON COLUMN tb_rdf_property.RDF_NMSP_ID IS 'RDF 네임스페이스 아이디';

-- RDF 프라퍼티 명
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_NM IS 'RDF 프라퍼티 명';

-- RDF 프라퍼티 논리 명
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_LOGIC_NM IS 'RDF 프라퍼티 논리 명';

-- RDF 프라퍼티 설명
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_DESC IS 'RDF 프라퍼티 설명';

-- RDF 형식 메타코드들
COMMENT ON COLUMN tb_rdf_property.RDF_FORM_MTCDS IS 'RDF 형식 메타코드들';

-- 상위 RDF 프라퍼티 아이디
COMMENT ON COLUMN tb_rdf_property.UP_RDF_PRPTY_ID IS '상위 RDF 프라퍼티 아이디';

-- RDF 프라퍼티 등록자 아이디
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_REGR_ID IS 'RDF 프라퍼티 등록자 아이디';

-- RDF 프라퍼티 등록자 명
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_REGR_NM IS 'RDF 프라퍼티 등록자 명';

-- RDF 프라퍼티 등록 일시
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_REG_DT IS 'RDF 프라퍼티 등록 일시';

-- RDF 프라퍼티 수정자 아이디
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_AMDR_ID IS 'RDF 프라퍼티 수정자 아이디';

-- RDF 프라퍼티 수정자 명
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_AMDR_NM IS 'RDF 프라퍼티 수정자 명';

-- RDF 프라퍼티 수정 일시
COMMENT ON COLUMN tb_rdf_property.RDF_PRPTY_AMD_DT IS 'RDF 프라퍼티 수정 일시';

-- RDF프라퍼티 기본키
CREATE UNIQUE INDEX pk_tb_rdf_property
    ON tb_rdf_property
        ( -- RDF프라퍼티
         RDF_PRPTY_ID ASC NULLS LAST -- RDF 프라퍼티 아이디
            );

-- RDF프라퍼티 기본키
COMMENT ON INDEX pk_tb_rdf_property IS 'RDF프라퍼티 기본키';

-- RDF프라퍼티 유니크 인덱스
CREATE UNIQUE INDEX uk_tb_rdf_property
    ON tb_rdf_property
        ( -- RDF프라퍼티
         RDF_NMSP_ID ASC NULLS LAST, -- RDF 네임스페이스 아이디
         RDF_PRPTY_NM ASC NULLS LAST -- RDF 프라퍼티 명
            );

-- RDF프라퍼티 유니크 인덱스
COMMENT ON INDEX uk_tb_rdf_property IS 'RDF프라퍼티 유니크 인덱스';

-- RDF프라퍼티
ALTER TABLE tb_rdf_property
    ADD CONSTRAINT pk_tb_rdf_property
        -- RDF프라퍼티 기본키
        PRIMARY KEY
    USING INDEX pk_tb_rdf_property
    NOT DEFERRABLE;

-- RDF프라퍼티 기본키
COMMENT ON CONSTRAINT pk_tb_rdf_property ON tb_rdf_property IS 'RDF프라퍼티 기본키';

-- RDF프라퍼티
ALTER TABLE tb_rdf_property
    ADD CONSTRAINT uk_tb_rdf_property -- RDF프라퍼티 유니크 제약
        UNIQUE
    USING INDEX uk_tb_rdf_property
    NOT DEFERRABLE;

-- RDF프라퍼티 유니크 제약
COMMENT ON CONSTRAINT uk_tb_rdf_property ON tb_rdf_property IS 'RDF프라퍼티 유니크 제약';

-- RDF프라퍼티정의
CREATE TABLE tb_rdf_propertydefine
(
    RDF_PRPTY_DEF_ID    VARCHAR(32)  NOT NULL, -- RDF 프라퍼티 정의 아이디
    RDF_PRPTY_ID        VARCHAR(32)  NOT NULL, -- RDF 프라퍼티 아이디
    DOMN_RANGE_DIV_MTCD VARCHAR(64)  NULL,     -- 도메인 범위 구분 메타코드
    RDF_PRPTY_DEF_ODRG  NUMERIC(5,0) NULL,     -- RDF 프라퍼티 정의 순서
    RDF_CLASS_ID        VARCHAR(32)  NULL      -- RDF 클래스 아이디
);

-- RDF프라퍼티정의
COMMENT ON TABLE tb_rdf_propertydefine IS 'RDF프라퍼티정의';

-- RDF 프라퍼티 정의 아이디
COMMENT ON COLUMN tb_rdf_propertydefine.RDF_PRPTY_DEF_ID IS 'RDF 프라퍼티 정의 아이디';

-- RDF 프라퍼티 아이디
COMMENT ON COLUMN tb_rdf_propertydefine.RDF_PRPTY_ID IS 'RDF 프라퍼티 아이디';

-- 도메인 범위 구분 메타코드
COMMENT ON COLUMN tb_rdf_propertydefine.DOMN_RANGE_DIV_MTCD IS '도메인 범위 구분 메타코드';

-- RDF 프라퍼티 정의 순서
COMMENT ON COLUMN tb_rdf_propertydefine.RDF_PRPTY_DEF_ODRG IS 'RDF 프라퍼티 정의 순서';

-- RDF 클래스 아이디
COMMENT ON COLUMN tb_rdf_propertydefine.RDF_CLASS_ID IS 'RDF 클래스 아이디';

-- RDF프라퍼티정의 기본키
CREATE UNIQUE INDEX pk_tb_rdf_propertydefine
    ON tb_rdf_propertydefine
        ( -- RDF프라퍼티정의
         RDF_PRPTY_DEF_ID ASC NULLS LAST -- RDF 프라퍼티 정의 아이디
            );

-- RDF프라퍼티정의 기본키
COMMENT ON INDEX pk_tb_rdf_propertydefine IS 'RDF프라퍼티정의 기본키';

-- RDF프라퍼티정의
ALTER TABLE tb_rdf_propertydefine
    ADD CONSTRAINT pk_tb_rdf_propertydefine
        -- RDF프라퍼티정의 기본키
        PRIMARY KEY
    USING INDEX pk_tb_rdf_propertydefine
    NOT DEFERRABLE;

-- RDF프라퍼티정의 기본키
COMMENT ON CONSTRAINT pk_tb_rdf_propertydefine ON tb_rdf_propertydefine IS 'RDF프라퍼티정의 기본키';

-- RDFTriple로그
CREATE TABLE tb_rdf_triplelog
(
    RDF_TRIPLE_LOG_ID VARCHAR(64)  NOT NULL, -- RDF 트리플 로그 아이디
    LOG_DT            TIMESTAMP(6) NULL,     -- 로그 일시
    SBJT_RI           VARCHAR(512) NULL,     -- 주어 자원
    PREDCT_RI         VARCHAR(512) NULL,     -- 술어 자원
    OBJT_RI           TEXT         NULL,     -- 목적어 자원
    LOG_DIV_MTCD      VARCHAR(64)  NULL,     -- 로그 구분 메타코드
    LOG_STORE_LO_NM   VARCHAR(128) NULL,     -- 로그 저장 위치 명
    LOG_REGR_ID       VARCHAR(32)  NULL      -- 로그 등록자 아이디
);

-- RDFTriple로그
COMMENT ON TABLE tb_rdf_triplelog IS 'RDFTriple로그';

-- RDF 트리플 로그 아이디
COMMENT ON COLUMN tb_rdf_triplelog.RDF_TRIPLE_LOG_ID IS 'RDF 트리플 로그 아이디';

-- 로그 일시
COMMENT ON COLUMN tb_rdf_triplelog.LOG_DT IS '로그 일시';

-- 주어 자원
COMMENT ON COLUMN tb_rdf_triplelog.SBJT_RI IS '주어 자원';

-- 술어 자원
COMMENT ON COLUMN tb_rdf_triplelog.PREDCT_RI IS '술어 자원';

-- 목적어 자원
COMMENT ON COLUMN tb_rdf_triplelog.OBJT_RI IS '목적어 자원';

-- 로그 구분 메타코드
COMMENT ON COLUMN tb_rdf_triplelog.LOG_DIV_MTCD IS '로그 구분 메타코드';

-- 로그 저장 위치 명
COMMENT ON COLUMN tb_rdf_triplelog.LOG_STORE_LO_NM IS '로그 저장 위치 명';

-- 로그 등록자 아이디
COMMENT ON COLUMN tb_rdf_triplelog.LOG_REGR_ID IS '로그 등록자 아이디';

-- RDFTriple로그 기본키
CREATE UNIQUE INDEX pk_tb_rdf_triplelog
    ON tb_rdf_triplelog
        ( -- RDFTriple로그
         RDF_TRIPLE_LOG_ID ASC NULLS LAST -- RDF 트리플 로그 아이디
            );

-- RDFTriple로그 기본키
COMMENT ON INDEX pk_tb_rdf_triplelog IS 'RDFTriple로그 기본키';

-- RDFTriple로그
ALTER TABLE tb_rdf_triplelog
    ADD CONSTRAINT pk_tb_rdf_triplelog
        -- RDFTriple로그 기본키
        PRIMARY KEY
    USING INDEX pk_tb_rdf_triplelog
    NOT DEFERRABLE;

-- RDFTriple로그 기본키
COMMENT ON CONSTRAINT pk_tb_rdf_triplelog ON tb_rdf_triplelog IS 'RDFTriple로그 기본키';

-- 메타데이터코드그룹
CREATE TABLE tb_portal_codegroup
(
    MTCD_GRP_ID         VARCHAR(32)   NOT NULL, -- 메타코드그룹 아이디
    MTCD_GRP_NM         VARCHAR(128)  NOT NULL, -- 메타코드그룹 명
    MTCD_GRP_USE_YN     CHAR(1)       NOT NULL, -- 메타코드그룹 사용 여부
    MTCD_GRP_DESC       VARCHAR(1000) NULL,     -- 메타코드그룹 설명
    UP_MTCD_GRP_ID      VARCHAR(32)   NULL,     -- 상위 메타코드그룹 아이디
    MTCD_GRP_SYS_USG_YN CHAR(1)       NOT NULL, -- 메타코드그룹 시스템 용 여부
    MTCD_GRP_REGR_ID    VARCHAR(32)   NULL,     -- 메타코드그룹 등록자 아이디
    MTCD_GRP_REGR_NM    VARCHAR(128)  NULL,     -- 메타코드그룹 등록자 명
    MTCD_GRP_REG_DT     TIMESTAMP(6)  NULL,     -- 메타코드그룹 등록 일시
    MTCD_GRP_AMDR_ID    VARCHAR(32)   NULL,     -- 메타코드그룹 수정자 아이디
    MTCD_GRP_AMDR_NM    VARCHAR(128)  NULL,     -- 메타코드그룹 수정자 명
    MTCD_GRP_AMD_DT     TIMESTAMP(6)  NULL      -- 메타코드그룹 수정 일시
);

-- 메타데이터코드그룹
COMMENT ON TABLE tb_portal_codegroup IS '메타데이터코드그룹';

-- 메타코드그룹 아이디
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_ID IS '메타코드그룹 아이디';

-- 메타코드그룹 명
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_NM IS '메타코드그룹 명';

-- 메타코드그룹 사용 여부
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_USE_YN IS '메타코드그룹 사용 여부';

-- 메타코드그룹 설명
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_DESC IS '메타코드그룹 설명';

-- 상위 메타코드그룹 아이디
COMMENT ON COLUMN tb_portal_codegroup.UP_MTCD_GRP_ID IS '상위 메타코드그룹 아이디';

-- 메타코드그룹 시스템 용 여부
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_SYS_USG_YN IS '메타코드그룹 시스템 용 여부';

-- 메타코드그룹 등록자 아이디
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_REGR_ID IS '메타코드그룹 등록자 아이디';

-- 메타코드그룹 등록자 명
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_REGR_NM IS '메타코드그룹 등록자 명';

-- 메타코드그룹 등록 일시
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_REG_DT IS '메타코드그룹 등록 일시';

-- 메타코드그룹 수정자 아이디
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_AMDR_ID IS '메타코드그룹 수정자 아이디';

-- 메타코드그룹 수정자 명
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_AMDR_NM IS '메타코드그룹 수정자 명';

-- 메타코드그룹 수정 일시
COMMENT ON COLUMN tb_portal_codegroup.MTCD_GRP_AMD_DT IS '메타코드그룹 수정 일시';

-- 메타데이터코드그룹 기본키
CREATE UNIQUE INDEX pk_tb_portal_codegroup
    ON tb_portal_codegroup
        ( -- 메타데이터코드그룹
         MTCD_GRP_ID ASC NULLS LAST -- 메타코드그룹 아이디
            );

-- 메타데이터코드그룹 기본키
COMMENT ON INDEX pk_tb_portal_codegroup IS '메타데이터코드그룹 기본키';

-- 메타데이터코드그룹
ALTER TABLE tb_portal_codegroup
    ADD CONSTRAINT pk_tb_portal_codegroup
        -- 메타데이터코드그룹 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_codegroup
    NOT DEFERRABLE;

-- 메타데이터코드그룹 기본키
COMMENT ON CONSTRAINT pk_tb_portal_codegroup ON tb_portal_codegroup IS '메타데이터코드그룹 기본키';

-- 메타데이터코드
CREATE TABLE tb_portal_code
(
    MTCD_GRP_ID    VARCHAR(32)   NOT NULL, -- 메타코드그룹 아이디
    MTCD           VARCHAR(64)   NOT NULL, -- 메타코드
    MTCD_NM        VARCHAR(128)  NOT NULL, -- 메타코드 명
    MTCD_USE_YN    CHAR(1)       NOT NULL, -- 메타코드 사용 여부
    MTCD_SORT_ODRG NUMERIC(5,0)  NULL,     -- 메타코드 정렬 순서
    MTCD_DESC      VARCHAR(1000) NULL,     -- 메타코드 설명
    UP_MTCD        VARCHAR(64)   NULL,     -- 상위 메타코드
    MTCD_REGR_ID   VARCHAR(32)   NULL,     -- 메타코드 등록자 아이디
    MTCD_REGR_NM   VARCHAR(128)  NULL,     -- 메타코드 등록자 명
    MTCD_REG_DT    TIMESTAMP(6)  NULL,     -- 메타코드 등록 일시
    MTCD_AMDR_ID   VARCHAR(32)   NULL,     -- 메타코드 수정자 아이디
    MTCD_AMDR_NM   VARCHAR(128)  NULL,     -- 메타코드 수정자 명
    MTCD_AMD_DT    TIMESTAMP(6)  NULL      -- 메타코드 수정 일시
);

-- 메타데이터코드
COMMENT ON TABLE tb_portal_code IS '메타데이터코드';

-- 메타코드그룹 아이디
COMMENT ON COLUMN tb_portal_code.MTCD_GRP_ID IS '메타코드그룹 아이디';

-- 메타코드
COMMENT ON COLUMN tb_portal_code.MTCD IS '메타코드';

-- 메타코드 명
COMMENT ON COLUMN tb_portal_code.MTCD_NM IS '메타코드 명';

-- 메타코드 사용 여부
COMMENT ON COLUMN tb_portal_code.MTCD_USE_YN IS '메타코드 사용 여부';

-- 메타코드 정렬 순서
COMMENT ON COLUMN tb_portal_code.MTCD_SORT_ODRG IS '메타코드 정렬 순서';

-- 메타코드 설명
COMMENT ON COLUMN tb_portal_code.MTCD_DESC IS '메타코드 설명';

-- 상위 메타코드
COMMENT ON COLUMN tb_portal_code.UP_MTCD IS '상위 메타코드';

-- 메타코드 등록자 아이디
COMMENT ON COLUMN tb_portal_code.MTCD_REGR_ID IS '메타코드 등록자 아이디';

-- 메타코드 등록자 명
COMMENT ON COLUMN tb_portal_code.MTCD_REGR_NM IS '메타코드 등록자 명';

-- 메타코드 등록 일시
COMMENT ON COLUMN tb_portal_code.MTCD_REG_DT IS '메타코드 등록 일시';

-- 메타코드 수정자 아이디
COMMENT ON COLUMN tb_portal_code.MTCD_AMDR_ID IS '메타코드 수정자 아이디';

-- 메타코드 수정자 명
COMMENT ON COLUMN tb_portal_code.MTCD_AMDR_NM IS '메타코드 수정자 명';

-- 메타코드 수정 일시
COMMENT ON COLUMN tb_portal_code.MTCD_AMD_DT IS '메타코드 수정 일시';

-- 메타데이터코드 기본키
CREATE UNIQUE INDEX pk_tb_portal_code
    ON tb_portal_code
        ( -- 메타데이터코드
         MTCD_GRP_ID ASC NULLS LAST, -- 메타코드그룹 아이디
         MTCD ASC NULLS LAST -- 메타코드
            );

-- 메타데이터코드 기본키
COMMENT ON INDEX pk_tb_portal_code IS '메타데이터코드 기본키';

-- 메타데이터코드
ALTER TABLE tb_portal_code
    ADD CONSTRAINT pk_tb_portal_code
        -- 메타데이터코드 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_code
    NOT DEFERRABLE;

-- 메타데이터코드 기본키
COMMENT ON CONSTRAINT pk_tb_portal_code ON tb_portal_code IS '메타데이터코드 기본키';

-- 사용자별알림설정
CREATE TABLE tb_portal_notifcsettings
(
    NOTIFC_SETUP_ID     VARCHAR(32)  NOT NULL, -- 알림 설정 아이디
    USER_ID             VARCHAR(32)  NOT NULL, -- 사용자 아이디
    NOTIFC_TYPE_ID      VARCHAR(32)  NULL,     -- 알림 유형 아이디
    NOTIFC_RCV_YN       CHAR(1)      NOT NULL, -- 알림 수신 여부
    NOTIFC_POPUP_YN     CHAR(1)      NOT NULL, -- 알림 팝업 여부
    NOTIFC_SETUP_REG_DT TIMESTAMP(6) NULL,     -- 알림 설정 등록 일시
    NOTIFC_SETUP_AMD_DT TIMESTAMP(6) NULL      -- 알림 설정 수정 일시
);

-- 사용자별알림설정
COMMENT ON TABLE tb_portal_notifcsettings IS '사용자별알림설정';

-- 알림 설정 아이디
COMMENT ON COLUMN tb_portal_notifcsettings.NOTIFC_SETUP_ID IS '알림 설정 아이디';

-- 사용자 아이디
COMMENT ON COLUMN tb_portal_notifcsettings.USER_ID IS '사용자 아이디';

-- 알림 유형 아이디
COMMENT ON COLUMN tb_portal_notifcsettings.NOTIFC_TYPE_ID IS '알림 유형 아이디';

-- 알림 수신 여부
COMMENT ON COLUMN tb_portal_notifcsettings.NOTIFC_RCV_YN IS '알림 수신 여부';

-- 알림 팝업 여부
COMMENT ON COLUMN tb_portal_notifcsettings.NOTIFC_POPUP_YN IS '알림 팝업 여부';

-- 알림 설정 등록 일시
COMMENT ON COLUMN tb_portal_notifcsettings.NOTIFC_SETUP_REG_DT IS '알림 설정 등록 일시';

-- 알림 설정 수정 일시
COMMENT ON COLUMN tb_portal_notifcsettings.NOTIFC_SETUP_AMD_DT IS '알림 설정 수정 일시';

-- 사용자별알림설정 기본키
CREATE UNIQUE INDEX pk_tb_portal_notifcsettings
    ON tb_portal_notifcsettings
        ( -- 사용자별알림설정
         NOTIFC_SETUP_ID ASC NULLS LAST -- 알림 설정 아이디
            );

-- 사용자별알림설정 기본키
COMMENT ON INDEX pk_tb_portal_notifcsettings IS '사용자별알림설정 기본키';

-- 사용자별알림설정
ALTER TABLE tb_portal_notifcsettings
    ADD CONSTRAINT pk_tb_portal_notifcsettings
        -- 사용자별알림설정 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_notifcsettings
    NOT DEFERRABLE;

-- 사용자별알림설정 기본키
COMMENT ON CONSTRAINT pk_tb_portal_notifcsettings ON tb_portal_notifcsettings IS '사용자별알림설정 기본키';

-- 알림유형
CREATE TABLE tb_portal_notifctype
(
    NOTIFC_TYPE_ID        VARCHAR(32)   NOT NULL, -- 알림 유형 아이디
    NOTIFC_TYPE_NM        VARCHAR(128)  NOT NULL, -- 알림 유형 명
    NOTIFC_USE_YN         CHAR(1)       NOT NULL, -- 알림 사용 여부
    NOTIFC_TYPE_DESC      VARCHAR(1000) NULL,     -- 알림 유형 설명
    NOTIFC_MSG_RSTRTN_LEN INT4          NOT NULL, -- 알림 메시지 제한 길이
    NOTIFC_MSG_TMPLT      VARCHAR(4000) NOT NULL, -- 알림 메시지 템플릿
    NOTIFC_LINK_TMPLT_URL VARCHAR(512)  NULL,     -- 알림 링크 템플릿 URL
    NOTIFC_TYPE_SORT_ODRG NUMERIC(5,0)  NULL,     -- 알림 유형 정렬 순서
    NOTIFC_TYPE_REGR_ID   VARCHAR(32)   NULL,     -- 알림 유형 등록자 아이디
    NOTIFC_TYPE_REGR_NM   VARCHAR(128)  NULL,     -- 알림 유형 등록자 명
    NOTIFC_TYPE_REG_DT    TIMESTAMP(6)  NULL,     -- 알림 유형 등록 일시
    NOTIFC_TYPE_AMDR_ID   VARCHAR(32)   NULL,     -- 알림 유형 수정자 아이디
    NOTIFC_TYPE_AMDR_NM   VARCHAR(128)  NULL,     -- 알림 유형 수정자 명
    NOTIFC_TYPE_AMD_DT    TIMESTAMP(6)  NULL      -- 알림 유형 수정 일시
);

-- 알림유형
COMMENT ON TABLE tb_portal_notifctype IS '알림유형';

-- 알림 유형 아이디
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_ID IS '알림 유형 아이디';

-- 알림 유형 명
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_NM IS '알림 유형 명';

-- 알림 사용 여부
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_USE_YN IS '알림 사용 여부';

-- 알림 유형 설명
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_DESC IS '알림 유형 설명';

-- 알림 메시지 제한 길이
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_MSG_RSTRTN_LEN IS '알림 메시지 제한 길이';

-- 알림 메시지 템플릿
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_MSG_TMPLT IS '알림 메시지 템플릿';

-- 알림 링크 템플릿 URL
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_LINK_TMPLT_URL IS '알림 링크 템플릿 URL';

-- 알림 유형 정렬 순서
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_SORT_ODRG IS '알림 유형 정렬 순서';

-- 알림 유형 등록자 아이디
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_REGR_ID IS '알림 유형 등록자 아이디';

-- 알림 유형 등록자 명
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_REGR_NM IS '알림 유형 등록자 명';

-- 알림 유형 등록 일시
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_REG_DT IS '알림 유형 등록 일시';

-- 알림 유형 수정자 아이디
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_AMDR_ID IS '알림 유형 수정자 아이디';

-- 알림 유형 수정자 명
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_AMDR_NM IS '알림 유형 수정자 명';

-- 알림 유형 수정 일시
COMMENT ON COLUMN tb_portal_notifctype.NOTIFC_TYPE_AMD_DT IS '알림 유형 수정 일시';

-- 알림유형 기본키
CREATE UNIQUE INDEX pk_tb_portal_notifctype
    ON tb_portal_notifctype
        ( -- 알림유형
         NOTIFC_TYPE_ID ASC NULLS LAST -- 알림 유형 아이디
            );

-- 알림유형 기본키
COMMENT ON INDEX pk_tb_portal_notifctype IS '알림유형 기본키';

-- 알림유형
ALTER TABLE tb_portal_notifctype
    ADD CONSTRAINT pk_tb_portal_notifctype
        -- 알림유형 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_notifctype
    NOT DEFERRABLE;

-- 알림유형 기본키
COMMENT ON CONSTRAINT pk_tb_portal_notifctype ON tb_portal_notifctype IS '알림유형 기본키';

-- 사용자별알림확인
CREATE TABLE tb_portal_notifcconfirmed
(
    NOTIFC_ID            VARCHAR(64)   NOT NULL, -- 알림 아이디
    USER_ID              VARCHAR(32)   NOT NULL, -- 사용자 아이디
    NOTIFC_MSG           VARCHAR(4000) NULL,     -- 알림 메시지
    NOTIFC_LINK_URL      VARCHAR(512)  NULL,     -- 알림 링크 URL
    NOTIFC_TYPE_ID       VARCHAR(32)   NULL,     -- 알림 유형 아이디
    NOTIFC_RQTR_DIV_MTCD VARCHAR(64)   NULL,     -- 알림 요청자 구분 메타코드
    NOTIFC_RQTR_ID       VARCHAR(32)   NULL,     -- 알림 요청자 아이디
    NOTIFC_RQTR_NM       VARCHAR(128)  NULL,     -- 알림 요청자 명
    NOTIFC_REG_DT        TIMESTAMP(6)  NOT NULL, -- 알림 등록 일시
    NOTIFC_CONF_DT       TIMESTAMP(6)  NOT NULL  -- 알림 확인 일시
);

-- 사용자별알림확인
COMMENT ON TABLE tb_portal_notifcconfirmed IS '사용자별알림확인';

-- 알림 아이디
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_ID IS '알림 아이디';

-- 사용자 아이디
COMMENT ON COLUMN tb_portal_notifcconfirmed.USER_ID IS '사용자 아이디';

-- 알림 메시지
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_MSG IS '알림 메시지';

-- 알림 링크 URL
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_LINK_URL IS '알림 링크 URL';

-- 알림 유형 아이디
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_TYPE_ID IS '알림 유형 아이디';

-- 알림 요청자 구분 메타코드
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_RQTR_DIV_MTCD IS '알림 요청자 구분 메타코드';

-- 알림 요청자 아이디
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_RQTR_ID IS '알림 요청자 아이디';

-- 알림 요청자 명
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_RQTR_NM IS '알림 요청자 명';

-- 알림 등록 일시
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_REG_DT IS '알림 등록 일시';

-- 알림 확인 일시
COMMENT ON COLUMN tb_portal_notifcconfirmed.NOTIFC_CONF_DT IS '알림 확인 일시';

-- 사용자별알림확인 기본키
CREATE UNIQUE INDEX pk_tb_portal_notifcconfirmed
    ON tb_portal_notifcconfirmed
        ( -- 사용자별알림확인
         NOTIFC_ID ASC NULLS LAST -- 알림 아이디
            );

-- 사용자별알림확인 기본키
COMMENT ON INDEX pk_tb_portal_notifcconfirmed IS '사용자별알림확인 기본키';

-- 사용자별알림확인
ALTER TABLE tb_portal_notifcconfirmed
    ADD CONSTRAINT pk_tb_portal_notifcconfirmed
        -- 사용자별알림확인 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_notifcconfirmed
    NOT DEFERRABLE;

-- 사용자별알림확인 기본키
COMMENT ON CONSTRAINT pk_tb_portal_notifcconfirmed ON tb_portal_notifcconfirmed IS '사용자별알림확인 기본키';

-- 알림대상
CREATE TABLE tb_portal_notifctarget
(
    NOTIFC_TGT_ID        VARCHAR(32)  NOT NULL, -- 알림 대상 아이디
    NOTIFC_TYPE_ID       VARCHAR(32)  NOT NULL, -- 알림 유형 아이디
    NOTIFC_TGT_TYPE_MTCD VARCHAR(64)  NOT NULL, -- 알림 대상 유형 메타코드
    NOTIFC_TGT_DIV_MTCD  VARCHAR(64)  NOT NULL, -- 알림 대상 구분 메타코드
    NOTIFC_TGTR_IDS      TEXT         NOT NULL, -- 알림 대상자 아이디S
    NOTIFC_TGTR_NMS      TEXT         NULL,     -- 알림 대상자 명S
    NOTIFC_TGT_REG_DT    TIMESTAMP(6) NULL,     -- 알림 대상 등록 일시
    NOTIFC_TGT_AMD_DT    TIMESTAMP(6) NULL      -- 알림 대상 수정 일시
);

-- 알림대상
COMMENT ON TABLE tb_portal_notifctarget IS '알림대상';

-- 알림 대상 아이디
COMMENT ON COLUMN tb_portal_notifctarget.NOTIFC_TGT_ID IS '알림 대상 아이디';

-- 알림 유형 아이디
COMMENT ON COLUMN tb_portal_notifctarget.NOTIFC_TYPE_ID IS '알림 유형 아이디';

-- 알림 대상 유형 메타코드
COMMENT ON COLUMN tb_portal_notifctarget.NOTIFC_TGT_TYPE_MTCD IS '알림 대상 유형 메타코드';

-- 알림 대상 구분 메타코드
COMMENT ON COLUMN tb_portal_notifctarget.NOTIFC_TGT_DIV_MTCD IS '알림 대상 구분 메타코드';

-- 알림 대상자 아이디S
COMMENT ON COLUMN tb_portal_notifctarget.NOTIFC_TGTR_IDS IS '알림 대상자 아이디S';

-- 알림 대상자 명S
COMMENT ON COLUMN tb_portal_notifctarget.NOTIFC_TGTR_NMS IS '알림 대상자 명S';

-- 알림 대상 등록 일시
COMMENT ON COLUMN tb_portal_notifctarget.NOTIFC_TGT_REG_DT IS '알림 대상 등록 일시';

-- 알림 대상 수정 일시
COMMENT ON COLUMN tb_portal_notifctarget.NOTIFC_TGT_AMD_DT IS '알림 대상 수정 일시';

-- 알림대상 기본키
CREATE UNIQUE INDEX pk_tb_portal_notifctarget
    ON tb_portal_notifctarget
        ( -- 알림대상
         NOTIFC_TGT_ID ASC NULLS LAST -- 알림 대상 아이디
            );

-- 알림대상 기본키
COMMENT ON INDEX pk_tb_portal_notifctarget IS '알림대상 기본키';

-- 알림대상
ALTER TABLE tb_portal_notifctarget
    ADD CONSTRAINT pk_tb_portal_notifctarget
        -- 알림대상 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_notifctarget
    NOT DEFERRABLE;

-- 알림대상 기본키
COMMENT ON CONSTRAINT pk_tb_portal_notifctarget ON tb_portal_notifctarget IS '알림대상 기본키';

-- 수집로그
CREATE TABLE tb_meta_collectionlog
(
    COLEC_LOG_ID      VARCHAR(64)  NOT NULL, -- 수집 로그 아이디
    COLEC_LOG_REGR_ID VARCHAR(32)  NULL,     -- 수집 로그 등록자 아이디
    COLEC_LOG_REGR_NM VARCHAR(128) NULL,     -- 수집 로그 등록자 명
    COLEC_LOG_REG_DT  TIMESTAMP(6) NOT NULL, -- 수집 로그 등록 일시
    COLEC_LOG_DATA    JSONB        NULL      -- 수집 로그 데이터
);

-- 수집로그
COMMENT ON TABLE tb_meta_collectionlog IS '수집로그';

-- 수집 로그 아이디
COMMENT ON COLUMN tb_meta_collectionlog.COLEC_LOG_ID IS '수집 로그 아이디';

-- 수집 로그 등록자 아이디
COMMENT ON COLUMN tb_meta_collectionlog.COLEC_LOG_REGR_ID IS '수집 로그 등록자 아이디';

-- 수집 로그 등록자 명
COMMENT ON COLUMN tb_meta_collectionlog.COLEC_LOG_REGR_NM IS '수집 로그 등록자 명';

-- 수집 로그 등록 일시
COMMENT ON COLUMN tb_meta_collectionlog.COLEC_LOG_REG_DT IS '수집 로그 등록 일시';

-- 수집 로그 데이터
COMMENT ON COLUMN tb_meta_collectionlog.COLEC_LOG_DATA IS '수집 로그 데이터';

-- 수집로그 기본키
CREATE UNIQUE INDEX pk_tb_meta_collectionlog
    ON tb_meta_collectionlog
        ( -- 수집로그
         COLEC_LOG_ID ASC NULLS LAST -- 수집 로그 아이디
            );

-- 수집로그 기본키
COMMENT ON INDEX pk_tb_meta_collectionlog IS '수집로그 기본키';

-- 수집로그
ALTER TABLE tb_meta_collectionlog
    ADD CONSTRAINT pk_tb_meta_collectionlog
        -- 수집로그 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_collectionlog
    NOT DEFERRABLE;

-- 수집로그 기본키
COMMENT ON CONSTRAINT pk_tb_meta_collectionlog ON tb_meta_collectionlog IS '수집로그 기본키';

-- 수집작업
CREATE TABLE tb_meta_collectionwork
(
    COLEC_WRK_ID            VARCHAR(64)   NOT NULL, -- 수집 작업 아이디
    COLEC_WRK_STTUS_MTCD    VARCHAR(64)   NOT NULL, -- 수집 작업 상태 메타코드
    COLEC_LOG_ID            VARCHAR(64)   NOT NULL, -- 수집 로그 아이디
    ROOT_MEDATA_SET_ID      VARCHAR(32)   NULL,     -- 루트 메타데이터셋 아이디
    CRET_MEDATA_SET_ID_LIST JSONB         NULL,     -- 생성 메타데이터셋 아이디 목록
    COLEC_WRK_MSG           VARCHAR(1000) NULL,     -- 수집 작업 메시지
    COLEC_WRK_REG_DT        TIMESTAMP(6)  NOT NULL, -- 수집 작업 등록 일시
    COLEC_WRK_AMD_DT        TIMESTAMP(6)  NULL      -- 수집 작업 수정 일시
);

-- 수집작업
COMMENT ON TABLE tb_meta_collectionwork IS '수집작업';

-- 수집 작업 아이디
COMMENT ON COLUMN tb_meta_collectionwork.COLEC_WRK_ID IS '수집 작업 아이디';

-- 수집 작업 상태 메타코드
COMMENT ON COLUMN tb_meta_collectionwork.COLEC_WRK_STTUS_MTCD IS '수집 작업 상태 메타코드';

-- 수집 로그 아이디
COMMENT ON COLUMN tb_meta_collectionwork.COLEC_LOG_ID IS '수집 로그 아이디';

-- 루트 메타데이터셋 아이디
COMMENT ON COLUMN tb_meta_collectionwork.ROOT_MEDATA_SET_ID IS '루트 메타데이터셋 아이디';

-- 생성 메타데이터셋 아이디 목록
COMMENT ON COLUMN tb_meta_collectionwork.CRET_MEDATA_SET_ID_LIST IS '생성 메타데이터셋 아이디 목록';

-- 수집 작업 메시지
COMMENT ON COLUMN tb_meta_collectionwork.COLEC_WRK_MSG IS '수집 작업 메시지';

-- 수집 작업 등록 일시
COMMENT ON COLUMN tb_meta_collectionwork.COLEC_WRK_REG_DT IS '수집 작업 등록 일시';

-- 수집 작업 수정 일시
COMMENT ON COLUMN tb_meta_collectionwork.COLEC_WRK_AMD_DT IS '수집 작업 수정 일시';

-- 수집작업 기본키
CREATE UNIQUE INDEX pk_tb_meta_collectionwork
    ON tb_meta_collectionwork
        ( -- 수집작업
         COLEC_WRK_ID ASC NULLS LAST -- 수집 작업 아이디
            );

-- 수집작업 기본키
COMMENT ON INDEX pk_tb_meta_collectionwork IS '수집작업 기본키';

-- 수집작업
ALTER TABLE tb_meta_collectionwork
    ADD CONSTRAINT pk_tb_meta_collectionwork
        -- 수집작업 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_collectionwork
    NOT DEFERRABLE;

-- 수집작업 기본키
COMMENT ON CONSTRAINT pk_tb_meta_collectionwork ON tb_meta_collectionwork IS '수집작업 기본키';

-- PAT
CREATE TABLE tb_portal_pat
(
    PATK_ID       VARCHAR(32)   NOT NULL, -- PAT 아이디
    TOKN_NM       VARCHAR(128)  NOT NULL, -- 토큰 명
    TOKN_VAL      VARCHAR(1000) NOT NULL, -- 토큰 값
    TOKN_EXP_DATE DATE          NULL,     -- 토큰 만료 일자
    PATK_REGR_ID  VARCHAR(32)   NULL,     -- PAT 등록자 아이디
    PATK_REGR_NM  VARCHAR(128)  NULL,     -- PAT 등록자 명
    PATK_REG_DT   TIMESTAMP(6)  NULL      -- PAT 등록 일시
);

-- PAT
COMMENT ON TABLE tb_portal_pat IS 'PAT';

-- PAT 아이디
COMMENT ON COLUMN tb_portal_pat.PATK_ID IS 'PAT 아이디';

-- 토큰 명
COMMENT ON COLUMN tb_portal_pat.TOKN_NM IS '토큰 명';

-- 토큰 값
COMMENT ON COLUMN tb_portal_pat.TOKN_VAL IS '토큰 값';

-- 토큰 만료 일자
COMMENT ON COLUMN tb_portal_pat.TOKN_EXP_DATE IS '토큰 만료 일자';

-- PAT 등록자 아이디
COMMENT ON COLUMN tb_portal_pat.PATK_REGR_ID IS 'PAT 등록자 아이디';

-- PAT 등록자 명
COMMENT ON COLUMN tb_portal_pat.PATK_REGR_NM IS 'PAT 등록자 명';

-- PAT 등록 일시
COMMENT ON COLUMN tb_portal_pat.PATK_REG_DT IS 'PAT 등록 일시';

-- PAT 기본키
CREATE UNIQUE INDEX pk_tb_portal_pat
    ON tb_portal_pat
        ( -- PAT
         PATK_ID ASC NULLS LAST -- PAT 아이디
            );

-- PAT 기본키
COMMENT ON INDEX pk_tb_portal_pat IS 'PAT 기본키';

-- PAT
ALTER TABLE tb_portal_pat
    ADD CONSTRAINT pk_tb_portal_pat
        -- PAT 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_pat
    NOT DEFERRABLE;

-- PAT 기본키
COMMENT ON CONSTRAINT pk_tb_portal_pat ON tb_portal_pat IS 'PAT 기본키';

-- 식별체계코드_표준산업분류
CREATE TABLE tb_meta_idschmstdind
(
    ID_SCHM_CD         VARCHAR(32)   NOT NULL, -- 식별체계 코드
    ID_SCHM_CD_NM      VARCHAR(255)  NOT NULL, -- 식별체계 코드 명
    ID_SCHM_CD_ENG_NM  VARCHAR(255)  NULL,     -- 식별체계 코드 영문 명
    CD_SIZE_DIV_MTCD   VARCHAR(64)   NULL,     -- 코드 크기 구분 메타코드
    LCTG_EXTR_CD       VARCHAR(32)   NOT NULL, -- 대분류 외부 코드
    ORIGIN_EXTR_CD     VARCHAR(32)   NOT NULL, -- 원본 외부 코드
    IDFY_USE_YN        CHAR(1)       NOT NULL, -- 식별 사용 여부
    USE_YN             CHAR(1)       NOT NULL, -- 사용 여부
    ID_SCHM_CD_DESC    VARCHAR(1000) NULL,     -- 식별체계 코드 설명
    ID_SCHM_CD_REGR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 등록자 아이디
    ID_SCHM_CD_REGR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 등록자 명
    ID_SCHM_CD_REG_DT  TIMESTAMP(6)  NULL,     -- 식별체계 코드 등록 일시
    ID_SCHM_CD_AMDR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 수정자 아이디
    ID_SCHM_CD_AMDR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 수정자 명
    ID_SCHM_CD_AMD_DT  TIMESTAMP(6)  NULL      -- 식별체계 코드 수정 일시
);

-- 식별체계코드_표준산업분류
COMMENT ON TABLE tb_meta_idschmstdind IS '식별체계코드_표준산업분류';

-- 식별체계 코드
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD IS '식별체계 코드';

-- 식별체계 코드 명
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_NM IS '식별체계 코드 명';

-- 식별체계 코드 영문 명
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_ENG_NM IS '식별체계 코드 영문 명';

-- 코드 크기 구분 메타코드
COMMENT ON COLUMN tb_meta_idschmstdind.CD_SIZE_DIV_MTCD IS '코드 크기 구분 메타코드';

-- 대분류 외부 코드
COMMENT ON COLUMN tb_meta_idschmstdind.LCTG_EXTR_CD IS '대분류 외부 코드';

-- 원본 외부 코드
COMMENT ON COLUMN tb_meta_idschmstdind.ORIGIN_EXTR_CD IS '원본 외부 코드';

-- 식별 사용 여부
COMMENT ON COLUMN tb_meta_idschmstdind.IDFY_USE_YN IS '식별 사용 여부';

-- 사용 여부
COMMENT ON COLUMN tb_meta_idschmstdind.USE_YN IS '사용 여부';

-- 식별체계 코드 설명
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_DESC IS '식별체계 코드 설명';

-- 식별체계 코드 등록자 아이디
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_REGR_ID IS '식별체계 코드 등록자 아이디';

-- 식별체계 코드 등록자 명
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_REGR_NM IS '식별체계 코드 등록자 명';

-- 식별체계 코드 등록 일시
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_REG_DT IS '식별체계 코드 등록 일시';

-- 식별체계 코드 수정자 아이디
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_AMDR_ID IS '식별체계 코드 수정자 아이디';

-- 식별체계 코드 수정자 명
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_AMDR_NM IS '식별체계 코드 수정자 명';

-- 식별체계 코드 수정 일시
COMMENT ON COLUMN tb_meta_idschmstdind.ID_SCHM_CD_AMD_DT IS '식별체계 코드 수정 일시';

-- 식별체계코드_표준산업분류 기본키
CREATE UNIQUE INDEX pk_tb_meta_idschmstdind
    ON tb_meta_idschmstdind
        ( -- 식별체계코드_표준산업분류
         ID_SCHM_CD ASC NULLS LAST -- 식별체계 코드
            );

-- 식별체계코드_표준산업분류 기본키
COMMENT ON INDEX pk_tb_meta_idschmstdind IS '식별체계코드_표준산업분류 기본키';

-- 식별체계코드_표준산업분류
ALTER TABLE tb_meta_idschmstdind
    ADD CONSTRAINT pk_tb_meta_idschmstdind
        -- 식별체계코드_표준산업분류 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_idschmstdind
    NOT DEFERRABLE;

-- 식별체계코드_표준산업분류 기본키
COMMENT ON CONSTRAINT pk_tb_meta_idschmstdind ON tb_meta_idschmstdind IS '식별체계코드_표준산업분류 기본키';

-- 식별체계코드_공공자원분류
CREATE TABLE tb_meta_idschmpubri
(
    ID_SCHM_CD         VARCHAR(32)   NOT NULL, -- 식별체계 코드
    ID_SCHM_CD_NM      VARCHAR(255)  NOT NULL, -- 식별체계 코드 명
    ID_SCHM_CD_ENG_NM  VARCHAR(255)  NULL,     -- 식별체계 코드 영문 명
    CD_SIZE_DIV_MTCD   VARCHAR(64)   NULL,     -- 코드 크기 구분 메타코드
    LCTG_EXTR_CD       VARCHAR(32)   NOT NULL, -- 대분류 외부 코드
    ORIGIN_EXTR_CD     VARCHAR(32)   NOT NULL, -- 원본 외부 코드
    IDFY_USE_YN        CHAR(1)       NOT NULL, -- 식별 사용 여부
    USE_YN             CHAR(1)       NOT NULL, -- 사용 여부
    ID_SCHM_CD_DESC    VARCHAR(1000) NULL,     -- 식별체계 코드 설명
    ID_SCHM_CD_REGR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 등록자 아이디
    ID_SCHM_CD_REGR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 등록자 명
    ID_SCHM_CD_REG_DT  TIMESTAMP(6)  NULL,     -- 식별체계 코드 등록 일시
    ID_SCHM_CD_AMDR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 수정자 아이디
    ID_SCHM_CD_AMDR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 수정자 명
    ID_SCHM_CD_AMD_DT  TIMESTAMP(6)  NULL      -- 식별체계 코드 수정 일시
);

-- 식별체계코드_공공자원분류
COMMENT ON TABLE tb_meta_idschmpubri IS '식별체계코드_공공자원분류';

-- 식별체계 코드
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD IS '식별체계 코드';

-- 식별체계 코드 명
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_NM IS '식별체계 코드 명';

-- 식별체계 코드 영문 명
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_ENG_NM IS '식별체계 코드 영문 명';

-- 코드 크기 구분 메타코드
COMMENT ON COLUMN tb_meta_idschmpubri.CD_SIZE_DIV_MTCD IS '코드 크기 구분 메타코드';

-- 대분류 외부 코드
COMMENT ON COLUMN tb_meta_idschmpubri.LCTG_EXTR_CD IS '대분류 외부 코드';

-- 원본 외부 코드
COMMENT ON COLUMN tb_meta_idschmpubri.ORIGIN_EXTR_CD IS '원본 외부 코드';

-- 식별 사용 여부
COMMENT ON COLUMN tb_meta_idschmpubri.IDFY_USE_YN IS '식별 사용 여부';

-- 사용 여부
COMMENT ON COLUMN tb_meta_idschmpubri.USE_YN IS '사용 여부';

-- 식별체계 코드 설명
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_DESC IS '식별체계 코드 설명';

-- 식별체계 코드 등록자 아이디
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_REGR_ID IS '식별체계 코드 등록자 아이디';

-- 식별체계 코드 등록자 명
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_REGR_NM IS '식별체계 코드 등록자 명';

-- 식별체계 코드 등록 일시
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_REG_DT IS '식별체계 코드 등록 일시';

-- 식별체계 코드 수정자 아이디
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_AMDR_ID IS '식별체계 코드 수정자 아이디';

-- 식별체계 코드 수정자 명
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_AMDR_NM IS '식별체계 코드 수정자 명';

-- 식별체계 코드 수정 일시
COMMENT ON COLUMN tb_meta_idschmpubri.ID_SCHM_CD_AMD_DT IS '식별체계 코드 수정 일시';

-- 식별체계코드_공공자원분류 기본키
CREATE UNIQUE INDEX pk_tb_meta_idschmpubri
    ON tb_meta_idschmpubri
        ( -- 식별체계코드_공공자원분류
         ID_SCHM_CD ASC NULLS LAST -- 식별체계 코드
            );

-- 식별체계코드_공공자원분류 기본키
COMMENT ON INDEX pk_tb_meta_idschmpubri IS '식별체계코드_공공자원분류 기본키';

-- 식별체계코드_공공자원분류
ALTER TABLE tb_meta_idschmpubri
    ADD CONSTRAINT pk_tb_meta_idschmpubri
        -- 식별체계코드_공공자원분류 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_idschmpubri
    NOT DEFERRABLE;

-- 식별체계코드_공공자원분류 기본키
COMMENT ON CONSTRAINT pk_tb_meta_idschmpubri ON tb_meta_idschmpubri IS '식별체계코드_공공자원분류 기본키';

-- 식별체계코드_물품분류
CREATE TABLE tb_meta_idschmproduct
(
    ID_SCHM_CD         VARCHAR(32)   NOT NULL, -- 식별체계 코드
    ID_SCHM_CD_NM      VARCHAR(255)  NOT NULL, -- 식별체계 코드 명
    ID_SCHM_CD_ENG_NM  VARCHAR(255)  NULL,     -- 식별체계 코드 영문 명
    CD_SIZE_DIV_MTCD   VARCHAR(64)   NULL,     -- 코드 크기 구분 메타코드
    LCTG_EXTR_CD       VARCHAR(32)   NOT NULL, -- 대분류 외부 코드
    ORIGIN_EXTR_CD     VARCHAR(32)   NOT NULL, -- 원본 외부 코드
    IDFY_USE_YN        CHAR(1)       NOT NULL, -- 식별 사용 여부
    USE_YN             CHAR(1)       NOT NULL, -- 사용 여부
    ID_SCHM_CD_DESC    VARCHAR(1000) NULL,     -- 식별체계 코드 설명
    ID_SCHM_CD_REGR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 등록자 아이디
    ID_SCHM_CD_REGR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 등록자 명
    ID_SCHM_CD_REG_DT  TIMESTAMP(6)  NULL,     -- 식별체계 코드 등록 일시
    ID_SCHM_CD_AMDR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 수정자 아이디
    ID_SCHM_CD_AMDR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 수정자 명
    ID_SCHM_CD_AMD_DT  TIMESTAMP(6)  NULL      -- 식별체계 코드 수정 일시
);

-- 식별체계코드_물품분류
COMMENT ON TABLE tb_meta_idschmproduct IS '식별체계코드_물품분류';

-- 식별체계 코드
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD IS '식별체계 코드';

-- 식별체계 코드 명
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_NM IS '식별체계 코드 명';

-- 식별체계 코드 영문 명
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_ENG_NM IS '식별체계 코드 영문 명';

-- 코드 크기 구분 메타코드
COMMENT ON COLUMN tb_meta_idschmproduct.CD_SIZE_DIV_MTCD IS '코드 크기 구분 메타코드';

-- 대분류 외부 코드
COMMENT ON COLUMN tb_meta_idschmproduct.LCTG_EXTR_CD IS '대분류 외부 코드';

-- 원본 외부 코드
COMMENT ON COLUMN tb_meta_idschmproduct.ORIGIN_EXTR_CD IS '원본 외부 코드';

-- 식별 사용 여부
COMMENT ON COLUMN tb_meta_idschmproduct.IDFY_USE_YN IS '식별 사용 여부';

-- 사용 여부
COMMENT ON COLUMN tb_meta_idschmproduct.USE_YN IS '사용 여부';

-- 식별체계 코드 설명
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_DESC IS '식별체계 코드 설명';

-- 식별체계 코드 등록자 아이디
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_REGR_ID IS '식별체계 코드 등록자 아이디';

-- 식별체계 코드 등록자 명
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_REGR_NM IS '식별체계 코드 등록자 명';

-- 식별체계 코드 등록 일시
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_REG_DT IS '식별체계 코드 등록 일시';

-- 식별체계 코드 수정자 아이디
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_AMDR_ID IS '식별체계 코드 수정자 아이디';

-- 식별체계 코드 수정자 명
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_AMDR_NM IS '식별체계 코드 수정자 명';

-- 식별체계 코드 수정 일시
COMMENT ON COLUMN tb_meta_idschmproduct.ID_SCHM_CD_AMD_DT IS '식별체계 코드 수정 일시';

-- 식별체계코드_물품분류 기본키
CREATE UNIQUE INDEX pk_tb_meta_idschmproduct
    ON tb_meta_idschmproduct
        ( -- 식별체계코드_물품분류
         ID_SCHM_CD ASC NULLS LAST -- 식별체계 코드
            );

-- 식별체계코드_물품분류 기본키
COMMENT ON INDEX pk_tb_meta_idschmproduct IS '식별체계코드_물품분류 기본키';

-- 식별체계코드_물품분류
ALTER TABLE tb_meta_idschmproduct
    ADD CONSTRAINT pk_tb_meta_idschmproduct
        -- 식별체계코드_물품분류 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_idschmproduct
    NOT DEFERRABLE;

-- 식별체계코드_물품분류 기본키
COMMENT ON CONSTRAINT pk_tb_meta_idschmproduct ON tb_meta_idschmproduct IS '식별체계코드_물품분류 기본키';

-- 식별체계코드_시설분류
CREATE TABLE tb_meta_idschmfacility
(
    ID_SCHM_CD         VARCHAR(32)   NOT NULL, -- 식별체계 코드
    ID_SCHM_CD_NM      VARCHAR(255)  NOT NULL, -- 식별체계 코드 명
    ID_SCHM_CD_ENG_NM  VARCHAR(255)  NULL,     -- 식별체계 코드 영문 명
    CD_SIZE_DIV_MTCD   VARCHAR(64)   NULL,     -- 코드 크기 구분 메타코드
    LCTG_EXTR_CD       VARCHAR(32)   NOT NULL, -- 대분류 외부 코드
    ORIGIN_EXTR_CD     VARCHAR(32)   NOT NULL, -- 원본 외부 코드
    IDFY_USE_YN        CHAR(1)       NOT NULL, -- 식별 사용 여부
    USE_YN             CHAR(1)       NOT NULL, -- 사용 여부
    ID_SCHM_CD_DESC    VARCHAR(1000) NULL,     -- 식별체계 코드 설명
    ID_SCHM_CD_REGR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 등록자 아이디
    ID_SCHM_CD_REGR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 등록자 명
    ID_SCHM_CD_REG_DT  TIMESTAMP(6)  NULL,     -- 식별체계 코드 등록 일시
    ID_SCHM_CD_AMDR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 수정자 아이디
    ID_SCHM_CD_AMDR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 수정자 명
    ID_SCHM_CD_AMD_DT  TIMESTAMP(6)  NULL      -- 식별체계 코드 수정 일시
);

-- 식별체계코드_시설분류
COMMENT ON TABLE tb_meta_idschmfacility IS '식별체계코드_시설분류';

-- 식별체계 코드
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD IS '식별체계 코드';

-- 식별체계 코드 명
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_NM IS '식별체계 코드 명';

-- 식별체계 코드 영문 명
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_ENG_NM IS '식별체계 코드 영문 명';

-- 코드 크기 구분 메타코드
COMMENT ON COLUMN tb_meta_idschmfacility.CD_SIZE_DIV_MTCD IS '코드 크기 구분 메타코드';

-- 대분류 외부 코드
COMMENT ON COLUMN tb_meta_idschmfacility.LCTG_EXTR_CD IS '대분류 외부 코드';

-- 원본 외부 코드
COMMENT ON COLUMN tb_meta_idschmfacility.ORIGIN_EXTR_CD IS '원본 외부 코드';

-- 식별 사용 여부
COMMENT ON COLUMN tb_meta_idschmfacility.IDFY_USE_YN IS '식별 사용 여부';

-- 사용 여부
COMMENT ON COLUMN tb_meta_idschmfacility.USE_YN IS '사용 여부';

-- 식별체계 코드 설명
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_DESC IS '식별체계 코드 설명';

-- 식별체계 코드 등록자 아이디
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_REGR_ID IS '식별체계 코드 등록자 아이디';

-- 식별체계 코드 등록자 명
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_REGR_NM IS '식별체계 코드 등록자 명';

-- 식별체계 코드 등록 일시
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_REG_DT IS '식별체계 코드 등록 일시';

-- 식별체계 코드 수정자 아이디
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_AMDR_ID IS '식별체계 코드 수정자 아이디';

-- 식별체계 코드 수정자 명
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_AMDR_NM IS '식별체계 코드 수정자 명';

-- 식별체계 코드 수정 일시
COMMENT ON COLUMN tb_meta_idschmfacility.ID_SCHM_CD_AMD_DT IS '식별체계 코드 수정 일시';

-- 식별체계코드_시설분류 기본키
CREATE UNIQUE INDEX pk_tb_meta_idschmfacility
    ON tb_meta_idschmfacility
        ( -- 식별체계코드_시설분류
         ID_SCHM_CD ASC NULLS LAST -- 식별체계 코드
            );

-- 식별체계코드_시설분류 기본키
COMMENT ON INDEX pk_tb_meta_idschmfacility IS '식별체계코드_시설분류 기본키';

-- 식별체계코드_시설분류
ALTER TABLE tb_meta_idschmfacility
    ADD CONSTRAINT pk_tb_meta_idschmfacility
        -- 식별체계코드_시설분류 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_idschmfacility
    NOT DEFERRABLE;

-- 식별체계코드_시설분류 기본키
COMMENT ON CONSTRAINT pk_tb_meta_idschmfacility ON tb_meta_idschmfacility IS '식별체계코드_시설분류 기본키';

-- 인터페이스로그
CREATE TABLE tb_portal_iflog
(
    IF_LOG_ID VARCHAR(64)  NOT NULL, -- 인터페이스 로그 ID
    IF_LOG_DT TIMESTAMP(6) NOT NULL, -- 인터페이스 로그 일시
    IF_TYPE   VARCHAR(128) NULL,     -- 인터페이스 유형
    IF_KEY    VARCHAR(128) NULL,     -- 인터페이스 키
    IF_MSG    TEXT         NULL,     -- 인터페이스 메시지
    IF_RESLT  VARCHAR(300) NULL      -- 인터페이스 결과
);

-- 인터페이스로그
COMMENT ON TABLE tb_portal_iflog IS '인터페이스로그';

-- 인터페이스 로그 ID
COMMENT ON COLUMN tb_portal_iflog.IF_LOG_ID IS '인터페이스 로그 ID';

-- 인터페이스 로그 일시
COMMENT ON COLUMN tb_portal_iflog.IF_LOG_DT IS '인터페이스 로그 일시';

-- 인터페이스 유형
COMMENT ON COLUMN tb_portal_iflog.IF_TYPE IS '인터페이스 유형';

-- 인터페이스 키
COMMENT ON COLUMN tb_portal_iflog.IF_KEY IS '인터페이스 키';

-- 인터페이스 메시지
COMMENT ON COLUMN tb_portal_iflog.IF_MSG IS '인터페이스 메시지';

-- 인터페이스 결과
COMMENT ON COLUMN tb_portal_iflog.IF_RESLT IS '인터페이스 결과';

-- 인터페이스로그 기본키
CREATE UNIQUE INDEX pk_tb_portal_iflog
    ON tb_portal_iflog
        ( -- 인터페이스로그
         IF_LOG_ID ASC NULLS LAST -- 인터페이스 로그 ID
            );

-- 인터페이스로그 기본키
COMMENT ON INDEX pk_tb_portal_iflog IS '인터페이스로그 기본키';

-- 인터페이스로그
ALTER TABLE tb_portal_iflog
    ADD CONSTRAINT pk_tb_portal_iflog
        -- 인터페이스로그 기본키
        PRIMARY KEY
    USING INDEX pk_tb_portal_iflog
    NOT DEFERRABLE;

-- 인터페이스로그 기본키
COMMENT ON CONSTRAINT pk_tb_portal_iflog ON tb_portal_iflog IS '인터페이스로그 기본키';

-- 식별체계코드_지형지물분류
CREATE TABLE tb_meta_idschmfeature
(
    ID_SCHM_CD         VARCHAR(32)   NOT NULL, -- 식별체계 코드
    ID_SCHM_CD_NM      VARCHAR(255)  NOT NULL, -- 식별체계 코드 명
    ID_SCHM_CD_ENG_NM  VARCHAR(255)  NULL,     -- 식별체계 코드 영문 명
    CD_SIZE_DIV_MTCD   VARCHAR(64)   NULL,     -- 코드 크기 구분 메타코드
    LCTG_EXTR_CD       VARCHAR(32)   NOT NULL, -- 대분류 외부 코드
    ORIGIN_EXTR_CD     VARCHAR(32)   NOT NULL, -- 원본 외부 코드
    IDFY_USE_YN        CHAR(1)       NOT NULL, -- 식별 사용 여부
    USE_YN             CHAR(1)       NOT NULL, -- 사용 여부
    ID_SCHM_CD_DESC    VARCHAR(1000) NULL,     -- 식별체계 코드 설명
    ID_SCHM_CD_REGR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 등록자 아이디
    ID_SCHM_CD_REGR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 등록자 명
    ID_SCHM_CD_REG_DT  TIMESTAMP(6)  NULL,     -- 식별체계 코드 등록 일시
    ID_SCHM_CD_AMDR_ID VARCHAR(32)   NULL,     -- 식별체계 코드 수정자 아이디
    ID_SCHM_CD_AMDR_NM VARCHAR(128)  NULL,     -- 식별체계 코드 수정자 명
    ID_SCHM_CD_AMD_DT  TIMESTAMP(6)  NULL      -- 식별체계 코드 수정 일시
);

-- 식별체계코드_지형지물분류
COMMENT ON TABLE tb_meta_idschmfeature IS '식별체계코드_지형지물분류';

-- 식별체계 코드
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD IS '식별체계 코드';

-- 식별체계 코드 명
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_NM IS '식별체계 코드 명';

-- 식별체계 코드 영문 명
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_ENG_NM IS '식별체계 코드 영문 명';

-- 코드 크기 구분 메타코드
COMMENT ON COLUMN tb_meta_idschmfeature.CD_SIZE_DIV_MTCD IS '코드 크기 구분 메타코드';

-- 대분류 외부 코드
COMMENT ON COLUMN tb_meta_idschmfeature.LCTG_EXTR_CD IS '대분류 외부 코드';

-- 원본 외부 코드
COMMENT ON COLUMN tb_meta_idschmfeature.ORIGIN_EXTR_CD IS '원본 외부 코드';

-- 식별 사용 여부
COMMENT ON COLUMN tb_meta_idschmfeature.IDFY_USE_YN IS '식별 사용 여부';

-- 사용 여부
COMMENT ON COLUMN tb_meta_idschmfeature.USE_YN IS '사용 여부';

-- 식별체계 코드 설명
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_DESC IS '식별체계 코드 설명';

-- 식별체계 코드 등록자 아이디
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_REGR_ID IS '식별체계 코드 등록자 아이디';

-- 식별체계 코드 등록자 명
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_REGR_NM IS '식별체계 코드 등록자 명';

-- 식별체계 코드 등록 일시
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_REG_DT IS '식별체계 코드 등록 일시';

-- 식별체계 코드 수정자 아이디
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_AMDR_ID IS '식별체계 코드 수정자 아이디';

-- 식별체계 코드 수정자 명
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_AMDR_NM IS '식별체계 코드 수정자 명';

-- 식별체계 코드 수정 일시
COMMENT ON COLUMN tb_meta_idschmfeature.ID_SCHM_CD_AMD_DT IS '식별체계 코드 수정 일시';

-- 식별체계코드_지형지물분류 기본키
CREATE UNIQUE INDEX pk_tb_meta_idschmfeature
    ON tb_meta_idschmfeature
        ( -- 식별체계코드_지형지물분류
         ID_SCHM_CD ASC NULLS LAST -- 식별체계 코드
            );

-- 식별체계코드_지형지물분류 기본키
COMMENT ON INDEX pk_tb_meta_idschmfeature IS '식별체계코드_지형지물분류 기본키';

-- 식별체계코드_지형지물분류
ALTER TABLE tb_meta_idschmfeature
    ADD CONSTRAINT pk_tb_meta_idschmfeature
        -- 식별체계코드_지형지물분류 기본키
        PRIMARY KEY
    USING INDEX pk_tb_meta_idschmfeature
    NOT DEFERRABLE;

-- 식별체계코드_지형지물분류 기본키
COMMENT ON CONSTRAINT pk_tb_meta_idschmfeature ON tb_meta_idschmfeature IS '식별체계코드_지형지물분류 기본키';

