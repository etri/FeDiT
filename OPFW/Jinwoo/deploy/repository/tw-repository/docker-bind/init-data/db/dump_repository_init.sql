-- MySQL dump 10.13  Distrib 8.0.28, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: test_repository
-- ------------------------------------------------------
-- Server version	8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `data_category_desc`
--

DROP TABLE IF EXISTS `data_category_desc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_category_desc` (
  `category` varchar(20) NOT NULL COMMENT '@SelectWhere,@UpdateWhere,@DeleteWhere',
  `name` varchar(50) DEFAULT NULL COMMENT 'name',
  `icon` varchar(200) DEFAULT NULL COMMENT '@UpdateSet',
  `icon_file_id` bigint DEFAULT NULL COMMENT 'icon_file_id',
  `description` varchar(250) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '@UpdateSet',
  `REG_ID` bigint DEFAULT NULL COMMENT '등록인ID',
  `REG_DT` timestamp NULL DEFAULT NULL COMMENT '등록일시',
  `DEL_ID` bigint DEFAULT NULL COMMENT '삭제인ID',
  `DEL_DT` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AUTOGEN-DataCategoryDesc:net.jw.twin.repository.db.dataCategoryDesc';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_category_desc`
--

LOCK TABLES `data_category_desc` WRITE;
/*!40000 ALTER TABLE `data_category_desc` DISABLE KEYS */;
INSERT INTO `data_category_desc` (`category`, `name`, `icon`, `icon_file_id`, `description`, `REG_ID`, `REG_DT`, `DEL_ID`, `DEL_DT`) VALUES ('environment','환경',NULL,38,'날씨, 미세먼지 정보 등',1,'2024-08-13 01:29:10',NULL,NULL),('test','test',NULL,37,'test',1,'2024-08-13 01:05:52',1,'2024-09-19 07:45:57'),('tourism','관광',NULL,39,'관광지 정보, 이미지 정보 등',1,'2024-08-13 01:30:30',NULL,NULL),('traffic','교통',NULL,40,'교통현황, vvms, 주차장 정보 등 ',1,'2024-08-13 01:31:02',NULL,NULL);
/*!40000 ALTER TABLE `data_category_desc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_item`
--

DROP TABLE IF EXISTS `data_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(20) NOT NULL COMMENT '분류',
  `type` varchar(30) NOT NULL,
  `name` varchar(50) NOT NULL,
  `data_code` varchar(30) DEFAULT NULL,
  `status` varchar(20) NOT NULL COMMENT 'status',
  `swagger_tag_list` varchar(2000) DEFAULT NULL,
  `api_type` varchar(20) DEFAULT NULL,
  `data_format` varchar(20) DEFAULT NULL,
  `service_id` varchar(50) DEFAULT NULL,
  `external_url` varchar(200) DEFAULT NULL,
  `rest_url` varchar(200) DEFAULT NULL,
  `rest_ip` varchar(200) DEFAULT NULL COMMENT 'rest_ip',
  `rest_port` smallint unsigned DEFAULT NULL COMMENT 'rest_port',
  `swagger_url` varchar(200) DEFAULT NULL,
  `swagger_homepath` varchar(50) DEFAULT NULL,
  `institution_id` bigint DEFAULT NULL COMMENT 'institution_id',
  `description` varchar(2000) DEFAULT NULL,
  `approval_time` timestamp NULL DEFAULT NULL COMMENT '승인일시',
  `denial_time` timestamp NULL DEFAULT NULL COMMENT '거절일시',
  `deprecated_time` timestamp NULL DEFAULT NULL COMMENT '사용정지일시',
  `current_call_count` int DEFAULT NULL COMMENT 'current_call_count',
  `max_call_count` int DEFAULT NULL COMMENT 'max_call_count',
  `REG_ID` bigint DEFAULT NULL COMMENT '등록인ID',
  `REG_DT` timestamp NULL DEFAULT NULL COMMENT '등록일시',
  `DEL_ID` bigint DEFAULT NULL COMMENT '삭제인ID',
  `DEL_DT` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  KEY `data_item_category_index` (`category` DESC),
  KEY `data_item_name_index` (`name` DESC),
  KEY `data_item_rest_ip_index` (`rest_ip` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_item`
--

LOCK TABLES `data_item` WRITE;
/*!40000 ALTER TABLE `data_item` DISABLE KEYS */;
INSERT INTO `data_item` (`id`, `category`, `type`, `name`, `data_code`, `status`, `swagger_tag_list`, `api_type`, `data_format`, `service_id`, `external_url`, `rest_url`, `rest_ip`, `rest_port`, `swagger_url`, `swagger_homepath`, `institution_id`, `description`, `approval_time`, `denial_time`, `deprecated_time`, `current_call_count`, `max_call_count`, `REG_ID`, `REG_DT`, `DEL_ID`, `DEL_DT`) VALUES (1,'environment','TWIN','환경트윈',NULL,'approved',NULL,'REST','JSON','twin1','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103','api-docs',2,NULL,'2024-06-21 02:22:09',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(2,'traffic','TWIN','교통트윈',NULL,'approved',NULL,'REST','JSON','twin2','','http://192.168.62.152:8202','http://192.168.62.152',8202,'http://192.168.62.152:8203','api-docs',2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(3,'tourism','TWIN','관광트윈',NULL,'approved',NULL,'REST','JSON','twin3','','http://192.168.62.152:8302','http://192.168.62.152',8302,'http://192.168.62.152:8303','api-docs',2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(4,'environment','RAWDATA','대기오염정보','air-quality','approved','air-quality','REST','JSON','data1','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103','api-docs',2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(5,'environment','RAWDATA','해수욕장수온정보','beach-water-temperature','approved','beach-water-temperature','REST','JSON','data2','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(6,'environment','RAWDATA','해수욕장파고정보','beach-wave-height','approved','beach-wave-height','REST','JSON','data3','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(7,'environment','RAWDATA','해수욕장날씨','beach-weather','approved','beach-weather','REST','JSON','data4','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(8,'environment','RAWDATA','날씨건강지수','health-weather','approved','health-weather','REST','JSON','data5','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(9,'environment','RAWDATA','날씨생활지수','life-weather','approved','life-weather','REST','JSON','data6','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(10,'environment','RAWDATA','날씨-초단기예보','weather-ultra-srt-fcst','approved','weather-ultra-srt-fcst','REST','JSON','data7','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(11,'environment','RAWDATA','날씨-초단기실황','weather-ultra-srt-ncst','approved','weather-ultra-srt-ncst','REST','JSON','data8','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(12,'environment','RAWDATA','날씨-단기예보','weather-vilage-fcst','approved','weather-vilage-fcst','REST','JSON','data9','','http://192.168.62.152:8102','http://192.168.62.152',8102,'http://192.168.62.152:8103',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(13,'traffic','RAWDATA','공항이용객','airport-passenger','approved','airport-pax','REST','JSON','data10','','http://192.168.62.152:8202','http://192.168.62.152',8202,'http://192.168.62.152:8203',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(14,'traffic','RAWDATA','주차장정보','parkinglotstatus','approved','parking-lot-status','REST','JSON','data11','','http://192.168.62.152:8202','http://192.168.62.152',8202,'http://192.168.62.152:8203',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(15,'traffic','RAWDATA','도로노면상태정보','road-condition','approved','road-condition','REST','JSON','data12','','http://192.168.62.152:8202','http://192.168.62.152',8202,'http://192.168.62.152:8203',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(16,'traffic','RAWDATA','도로상황정보','road-operation-status','deprecated','road-operation-status','REST','JSON','data13','','http://192.168.62.152:8202','http://192.168.62.152',8202,'http://192.168.62.152:8203',NULL,2,NULL,'2024-06-18 06:41:03',NULL,'2024-06-21 13:10:54',NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(17,'traffic','RAWDATA','교통정보','traffic','approved','traffic','REST','JSON','data14','','http://192.168.62.152:8202','http://192.168.62.152',8202,'http://192.168.62.152:8203',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(18,'traffic','RAWDATA','vvms','vvms','approved','vvms','REST','JSON','data15','','http://192.168.62.152:8202','http://192.168.62.152',8202,'http://192.168.62.152:8203',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(19,'tourism','RAWDATA','방문객','visitor','approved','visitor','REST','JSON','data16','','http://192.168.62.152:8302','http://192.168.62.152',8302,'http://192.168.62.152:8303',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(20,'tourism','RAWDATA','관광지정보','visitjeju','approved','visitjeju','REST','JSON','data17','','http://192.168.62.152:8302','http://192.168.62.152',8302,'http://192.168.62.152:8303',NULL,2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-18 06:41:03',NULL,NULL),(21,'tourism','RAWDATA','관광지 이미지','visitjeju-image','approved','visitjeju-image','REST','JSON','data18','','http://192.168.62.152:8302','http://192.168.62.152',8302,'http://192.168.62.152:8303','',2,NULL,'2024-06-18 06:41:03',NULL,NULL,NULL,NULL,1,'2024-06-21 02:46:53',NULL,NULL),(25,'traffic','TWIN','222',NULL,'waiting','555','REST','JSON','333','111',NULL,NULL,NULL,NULL,'444',2,'999',NULL,NULL,NULL,NULL,NULL,22,'2024-06-21 02:46:17',1,'2024-06-20 06:35:46'),(26,'tourism','TWIN','222','','denied','555','REST','JSON','333','111',NULL,NULL,NULL,NULL,'444',2,'999',NULL,'2024-06-20 08:07:21',NULL,NULL,NULL,22,'2024-06-20 07:23:07',NULL,NULL),(27,'traffic','TWIN','22222',NULL,'deprecated','55555','REST','JSON','33333','11111',NULL,NULL,NULL,NULL,'44444',2,'99999','2024-06-21 06:50:26',NULL,'2024-06-21 13:02:12',NULL,NULL,22,'2024-06-21 06:33:38',NULL,NULL),(28,'environment','TWIN','22222',NULL,'denied','55555','REST','JSON','33333','11111',NULL,NULL,NULL,NULL,'44444',2,'99999',NULL,'2024-06-21 06:51:33',NULL,NULL,NULL,22,'2024-06-21 06:51:09',NULL,NULL),(29,'traffic','RWADATA','333','111','approved','555','REST','JSON','service','222',NULL,NULL,NULL,NULL,'444',2,'','2024-06-28 04:32:25',NULL,NULL,NULL,NULL,22,'2024-06-28 02:19:29',NULL,NULL),(30,'environment','TWIN','2222',NULL,'denied','5555','REST','JSON','3333','11111',NULL,NULL,NULL,NULL,'4444',2,'',NULL,'2024-07-29 08:02:46',NULL,NULL,NULL,22,'2024-06-28 02:24:36',NULL,NULL),(31,'traffic','TWIN','bbbbbbbbbbbbbb',NULL,'approved','eeeeeeeeeeeeeeee','REST','JSON','cccccccccccccccc','aaaaaaaaaaaaaa','http://192.168.62.152:8302','http://192.168.62.152',8302,'http://192.168.62.152:8303','ddddddddddddddd',2,'','2024-07-29 08:00:04',NULL,NULL,NULL,NULL,22,'2024-07-03 06:59:20',NULL,NULL),(32,'traffic','RAWDATA','333','111','waiting','666','REST','JSON','444','222',NULL,NULL,NULL,NULL,'555',2,'',NULL,NULL,NULL,NULL,NULL,27,'2024-08-08 01:45:53',NULL,NULL),(33,'traffic','RAWDATA','대기오염정보','111','waiting','555','REST','JSON','ccc','222',NULL,NULL,NULL,NULL,'555',1,'',NULL,NULL,NULL,NULL,NULL,28,'2024-08-08 01:48:18',NULL,NULL),(34,'traffic','RAWDATA','대기오염정보22','111','approved','555','REST','JSON','ccc','222',NULL,NULL,NULL,NULL,'555',2,'','2024-08-08 04:37:01',NULL,NULL,NULL,NULL,29,'2024-08-08 01:48:55',NULL,NULL),(35,'traffic','RAWDATA','11',NULL,'waiting','','REST','JSON','',NULL,NULL,'111.222.222.222',111,'http://111','11',2,'',NULL,NULL,NULL,NULL,NULL,22,'2024-09-10 04:35:51',NULL,NULL),(36,'traffic','TWIN','aaaaa',NULL,'waiting','','REST','JSON','',NULL,NULL,'111.222.222.222',111,'http://111','555',2,'',NULL,NULL,NULL,NULL,NULL,22,'2024-09-10 04:51:54',NULL,NULL),(37,'traffic','TWIN','대기오염정보',NULL,'waiting','','REST','JSON','',NULL,NULL,'111.222.222.222',111,'http://111','555',2,'',NULL,NULL,NULL,NULL,NULL,22,'2024-09-10 04:55:35',NULL,NULL),(38,'traffic','TWIN','대기오염정보',NULL,'waiting','','REST','JSON','ccc','http://111',NULL,NULL,NULL,NULL,'555',2,'',NULL,NULL,NULL,NULL,NULL,22,'2024-09-11 04:33:35',NULL,NULL);
/*!40000 ALTER TABLE `data_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_use`
--

DROP TABLE IF EXISTS `data_use`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_use` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '@AutoIncrease,@SelectWhere,@UpdateWhere,@DeleteWhere',
  `data_id` bigint NOT NULL COMMENT '@SelectWhere,@UpdateSet',
  `purpose` varchar(2000) DEFAULT NULL COMMENT '@UpdateSet',
  `status` varchar(20) NOT NULL COMMENT '@SelectWhere,@UpdateSet',
  `approval_time` timestamp NULL DEFAULT NULL COMMENT '@UpdateSet',
  `denial_time` timestamp NULL DEFAULT NULL COMMENT '@UpdateSet',
  `expire_time` timestamp NULL DEFAULT NULL COMMENT '@SelectWhereStartTimeStamp,@SelectWhereEndTimeStampLess,@UpdateSet',
  `current_call_count` int DEFAULT '0' COMMENT '@UpdateSet',
  `max_call_count` int DEFAULT NULL COMMENT '@UpdateSet',
  `REG_ID` bigint NOT NULL COMMENT '등록인ID',
  `REG_DT` timestamp NOT NULL COMMENT '등록일시',
  `DEL_ID` bigint DEFAULT NULL COMMENT '삭제인ID',
  `DEL_DT` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  KEY `IX_data_use` (`REG_ID`),
  KEY `IX_data_use2` (`REG_DT`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AUTOGEN-DataUse:net.jw.twin.repository.db.dataUse';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_use`
--

LOCK TABLES `data_use` WRITE;
/*!40000 ALTER TABLE `data_use` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_use` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `institution`
--

DROP TABLE IF EXISTS `institution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `institution` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '@AutoIncrease,@SelectWhere,@UpdateWhere,@DeleteWhere',
  `name` varchar(50) DEFAULT NULL COMMENT '@SelectWhereLike,@UpdateSet',
  `manager_user_id` bigint DEFAULT NULL COMMENT '관리자',
  `address` varchar(255) DEFAULT NULL COMMENT '@UpdateSet',
  `address_detail` varchar(255) DEFAULT NULL COMMENT '@UpdateSet',
  `zip_code` varchar(12) DEFAULT NULL COMMENT '@UpdateSet',
  `phone_number` varchar(30) DEFAULT NULL COMMENT '@UpdateSet',
  `REG_ID` bigint NOT NULL COMMENT '@SelectWhere, @DeleteWhere',
  `REG_DT` timestamp NOT NULL COMMENT '@SelectWhereStartTimeStamp,@SelectWhereEndTimeStampLess,@UpdateSet',
  `DEL_ID` bigint DEFAULT NULL COMMENT '삭제자',
  `DEL_DT` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  KEY `IX_institution` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기관';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `institution`
--

LOCK TABLES `institution` WRITE;
/*!40000 ALTER TABLE `institution` DISABLE KEYS */;
INSERT INTO `institution` (`id`, `name`, `manager_user_id`, `address`, `address_detail`, `zip_code`, `phone_number`, `REG_ID`, `REG_DT`, `DEL_ID`, `DEL_DT`) VALUES (1,'1',NULL,'2','3','4','5',1,'2024-08-02 07:30:27',NULL,NULL),(2,'진우소프트이노베이션',22,'제주도 첨단로8길 40','310','63243','064-742-1816',1,'2024-08-02 08:12:19',NULL,NULL);
/*!40000 ALTER TABLE `institution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_cd`
--

DROP TABLE IF EXISTS `jcms_cd`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_cd` (
  `CD_ID` varchar(20) NOT NULL,
  `CD_CLS_ID` varchar(20) DEFAULT NULL,
  `CD_NM` varchar(50) DEFAULT NULL,
  `CD_DESC` varchar(250) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  `DEL_ID` bigint DEFAULT NULL,
  `DEL_DT` datetime DEFAULT NULL,
  `REC_ST` char(1) DEFAULT NULL,
  PRIMARY KEY (`CD_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_cd`
--

LOCK TABLES `jcms_cd` WRITE;
/*!40000 ALTER TABLE `jcms_cd` DISABLE KEYS */;
INSERT INTO `jcms_cd` (`CD_ID`, `CD_CLS_ID`, `CD_NM`, `CD_DESC`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`, `DEL_ID`, `DEL_DT`, `REC_ST`) VALUES ('dataApiType','cms','데이터API 타입','',1,'2024-06-19 17:40:33',NULL,NULL,NULL,NULL,'Y'),('dataClassification','cms','데이터분류','데이터분류',1,'2024-06-18 16:49:31',NULL,NULL,NULL,NULL,'Y'),('dataFormat','cms','데이터포맷','',1,'2024-06-19 17:42:04',NULL,NULL,NULL,NULL,'Y'),('dataStatus','cms','데이터상태','',1,'2024-06-21 17:10:09',NULL,NULL,NULL,NULL,'Y'),('dataType','cms','데이터타입','rawData or twinData',1,'2023-05-22 15:16:45',NULL,NULL,NULL,NULL,'Y'),('deleteSt','cms','삭제여부코드','삭제여부코드',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('lang','cms','언어','홈페이지 언어',1,'2021-10-22 00:00:00',1,'2021-10-05 00:00:00',NULL,NULL,'Y'),('program','cms','프로그램 타입','프로그램 타입',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('raw_data_code','cms','raw 데이터 코드',NULL,1,'2023-05-31 17:18:17',NULL,NULL,NULL,NULL,'Y'),('restKeyStatus','cms','RestKey 상태',NULL,1,'2023-05-22 14:50:58',NULL,NULL,NULL,NULL,'Y'),('userSt','cms','사용자상태코드','사용자상태코드',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('useYn','cms','사용여부코드','사용여부코드',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y');
/*!40000 ALTER TABLE `jcms_cd` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_cd_cls`
--

DROP TABLE IF EXISTS `jcms_cd_cls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_cd_cls` (
  `CD_CLS_ID` varchar(20) NOT NULL,
  `CD_CLS_NM` varchar(50) DEFAULT NULL,
  `CD_CLS_DESC` varchar(250) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  `DEL_ID` bigint DEFAULT NULL,
  `DEL_DT` datetime DEFAULT NULL,
  `REC_ST` char(1) DEFAULT NULL,
  PRIMARY KEY (`CD_CLS_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_cd_cls`
--

LOCK TABLES `jcms_cd_cls` WRITE;
/*!40000 ALTER TABLE `jcms_cd_cls` DISABLE KEYS */;
INSERT INTO `jcms_cd_cls` (`CD_CLS_ID`, `CD_CLS_NM`, `CD_CLS_DESC`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`, `DEL_ID`, `DEL_DT`, `REC_ST`) VALUES ('cms','cms','CMS에서 사용하는 코드 목록',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y');
/*!40000 ALTER TABLE `jcms_cd_cls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_cd_dtl`
--

DROP TABLE IF EXISTS `jcms_cd_dtl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_cd_dtl` (
  `CD_DTL_ID` varchar(30) NOT NULL,
  `CD_ID` varchar(30) DEFAULT NULL,
  `CD_DTL_NM` varchar(50) DEFAULT NULL,
  `CD_DTL_LABEL` varchar(50) DEFAULT NULL,
  `CD_DTL_DESC` varchar(250) DEFAULT NULL,
  `CD_DTL_ORD` int DEFAULT NULL,
  `CD_DTL_ACTIVE_ICON` bigint DEFAULT NULL,
  `CD_DTL_INACTIVE_ICON` bigint DEFAULT NULL,
  `CD_DTL_CUSTOM_INT` int DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  `DEL_ID` bigint DEFAULT NULL,
  `DEL_DT` datetime DEFAULT NULL,
  `REC_ST` char(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_cd_dtl`
--

LOCK TABLES `jcms_cd_dtl` WRITE;
/*!40000 ALTER TABLE `jcms_cd_dtl` DISABLE KEYS */;
INSERT INTO `jcms_cd_dtl` (`CD_DTL_ID`, `CD_ID`, `CD_DTL_NM`, `CD_DTL_LABEL`, `CD_DTL_DESC`, `CD_DTL_ORD`, `CD_DTL_ACTIVE_ICON`, `CD_DTL_INACTIVE_ICON`, `CD_DTL_CUSTOM_INT`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`, `DEL_ID`, `DEL_DT`, `REC_ST`) VALUES ('0','useYn','사용중','success','사용중',1,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('1','userSt','사용중','success','사용중',1,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('1','useYn','사용중지','default','사용중지',2,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('8','userSt','사용중지','default','사용중지',8,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('9','userSt','탈퇴','danger','탈퇴',9,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('board','program','게시판','info','게시판 메뉴',5,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('cont','program','콘텐츠','warning','콘텐츠 메뉴',4,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('ko','lang','한글','success','한국어',1,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('link','program','링크','success','링크 메뉴',3,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('N','deleteSt','미삭제','default','미삭제',3,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('pgm','program','프로그램','default','프로그램 메뉴',2,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('ready','program','준비중','default','준비중 메뉴',1,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('Y','deleteSt','삭제됨','success','삭제됨',2,NULL,NULL,NULL,1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'Y'),('applying','restKeyStatus','신청중','primary',NULL,0,NULL,NULL,NULL,1,'2023-05-22 14:53:46',1,'2023-05-22 14:55:27',NULL,NULL,'Y'),('approved','restKeyStatus','승인','success',NULL,1,NULL,NULL,NULL,1,'2023-05-22 14:54:53',NULL,NULL,NULL,NULL,'Y'),('disposed','restKeyStatus','폐기','default',NULL,2,NULL,NULL,NULL,1,'2023-05-22 14:56:07',NULL,NULL,NULL,NULL,'Y'),('rawData','dataType','rawData','primary',NULL,0,NULL,NULL,NULL,1,'2023-05-22 15:17:15',NULL,NULL,NULL,NULL,'Y'),('twinData','dataType','twinData','success',NULL,1,NULL,NULL,NULL,1,'2023-05-22 15:17:32',NULL,NULL,NULL,NULL,'Y'),('air_quality','raw_data_code','대기오염정보','default',NULL,1,NULL,NULL,NULL,1,'2023-05-31 17:25:39',1,'2023-05-31 17:27:13',NULL,NULL,'Y'),('weather','raw_data_code','날씨정보','primary',NULL,2,NULL,NULL,NULL,1,'2023-05-31 17:26:08',1,'2023-05-31 17:27:08',NULL,NULL,'Y'),('health_weather_index','raw_data_code','보건기상지수','success',NULL,4,NULL,NULL,NULL,1,'2023-05-31 17:26:35',1,'2023-05-31 17:27:00',NULL,NULL,'Y'),('life_weather_index','raw_data_code','생활기상지수','info',NULL,3,NULL,NULL,NULL,1,'2023-05-31 17:27:31',NULL,NULL,NULL,NULL,'Y'),('road_condition','raw_data_code','노면기상정보','warning',NULL,5,NULL,NULL,NULL,1,'2023-05-31 17:27:53',NULL,NULL,NULL,NULL,'Y'),('traffic','raw_data_code','실시간교통정보','default',NULL,6,NULL,NULL,NULL,1,'2023-05-31 17:28:15',NULL,NULL,NULL,NULL,'Y'),('traffic','dataClassification','교통','default','',0,NULL,NULL,NULL,1,'2024-06-18 16:50:13',NULL,NULL,NULL,NULL,'Y'),('environment','dataClassification','환경','default','',1,NULL,NULL,NULL,1,'2024-06-18 16:51:34',NULL,NULL,NULL,NULL,'Y'),('tourism','dataClassification','관광','default','',2,NULL,NULL,NULL,1,'2024-06-18 16:51:58',NULL,NULL,NULL,NULL,'Y'),('REST','dataApiType','REST','default','',0,1,NULL,NULL,1,'2024-06-19 17:41:32',1,'2024-08-12 19:49:50',NULL,NULL,'Y'),('JSON','dataFormat','JSON','default','',0,NULL,NULL,NULL,1,'2024-06-19 17:42:27',NULL,NULL,NULL,NULL,'Y'),('waiting','dataStatus','승인대기','default','',0,NULL,NULL,NULL,1,'2024-06-21 17:10:46',NULL,NULL,NULL,NULL,'Y'),('approved','dataStatus','승인','default','',1,NULL,NULL,NULL,1,'2024-06-21 17:11:22',NULL,NULL,NULL,NULL,'Y'),('denied','dataStatus','거부','default','',2,NULL,NULL,NULL,1,'2024-06-21 17:11:48',NULL,NULL,NULL,NULL,'Y'),('deprecated','dataStatus','사용중지','default','',3,NULL,NULL,NULL,1,'2024-06-21 17:12:05',NULL,NULL,NULL,NULL,'Y'),('test','dataApiType','test','default','',2,1,NULL,NULL,1,'2024-08-12 19:57:24',NULL,NULL,NULL,NULL,'Y');
/*!40000 ALTER TABLE `jcms_cd_dtl` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_file`
--

DROP TABLE IF EXISTS `jcms_file`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_file` (
  `FILE_ID` bigint NOT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`FILE_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_file`
--

LOCK TABLES `jcms_file` WRITE;
/*!40000 ALTER TABLE `jcms_file` DISABLE KEYS */;
/*!40000 ALTER TABLE `jcms_file` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_file_item`
--

DROP TABLE IF EXISTS `jcms_file_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_file_item` (
  `ITEM_ID` bigint NOT NULL AUTO_INCREMENT,
  `FILE_ID` bigint DEFAULT NULL,
  `FILE_NM` varchar(200) DEFAULT NULL,
  `FILE_EXT` varchar(20) DEFAULT NULL,
  `MEDIA_TP` varchar(150) DEFAULT NULL,
  `FILE_SIZE` int DEFAULT NULL,
  `SAVE_PATH` varchar(500) DEFAULT NULL,
  `SAVE_FILE_NM` varchar(200) DEFAULT NULL,
  `DWN_CNT` int DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`ITEM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_file_item`
--

LOCK TABLES `jcms_file_item` WRITE;
/*!40000 ALTER TABLE `jcms_file_item` DISABLE KEYS */;
INSERT INTO `jcms_file_item` (`ITEM_ID`, `FILE_ID`, `FILE_NM`, `FILE_EXT`, `MEDIA_TP`, `FILE_SIZE`, `SAVE_PATH`, `SAVE_FILE_NM`, `DWN_CNT`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`) VALUES (37,NULL,'description.png','png','image/png',1,'icon/','test.png',0,1,'2024-08-13 10:05:52',1,'2024-08-13 11:38:28'),(38,NULL,'partly_cloudy_day.png','png','image/png',1,'icon/','partly_cloudy_day.png',0,1,'2024-08-13 10:29:10',NULL,NULL),(39,NULL,'explore.png','png','image/png',2,'icon/','explore.png',0,1,'2024-08-13 10:30:30',NULL,NULL),(40,NULL,'delete.png','png','image/png',1,'icon/','directions_car.png',0,1,'2024-08-13 10:31:02',1,'2024-08-13 11:21:16');
/*!40000 ALTER TABLE `jcms_file_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_login_log`
--

DROP TABLE IF EXISTS `jcms_login_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_login_log` (
  `LOGIN_LOG_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_ID` bigint DEFAULT NULL,
  `LOGIN_IP` varchar(50) DEFAULT NULL,
  `LOGIN_DT` datetime DEFAULT NULL,
  `LOGOUT_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`LOGIN_LOG_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1617 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_login_log`
--

LOCK TABLES `jcms_login_log` WRITE;
/*!40000 ALTER TABLE `jcms_login_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `jcms_login_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_menu`
--

DROP TABLE IF EXISTS `jcms_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_menu` (
  `MENU_ID` bigint NOT NULL AUTO_INCREMENT,
  `MENU_NM` varchar(50) DEFAULT NULL,
  `UPPER_MENU_ID` bigint DEFAULT NULL,
  `MENU_URL` varchar(200) DEFAULT NULL,
  `MENU_DESC` varchar(2000) DEFAULT NULL,
  `MENU_ORD` int DEFAULT NULL,
  `MENU_TP` varchar(20) DEFAULT NULL,
  `LINK_URL` varchar(200) DEFAULT NULL,
  `LINK_TP` varchar(20) DEFAULT NULL,
  `CONT_DISP_TP` varchar(20) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  `DEL_ID` bigint DEFAULT NULL,
  `DEL_DT` datetime DEFAULT NULL,
  `REC_ST` char(1) DEFAULT NULL,
  PRIMARY KEY (`MENU_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_menu`
--

LOCK TABLES `jcms_menu` WRITE;
/*!40000 ALTER TABLE `jcms_menu` DISABLE KEYS */;
INSERT INTO `jcms_menu` (`MENU_ID`, `MENU_NM`, `UPPER_MENU_ID`, `MENU_URL`, `MENU_DESC`, `MENU_ORD`, `MENU_TP`, `LINK_URL`, `LINK_TP`, `CONT_DISP_TP`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`, `DEL_ID`, `DEL_DT`, `REC_ST`) VALUES (1,'메인',NULL,'main',NULL,0,'pgm',NULL,NULL,NULL,1,'2019-08-21 00:00:00',NULL,NULL,NULL,NULL,'Y');
/*!40000 ALTER TABLE `jcms_menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_mngr_menu`
--

DROP TABLE IF EXISTS `jcms_mngr_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_mngr_menu` (
  `MENU_ID` bigint NOT NULL AUTO_INCREMENT,
  `MENU_NM` varchar(50) DEFAULT NULL,
  `ONLY_SYSTEM` tinyint DEFAULT NULL,
  `UPPER_MENU_ID` bigint DEFAULT NULL,
  `MENU_DESC` varchar(2000) DEFAULT NULL,
  `MENU_ORD` int DEFAULT NULL,
  `PGM_ID` bigint DEFAULT NULL,
  `ICON` varchar(50) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  `DEL_ID` bigint DEFAULT NULL,
  `DEL_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`MENU_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1020 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_mngr_menu`
--

LOCK TABLES `jcms_mngr_menu` WRITE;
/*!40000 ALTER TABLE `jcms_mngr_menu` DISABLE KEYS */;
INSERT INTO `jcms_mngr_menu` (`MENU_ID`, `MENU_NM`, `ONLY_SYSTEM`, `UPPER_MENU_ID`, `MENU_DESC`, `MENU_ORD`, `PGM_ID`, `ICON`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`, `DEL_ID`, `DEL_DT`) VALUES (1,'시스템 관리',1,NULL,NULL,5,25,'brightness_high',1,'2021-10-22 00:00:00',1,NULL,NULL,NULL),(2,'시스템 프로그램 관리',1,1,NULL,0,25,'label_important',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL),(3,'시스템 메뉴 관리',1,1,NULL,1,26,'label_important',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL),(4,'코드 관리',1,1,NULL,2,27,'label_important',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL),(8,'사용자 관리',0,NULL,NULL,3,1,'account_box',1,'2021-10-22 00:00:00',1,NULL,NULL,NULL),(9,'회원 관리',0,8,NULL,0,1,'label_important',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL),(10,'로그인 이력',0,8,NULL,1,4,'label_important',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL),(11,'사용이력',0,8,NULL,2,5,'label_important',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL),(25,'통계',0,NULL,NULL,6,23,'insert_chart',1,'2021-10-22 00:00:00',1,NULL,NULL,NULL),(26,'사용자 접속 통계',0,25,NULL,0,23,'label_important',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL),(160,'대시보드',NULL,NULL,NULL,0,101,'all_inbox',1,'2021-10-22 00:00:00',1,'2023-05-16 09:59:24',NULL,NULL),(1000,'권한 관리',1,1,NULL,3,1001,'label_important',1,'2021-10-25 15:52:41',NULL,NULL,NULL,NULL),(1002,'데이터 관리',NULL,NULL,'',1,1007,'insert_chart',1,'2023-05-19 16:26:41',1,'2024-06-19 19:19:03',NULL,NULL),(1003,'마이페이지',NULL,NULL,NULL,4,101,'face',1,'2023-05-19 16:27:56',NULL,NULL,1,'2024-07-02 18:31:27'),(1004,'인증키 발급현황',NULL,1003,NULL,0,1004,'label_important',1,'2023-05-19 16:50:29',1,'2023-05-24 09:09:38',1,'2024-07-02 18:31:23'),(1005,'Raw 데이터 활용신청 현황',NULL,1003,NULL,1,101,'label_important',1,'2023-05-19 16:52:40',NULL,NULL,1,'2024-07-02 18:31:18'),(1006,'트윈 데이터 활용신청 현황',NULL,1003,NULL,2,101,'label_important',1,'2023-05-19 16:53:27',NULL,NULL,1,'2024-07-02 18:30:58'),(1007,'test',NULL,NULL,NULL,7,101,'label_important',1,'2023-05-22 14:36:44',NULL,NULL,NULL,NULL),(1008,'리포지터리 관리',NULL,NULL,NULL,5,101,'build',1,'2023-05-30 21:45:04',NULL,NULL,1,'2024-07-02 18:31:11'),(1009,'RestKey 관리',NULL,1008,NULL,0,1005,'label_important',1,'2023-05-30 21:45:39',1,'2023-05-31 07:23:51',1,'2024-07-02 18:31:06'),(1010,'수집기 관리',NULL,NULL,NULL,2,1006,'insert_chart',1,'2023-09-14 13:18:20',NULL,NULL,NULL,NULL),(1011,'수집기 모니터링',NULL,1010,NULL,0,1006,'insert_chart',1,'2023-09-14 13:19:15',NULL,NULL,NULL,NULL),(1012,'aa',NULL,NULL,'aa',10,1,'label_important',1,'2024-05-24 14:43:19',NULL,NULL,1,'2024-05-24 14:43:31'),(1013,'데이터 리스트',NULL,1002,'',1,1007,'label_important',1,'2024-06-19 19:19:46',NULL,NULL,NULL,NULL),(1014,'데이터 등록 신청 리스트',NULL,1002,'',2,1008,'label_important',1,'2024-06-19 19:20:00',NULL,NULL,NULL,NULL),(1015,'데이터 활용 신청 리스트',NULL,1002,'',3,1009,'label_important',1,'2024-07-02 15:16:09',NULL,NULL,NULL,NULL),(1016,'기관 관리',NULL,1017,'',0,1010,'label_important',1,'2024-07-30 14:49:20',NULL,NULL,NULL,NULL),(1017,'기관 관리',NULL,NULL,'',4,1011,'assignment_ind',1,'2024-08-06 14:09:13',1,'2024-08-08 10:00:21',NULL,NULL),(1018,'기관 회원 관리',NULL,1017,'',1,1011,'label_important',1,'2024-08-06 14:09:53',NULL,NULL,NULL,NULL),(1019,'데이터 분류 리스트',NULL,1002,'',0,1012,'label_important',1,'2024-08-12 10:05:36',1,'2024-08-12 10:05:53',NULL,NULL);
/*!40000 ALTER TABLE `jcms_mngr_menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_mngr_menu_role`
--

DROP TABLE IF EXISTS `jcms_mngr_menu_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_mngr_menu_role` (
  `MENU_ID` bigint DEFAULT NULL,
  `ROLE_AUTH` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_mngr_menu_role`
--

LOCK TABLES `jcms_mngr_menu_role` WRITE;
/*!40000 ALTER TABLE `jcms_mngr_menu_role` DISABLE KEYS */;
INSERT INTO `jcms_mngr_menu_role` (`MENU_ID`, `ROLE_AUTH`) VALUES (160,'ROLE_BASE'),(160,'ROLE_CHRG_MMBR'),(160,'ROLE_CHRGR_OWNER'),(160,'ROLE_CHRGR_MNFCT'),(160,'ROLE_CHRG_OPRTR'),(1011,'ROLE_MEMBER'),(1010,'ROLE_MEMBER'),(1011,'ROLE_MEMBER_ADMIN'),(1010,'ROLE_MEMBER_ADMIN'),(1018,'ROLE_MEMBER_ADMIN'),(1017,'ROLE_MEMBER_ADMIN'),(1013,'ROLE_MANAGER'),(1002,'ROLE_MANAGER'),(1014,'ROLE_MANAGER'),(1015,'ROLE_MANAGER'),(1011,'ROLE_MANAGER'),(1010,'ROLE_MANAGER'),(9,'ROLE_MANAGER'),(8,'ROLE_MANAGER'),(10,'ROLE_MANAGER'),(11,'ROLE_MANAGER'),(1000,'ROLE_MANAGER'),(1,'ROLE_MANAGER'),(1016,'ROLE_MANAGER'),(1018,'ROLE_MANAGER'),(1017,'ROLE_MANAGER'),(1013,'ROLE_SYSTEM'),(1002,'ROLE_SYSTEM'),(1014,'ROLE_SYSTEM'),(1015,'ROLE_SYSTEM'),(1011,'ROLE_SYSTEM'),(1010,'ROLE_SYSTEM'),(9,'ROLE_SYSTEM'),(8,'ROLE_SYSTEM'),(10,'ROLE_SYSTEM'),(11,'ROLE_SYSTEM'),(1016,'ROLE_SYSTEM'),(1017,'ROLE_SYSTEM'),(1018,'ROLE_SYSTEM'),(2,'ROLE_SYSTEM'),(1,'ROLE_SYSTEM'),(3,'ROLE_SYSTEM'),(4,'ROLE_SYSTEM'),(1000,'ROLE_SYSTEM'),(1019,'ROLE_SYSTEM');
/*!40000 ALTER TABLE `jcms_mngr_menu_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_pgm`
--

DROP TABLE IF EXISTS `jcms_pgm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_pgm` (
  `PGM_ID` bigint NOT NULL AUTO_INCREMENT,
  `PGM_NM` varchar(50) DEFAULT NULL,
  `PGM_DESC` varchar(2000) DEFAULT NULL,
  `PGM_URL` varchar(200) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  `DEL_ID` bigint DEFAULT NULL,
  `DEL_DT` datetime DEFAULT NULL,
  `REC_ST` char(1) DEFAULT NULL,
  PRIMARY KEY (`PGM_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=1013 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_pgm`
--

LOCK TABLES `jcms_pgm` WRITE;
/*!40000 ALTER TABLE `jcms_pgm` DISABLE KEYS */;
INSERT INTO `jcms_pgm` (`PGM_ID`, `PGM_NM`, `PGM_DESC`, `PGM_URL`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`, `DEL_ID`, `DEL_DT`, `REC_ST`) VALUES (1,'회원관리',NULL,'/system/user/list.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(4,'로그인 이력',NULL,'/system/scur/loginLogList.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(5,'사용 이력',NULL,'/system/webLog/list.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(6,'탈퇴 회원 조회',NULL,'/system/userOut/list.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(23,'사용자 접속 통계',NULL,'/system/siteStats/list.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(24,'메뉴별 접속 통계',NULL,'/system/stats/list.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(25,'시스템 프로그램 관리',NULL,'/system/pgm/list.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(26,'시스템 메뉴 관리',NULL,'/system/menu/list.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(27,'코드 관리',NULL,'/system/cd/mng.mng',1,'2021-10-22 00:00:00',NULL,NULL,NULL,NULL,'1'),(101,'대시보드',NULL,'/user/index.mng',1,'2021-10-22 00:00:00',1,'2023-09-12 13:29:47',NULL,NULL,'1'),(1001,'권한 관리','권한 관리','/system/role/list.mng',1,'2021-10-25 15:52:15',1,'2021-11-04 16:21:43',NULL,NULL,'1'),(1003,'트윈 데이터 리스트',NULL,'/user/repository/TwinData/pageMain.mng',1,'2023-05-22 13:19:09',1,'2023-09-12 13:29:23',1,'2024-07-02 18:30:07','1'),(1004,'Rest Key 리스트',NULL,'/user/repository/RestKey/pageMain.mng',1,'2023-05-23 22:51:07',1,'2023-09-12 13:28:34',1,'2024-07-02 18:30:13','1'),(1005,'RestKey 관리',NULL,'/system/repository/RestKeyManage/pageMain.mng',1,'2023-05-30 21:47:23',NULL,NULL,1,'2024-07-02 18:30:19','1'),(1006,'수집기 모니터링',NULL,'/system/collector/monitor.mng',1,'2023-09-14 13:06:08',NULL,NULL,NULL,NULL,'1'),(1007,'DataItem 리스트','','/system/repository/DataItem/pageMain.mng',1,'2024-05-23 16:35:35',1,'2024-07-02 18:30:34',NULL,NULL,'1'),(1008,'데이터 등록 신청 리스트','','/system/repository/DataRegistRequestList/pageMain.mng',1,'2024-06-19 19:17:41',NULL,NULL,NULL,NULL,'1'),(1009,'데이터 활용 신청 리스트','','/system/repository/DataUseRequestList/pageMain.mng',1,'2024-07-02 15:14:55',1,'2024-07-02 15:15:50',NULL,NULL,'1'),(1010,'기관 리스트','','/system/repository/InstitutionList/pageMain.mng',1,'2024-07-30 14:48:27',NULL,NULL,NULL,NULL,'1'),(1011,'기관회원관리','','/system/repository/InstitutionUserManage/pageMain.mng',1,'2024-08-06 14:07:43',NULL,NULL,NULL,NULL,'1'),(1012,'데이터 분류 리스트','','/system/repository/DataCategoryList/pageMain.mng	',1,'2024-08-12 10:05:05',1,'2024-08-12 10:06:10',NULL,NULL,'1');
/*!40000 ALTER TABLE `jcms_pgm` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_role`
--

DROP TABLE IF EXISTS `jcms_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_role` (
  `ROLE_AUTH` varchar(50) NOT NULL,
  `ROLE_NM` varchar(50) DEFAULT NULL,
  `ROLE_DESC` varchar(2000) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`ROLE_AUTH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_role`
--

LOCK TABLES `jcms_role` WRITE;
/*!40000 ALTER TABLE `jcms_role` DISABLE KEYS */;
INSERT INTO `jcms_role` (`ROLE_AUTH`, `ROLE_NM`, `ROLE_DESC`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`) VALUES ('ROLE_MANAGER','최고 관리자','업무관리자(운영자)',1,'2021-10-22 00:00:00',NULL,NULL),('ROLE_MEMBER','트윈 멤버','트윈 멤버',1,'2024-06-13 16:13:16',NULL,NULL),('ROLE_MEMBER_ADMIN','트윈 멤버 어드민','트윈 멤버 어드민',1,'2024-07-26 13:25:51',NULL,NULL),('ROLE_SYSTEM','시스템 관리자','시스템 관리자(개발업체)',1,'2021-10-22 00:00:00',NULL,NULL),('ROLE_UNAUTHENTICATED','인증안된 사용자','인증안된 사용자',1,'2023-09-11 14:45:01',NULL,NULL),('ROLE_USER','일반 사용자','일반 사용자',1,'2021-10-22 00:00:00',1,'2021-12-15 15:44:55');
/*!40000 ALTER TABLE `jcms_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_role_hrcy`
--

DROP TABLE IF EXISTS `jcms_role_hrcy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_role_hrcy` (
  `PARENT_ROLE` varchar(50) NOT NULL,
  `CHILD_ROLE` varchar(50) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`PARENT_ROLE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_role_hrcy`
--

LOCK TABLES `jcms_role_hrcy` WRITE;
/*!40000 ALTER TABLE `jcms_role_hrcy` DISABLE KEYS */;
INSERT INTO `jcms_role_hrcy` (`PARENT_ROLE`, `CHILD_ROLE`, `REG_ID`, `REG_DT`) VALUES ('ROLE_BOARD','ROLE_MANAGER',1,'2021-10-22 00:00:00'),('ROLE_MAIN','ROLE_BOARD',1,'2021-10-22 00:00:00'),('ROLE_MANAGER','ROLE_SYSTEM',1,'2021-10-22 00:00:00'),('ROLE_USER','ROLE_MAIN',1,'2021-10-22 00:00:00');
/*!40000 ALTER TABLE `jcms_role_hrcy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_scur_rsc`
--

DROP TABLE IF EXISTS `jcms_scur_rsc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_scur_rsc` (
  `RSC_ID` varchar(50) NOT NULL,
  `RSC_NM` varchar(50) DEFAULT NULL,
  `RSC_TP` varchar(20) DEFAULT NULL,
  `RSC_PATN` varchar(250) DEFAULT NULL,
  `RSC_DESC` varchar(2000) DEFAULT NULL,
  `SORT_ORD` int DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`RSC_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_scur_rsc`
--

LOCK TABLES `jcms_scur_rsc` WRITE;
/*!40000 ALTER TABLE `jcms_scur_rsc` DISABLE KEYS */;
INSERT INTO `jcms_scur_rsc` (`RSC_ID`, `RSC_NM`, `RSC_TP`, `RSC_PATN`, `RSC_DESC`, `SORT_ORD`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`) VALUES ('INSERT_USER','회원등록','url','/system/user/insert*','ROLE_UNAUTHENTICATED',4001,1,'2024-06-07 11:23:37',NULL,NULL),('LOGIN','로그인','url','/login*/**','ROLE_UNAUTHENTICATED',3000,1,'2023-09-06 13:21:54',NULL,NULL),('PUBLIC','공개','url','/public/**','ROLE_UNAUTHENTICATED',3999,1,'2024-05-16 13:57:10',NULL,NULL),('PUBLIC_DATA_REGIST','PUBLIC 데이터 등록','url','/public/data-regist.mng','ROLE_USER',3002,1,'2024-06-14 11:22:33',NULL,NULL),('PUBLIC_LOGIN_PAGE','PUBLIC 로그인페이지','url','/index.mng','ROLE_UNAUTHENTICATED',2001,1,'2024-05-27 10:43:49',NULL,NULL),('PUBLIC_USER','PUBLIC 유저','url','/public/user/**','ROLE_USER',3001,1,'2024-06-07 15:42:51',NULL,NULL),('SIGNUP','회원가입','url','/system/register*','ROLE_UNAUTHENTICATED',4000,1,'2023-09-12 14:58:17',NULL,NULL),('SYSTEM_FINDPASSWORD','시스템 암호찾기','url','/system/findPassword*','ROLE_UNAUTHENTICATED',4002,1,'2024-06-11 10:04:15',NULL,NULL),('SYSTEM_RESOURCE','시스템 관리','url','/system/**','ROLE_MEMBER_ADMIN',4999,1,'2021-10-22 00:00:00',NULL,NULL),('USER_RESOURCE','유저접근','url','/user/**','ROLE_USER',2000,1,'2023-09-12 15:19:46',NULL,NULL);
/*!40000 ALTER TABLE `jcms_scur_rsc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_scur_rsc_role`
--

DROP TABLE IF EXISTS `jcms_scur_rsc_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_scur_rsc_role` (
  `RSC_ID` varchar(50) NOT NULL,
  `ROLE_AUTH` varchar(50) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_scur_rsc_role`
--

LOCK TABLES `jcms_scur_rsc_role` WRITE;
/*!40000 ALTER TABLE `jcms_scur_rsc_role` DISABLE KEYS */;
INSERT INTO `jcms_scur_rsc_role` (`RSC_ID`, `ROLE_AUTH`, `REG_ID`, `REG_DT`) VALUES ('SYSTEM_RESOURCE','hasRole(\'ROLE_MEMBER_ADMIN\')',1,'2021-10-22 00:00:00'),('USER_RESOURCE','hasRole(\'ROLE_USER\')',1,'2021-10-22 00:00:00'),('LOGIN','hasRole(\'ROLE_UNAUTHENTICATED\')',1,'2023-09-12 15:20:57'),('AUTHENTICATED','isAuthenticated()',1,'2023-09-12 15:21:20'),('SIGNUP','hasRole(\'ROLE_UNAUTHENTICATED\')',1,'2023-09-12 15:21:43'),('PUBLIC','hasRole(\'ROLE_UNAUTHENTICATED\')',1,'2024-05-16 13:57:46'),('DEFAULT','hasRole(\'ROLE_UNAUTHENTICATED\')',1,'2024-05-16 14:55:15'),('PUBLIC_LOGIN_PAGE','hasRole(\'ROLE_UNAUTHENTICATED\')',1,'2024-05-27 13:24:48'),('INSERT_USER','hasRole(\'ROLE_UNAUTHENTICATED\')',1,'2024-06-07 11:24:17'),('PUBLIC_USER','hasRole(\'ROLE_USER\')',1,'2024-06-07 15:43:26'),('SYSTEM_FINDPASSWORD','hasRole(\'ROLE_UNAUTHENTICATED\')',1,'2024-06-11 10:04:34'),('PUBLIC_DATA_REGIST','hasRole(\'ROLE_USER\')',1,'2024-06-14 11:23:51');
/*!40000 ALTER TABLE `jcms_scur_rsc_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_seq`
--

DROP TABLE IF EXISTS `jcms_seq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_seq` (
  `TB_NM` varchar(50) NOT NULL,
  `NEW_SEQ` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_seq`
--

LOCK TABLES `jcms_seq` WRITE;
/*!40000 ALTER TABLE `jcms_seq` DISABLE KEYS */;
INSERT INTO `jcms_seq` (`TB_NM`, `NEW_SEQ`) VALUES ('FILE_ID_SEQ',1000),('FILE_ITEM_ID_SEQ',1000),('JCMS_MNGR_MENU_ID_SEQ',1000),('LOGIN_LOG_ID_SEQ',1291),('MENU_CONN_HIST_ID_SEQ',1071),('PGM_ID_SEQ',1001),('USER_ID_SEQ',1000),('WEB_LOG_ID_SEQ',6364);
/*!40000 ALTER TABLE `jcms_seq` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_user`
--

DROP TABLE IF EXISTS `jcms_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_user` (
  `USER_ID` bigint NOT NULL AUTO_INCREMENT,
  `USER_LOGIN_ID` varchar(30) DEFAULT NULL,
  `INSTITUTION_ID` bigint DEFAULT NULL,
  `USER_NM` varchar(30) DEFAULT NULL,
  `USER_PWD` varchar(200) DEFAULT NULL,
  `USER_DI` varchar(200) DEFAULT NULL,
  `BIRTH` varchar(10) DEFAULT NULL,
  `GENDER` char(1) DEFAULT NULL,
  `ADULT_YN` char(1) DEFAULT NULL,
  `EMAIL` varchar(40) DEFAULT NULL,
  `ADDR` varchar(255) DEFAULT NULL,
  `MOBILE` varchar(30) DEFAULT NULL,
  `FAIL_CNT` int DEFAULT NULL,
  `USER_ST` varchar(20) DEFAULT NULL,
  `USER_OUT_RSN` varchar(250) DEFAULT NULL,
  `REG_ID` bigint DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  `UPD_ID` bigint DEFAULT NULL,
  `UPD_DT` datetime DEFAULT NULL,
  `DEL_ID` bigint DEFAULT NULL,
  `DEL_DT` datetime DEFAULT NULL,
  `REC_ST` char(1) DEFAULT NULL,
  PRIMARY KEY (`USER_ID`),
  KEY `JCMS_USER_USER_LOGIN_ID_index` (`USER_LOGIN_ID` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_user`
--

LOCK TABLES `jcms_user` WRITE;
/*!40000 ALTER TABLE `jcms_user` DISABLE KEYS */;
INSERT INTO `jcms_user` (`USER_ID`, `USER_LOGIN_ID`, `INSTITUTION_ID`, `USER_NM`, `USER_PWD`, `USER_DI`, `BIRTH`, `GENDER`, `ADULT_YN`, `EMAIL`, `ADDR`, `MOBILE`, `FAIL_CNT`, `USER_ST`, `USER_OUT_RSN`, `REG_ID`, `REG_DT`, `UPD_ID`, `UPD_DT`, `DEL_ID`, `DEL_DT`, `REC_ST`) VALUES (1,'system',NULL,'관리자','$2a$10$8luk3Yv9rmsR2w/7XdpI2OW1s2cKc.vaPHxoi9diNInFXkBo5yXim',NULL,NULL,NULL,NULL,'soo1206@gmail.com',NULL,'010-0000-0000',0,'1',NULL,NULL,'2023-08-23 17:04:38',1,'2024-08-07 17:35:45',NULL,NULL,'Y');
/*!40000 ALTER TABLE `jcms_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_user_role`
--

DROP TABLE IF EXISTS `jcms_user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_user_role` (
  `USER_ID` bigint NOT NULL,
  `ROLE_AUTH` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_user_role`
--

LOCK TABLES `jcms_user_role` WRITE;
/*!40000 ALTER TABLE `jcms_user_role` DISABLE KEYS */;
INSERT INTO `jcms_user_role` (`USER_ID`, `ROLE_AUTH`) VALUES (1,'ROLE_SYSTEM');
/*!40000 ALTER TABLE `jcms_user_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jcms_web_log`
--

DROP TABLE IF EXISTS `jcms_web_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jcms_web_log` (
  `WEB_LOG_ID` bigint NOT NULL AUTO_INCREMENT,
  `LOGIN_LOG_ID` bigint DEFAULT NULL,
  `REQ_TP` char(1) DEFAULT NULL,
  `REQ_URL` varchar(200) DEFAULT NULL,
  `PGM_ID` bigint DEFAULT NULL,
  `REQ_MTHD` varchar(50) DEFAULT NULL,
  `REQ_PARAM` varchar(4000) DEFAULT NULL,
  `REQ_IP` varchar(50) DEFAULT NULL,
  `REG_DT` datetime DEFAULT NULL,
  PRIMARY KEY (`WEB_LOG_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=11807 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jcms_web_log`
--

LOCK TABLES `jcms_web_log` WRITE;
/*!40000 ALTER TABLE `jcms_web_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `jcms_web_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rest_key`
--

DROP TABLE IF EXISTS `rest_key`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rest_key` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '@AutoIncrease,@SelectWhere,@UpdateWhere,@DeleteWhere',
  `user_id` bigint NOT NULL COMMENT '@SelectWhere,@UpdateSet',
  `token` varchar(255) DEFAULT NULL COMMENT 'token',
  `status` varchar(20) NOT NULL COMMENT '@SelectWhere,@UpdateSet',
  `issue_time` timestamp NOT NULL COMMENT '@SelectWhereStartTimeStamp,@SelectWhereEndTimeStampLess,@UpdateSet',
  `expire_time` timestamp NULL DEFAULT NULL COMMENT '@SelectWhereStartTimeStamp,@SelectWhereEndTimeStampLess,@UpdateSet',
  PRIMARY KEY (`id`),
  KEY `IX_rest_key` (`user_id`),
  KEY `IX_rest_key2` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AUTOGEN-RestKey:net.jw.twin.repository.db.restKey';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rest_key`
--

LOCK TABLES `rest_key` WRITE;
/*!40000 ALTER TABLE `rest_key` DISABLE KEYS */;
/*!40000 ALTER TABLE `rest_key` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-09-27 11:00:07
