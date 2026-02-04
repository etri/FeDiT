CREATE DATABASE  IF NOT EXISTS `federatedTwins` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `federatedTwins`;
-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: 221.133.48.16    Database: federatedTwins
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
-- Table structure for table `event_occured_info`
--

DROP TABLE IF EXISTS `event_occured_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4608 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_transmission_result_info`
--

DROP TABLE IF EXISTS `event_transmission_result_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5571 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msa_control_command_sequence_info`
--

DROP TABLE IF EXISTS `msa_control_command_sequence_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msa_control_command_sequence_info` (
  `ctrl_cmd_sequence_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_control_command_id` int(11) NOT NULL,
  `sequence_identifier` varchar(200) NOT NULL,
  `control_idtifier` varchar(45) DEFAULT NULL,
  `sequence_act_type` varchar(10) NOT NULL,
  `federated_twin_id` varchar(100) DEFAULT NULL,
  `federated_digital_object_id` varchar(100) DEFAULT NULL,
  `digital_twin_id` varchar(100) DEFAULT NULL,
  `digital_object_id` varchar(100) DEFAULT NULL,
  `digital_control_Id` varchar(100) DEFAULT NULL,
  `control_command` varchar(500) DEFAULT NULL,
  `condition_param` tinytext,
  `next_sequence_identifier` varchar(200) DEFAULT NULL,
  `next_sequence_condition` tinytext,
  `logical_expression` varchar(500) DEFAULT NULL,
  `start_interval` mediumint(9) DEFAULT NULL,
  `next_interval` int(11) DEFAULT NULL,
  `sequence_status` varchar(10) NOT NULL,
  `create_time` timestamp(3) NOT NULL,
  `seqeunce_status_change_time` timestamp(3) NOT NULL,
  `retry_sending_count` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ctrl_cmd_sequence_id`,`request_control_command_id`),
  UNIQUE KEY `sequence_identifier_UNIQUE` (`sequence_identifier`),
  KEY `msa_control_command_sequence_info_ibfk1_idx` (`request_control_command_id`),
  KEY `msa_ctrl_cmd_seq_info_act_sts_idx` (`sequence_act_type`,`sequence_status`),
  CONSTRAINT `msa_control_command_sequence_info_ibfk1` FOREIGN KEY (`request_control_command_id`) REFERENCES `msa_request_control_command_info` (`request_control_command_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5319 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msa_control_command_status_change_record`
--

DROP TABLE IF EXISTS `msa_control_command_status_change_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msa_control_command_status_change_record` (
  `ctrl_cmd_status_change_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_control_command_id` int(11) NOT NULL,
  `status_update_time` timestamp(3) NULL DEFAULT NULL,
  `change_status` varchar(10) NOT NULL,
  `status_result_msg` varchar(200) NOT NULL,
  PRIMARY KEY (`ctrl_cmd_status_change_id`,`request_control_command_id`),
  KEY `msa_control_command_status_change_history_ibfk1_idx` (`request_control_command_id`),
  CONSTRAINT `msa_control_command_status_change_history_ibfk1` FOREIGN KEY (`request_control_command_id`) REFERENCES `msa_request_control_command_info` (`request_control_command_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2788 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msa_request_control_command_info`
--

DROP TABLE IF EXISTS `msa_request_control_command_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msa_request_control_command_info` (
  `request_control_command_id` int(11) NOT NULL AUTO_INCREMENT,
  `msa_identifier` varchar(200) NOT NULL,
  `req_identifier` varchar(100) NOT NULL,
  `req_ctrl_cmd_type` varchar(10) NOT NULL,
  `req_ctrl_cmd_time` timestamp(3) NOT NULL,
  `req_ctrl_cmd_status` varchar(10) NOT NULL,
  `result_callback_url` varchar(500) NOT NULL,
  `req_ctrl_cmd` text NOT NULL,
  `req_status_change_time` timestamp NOT NULL,
  `transmission_status` varchar(10) DEFAULT NULL,
  `transmission_time` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`request_control_command_id`),
  UNIQUE KEY `req_identifier_UNIQUE` (`msa_identifier`)
) ENGINE=InnoDB AUTO_INCREMENT=1809 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msa_result_data_transmission_info`
--

DROP TABLE IF EXISTS `msa_result_data_transmission_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msa_result_data_transmission_info` (
  `transmission_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_control_command_id` int(11) NOT NULL,
  `transmission_code` int(11) NOT NULL,
  `transmission_msg` varchar(100) NOT NULL,
  `transmission_time` timestamp(3) NOT NULL,
  `transmission_url` varchar(500) NOT NULL,
  `transmission_param` varchar(500) DEFAULT NULL,
  `transmission_result_data` text,
  `resp_ctrl_cmd_code` varchar(10) DEFAULT NULL,
  `resp_ctrl_cmd_msg` text,
  `resp_ctrl_cmd_time` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`transmission_id`,`request_control_command_id`),
  KEY `msa_result_data_transmission_info_ibfk1_idx` (`request_control_command_id`),
  CONSTRAINT `msa_result_data_transmission_info_ibfk1` FOREIGN KEY (`request_control_command_id`) REFERENCES `msa_request_control_command_info` (`request_control_command_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=22910 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msa_sequence_status_change_record`
--

DROP TABLE IF EXISTS `msa_sequence_status_change_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msa_sequence_status_change_record` (
  `sequence_status_change_id` int(11) NOT NULL AUTO_INCREMENT,
  `status_update_time` timestamp(3) NOT NULL,
  `change_status` varchar(10) NOT NULL,
  `status_result_msg` varchar(200) NOT NULL,
  `ctrl_cmd_sequence_id` int(11) NOT NULL,
  `request_control_command_id` int(11) NOT NULL,
  `task_response_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`sequence_status_change_id`,`ctrl_cmd_sequence_id`,`request_control_command_id`),
  KEY `msa_sequence_status_change_history_ibfk1_idx` (`ctrl_cmd_sequence_id`,`request_control_command_id`),
  KEY `msa_seq_status_change_receive_id_idx` (`task_response_id`)
) ENGINE=InnoDB AUTO_INCREMENT=73564 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msa_task_processing_info`
--

DROP TABLE IF EXISTS `msa_task_processing_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msa_task_processing_info` (
  `task_processing_id` int(11) NOT NULL AUTO_INCREMENT,
  `ctrl_cmd_sequence_id` int(11) NOT NULL,
  `request_control_command_id` int(11) NOT NULL,
  `task_processing_start_time` timestamp(3) NOT NULL,
  `task_processing_result_msg` varchar(200) DEFAULT NULL,
  `task_processing_status` varchar(10) NOT NULL,
  `task_processing_end_time` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`task_processing_id`,`ctrl_cmd_sequence_id`,`request_control_command_id`),
  KEY `msa_task_processing_info_ibfk1_idx` (`ctrl_cmd_sequence_id`,`request_control_command_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32278 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msa_task_response_data_info`
--

DROP TABLE IF EXISTS `msa_task_response_data_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msa_task_response_data_info` (
  `task_response_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_sending_id` int(11) NOT NULL,
  `receive_time` timestamp(3) NOT NULL,
  `receive_val` varchar(200) NOT NULL,
  `receive_status` varchar(10) NOT NULL,
  `receive_msg` varchar(200) NOT NULL,
  `task_processing_id` int(11) DEFAULT NULL,
  `ctrl_cmd_sequence_id` int(11) DEFAULT NULL,
  `request_control_command_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`task_response_id`),
  KEY `msa_receive_result_data_info_ibfk1_idx` (`task_sending_id`,`task_processing_id`,`ctrl_cmd_sequence_id`,`request_control_command_id`),
  CONSTRAINT `msa_receive_result_data_info_ibfk1` FOREIGN KEY (`task_sending_id`, `task_processing_id`, `ctrl_cmd_sequence_id`, `request_control_command_id`) REFERENCES `msa_task_sending_info` (`task_sending_id`, `task_processing_id`, `ctrl_cmd_sequence_id`, `request_control_command_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=30922 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `msa_task_sending_info`
--

DROP TABLE IF EXISTS `msa_task_sending_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `msa_task_sending_info` (
  `task_sending_id` int(11) NOT NULL AUTO_INCREMENT,
  `task_processing_id` int(11) NOT NULL,
  `ctrl_cmd_sequence_id` int(11) NOT NULL,
  `request_control_command_id` int(11) NOT NULL,
  `task_sending_identifier` varchar(200) NOT NULL,
  `task_connection_url` text NOT NULL,
  `task_sending_control_command_param` varchar(200) DEFAULT NULL,
  `task_sending_control_command` text,
  `task_sending_time` timestamp(3) NOT NULL,
  `task_sending_status` varchar(10) NOT NULL,
  `task_receive_result_msg` varchar(200) DEFAULT NULL,
  `task_receive_result_time` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`task_sending_id`,`task_processing_id`,`ctrl_cmd_sequence_id`,`request_control_command_id`),
  UNIQUE KEY `task_sending_identifiier_UNIQUE` (`task_sending_identifier`),
  KEY `msa_task_sending_info_idx` (`task_processing_id`,`ctrl_cmd_sequence_id`,`request_control_command_id`),
  CONSTRAINT `msa_task_sending_info` FOREIGN KEY (`task_processing_id`, `ctrl_cmd_sequence_id`, `request_control_command_id`) REFERENCES `msa_task_processing_info` (`task_processing_id`, `ctrl_cmd_sequence_id`, `request_control_command_id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=33212 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'federatedTwins'
--

--
-- Dumping routines for database 'federatedTwins'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-07-17 16:49:54
