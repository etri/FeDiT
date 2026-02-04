CREATE DATABASE  IF NOT EXISTS `ctrlApiGateway` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `ctrlApiGateway`;
-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: ctrlApiGateway
-- ------------------------------------------------------
-- Server version	5.7.30

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
-- Table structure for table `ctrl_cmd_exec_code_info`
--

DROP TABLE IF EXISTS `ctrl_cmd_exec_code_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctrl_cmd_exec_code_info` (
  `ctrl_cmd_exec_code_id` int(11) NOT NULL AUTO_INCREMENT,
  `ctrl_cmd_exec_code_name` varchar(100) NOT NULL,
  `ctrl_kind_code` varchar(10) NOT NULL,
  `ctrl_cmd_code` varchar(10) NOT NULL,
  `ctrl_exec_param` varchar(1) DEFAULT NULL,
  `ctrl_exec_desc` text,
  `updateDate` date DEFAULT NULL,
  PRIMARY KEY (`ctrl_cmd_exec_code_id`),
  UNIQUE KEY `ctrl_cmd_exec_code_info_unique1` (`ctrl_kind_code`,`ctrl_cmd_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctrl_cmd_exec_code_info`
--

LOCK TABLES `ctrl_cmd_exec_code_info` WRITE;
/*!40000 ALTER TABLE `ctrl_cmd_exec_code_info` DISABLE KEYS */;
INSERT INTO `ctrl_cmd_exec_code_info` VALUES (1,'Actuator_Pan','CTRL01','EXEC0101',NULL,'Actuator Pan',NULL),(2,'Actuator_Tilt','CTRL01','EXEC0102',NULL,'Actuator Tilt',NULL),(3,'Actuator_Zoom','CTRL01','EXEC0103',NULL,'Actuator Zoom',NULL),(4,'PowerControl_Init','CTRL02','EXEC0201',NULL,'PowerControl Init',NULL),(5,'PowerControl_PowerOn','CTRL02','EXEC0202',NULL,'PowerControl PowerOn',NULL),(6,'PowerControl_PowerOff','CTRL02','EXEC0203',NULL,'PowerControl PowerOff',NULL),(7,'PowerControl_ReBoot','CTRL02','EXEC0204',NULL,'PowerControl ReBoot',NULL),(8,'PowerControl_Enable','CTRL02','EXEC0205',NULL,'PowerControl Enable',NULL),(9,'PowerControl_Disable','CTRL02','EXEC0206',NULL,'PowerControl Disable',NULL),(10,'Configuration_profile','CTRL03','EXEC0301',NULL,'Configuration profile',NULL),(11,'SensingData_GetData','CTRL04','EXEC0401',NULL,'SensingData GetData',NULL),(12,'SensingData_GetStatus','CTRL04','EXEC0402',NULL,'SensingData GetStatus',NULL);
/*!40000 ALTER TABLE `ctrl_cmd_exec_code_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctrl_device_cmd_exec_req_resp`
--

DROP TABLE IF EXISTS `ctrl_device_cmd_exec_req_resp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctrl_device_cmd_exec_req_resp` (
  `ctrl_device_id` int(11) NOT NULL,
  `ctrl_cmd_exec_code_id` int(11) NOT NULL,
  `exec_request_url` varchar(500) NOT NULL,
  `exec_param` varchar(500) DEFAULT NULL,
  `exec_status` varchar(1) NOT NULL DEFAULT 'Y',
  `result_response_url` varchar(500) DEFAULT NULL,
  `result_response_param` varchar(500) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `updateDate` date DEFAULT NULL,
  PRIMARY KEY (`ctrl_device_id`,`ctrl_cmd_exec_code_id`),
  KEY `ctrl_device_cmd_request_info_ibfk_2_idx` (`ctrl_cmd_exec_code_id`),
  CONSTRAINT `ctrl_device_cmd_exec_req_resp_ibfk_1` FOREIGN KEY (`ctrl_device_id`) REFERENCES `ctrl_device_info` (`ctrl_device_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `ctrl_device_cmd_exec_req_resp_ibfk_2` FOREIGN KEY (`ctrl_cmd_exec_code_id`) REFERENCES `ctrl_cmd_exec_code_info` (`ctrl_cmd_exec_code_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctrl_device_cmd_exec_req_resp`
--

LOCK TABLES `ctrl_device_cmd_exec_req_resp` WRITE;
/*!40000 ALTER TABLE `ctrl_device_cmd_exec_req_resp` DISABLE KEYS */;
INSERT INTO `ctrl_device_cmd_exec_req_resp` VALUES (1,1,'request.JW-PTZ-CMR-01.EXEC0101',NULL,'Y','response.JW-PTZ-CMR-01.EXEC0101',NULL,NULL,'2024-06-14'),(1,2,'request.JW-PTZ-CMR-01.EXEC0102',NULL,'Y','response.JW-PTZ-CMR-01.EXEC0102',NULL,NULL,'2024-06-14'),(1,3,'request.JW-PTZ-CMR-01.EXEC0103',NULL,'Y','response.JW-PTZ-CMR-01.EXEC0103',NULL,NULL,'2024-06-14'),(1,4,'request.JW-PTZ-CMR-01.EXEC0201',NULL,'Y','response.JW-PTZ-CMR-01.EXEC0201',NULL,NULL,'2024-06-14'),(2,1,'request.JW-PTZ-CMR-02.EXEC0101',NULL,'Y','response.JW-PTZ-CMR-02.EXEC0101',NULL,NULL,'2024-06-14'),(2,2,'request.JW-PTZ-CMR-02.EXEC0102',NULL,'Y','response.JW-PTZ-CMR-02.EXEC0102',NULL,NULL,'2024-06-14'),(2,3,'request.JW-PTZ-CMR-02.EXEC0103',NULL,'Y','response.JW-PTZ-CMR-02.EXEC0103',NULL,NULL,'2024-06-14'),(2,4,'request.JW-PTZ-CMR-02.EXEC0201',NULL,'Y','response.JW-PTZ-CMR-02.EXEC0201',NULL,NULL,'2024-06-14');
/*!40000 ALTER TABLE `ctrl_device_cmd_exec_req_resp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctrl_device_info`
--

DROP TABLE IF EXISTS `ctrl_device_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctrl_device_info` (
  `ctrl_device_id` int(11) NOT NULL AUTO_INCREMENT,
  `device_identifier` varchar(100) NOT NULL,
  `device_type` varchar(10) NOT NULL,
  `device_status` varchar(1) NOT NULL DEFAULT 'Y',
  `digital_twin_id` varchar(100) DEFAULT NULL,
  `digital_object_id` varchar(100) DEFAULT NULL,
  `protocol_type` varchar(10) NOT NULL,
  `ipAddr` varchar(15) DEFAULT NULL,
  `port` int(11) DEFAULT NULL,
  `updateDate` date DEFAULT NULL,
  PRIMARY KEY (`ctrl_device_id`),
  UNIQUE KEY `device_identifier_UNIQUE` (`device_identifier`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctrl_device_info`
--

LOCK TABLES `ctrl_device_info` WRITE;
/*!40000 ALTER TABLE `ctrl_device_info` DISABLE KEYS */;
INSERT INTO `ctrl_device_info` VALUES (1,'JW-PTZ-CMR-01','DEV01','Y','KR-109111-9999','KR-909111-9001','MQTT','223.171.154.176',80,'2024-06-21'),(2,'JW-PTZ-CMR-02','DEV01','Y','KR-109111-9999','KR-909111-9002','MQTT','223.171.154.176',80,'2024-06-21');
/*!40000 ALTER TABLE `ctrl_device_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ctrl_device_routing_service_info`
--

DROP TABLE IF EXISTS `ctrl_device_routing_service_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ctrl_device_routing_service_info` (
  `ctrl_device_id` int(11) NOT NULL,
  `ctrl_cmd_exec_code_id` int(11) NOT NULL,
  `request_routing` varchar(500) NOT NULL,
  `request_param` varchar(500) DEFAULT NULL,
  `routing_status` varchar(1) NOT NULL DEFAULT 'Y',
  `response_routing` varchar(500) DEFAULT NULL,
  `response_param` varchar(500) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `updateDate` date DEFAULT NULL,
  PRIMARY KEY (`ctrl_device_id`,`ctrl_cmd_exec_code_id`),
  KEY `ctrl_device_routing_service_info_ibfk_2_idx` (`ctrl_cmd_exec_code_id`),
  CONSTRAINT `ctrl_device_routing_service_info_ibfk_1` FOREIGN KEY (`ctrl_device_id`) REFERENCES `ctrl_device_info` (`ctrl_device_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `ctrl_device_routing_service_info_ibfk_2` FOREIGN KEY (`ctrl_cmd_exec_code_id`) REFERENCES `ctrl_cmd_exec_code_info` (`ctrl_cmd_exec_code_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ctrl_device_routing_service_info`
--

LOCK TABLES `ctrl_device_routing_service_info` WRITE;
/*!40000 ALTER TABLE `ctrl_device_routing_service_info` DISABLE KEYS */;
INSERT INTO `ctrl_device_routing_service_info` VALUES (1,1,'request.JW-PTZ-CMR-01.EXEC0101',NULL,'Y','response.JW-PTZ-CMR-01.EXEC0101',NULL,NULL,'2024-06-14'),(1,2,'request.JW-PTZ-CMR-01.EXEC0102',NULL,'Y','response.JW-PTZ-CMR-01.EXEC0102',NULL,NULL,'2024-06-14'),(1,3,'request.JW-PTZ-CMR-01.EXEC0103',NULL,'Y','response.JW-PTZ-CMR-01.EXEC0103',NULL,NULL,'2024-06-14'),(1,4,'request.JW-PTZ-CMR-01.EXEC0201',NULL,'Y','response.JW-PTZ-CMR-01.EXEC0201',NULL,NULL,'2024-06-14'),(2,1,'request.JW-PTZ-CMR-02.EXEC0101',NULL,'Y','response.JW-PTZ-CMR-02.EXEC0101',NULL,NULL,'2024-06-14'),(2,2,'request.JW-PTZ-CMR-02.EXEC0102',NULL,'Y','response.JW-PTZ-CMR-02.EXEC0102',NULL,NULL,'2024-06-14'),(2,3,'request.JW-PTZ-CMR-02.EXEC0103',NULL,'Y','response.JW-PTZ-CMR-02.EXEC0103',NULL,NULL,'2024-06-14'),(2,4,'request.JW-PTZ-CMR-02.EXEC0201',NULL,'Y','response.JW-PTZ-CMR-02.EXEC0201',NULL,NULL,'2024-06-14');
/*!40000 ALTER TABLE `ctrl_device_routing_service_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dgtw_exec_ctrl_cmd_info`
--

DROP TABLE IF EXISTS `dgtw_exec_ctrl_cmd_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dgtw_exec_ctrl_cmd_info` (
  `dgtw_exec_ctrl_cmd_id` int(11) NOT NULL AUTO_INCREMENT,
  `dgtw_req_ctrl_cmd_id` int(11) NOT NULL,
  `exec_ctrl_cmd_identifier` varchar(200) NOT NULL,
  `dgtw_exec_ctrl_cmd` varchar(500) NOT NULL,
  `ctrl_kind_code` varchar(10) NOT NULL,
  `exec_cmd_code` varchar(10) NOT NULL,
  `ctrl_cmd_param` varchar(500) DEFAULT NULL,
  `exec_cmd_status` varchar(10) NOT NULL,
  `exec_cmd_update_date` date NOT NULL,
  `result_msg` text,
  PRIMARY KEY (`dgtw_exec_ctrl_cmd_id`,`dgtw_req_ctrl_cmd_id`),
  UNIQUE KEY `exec_ctrl_cmd_identifier_UNIQUE` (`exec_ctrl_cmd_identifier`),
  KEY `dgtw_ctrl_exec_cmd_info_fk1_idx` (`dgtw_req_ctrl_cmd_id`),
  CONSTRAINT `dgtw_exec_ctrl_cmd_info_fk1` FOREIGN KEY (`dgtw_req_ctrl_cmd_id`) REFERENCES `dgtw_req_ctrl_cmd_info` (`dgtw_req_ctrl_cmd_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dgtw_exec_ctrl_cmd_info`
--

LOCK TABLES `dgtw_exec_ctrl_cmd_info` WRITE;
/*!40000 ALTER TABLE `dgtw_exec_ctrl_cmd_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `dgtw_exec_ctrl_cmd_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dgtw_req_ctrl_cmd_info`
--

DROP TABLE IF EXISTS `dgtw_req_ctrl_cmd_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dgtw_req_ctrl_cmd_info` (
  `dgtw_req_ctrl_cmd_id` int(11) NOT NULL AUTO_INCREMENT,
  `resp_identifier` varchar(200) NOT NULL,
  `federated_twin_id` varchar(100) NOT NULL,
  `federated_digital_object_id` varchar(100) NOT NULL,
  `digital_twin_id` varchar(100) NOT NULL,
  `digital_object_id` varchar(100) NOT NULL,
  `req_ctrl_command` text NOT NULL,
  `req_date` datetime NOT NULL,
  `req_ctrl_cmd_status` varchar(10) NOT NULL,
  PRIMARY KEY (`dgtw_req_ctrl_cmd_id`),
  UNIQUE KEY `ctrl_seq_identifier_UNIQUE` (`resp_identifier`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dgtw_req_ctrl_cmd_info`
--

LOCK TABLES `dgtw_req_ctrl_cmd_info` WRITE;
/*!40000 ALTER TABLE `dgtw_req_ctrl_cmd_info` DISABLE KEYS */;
/*!40000 ALTER TABLE `dgtw_req_ctrl_cmd_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ctrlApiGateway'
--

--
-- Dumping routines for database 'ctrlApiGateway'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-25 10:48:20
