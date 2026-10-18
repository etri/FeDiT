ALTER TABLE tracking_process_info
    ADD COLUMN IF NOT EXISTS context_url  VARCHAR(512) NULL COMMENT 'NGSI-LD @context URL' AFTER event_end_date,
    ADD COLUMN IF NOT EXISTS entity_id    VARCHAR(256) NULL COMMENT 'NGSI-LD 엔티티 ID' AFTER context_url,
    ADD COLUMN IF NOT EXISTS ngsi_type    VARCHAR(128) NULL COMMENT 'NGSI-LD 엔티티 타입' AFTER entity_id,
    ADD COLUMN IF NOT EXISTS timeproperty VARCHAR(256) NULL COMMENT '관측시각 경로({속성}.observedAt)' AFTER ngsi_type;

ALTER TABLE tracking_process_info
    ADD COLUMN IF NOT EXISTS data_link_type VARCHAR(10) NULL COMMENT '데이터 연계타입(DL01/DL02)' AFTER tracking_process_type;

ALTER TABLE tracking_process_info
    ADD COLUMN IF NOT EXISTS last_observed_at VARCHAR(64) NULL COMMENT '마지막으로 수집한 observedAt' AFTER timeproperty;

CREATE INDEX IF NOT EXISTS idx_tpi_entity_id ON tracking_process_info (entity_id);

CREATE TABLE IF NOT EXISTS tracking_status_transmission_info (
    status_transmission_id  BIGINT       NOT NULL AUTO_INCREMENT,
    request_tracking_id     INT          NOT NULL,
    tracking_process_id     INT          NOT NULL,
    msg_status              VARCHAR(20)  NOT NULL COMMENT '상태값 NO_DATA / COLLECT_ERROR',
    last_observed_at        VARCHAR(64)  NULL     COMMENT '데이터 트래킹의 마지막 관측 시각',
    no_data_refs            VARCHAR(500) NULL     COMMENT '이벤트 트래킹에서 값이 없는 참조 식별자(JSON 배열)',
    checked_time            DATETIME(3)  NULL     COMMENT 'Subscriber 가 데이터 없음을 확인한 시각',
    transmission_time       DATETIME(3)  NOT NULL COMMENT '콜백 전송 시각',
    transmission_status     VARCHAR(10)  NOT NULL COMMENT '전송 결과 TGS03 성공 / TGS99 실패',
    transmission_url        VARCHAR(500) NULL,
    transmission_param      TEXT         NULL     COMMENT '전송 본문',
    transmission_resp_code  VARCHAR(200) NULL     COMMENT 'HTTP 응답 코드 또는 오류 요약',
    transmission_resp_msg   TEXT         NULL     COMMENT '오류 상세',
    PRIMARY KEY (status_transmission_id),
    KEY idx_tsti_process (request_tracking_id, tracking_process_id, transmission_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
