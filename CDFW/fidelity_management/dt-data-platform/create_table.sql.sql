CREATE DATABASE  IF NOT EXISTS `dt_data_platform` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `dt_data_platform`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: dt_data_platform
-- ------------------------------------------------------
-- Server version	5.5.5-10.11.8-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tb_board`
--

DROP TABLE IF EXISTS `tb_board`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_board` (
  `BOARD_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '순번',
  `BOARD_TP` varchar(20) DEFAULT NULL COMMENT '유형',
  `BOARD_NM` varchar(200) DEFAULT NULL COMMENT '제목',
  `BOARD_SMP_DERPN` text DEFAULT NULL COMMENT '심플 내용',
  `BOARD_DERPN` text DEFAULT NULL COMMENT '상세 내용',
  `RLS_YN` varchar(1) DEFAULT NULL COMMENT '공유 여부',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`BOARD_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_board_files`
--

DROP TABLE IF EXISTS `tb_board_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_board_files` (
  `FILE_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '파일 순번',
  `REF_TP` varchar(20) DEFAULT NULL COMMENT '연관 유형',
  `REF_SEQ` int(11) DEFAULT NULL COMMENT '연관 순번',
  `FILE_TP` varchar(20) DEFAULT NULL COMMENT '파일 유형',
  `FILE_NM` varchar(100) DEFAULT NULL COMMENT '파일 명',
  `STRG_FILE_NM` varchar(100) DEFAULT NULL COMMENT '저장 파일 명',
  `FILE_TITLE` varchar(200) DEFAULT NULL COMMENT '파일 제목',
  `FILE_PATH` varchar(200) DEFAULT NULL COMMENT '파일 경로',
  `FILE_EXTN` varchar(100) DEFAULT NULL COMMENT '파일 확장자',
  `FILE_SZ` int(11) DEFAULT NULL COMMENT '파일 크기',
  `FILE_LEN` int(11) DEFAULT NULL COMMENT '파일 길이',
  `FILE_CONTS_TP` varchar(20) DEFAULT NULL COMMENT '파일 내용물 유형',
  `THUMB_S` varchar(100) DEFAULT NULL COMMENT '썸네일 소',
  `THUMB_M` varchar(100) DEFAULT NULL COMMENT '썸네일 중',
  `THUMB_L` varchar(100) DEFAULT NULL COMMENT '썸네일 대',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`FILE_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_code_dtl`
--

DROP TABLE IF EXISTS `tb_code_dtl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_code_dtl` (
  `GRP_CD` varchar(20) NOT NULL COMMENT '그룹 코드',
  `DTL_CD` varchar(20) NOT NULL COMMENT '상세 코드',
  `DTL_CD_NM` varchar(45) DEFAULT NULL COMMENT '상세 코드 명',
  `RMRK` varchar(4000) DEFAULT NULL COMMENT '비고',
  `REF_CD` varchar(20) DEFAULT NULL COMMENT '연관 코드',
  `REF_CLASS` varchar(100) DEFAULT NULL COMMENT '연관 클래스',
  `REF_VALUE` varchar(200) DEFAULT NULL COMMENT '연관 값',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  `GRP_CD_NM` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`GRP_CD`,`DTL_CD`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_code_mst`
--

DROP TABLE IF EXISTS `tb_code_mst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_code_mst` (
  `GRP_CD` varchar(20) NOT NULL COMMENT '그룹 코드',
  `GRP_CD_NM` varchar(45) DEFAULT NULL COMMENT '그룹 코드 명',
  `RMRK` varchar(4000) DEFAULT NULL COMMENT '비고',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`GRP_CD`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_data_vrfc`
--

DROP TABLE IF EXISTS `tb_data_vrfc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_data_vrfc` (
  `VRFC_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '검증 순번. 자료검증순번',
  `VRFC_TP` varchar(20) DEFAULT NULL COMMENT '검증 유형. 검증유형',
  `VRFC_NM` varchar(200) DEFAULT NULL COMMENT '검증 명. 검증명',
  `RULE_VALUE_1` varchar(100) DEFAULT NULL COMMENT '규칙 값 1번. 1번규칙값',
  `RULE_VALUE_2` varchar(100) DEFAULT NULL COMMENT '규칙 값 2번. 2번규칙값',
  `RULE_VALUE_3` varchar(100) DEFAULT NULL COMMENT '규칙 값 3번. 3번규칙값',
  `RULE_VALUE_4` varchar(100) DEFAULT NULL COMMENT '규칙 값 4번. 4번규칙값',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서. 순서',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부. 사용여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 삭제여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번. 등록사용자순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시. 등록일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP. 등록IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번. 수정사용자순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시. 수정일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP. 수정IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번. 삭제사용자순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시. 삭제일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP. 삭제IP',
  PRIMARY KEY (`VRFC_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='데이터 검증';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_error_log`
--

DROP TABLE IF EXISTS `tb_error_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_error_log` (
  `ERR_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '오류 순번. 모델 설명',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번. 모델 순번',
  `AUGMENT_SEQ` int(11) DEFAULT NULL COMMENT '증강 순번',
  `ERR_TP` varchar(20) DEFAULT NULL COMMENT '오류 유형. 오류 유형',
  `ERR_CD` varchar(20) DEFAULT NULL,
  `ERR_LCT` varchar(200) DEFAULT NULL COMMENT '오류 위치. 오류 위치',
  `ERR_NM` varchar(200) DEFAULT NULL,
  `ERR_CN` varchar(4000) DEFAULT NULL COMMENT '오류 내용. 오류 내용',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부. 사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번. 등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시. 등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP. 등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번. 수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시. 수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP. 수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번. 삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시. 삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP. 삭제 IP',
  PRIMARY KEY (`ERR_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_menu`
--

DROP TABLE IF EXISTS `tb_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_menu` (
  `MENU_CD` varchar(20) NOT NULL COMMENT '메뉴 코드. 메뉴코드',
  `MENU_NM` varchar(45) DEFAULT NULL COMMENT '메뉴 명. 메뉴이름',
  `UP_MENU_CD` varchar(20) DEFAULT NULL COMMENT '상위 메뉴 코드. 상위메뉴코드',
  `MENU_URL` varchar(200) DEFAULT NULL COMMENT '메뉴 URL. 메뉴링크',
  `MENU_ICON` varchar(40) DEFAULT NULL COMMENT '메뉴 아이콘. 메뉴아이콘',
  `MENU_CLASS` varchar(100) DEFAULT NULL COMMENT '메뉴 클래스. 메뉴클래스',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서. 정렬',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부. 삭제구분',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 삭제구분',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번. 등록사용자순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시. 등록일자',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP. 등록IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번. 수정사용자순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시. 수정일자',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP. 수정IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번. 삭제사용자순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시. 삭제일자',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP. 삭제IP',
  PRIMARY KEY (`MENU_CD`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_menu_auth`
--

DROP TABLE IF EXISTS `tb_menu_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_menu_auth` (
  `AUTH_CD` varchar(20) NOT NULL COMMENT '권한 코드. 권한',
  `MENU_CD` varchar(20) NOT NULL COMMENT '메뉴 코드. 메뉴코드',
  `INQ_AUTH_YN` char(1) DEFAULT 'N' COMMENT '조회 권한 여부. 조회권한구분',
  `WRT_AUTH_YN` char(1) DEFAULT 'N' COMMENT '작성 권한 여부. 쓰기권한구분',
  `MDFCN_AUTH_YN` char(1) DEFAULT 'N' COMMENT '수정 권한 여부. 수정권한구분',
  `DEL_AUTH_YN` char(1) DEFAULT 'N' COMMENT '삭제 권한 여부. 삭제권한구분',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 사용구분',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번. 등록사용자순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시. 등록일자',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP. 등록IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번. 수정사용자순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시. 수정일자',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP. 수정IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번. 삭제사용자순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시. 삭제일자',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP. 삭제IP',
  PRIMARY KEY (`AUTH_CD`,`MENU_CD`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_augment`
--

DROP TABLE IF EXISTS `tb_meta_augment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_augment` (
  `AUGMENT_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '증강 순번',
  `TITLE` varchar(200) DEFAULT NULL COMMENT '제목',
  `DERPN` text DEFAULT NULL COMMENT '설명',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `AUGMENT_TP` varchar(20) DEFAULT NULL COMMENT '증강유형(실시간/단일)',
  `DATA_TP` varchar(20) DEFAULT NULL COMMENT '자료유형(csv/excel)',
  `AUGMENT_CRT_BGNG` varchar(20) DEFAULT NULL COMMENT '증강 생성 시작',
  `AUGMENT_CRT_END` varchar(20) DEFAULT NULL COMMENT '증강 생성 종료',
  `DATA_PRCS_DT` datetime DEFAULT NULL COMMENT '자료 처리 일시',
  `DATA_PRCS_CNT` int(11) DEFAULT 0 COMMENT '자료 처리 수 (이전 데이터 수)',
  `DATA_CRT_INTVL_TP` varchar(20) DEFAULT NULL COMMENT '자료 생성 간격 유형',
  `DATA_CRT_INTVL_VALUE` varchar(20) DEFAULT NULL COMMENT '자료 생성 간격 (실시간 예측수)',
  `DATA_CRT_BGNG_HR` varchar(24) DEFAULT NULL COMMENT '자료 생성 시작 시간',
  `DATA_CRT_LAST_HR` varchar(24) DEFAULT NULL COMMENT '자료 생성 최종 시간 (실시간 수동선택)',
  `AUGMENT_STATUS` varchar(20) DEFAULT NULL COMMENT '증강상태(대기/진행/완료/일시중지/오류)',
  `RLS_YN` char(1) DEFAULT 'N' COMMENT '공개 여부',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  `SIM_TP` varchar(20) DEFAULT NULL COMMENT '시뮬레이션 유형(전처리/증강)',
  `CYCLE_TP` varchar(20) DEFAULT NULL COMMENT '주기 유형(시간/일)',
  `CYCLE_END_TP` varchar(2) DEFAULT NULL COMMENT 'C:지속, D:종료일, S: 일시중지',
  `CYCLE_BGNG_DSGN_YMD` varchar(20) DEFAULT NULL COMMENT '주기 시작 지정 일자',
  `CYCLE_END_DSGN_YMD` varchar(20) DEFAULT NULL COMMENT '주기 종료 지정 일자',
  `DATA_MAX_LIMIT_CNT` int(11) DEFAULT 1000,
  PRIMARY KEY (`AUGMENT_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_augment_files`
--

DROP TABLE IF EXISTS `tb_meta_augment_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_augment_files` (
  `FILE_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '파일 순번',
  `AUGMENT_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `FILE_NM` varchar(100) DEFAULT NULL COMMENT '파일 명',
  `STRG_FILE_NM` varchar(300) DEFAULT NULL,
  `REF_TP` varchar(20) DEFAULT NULL COMMENT '연관 유형',
  `FILE_PATH` varchar(200) DEFAULT NULL COMMENT '파일 경로',
  `FILE_EXTN` varchar(100) DEFAULT NULL COMMENT '파일 확장자',
  `FILE_SZ` int(11) DEFAULT NULL COMMENT '파일 크기',
  `FILE_LEN` int(11) DEFAULT NULL COMMENT '파일 길이',
  `FILE_CONTS_TP` varchar(200) DEFAULT NULL COMMENT '파일 내용물 유형',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`FILE_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=351 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_augment_log`
--

DROP TABLE IF EXISTS `tb_meta_augment_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_augment_log` (
  `AUGMENT_LOG_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '증강 로그 순번',
  `AUGMENT_SEQ` int(11) DEFAULT NULL COMMENT '증강 순번',
  `DERPN` text DEFAULT NULL COMMENT '설명',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `FILE_SEQ` int(11) DEFAULT NULL,
  `DATA_PRCS_CNT` int(11) DEFAULT 0 COMMENT '자료 처리 수',
  `AUGMENT_STATUS` varchar(20) DEFAULT NULL COMMENT '증강 상태',
  `ERR_TP` varchar(20) DEFAULT NULL COMMENT '오류 유형',
  `ERR_LCT` varchar(200) DEFAULT NULL COMMENT '오류 위치',
  `ERR_CD` varchar(20) DEFAULT NULL COMMENT '오류 코드',
  `ERR_NM` varchar(200) DEFAULT NULL COMMENT '오류 명',
  `ERR_CN` varchar(4000) DEFAULT NULL COMMENT '오류 내용',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'Y' COMMENT '삭제 여부',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `DATA_CRT_LAST_HR` varchar(24) DEFAULT NULL,
  PRIMARY KEY (`AUGMENT_LOG_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=4124 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_data_depth`
--

DROP TABLE IF EXISTS `tb_meta_data_depth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_data_depth` (
  `DATA_SEQ` int(11) NOT NULL AUTO_INCREMENT,
  `TWIN_ID` varchar(200) DEFAULT NULL,
  `TWIN_NM` varchar(200) DEFAULT NULL,
  `TWIN_OBJ_ID` varchar(200) DEFAULT NULL,
  `TWIN_OBJ_NM` varchar(200) DEFAULT NULL,
  `COLUMN_DEPTH_1` varchar(2000) DEFAULT NULL,
  `COLUMN_DEPTH_2` varchar(2000) DEFAULT NULL,
  `DATA_DEPTH_1` varchar(2000) DEFAULT NULL,
  `DATA_DEPTH_2` varchar(2000) DEFAULT NULL,
  `RLS_YN` char(1) DEFAULT 'N' COMMENT '공개 여부',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  `DATA_TIME_YN` char(1) DEFAULT 'Y',
  PRIMARY KEY (`DATA_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_data_file_log`
--

DROP TABLE IF EXISTS `tb_meta_data_file_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_data_file_log` (
  `LOG_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '로그 순번',
  `FILE_SEQ` int(11) DEFAULT NULL COMMENT '파일 번호',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`LOG_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_data_file_log`
--

DROP TABLE IF EXISTS `tb_meta_etc_data_file_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_data_file_log` (
  `LOG_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '로그 순번',
  `FILE_SEQ` int(11) DEFAULT NULL COMMENT '파일 번호',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`LOG_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_model`
--

DROP TABLE IF EXISTS `tb_meta_etc_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_model` (
  `ETC_MODEL_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '기타 모델 순번',
  `ETC_MODEL_NM` varchar(200) DEFAULT NULL COMMENT '기타 모델 명',
  `ETC_MODEL_DERPN` text DEFAULT NULL COMMENT '기타 모델 설명',
  `ETC_MODEL_TP` varchar(20) DEFAULT NULL COMMENT '기타 모델 유형',
  `TRGT_COL` varchar(200) DEFAULT NULL COMMENT '대상 컬럼',
  `MODEL_ALGRM_SEQ` int(11) DEFAULT NULL COMMENT '모델 알고리즘 순번',
  `WINDOW_SZ` int(11) DEFAULT NULL COMMENT '윈도우 크기',
  `BATCH_SZ` int(11) DEFAULT NULL COMMENT '배치 크기',
  `UNITS_CNT` int(11) DEFAULT NULL COMMENT '유닛 수',
  `TEST_SZ` double DEFAULT NULL COMMENT '테스트 크기',
  `EPOCHS_CNT` int(11) DEFAULT NULL COMMENT '학습차수 수',
  `PATIENCE_CNT` int(11) DEFAULT NULL COMMENT '조기종료 수',
  `LEARNING_BGNG_DT` datetime DEFAULT NULL COMMENT '학습 시작 일시',
  `LEARNING_END_DT` datetime DEFAULT NULL COMMENT '학습 종료 일시',
  `MODEL_STATUS` varchar(20) DEFAULT NULL COMMENT '모델 상태',
  `RLS_YN` char(1) DEFAULT 'N' COMMENT '공개 여부',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  `DATA_USE_TP` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ETC_MODEL_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_model_algrm`
--

DROP TABLE IF EXISTS `tb_meta_etc_model_algrm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_model_algrm` (
  `MODEL_ALGRM_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 알고리즘 순번',
  `MODEL_ALGRM` varchar(20) DEFAULT NULL COMMENT '모델 알고리즘',
  `MODEL_ALGRM_NM` varchar(45) DEFAULT NULL COMMENT '모델 알고리즘 명',
  `RMRK` varchar(4000) DEFAULT NULL COMMENT '비고',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`MODEL_ALGRM_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_model_column`
--

DROP TABLE IF EXISTS `tb_meta_etc_model_column`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_model_column` (
  `ETC_MODEL_COL_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 컬럼 순번. 모델 매개변수 순번',
  `ETC_MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번. 모델 순번',
  `MODEL_COL_TP` varchar(20) DEFAULT NULL COMMENT '모델 컬럼 유형. 모델 메타 순번',
  `MODEL_COL_NM` varchar(200) DEFAULT NULL COMMENT '모델 컬럼 명. 모델 메타 항목 순번',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부. 사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 삭제 여부',
  PRIMARY KEY (`ETC_MODEL_COL_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_model_files`
--

DROP TABLE IF EXISTS `tb_meta_etc_model_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_model_files` (
  `FILE_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '파일 순번',
  `ETC_MODEL_SEQ` int(11) DEFAULT NULL COMMENT '기타 모델 순번',
  `FILE_NM` varchar(100) DEFAULT NULL COMMENT '파일 명',
  `STRG_FILE_NM` varchar(100) DEFAULT NULL COMMENT '저장 파일 명',
  `REF_TP` varchar(20) DEFAULT NULL COMMENT '연관 유형',
  `FILE_PATH` varchar(200) DEFAULT NULL COMMENT '파일 경로',
  `FILE_EXTN` varchar(100) DEFAULT NULL COMMENT '파일 확장자',
  `FILE_SZ` int(11) DEFAULT NULL COMMENT '파일 크기',
  `FILE_LEN` int(11) DEFAULT NULL COMMENT '파일 길이',
  `FILE_CONTS_TP` varchar(200) DEFAULT NULL COMMENT '파일 내용물 유형',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`FILE_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=350 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_model_item`
--

DROP TABLE IF EXISTS `tb_meta_etc_model_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_model_item` (
  `MODEL_PARAMS_ITEM_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 매개변수 항목 순번',
  `MODEL_ALGRM_SEQ` int(11) DEFAULT NULL COMMENT '모델 알고리즘 순번',
  `MODEL_PARAMS_ITEM` varchar(200) DEFAULT NULL COMMENT '모델 매개변수 항목',
  `MODEL_PARAMS_ITEM_NM` varchar(200) DEFAULT NULL COMMENT '모델 매개변수 항목 명',
  `MODEL_PARAMS_ITEM_TP` varchar(20) DEFAULT NULL COMMENT '모델 매개변수 항목 유형',
  `MODEL_PARAMS_ITEM_CRTR_1` varchar(20) DEFAULT NULL COMMENT '모델 매개변수 항목 기준 1번',
  `MODEL_PARAMS_ITEM_CRTR_2` varchar(20) DEFAULT NULL COMMENT '모델 매개변수 항목 기준 2번',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `MODEL_PARAMS_DERPN` varchar(4000) DEFAULT NULL COMMENT '모델 매개변수 설명',
  PRIMARY KEY (`MODEL_PARAMS_ITEM_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_model_log`
--

DROP TABLE IF EXISTS `tb_meta_etc_model_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_model_log` (
  `LOG_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '로그 순번',
  `REF_MODEL_SEQ` int(11) DEFAULT NULL COMMENT '참조 모델 순번',
  `MODEL_ALGRM_SEQ` int(11) DEFAULT NULL COMMENT '모델 알고리즘 번호',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`LOG_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_model_loss`
--

DROP TABLE IF EXISTS `tb_meta_etc_model_loss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_model_loss` (
  `ETC_MODEL_LOSS_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '기타 모델 손실 순번',
  `ETC_MODEL_SEQ` int(11) DEFAULT NULL COMMENT '기타 모델 순번',
  `VRFC_TP` varchar(20) DEFAULT NULL COMMENT '검증 유형',
  `EPOCHS_CNT` int(11) DEFAULT NULL COMMENT '학습차수 수',
  `LOSS` double DEFAULT NULL COMMENT '손실',
  `VRFC_LOSS` double DEFAULT NULL COMMENT '검증 손실',
  `MAE` double DEFAULT NULL COMMENT '평균절대오차',
  `VRFC_MAE` double DEFAULT NULL COMMENT '검증 평균절대오차',
  `USE_YN` char(1) DEFAULT NULL COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT NULL COMMENT '삭제 여부',
  PRIMARY KEY (`ETC_MODEL_LOSS_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=1627 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_model_params`
--

DROP TABLE IF EXISTS `tb_meta_etc_model_params`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_model_params` (
  `MODEL_PARAMS_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 매개변수 순번',
  `ETC_MODEL_SEQ` int(11) DEFAULT NULL COMMENT '기타 모델 순번',
  `MODEL_ALGRM_SEQ` int(11) DEFAULT NULL COMMENT '모델 알고리즘 순번',
  `MODEL_PARAMS_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '모델 매개변수 항목 순번',
  `MODEL_PARAMS_ITEM_VALUE` varchar(100) DEFAULT NULL COMMENT '모델 매개변수 항목 값',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  PRIMARY KEY (`MODEL_PARAMS_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=972 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_etc_user_item`
--

DROP TABLE IF EXISTS `tb_meta_etc_user_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_etc_user_item` (
  `USER_META_ITEM_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '사용자 메타 항목 순번',
  `ETC_MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `ORIGIN_META_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '출처 메타 항목 순번',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  `INDEX_CRTR_YN` char(1) DEFAULT NULL COMMENT '인덱스 기준 여부',
  `USER_PPRCS_FULL_STNG_VALUE` longtext DEFAULT NULL COMMENT 'FULL JSON',
  `SDT_ID` varchar(50) DEFAULT NULL,
  `SDT_OBJ_ID` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`USER_META_ITEM_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model`
--

DROP TABLE IF EXISTS `tb_meta_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model` (
  `MODEL_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 순번',
  `MODEL_NM` varchar(200) DEFAULT NULL COMMENT '모델 명',
  `MODEL_DERPN` text DEFAULT NULL COMMENT '모델 설명',
  `MODEL_ALGRM_SEQ` int(11) DEFAULT NULL COMMENT '모델 알고리즘 순번',
  `INDEX_TRGT_COL` varchar(200) DEFAULT NULL,
  `LEARNING_BGNG_DT` datetime DEFAULT NULL COMMENT '학습 시작 일시',
  `LEARNING_END_DT` datetime DEFAULT NULL COMMENT '학습 종료 일시',
  `JOB_LEVEL` char(1) DEFAULT NULL COMMENT 'P:전처리, M:모델',
  `MODEL_STATUS` varchar(20) DEFAULT NULL COMMENT '모델 상태',
  `RLS_YN` char(1) DEFAULT 'N' COMMENT '공개 여부',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  `DATA_USE_TP` varchar(20) DEFAULT NULL COMMENT 'F:파일, M:메타',
  PRIMARY KEY (`MODEL_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=387 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_algrm`
--

DROP TABLE IF EXISTS `tb_meta_model_algrm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_algrm` (
  `MODEL_ALGRM_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 알고리즘 순번. 모델 메타 순번',
  `MODEL_ALGRM` varchar(20) DEFAULT NULL COMMENT '모델 알고리즘. 모델 메타 코드',
  `MODEL_ALGRM_NM` varchar(45) DEFAULT NULL COMMENT '모델 알고리즘 명. 모델 메타 코드 명',
  `RMRK` varchar(4000) DEFAULT NULL COMMENT '비고. 비고',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서. 순서',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부. 사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번. 등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시. 등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP. 등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번. 수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시. 수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP. 수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번. 삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시. 삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP. 삭제 IP',
  PRIMARY KEY (`MODEL_ALGRM_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_column`
--

DROP TABLE IF EXISTS `tb_meta_model_column`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_column` (
  `MODEL_COL_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 컬럼 순번. 모델 매개변수 순번',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번. 모델 순번',
  `MODEL_COL_TP` varchar(20) DEFAULT NULL COMMENT '모델 컬럼 유형. 모델 메타 순번',
  `MODEL_COL_NM` varchar(200) DEFAULT NULL COMMENT '모델 컬럼 명. 모델 메타 항목 순번',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부. 사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 삭제 여부',
  PRIMARY KEY (`MODEL_COL_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=636 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_fid`
--

DROP TABLE IF EXISTS `tb_meta_model_fid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_fid` (
  `MODEL_FID_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 평가지표 순번',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `EPOCHS` int(11) DEFAULT NULL COMMENT '학습차수',
  `FID_SCORE` double DEFAULT NULL COMMENT '평가지표 점수',
  `REAL_FILE_NM` varchar(500) DEFAULT NULL COMMENT '실제 파일 명',
  `FAKE_FILE_NM` varchar(500) DEFAULT NULL COMMENT '가짜 파일 명',
  `REAL_FAKE_FILE_NM` varchar(500) DEFAULT NULL COMMENT '실제 가짜 파일 명',
  `USE_YN` char(1) DEFAULT NULL COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT NULL COMMENT '삭제 여부',
  PRIMARY KEY (`MODEL_FID_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=8647 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_files`
--

DROP TABLE IF EXISTS `tb_meta_model_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_files` (
  `FILE_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '파일 순번',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `FILE_NM` varchar(100) DEFAULT NULL COMMENT '파일 명',
  `STRG_FILE_NM` varchar(300) DEFAULT NULL,
  `REF_TP` varchar(20) DEFAULT NULL COMMENT '연관 유형',
  `FILE_PATH` varchar(200) DEFAULT NULL COMMENT '파일 경로',
  `FILE_EXTN` varchar(100) DEFAULT NULL COMMENT '파일 확장자',
  `FILE_SZ` int(11) DEFAULT NULL COMMENT '파일 크기',
  `FILE_LEN` int(11) DEFAULT NULL COMMENT '파일 길이',
  `FILE_CONTS_TP` varchar(200) DEFAULT NULL COMMENT '파일 내용물 유형',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`FILE_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=1622 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_item`
--

DROP TABLE IF EXISTS `tb_meta_model_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_item` (
  `MODEL_PARAMS_ITEM_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 매개변수 항목 순번. 모델 메타 항목 순번',
  `MODEL_ALGRM_SEQ` int(11) DEFAULT NULL COMMENT '모델 알고리즘 순번. 모델 메타 순번',
  `MODEL_PARAMS_ITEM` varchar(200) DEFAULT NULL COMMENT '모델 매개변수 항목. 모델 메타 항목',
  `MODEL_PARAMS_ITEM_NM` varchar(200) DEFAULT NULL COMMENT '모델 매개변수 항목 명. 모델 메타 항목 명',
  `MODEL_PARAMS_ITEM_TP` varchar(20) DEFAULT NULL COMMENT '모델 매개변수 항목 유형. 모델 메타 항목 유형(문자형,숫자형,소숫점형,날짜형 등)',
  `MODEL_PARAMS_ITEM_CRTR_1` varchar(20) DEFAULT NULL COMMENT '모델 매개변수 항목 기준 1번. 모델 메타 항목 기준 1번',
  `MODEL_PARAMS_ITEM_CRTR_2` varchar(20) DEFAULT NULL COMMENT '모델 매개변수 항목 기준 2번. 모델 메타 항목 기준 2번',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서. 순서',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부. 사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 삭제 여부',
  `MODEL_PARAMS_DERPN` varchar(4000) DEFAULT NULL COMMENT '모델 매개변수 설명',
  PRIMARY KEY (`MODEL_PARAMS_ITEM_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_log`
--

DROP TABLE IF EXISTS `tb_meta_model_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_log` (
  `LOG_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '로그 순번',
  `REF_SIMULATION_SEQ` int(11) DEFAULT NULL,
  `MODEL_ALGRM_SEQ` int(11) DEFAULT NULL COMMENT '모델 알고리즘 번호',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  PRIMARY KEY (`LOG_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_loss`
--

DROP TABLE IF EXISTS `tb_meta_model_loss`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_loss` (
  `MODEL_LOSS_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 손실 순번',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `VRFC_TP` varchar(20) DEFAULT NULL COMMENT '검증 유형',
  `EPOCHS` int(11) DEFAULT NULL COMMENT '학습차수',
  `LOSS` double DEFAULT NULL COMMENT '손실',
  `VRFC_LOSS` double DEFAULT NULL COMMENT '검증 손실',
  `METRICS_TP` varchar(20) DEFAULT NULL COMMENT '메트릭스 유형',
  `METRICS` double DEFAULT NULL COMMENT '메트릭스',
  `VRFC_METRICS` double DEFAULT NULL COMMENT '검증 메트릭스',
  `USE_YN` char(1) DEFAULT NULL COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT NULL COMMENT '삭제 여부',
  PRIMARY KEY (`MODEL_LOSS_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=8647 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_params`
--

DROP TABLE IF EXISTS `tb_meta_model_params`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_params` (
  `MODEL_PARAMS_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '모델 매개변수 순번',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `MODEL_ALGRM_SEQ` int(11) DEFAULT NULL COMMENT '모델 알고리즘 순번',
  `MODEL_PARAMS_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '모델 매개변수 항목 순번',
  `MODEL_PARAMS_ITEM_VALUE` varchar(100) DEFAULT NULL COMMENT '모델 매개변수 항목 값',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  PRIMARY KEY (`MODEL_PARAMS_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=3230 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_model_xai`
--

DROP TABLE IF EXISTS `tb_meta_model_xai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_model_xai` (
  `MODEL_XAI_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT 'XAI 테이블 로우 번호',
  `SHAP` longtext DEFAULT NULL COMMENT 'SHAP XAI 데이터',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 번호',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_DT` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`MODEL_XAI_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_user_item`
--

DROP TABLE IF EXISTS `tb_meta_user_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_user_item` (
  `USER_META_ITEM_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '사용자 메타 항목 순번',
  `MODEL_SEQ` int(11) DEFAULT NULL COMMENT '모델 순번',
  `ORIGIN_META_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '출처 메타 항목 순번',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  `INDEX_CRTR_YN` char(1) DEFAULT NULL COMMENT '인덱스 기준 여부',
  `USER_PPRCS_FULL_STNG_VALUE` longtext DEFAULT NULL COMMENT 'FULL JSON',
  `SDT_ID` varchar(50) DEFAULT NULL,
  `SDT_OBJ_ID` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`USER_META_ITEM_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=386 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_user_item_preprocess_map_interpl`
--

DROP TABLE IF EXISTS `tb_meta_user_item_preprocess_map_interpl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_user_item_preprocess_map_interpl` (
  `USER_META_ITEM_PPRCS_INTERPL_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '사용자 메타 항목 전처리 보간 순번',
  `USER_META_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '사용자 메타 항목 순번',
  `INTERPL_TP` varchar(20) DEFAULT NULL COMMENT '보간 유형',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  PRIMARY KEY (`USER_META_ITEM_PPRCS_INTERPL_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=227 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_user_item_preprocess_map_outlr`
--

DROP TABLE IF EXISTS `tb_meta_user_item_preprocess_map_outlr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_user_item_preprocess_map_outlr` (
  `USER_META_ITEM_PPRCS_OUTLR_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '사용자 메타 항목 전처리 이상치 순번',
  `USER_META_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '사용자 메타 항목 순번',
  `OUTLR_PRCS_TP` varchar(20) DEFAULT NULL COMMENT '이상치 처리 유형',
  `OUTLR_STANDRD_SMPL` double DEFAULT NULL COMMENT '이상치 표준 샘플',
  `OUTLR_SMPLNG_LEN` int(11) DEFAULT NULL COMMENT '이상치 샘플링 길이',
  `OUTLR_EPS` double DEFAULT NULL COMMENT '이상치 EPS',
  `OUTLR_MIN_SMPL` int(11) DEFAULT NULL COMMENT '이상치 최소 샘플',
  `OUTLR_CLUST_CNT` int(11) DEFAULT NULL COMMENT '이상치 클러스터 수',
  `OUTLR_CLUST_GRP` int(11) DEFAULT NULL COMMENT '이상치 클러스터 그룹',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  PRIMARY KEY (`USER_META_ITEM_PPRCS_OUTLR_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=243 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_user_item_preprocess_map_resmpl`
--

DROP TABLE IF EXISTS `tb_meta_user_item_preprocess_map_resmpl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_user_item_preprocess_map_resmpl` (
  `USER_META_ITEM_PPRCS_RESMPL_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '사용자 메타 항목 전처리 리샘플링 순번',
  `USER_META_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '사용자 메타 항목 순번',
  `RESMPL_TP` varchar(20) DEFAULT NULL COMMENT '리샘플링 유형',
  `RESMPL_INTVL_TP` varchar(20) DEFAULT NULL COMMENT '리샘플링 간격 유형',
  `RESMPL_INTVL_VALUE` int(11) DEFAULT NULL COMMENT '리샘플링 간격 값',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  PRIMARY KEY (`USER_META_ITEM_PPRCS_RESMPL_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=349 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_user_item_preprocess_map_unit`
--

DROP TABLE IF EXISTS `tb_meta_user_item_preprocess_map_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_user_item_preprocess_map_unit` (
  `USER_META_ITEM_PPRCS_UNIT_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '사용자 메타 항목 전처리 단위 순번',
  `USER_META_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '사용자 메타 항목 순번',
  `UNIT_TP` varchar(20) DEFAULT NULL COMMENT '단위 유형',
  `UNIT_CD_1` varchar(20) DEFAULT NULL COMMENT '단위 코드 1번',
  `UNIT_CD_2` varchar(20) DEFAULT NULL COMMENT '단위 코드 2번',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  PRIMARY KEY (`USER_META_ITEM_PPRCS_UNIT_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_meta_user_item_preprocess_map_vrfc`
--

DROP TABLE IF EXISTS `tb_meta_user_item_preprocess_map_vrfc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_meta_user_item_preprocess_map_vrfc` (
  `USER_META_ITEM_PPRCS_VRFC_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '사용자 메타 항목 전처리 검증 순번',
  `USER_META_ITEM_SEQ` int(11) DEFAULT NULL COMMENT '사용자 메타 항목 순번',
  `VRFC_TP` varchar(20) DEFAULT NULL COMMENT '검증 유형',
  `VRFC_CLEAR_TP` varchar(20) DEFAULT NULL COMMENT '검증 지우기 유형',
  `RULE_VALUE_1` varchar(100) DEFAULT NULL COMMENT '규칙 값 1번',
  `RULE_VALUE_2` varchar(100) DEFAULT NULL COMMENT '규칙 값 2번',
  `RULE_VALUE_3` varchar(100) DEFAULT NULL COMMENT '규칙 값 3번',
  `RULE_VALUE_4` varchar(100) DEFAULT NULL COMMENT '규칙 값 4번',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서',
  PRIMARY KEY (`USER_META_ITEM_PPRCS_VRFC_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=186 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_unit`
--

DROP TABLE IF EXISTS `tb_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_unit` (
  `UNIT_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '단위 순번. 단위순번',
  `UNIT_TP` varchar(20) DEFAULT NULL COMMENT '단위 유형. 단위유형',
  `UNIT_NM_1` varchar(200) DEFAULT NULL COMMENT '단위 명 1번. 현재단위명',
  `UNIT_CD_1` varchar(20) DEFAULT NULL COMMENT '단위 코드 1번. 현재단위코드',
  `UNIT_NM_2` varchar(200) DEFAULT NULL COMMENT '단위 명 2번. 변경단위명',
  `UNIT_CD_2` varchar(20) DEFAULT NULL COMMENT '단위 코드 2번. 변경단위코드',
  `UNIT_FORMULA` varchar(200) DEFAULT NULL COMMENT '단위 공식. 단위공식',
  `FORMULA_DERPN` text DEFAULT NULL COMMENT '공식 설명. 공식설명',
  `ORDBY` int(11) DEFAULT NULL COMMENT '순서. 순서',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부. 사용여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부. 삭제여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번. 등록사용자순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시. 등록일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP. 등록IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번. 수정사용자순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시. 수정일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP. 수정IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번. 삭제사용자순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시. 삭제일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP. 삭제IP',
  PRIMARY KEY (`UNIT_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci COMMENT='단위';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_user`
--

DROP TABLE IF EXISTS `tb_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_user` (
  `USER_SEQ` int(11) NOT NULL AUTO_INCREMENT COMMENT '사용자 순번',
  `USER_ID` varchar(20) DEFAULT NULL COMMENT '사용자 아이디',
  `USER_PW` varchar(200) DEFAULT NULL COMMENT '사용자 비밀번호',
  `USER_NM` varchar(45) DEFAULT NULL COMMENT '사용자 명',
  `USER_AUTH_CD` varchar(20) DEFAULT NULL COMMENT '사용자 권한 코드',
  `UNIQ_IDN_KEY` varchar(200) DEFAULT NULL COMMENT '고유 식별 키',
  `USER_EML` varchar(100) DEFAULT NULL COMMENT '사용자 이메일',
  `USER_BIRTH_YMD` char(8) DEFAULT NULL COMMENT '사용자 생일 일자',
  `USER_CONT_1` varchar(20) DEFAULT NULL COMMENT '사용자 연락처 1번',
  `USER_CONT_2` varchar(20) DEFAULT NULL COMMENT '사용자 연락처 2번',
  `USER_CONT_3` varchar(20) DEFAULT NULL COMMENT '사용자 연락처 3번',
  `USER_HP_1` varchar(20) DEFAULT NULL COMMENT '사용자 휴대폰 1번',
  `USER_HP_2` varchar(20) DEFAULT NULL COMMENT '사용자 휴대폰 2번',
  `USER_HP_3` varchar(20) DEFAULT NULL COMMENT '사용자 휴대폰 3번',
  `USER_ZIP` varchar(20) DEFAULT NULL COMMENT '사용자 우편번호',
  `USER_ROAD_NM_ADDR` varchar(200) DEFAULT NULL COMMENT '사용자 도로 명 주소',
  `USER_LOTNO_ADDR` varchar(200) DEFAULT NULL COMMENT '사용자 지번 주소',
  `USER_DTL_ADDR` varchar(200) DEFAULT NULL COMMENT '사용자 상세 주소',
  `TNCND_AGRE_YN` char(1) DEFAULT NULL COMMENT '이용약관 동의 여부',
  `PRVC_AGRE_YN` char(1) DEFAULT NULL COMMENT '개인정보 동의 여부',
  `INFO_PVSN_AGRE_YN` char(1) DEFAULT NULL COMMENT '정보 제공 동의 여부',
  `USE_YN` char(1) DEFAULT 'Y' COMMENT '사용 여부',
  `DEL_YN` char(1) DEFAULT 'N' COMMENT '삭제 여부',
  `REG_USER_SEQ` int(11) DEFAULT NULL COMMENT '등록 사용자 순번',
  `REG_DT` datetime DEFAULT current_timestamp() COMMENT '등록 일시',
  `REG_IP` varchar(50) DEFAULT NULL COMMENT '등록 IP',
  `MDFCN_USER_SEQ` int(11) DEFAULT NULL COMMENT '수정 사용자 순번',
  `MDFCN_DT` datetime DEFAULT NULL COMMENT '수정 일시',
  `MDFCN_IP` varchar(50) DEFAULT NULL COMMENT '수정 IP',
  `DEL_USER_SEQ` int(11) DEFAULT NULL COMMENT '삭제 사용자 순번',
  `DEL_DT` datetime DEFAULT NULL COMMENT '삭제 일시',
  `DEL_IP` varchar(50) DEFAULT NULL COMMENT '삭제 IP',
  `LAST_LGN_DT` datetime DEFAULT NULL COMMENT '최종 로그인 일시',
  PRIMARY KEY (`USER_SEQ`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'dt_data_platform'
--

--
-- Dumping routines for database 'dt_data_platform'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-01 11:02:23
