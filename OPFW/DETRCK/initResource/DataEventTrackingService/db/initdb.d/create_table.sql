CREATE DATABASE  IF NOT EXISTS `dataEventTrackings` DEFAULT CHARACTER SET utf8;
USE `dataEventTrackings`;

SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;
SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION;
SET NAMES utf8;
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;

DROP TABLE IF EXISTS `data_event_tracking_request_info`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `data_event_tracking_request_info` (
  `request_tracking_id` int(11) NOT NULL AUTO_INCREMENT,
  `tracking_identifier` varchar(200) NOT NULL,
  `req_identifier` varchar(200) NOT NULL,
  `req_trck_cmd_time` timestamp(3) NOT NULL,
  `req_trck_cmd_status` varchar(10) NOT NULL,
  `result_callback_url` varchar(500) NOT NULL,
  `req_tracking_cmd` text NOT NULL,
  `req_status_change_time` timestamp NOT NULL,
  PRIMARY KEY (`request_tracking_id`),
  UNIQUE KEY `XPK_tracking_request_info_id` (`request_tracking_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `event_occured_info`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `event_occured_info` (
  `event_occured_id` int(11) NOT NULL AUTO_INCREMENT,
  `detector_proc_id` int(11) NOT NULL,
  `tracking_process_id` int(11) NOT NULL,
  `request_tracking_id` int(11) NOT NULL,
  `event_occured_time` timestamp NOT NULL,
  `event_transmitted_status` varchar(10) NOT NULL,
  `event_transmitted_time` timestamp NULL DEFAULT NULL,
  `event_occured_msg` text,
  PRIMARY KEY (`event_occured_id`,`detector_proc_id`,`tracking_process_id`,`request_tracking_id`),
  UNIQUE KEY `XPK_event_occured_info` (`event_occured_id`,`detector_proc_id`,`tracking_process_id`,`request_tracking_id`),
  KEY `XIF1_event_occured_info` (`detector_proc_id`,`tracking_process_id`,`request_tracking_id`),
  CONSTRAINT `event_occured_info_ibfk_1` FOREIGN KEY (`detector_proc_id`, `tracking_process_id`, `request_tracking_id`) REFERENCES `tracking_detector_proc_info` (`detector_proc_id`, `tracking_process_id`, `request_tracking_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `event_transmission_result_info`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `event_transmission_result_info` (
  `event_transmission_result_id` int(11) NOT NULL AUTO_INCREMENT,
  `event_transmission_status` varchar(10) NOT NULL,
  `event_occured_msg` text,
  `transmission_time` timestamp NOT NULL,
  `transmission_url` varchar(500) NOT NULL,
  `transmission_param` varchar(500) DEFAULT NULL,
  `transmission_resp_msg` text,
  `event_occured_id` int(11) NOT NULL,
  `detector_proc_id` int(11) NOT NULL,
  `tracking_process_id` int(11) NOT NULL,
  `request_tracking_id` int(11) NOT NULL,
  `transmission_resp_code` text,
  PRIMARY KEY (`event_transmission_result_id`,`event_occured_id`,`detector_proc_id`,`tracking_process_id`,`request_tracking_id`),
  UNIQUE KEY `XPK_event_transmission_result_info` (`event_transmission_result_id`,`event_occured_id`,`detector_proc_id`,`tracking_process_id`,`request_tracking_id`),
  KEY `XIF1_event_transmission_result_info` (`event_occured_id`,`detector_proc_id`,`tracking_process_id`,`request_tracking_id`),
  CONSTRAINT `event_transmission_result_info_ibfk_1` FOREIGN KEY (`event_occured_id`, `detector_proc_id`, `tracking_process_id`, `request_tracking_id`) REFERENCES `event_occured_info` (`event_occured_id`, `detector_proc_id`, `tracking_process_id`, `request_tracking_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_detector_proc_info`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_detector_proc_info` (
  `detector_proc_id` int(11) NOT NULL AUTO_INCREMENT,
  `tracking_process_id` int(11) NOT NULL,
  `request_tracking_id` int(11) NOT NULL,
  `detected_status` varchar(10) NOT NULL,
  `tracking_start_date` timestamp(3) NOT NULL,
  `tracking_end_date` timestamp(3) NULL DEFAULT NULL,
  `detect_record_start_id` int(11) DEFAULT NULL,
  `detect_record_end_id` int(11) DEFAULT NULL,
  `event_occued_status` varchar(10) DEFAULT NULL,
  `tracking_result_value` text,
  `update_date` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`detector_proc_id`,`tracking_process_id`,`request_tracking_id`),
  UNIQUE KEY `XPK_tracking_detector_proc_info` (`detector_proc_id`,`tracking_process_id`,`request_tracking_id`),
  KEY `XIF1_tracking_detector_proc_info` (`tracking_process_id`,`request_tracking_id`),
  CONSTRAINT `tracking_detector_proc_info_ibfk_1` FOREIGN KEY (`tracking_process_id`, `request_tracking_id`) REFERENCES `tracking_process_info` (`tracking_process_id`, `request_tracking_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_process_info`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_process_info` (
  `tracking_process_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_tracking_id` int(11) NOT NULL,
  `trckPrcIdtifier` varchar(200) NOT NULL,
  `tracking_process_identifier` varchar(200) NOT NULL,
  `tracking_process_type` varchar(10) NOT NULL,
  `data_link_type` varchar(10) DEFAULT NULL COMMENT '데이터 연계타입(DL01/DL02)',
  `federated_twin_id` varchar(100) DEFAULT NULL,
  `federated_digital_object_id` varchar(100) DEFAULT NULL,
  `digital_twin_id` varchar(100) DEFAULT NULL,
  `digital_object_id` varchar(100) DEFAULT NULL,
  `tracking_command` text NOT NULL,
  `tracking_kafka_group` varchar(200) DEFAULT NULL,
  `tracking_kafka_topic` varchar(200) DEFAULT NULL,
  `tracking_value_info` varchar(500) DEFAULT NULL,
  `data_filter_type` varchar(10) DEFAULT NULL,
  `buffer_size` int(11) NOT NULL,
  `event_delay` int(11) DEFAULT NULL,
  `event_occurred_count` int(11) NOT NULL,
  `event_condition` varchar(500) NOT NULL,
  `event_end_date` text,
  `context_url` varchar(512) DEFAULT NULL COMMENT 'NGSI-LD @context URL',
  `entity_id` varchar(256) DEFAULT NULL COMMENT 'NGSI-LD 엔티티 ID',
  `ngsi_type` varchar(128) DEFAULT NULL COMMENT 'NGSI-LD 엔티티 타입',
  `timeproperty` varchar(256) DEFAULT NULL COMMENT '관측시각 경로({속성}.observedAt)',
  `last_observed_at` varchar(64) DEFAULT NULL COMMENT '마지막으로 수집한 observedAt',
  `tracking_status` varchar(10) NOT NULL,
  `create_time` timestamp(3) NOT NULL,
  `tracking_status_change_time` timestamp(3) NOT NULL,
  PRIMARY KEY (`tracking_process_id`,`request_tracking_id`),
  UNIQUE KEY `sequence_identifier_UNIQUE` (`tracking_process_identifier`),
  KEY `fk1_tracking_sequence_info_idx` (`request_tracking_id`),
  KEY `idx_tpi_entity_id` (`entity_id`),
  CONSTRAINT `fk1_tracking_process_info` FOREIGN KEY (`request_tracking_id`) REFERENCES `data_event_tracking_request_info` (`request_tracking_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_process_status_change_record`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_process_status_change_record` (
  `process_status_change_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_tracking_id` int(11) NOT NULL,
  `tracking_process_id` int(11) NOT NULL,
  `change_status` varchar(10) COLLATE utf8_bin NOT NULL,
  `status_update_time` timestamp(3) NOT NULL,
  `status_result_msg` varchar(200) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`process_status_change_id`,`request_tracking_id`,`tracking_process_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_response_data`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_response_data` (
  `tracking_process_identifier` varchar(200) NOT NULL,
  `result_value` varchar(100) NOT NULL,
  PRIMARY KEY (`tracking_process_identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_response_record`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_response_record` (
  `tracking_response_id` int(11) NOT NULL AUTO_INCREMENT,
  `tracking_process_id` int(11) NOT NULL,
  `request_tracking_id` int(11) NOT NULL,
  `receive_time` timestamp(3) NOT NULL,
  `receive_val` varchar(200) NOT NULL,
  `receive_status` varchar(10) NOT NULL,
  `receive_msg` text NOT NULL,
  `receive_payload` text NOT NULL,
  PRIMARY KEY (`tracking_response_id`,`tracking_process_id`,`request_tracking_id`),
  UNIQUE KEY `XPK_tracking_response_record` (`tracking_response_id`),
  KEY `XIF1_tracking_response_record` (`request_tracking_id`),
  KEY `tracking_process_id` (`tracking_process_id`),
  CONSTRAINT `tracking_response_record_ibfk_1` FOREIGN KEY (`tracking_process_id`) REFERENCES `tracking_process_info` (`tracking_process_id`),
  CONSTRAINT `tracking_response_record_ibfk_2` FOREIGN KEY (`request_tracking_id`) REFERENCES `tracking_process_info` (`request_tracking_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_result_data_transmission_info`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_result_data_transmission_info` (
  `transmission_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_tracking_id` int(11) NOT NULL,
  `transmission_code` int(11) NOT NULL,
  `transmission_msg` varchar(100) NOT NULL,
  `transmission_time` timestamp(3) NOT NULL,
  `transmission_url` varchar(500) NOT NULL,
  `transmission_param` text,
  `transmission_result_data` text,
  `resp_ctrl_cmd_code` varchar(10) DEFAULT NULL,
  `resp_ctrl_cmd_msg` text,
  `resp_ctrl_cmd_time` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`transmission_id`,`request_tracking_id`),
  UNIQUE KEY `XPK_tracking_result_data_transmission_info` (`transmission_id`,`request_tracking_id`),
  KEY `XIF1_tracking_result_data_transmission_info` (`request_tracking_id`),
  CONSTRAINT `tracking_result_data_transmission_info_ibfk_1` FOREIGN KEY (`request_tracking_id`) REFERENCES `data_event_tracking_request_info` (`request_tracking_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_status_change_record`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_status_change_record` (
  `tracking_status_change_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_tracking_id` int(11) NOT NULL,
  `status_update_time` timestamp(3) NOT NULL,
  `change_status` varchar(10) NOT NULL,
  `status_result_msg` varchar(200) NOT NULL,
  PRIMARY KEY (`tracking_status_change_id`,`request_tracking_id`),
  KEY `fk1_tracking_status_change_record_idx` (`request_tracking_id`),
  CONSTRAINT `fk1_tracking_status_change_record` FOREIGN KEY (`request_tracking_id`) REFERENCES `data_event_tracking_request_info` (`request_tracking_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_status_transmission_info`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_status_transmission_info` (
  `status_transmission_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `request_tracking_id` int(11) NOT NULL,
  `tracking_process_id` int(11) NOT NULL,
  `msg_status` varchar(20) NOT NULL COMMENT '상태값 NO_DATA / COLLECT_ERROR',
  `last_observed_at` varchar(64) DEFAULT NULL COMMENT '데이터 트래킹의 마지막 관측 시각',
  `no_data_refs` varchar(500) DEFAULT NULL COMMENT '이벤트 트래킹에서 값이 없는 참조 식별자(JSON 배열)',
  `checked_time` datetime(3) DEFAULT NULL COMMENT 'Subscriber 가 데이터 없음을 확인한 시각',
  `transmission_time` datetime(3) NOT NULL COMMENT '콜백 전송 시각',
  `transmission_status` varchar(10) NOT NULL COMMENT '전송 결과 TGS03 성공 / TGS99 실패',
  `transmission_url` varchar(500) DEFAULT NULL,
  `transmission_param` text COMMENT '전송 본문',
  `transmission_resp_code` varchar(200) DEFAULT NULL COMMENT 'HTTP 응답 코드 또는 오류 요약',
  `transmission_resp_msg` text COMMENT '오류 상세',
  PRIMARY KEY (`status_transmission_id`),
  KEY `idx_tsti_process` (`request_tracking_id`,`tracking_process_id`,`transmission_time`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `tracking_topic_info`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `tracking_topic_info` (
  `topic_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_tracking_id` int(11) NOT NULL,
  `tracking_process_id` int(11) NOT NULL,
  `group_name` varchar(10) NOT NULL,
  `topic_name` varchar(255) NOT NULL,
  `topic_create_time` timestamp(3) NOT NULL,
  `topic_update_time` timestamp(3) NOT NULL,
  PRIMARY KEY (`topic_id`,`request_tracking_id`,`tracking_process_id`),
  UNIQUE KEY `tracking_process_id_UNIQUE` (`tracking_process_id`),
  KEY `fk1_tracking_topic_info_idx` (`request_tracking_id`,`tracking_process_id`),
  CONSTRAINT `fk1_tracking_topic_info` FOREIGN KEY (`request_tracking_id`, `tracking_process_id`) REFERENCES `tracking_process_info` (`request_tracking_id`, `tracking_process_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

SET TIME_ZONE=@OLD_TIME_ZONE;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT;
SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS;
SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION;
SET SQL_NOTES=@OLD_SQL_NOTES;
