package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.impl;

import java.util.HashMap;
import java.util.List;

import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTopicInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTopicMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.component.KafkaProducer;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.mapper.TrackingCommandTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.service.TrackingCmdPrdService;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class TrackingCmdPubServiceImpl implements TrackingCmdPrdService {
	
	private final Logger log = LoggerFactory.getLogger(this.getClass());

	@Autowired
	ApplicationContext ctx;
	
	@Autowired
	private TrackingCommandTaskInfoMapper taskMapper;
	
	@Autowired
	private TrackingProcessInfoMapper trackingProcessInfoMapper;
	
	@Autowired
	private TrackingTopicMapper trackingTopicMapper;

	@Autowired
	public DataEventTrackingRequestInfoMapper dataEventTrackingRequestInfoMapper;

	@Autowired
	private TrackingStatusChangeRecordMapper trackingStatusChangeRecordMapper;

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public void updateProcessAndInsertTopic(HashMap<String, Object> map) throws Exception {
		
		TrackingProcessInfo trackingProcessInfo = new TrackingProcessInfo();
		trackingProcessInfo.setTrackingKafkaTopic(String.valueOf(map.get("payload")));
		trackingProcessInfo.setRequestTrackingId((int) map.get("requestTrackingId"));
		trackingProcessInfo.setTrackingProcessId((int) map.get("trackingProcessId"));
		trackingProcessInfoMapper.updateTrackingProcess(trackingProcessInfo);
		
		if(map.get("mode") != null && map.get("mode").equals("C")) {
			TrackingTopicInfo topicInfo = new TrackingTopicInfo();
			topicInfo.setTopicName((String) map.get("topic"));
			topicInfo.setGroupName("tracking");
			topicInfo.setRequestTrackingId((int) map.get("requestTrackingId"));
			topicInfo.setTrackingProcessId((int) map.get("trackingProcessId"));
			
			trackingTopicMapper.insertTopic(topicInfo);
		}
	}
	
	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public void insertTopic(HashMap<String, Object> map) throws Exception {
		
			TrackingTopicInfo topicInfo = new TrackingTopicInfo();
			topicInfo.setTopicName((String) map.get("topic"));
			topicInfo.setGroupName("tracking");
			topicInfo.setRequestTrackingId((int) map.get("requestTrackingId"));
			topicInfo.setTrackingProcessId((int) map.get("trackingProcessId"));
			
			trackingTopicMapper.insertTopic(topicInfo);
	}

	public void executeTrackingCommndProc(HashMap<String, Object> map) throws Exception {
		HashMap<String, Object> pMap = null;
		log.info("map : {} " , map.toString());
		List<TrackingProcessInfo> trckList = taskMapper.getTrackCmdProcInfoList(map);

		if (trckList != null && trckList.size() > 0) {
			String status = null;

			for (TrackingProcessInfo trckProc : trckList) {
				HashMap<String, Object> topicMap = new HashMap<>();
				topicMap.put("mode", "C");
				topicMap.put("trckTp", trckProc.getTrackingProcessType());
				
				log.info("getFederatedDigitalObjectId : {} " , trckProc.getFederatedDigitalObjectId());
				log.info("getTrackingKafkaTopic : {} " , trckProc.getTrackingKafkaTopic());
				
				topicMap.put("topic", trckProc.getTrackingKafkaTopic() != null ? trckProc.getTrackingKafkaTopic() : trckProc.getFederatedTwinId());
				topicMap.put("requestTrackingId", trckProc.getRequestTrackingId());
				topicMap.put("trackingProcessId", trckProc.getTrackingProcessId());

				try {
					pMap = new HashMap<>();
					pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_READY);
					pMap.put("trackingProcessId", trckProc.getTrackingProcessId());
					pMap.put("statusResultMsg", "Tracking Process STATUS READY Update Success");
					updateWithHisAndTrackingProcInfo(pMap);

					KafkaProducer kafkaProducer = ctx.getBean(KafkaProducer.class);
					
					topicMap.put("dataLinkType", linkTypeOf(trckProc));
					kafkaProducer.sendRabbitMqMsg(topicMap);
				} catch (Exception e) {
					e.printStackTrace();

					pMap = new HashMap<>();
					pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);
					pMap.put("trackingProcessId", trckProc.getTrackingProcessId());
					pMap.put("statusResultMsg", "Tracking Process STATUS ERROR Update Success");
					updateWithHisAndTrackingProcInfo(pMap);
				}
			}

		} else {
			throw new RuntimeException(
					"****************  Execute Tracking Commnd Processing Runtime Error *******************");
		}
	}

	public void executeTrackingProcessSingle(HashMap<String, Object> map) throws Exception {
		HashMap<String, Object> pMap = null;

		TrackingProcessInfo trckProc = trackingProcessInfoMapper.getTrackingProcessInfo(map);

		String status = "", message = "";

		if (trckProc != null && trckProc.getTrackingProcessId() > 0) {
			map.put("trackingProcessId", trckProc.getTrackingProcessId());
			map.put("federatedTwinId", trckProc.getFederatedTwinId());
			map.put("trackingProcessIdentifier", trckProc.getTrackingProcessIdentifier());

			JSONObject bodyJson = new JSONObject();
			bodyJson.put("testCode", "ON");
			
			HashMap<String, Object> topicMap = new HashMap<>();
			topicMap.put("mode", "C");
			topicMap.put("trckTp", trckProc.getTrackingProcessType());
			topicMap.put("topic", trckProc.getTrackingKafkaTopic() != null ? trckProc.getTrackingKafkaTopic() : trckProc.getFederatedTwinId());
			topicMap.put("payload", bodyJson);
			topicMap.put("requestTrackingId", trckProc.getRequestTrackingId());
			topicMap.put("trackingProcessId", trckProc.getTrackingProcessId());
			
			try {
				pMap = new HashMap<>();
				pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_READY);
				pMap.put("trackingProcessId", trckProc.getTrackingProcessId());
				pMap.put("statusResultMsg", "Tracking Process STATUS READY Update Success");
				updateWithHisAndTrackingProcInfo(pMap);

				KafkaProducer kafkaProducer = ctx.getBean(KafkaProducer.class);
			
				topicMap.put("dataLinkType", linkTypeOf(trckProc));
				kafkaProducer.sendRabbitMqMsg(topicMap);
				
			} catch (Exception e) {
				e.printStackTrace();

				pMap = new HashMap<>();
				pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);
				pMap.put("trackingProcessId", trckProc.getTrackingProcessId());
				pMap.put("statusResultMsg", "Tracking Process STATUS ERROR Update Success");
				updateWithHisAndTrackingProcInfo(pMap);
			}
		} else {
			throw new RuntimeException(
					"****************  Tracking Single Processing Insert Runtime Error *******************");
		}
	}

	public void deleteProcess(JSONObject json) throws Exception  {

		HashMap<String, Object> map = new HashMap<>();

		try {
			map.put("requestTrackingId", Integer.parseInt(String.valueOf(json.get("requestTrackingId"))));
			map.put("trackingProcessId", Integer.parseInt(String.valueOf(json.get("trackingProcessId"))));
			
			TrackingProcessInfo trck = trackingProcessInfoMapper.getTrackingProcessInfo(map);
			
			if (trck != null && trck.getTrackingProcessId() > 0) {
				
				if(Constant.TRCK_PROC_STATUS_TASKKILL.equals(trck.getTrackingStatus()))
					map.put("mode", "F");
				else
					map.put("mode", "R");

				map.put("topic", (String) json.get("topic"));			
				map.put("payload", "Delete Message");				
				map.put("flag", "N");
				
				KafkaProducer kafkaProducer = ctx.getBean(KafkaProducer.class);
				
				map.put("dataLinkType", linkTypeOf(trck));
				kafkaProducer.sendRabbitMqMsg(map);
			}
		} catch (Exception e) {
			log.error("Error Message : {} ", e);
		}
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int updateWithHisAndTrackingProcInfo(HashMap<String, Object> map) throws Exception {
		int proCnt = this.taskMapper.updateTrackingProcessInfoMap(map);

		if (proCnt > 0) {
			this.taskMapper.insertTrackingProcChangeHisMultiList(map);

			if(map.get("trackingStatus").equals(Constant.TRCK_PROC_STATUS_COMPLETE) || map.get("trackingStatus").equals(Constant.TRCK_PROC_STATUS_ERROR) ) {
				HashMap<String, Object> paramId = new HashMap<>();
				HashMap<String, Object> paramStatus = new HashMap<>();

				paramId.put("requestTrackingId", map.get("requestTrackingId"));
				paramStatus.put("requestTrackingId", map.get("requestTrackingId"));
				paramStatus.put("trackingStatus", map.get("trackingStatus"));

				List<TrackingProcessInfo> prcList = trackingProcessInfoMapper.getTrackingProcessList(paramId);
				List<TrackingProcessInfo> statusList = trackingProcessInfoMapper.getTrackingProcessList(paramStatus);
				if(prcList.size() == statusList.size()) {
					this.updateWithHisAndTrackingReqInfo(map);
				}
			}
		}

		return proCnt;
	}
	
		@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
		public int updateWithHisAndTrackingReqInfo(HashMap<String, Object> map) throws Exception {
	
			DataEventTrackingRequestInfo dataEventTrackingRequestInfo = new DataEventTrackingRequestInfo();
			dataEventTrackingRequestInfo.setRequestTrackingId(Integer.parseInt(String.valueOf(map.get("requestTrackingId"))));
			dataEventTrackingRequestInfo.setReqTrckCmdStatus(map.get("reqTrckCmdStatus").toString());
			int recCnt = dataEventTrackingRequestInfoMapper.updateDataEventTrackingRequest(dataEventTrackingRequestInfo);
			
			map.put("changeStatus" ,String.valueOf(map.get("reqTrckCmdStatus")));
			TrackingStatusChangeRecord trackStsChangeRecInfo = trackingStatusChangeRecordMapper.getTrackingStatusChangeHistoryInfo(map);
			if (recCnt > 0 && trackStsChangeRecInfo == null) {
				TrackingStatusChangeRecord trackingStatusChangeRecord = new TrackingStatusChangeRecord();
				trackingStatusChangeRecord.setRequestTrackingId(Integer.parseInt(String.valueOf(map.get("requestTrackingId"))));
				trackingStatusChangeRecord.setChangeStatus(map.get("reqTrckCmdStatus").toString());
				trackingStatusChangeRecord.setStatusResultMsg(map.get("statusResultMsg").toString());
				trackingStatusChangeRecordMapper.insertTrackingStatusChangeHistory(trackingStatusChangeRecord);
			}
	
			return recCnt;
		}

	private String linkTypeOf(TrackingProcessInfo proc) {
		String t = proc == null ? null : proc.getDataLinkType();
		return t == null || "".equals(t) ? Constant.DATA_LINK_TYPE_KAFKA : t;
	}
}
