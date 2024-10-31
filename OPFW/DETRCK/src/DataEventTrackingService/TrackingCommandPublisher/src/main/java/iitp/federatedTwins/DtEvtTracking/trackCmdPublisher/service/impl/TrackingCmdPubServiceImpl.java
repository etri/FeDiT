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

		// 토픽 메시지 전송내용 저장
		TrackingProcessInfo trackingProcessInfo = new TrackingProcessInfo();
		trackingProcessInfo.setTrackingKafkaTopic(String.valueOf(map.get("payload")));
		trackingProcessInfo.setRequestTrackingId((int) map.get("requestTrackingId"));
		trackingProcessInfo.setTrackingProcessId((int) map.get("trackingProcessId"));
		trackingProcessInfoMapper.updateTrackingProcess(trackingProcessInfo);

		if(map.get("mode") != null && map.get("mode").equals("C")) {
			// 성공처리
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
		// map inner param requestTrackingId
		log.info("map : {} " , map.toString());
		List<TrackingProcessInfo> trckList = taskMapper.getTrackCmdProcInfoList(map);

		// 트래킹 프로세스 정보 확인
		if (trckList != null && trckList.size() > 0) {
			// 타스크 정보가 정상적으로 등록되면 시퀀스정보, 운용타스크 정보를 기반으로 단위 실행시퀀스를 실행시킨다.
			String status = null;
			JSONObject bodyJson = new JSONObject();
			bodyJson.put("testCode22", "ON");

			for (TrackingProcessInfo trckProc : trckList) {
				HashMap<String, Object> topicMap = new HashMap<>();
				topicMap.put("mode", "C");
				topicMap.put("trckTp", trckProc.getTrackingProcessType());

				log.info("getFederatedDigitalObjectId : {} " , trckProc.getFederatedDigitalObjectId());
				log.info("getTrackingKafkaTopic : {} " , trckProc.getTrackingKafkaTopic());

				topicMap.put("topic", trckProc.getTrackingKafkaTopic() != null ? trckProc.getTrackingKafkaTopic() : trckProc.getFederatedTwinId());
				topicMap.put("payload", bodyJson);
				topicMap.put("requestTrackingId", trckProc.getRequestTrackingId());
				topicMap.put("trackingProcessId", trckProc.getTrackingProcessId());

				try {
					pMap = new HashMap<>();
					// 트래킹 프로세스 상태정보 변경 : 생성/등록-> 준비 상태
					pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_READY);
					pMap.put("trackingProcessId", trckProc.getTrackingProcessId());
					pMap.put("statusResultMsg", "Tracking Process STATUS READY Update Success");
					updateWithHisAndTrackingProcInfo(pMap);

					KafkaProducer kafkaProducer = ctx.getBean(KafkaProducer.class);

					//데이터 트래킹 -> 토픽전송해야 함.
					if(Constant.TRCK_CMD_TYPE_DATA.equals(trckProc.getTrackingProcessType()) && map.get("flag").equals("Y")) {
						kafkaProducer.sendTopic(topicMap);
					} else {
						//이벤트 트래킹 토픽 전송 불 필요
						kafkaProducer.sendRabbitMqMsg(topicMap);						
					}
				} catch (Exception e) {
					e.printStackTrace();

					pMap = new HashMap<>();
					// 트래킹 프로세스 상태정보 변경 : 생성/등록-> 준비 상태
					pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);
					pMap.put("trackingProcessId", trckProc.getTrackingProcessId());
					pMap.put("statusResultMsg", "Tracking Process STATUS ERROR Update Success");
					updateWithHisAndTrackingProcInfo(pMap);
				}
			}

		} else {
			// 시퀀스 제어명령 생성 이력등록
			throw new RuntimeException(
					"****************  Execute Tracking Commnd Processing Runtime Error *******************");
		}
	}

	public void executeTrackingProcessSingle(HashMap<String, Object> map) throws Exception {
		HashMap<String, Object> pMap = null;

		TrackingProcessInfo trckProc = trackingProcessInfoMapper.getTrackingProcessInfo(map);

		// 타스크 정보가 정상적으로 등록되면 시퀀스정보, 운용타스크 정보를 기반으로 단위 실행시퀀스를 실행시킨다.
		String status = "", message = "";

		if (trckProc != null && trckProc.getTrackingProcessId() > 0) {	} else {
			// 시퀀스 제어명령 생성 이력등록
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
				//				kafkaManager.deleteTopic((String) json.get("topic"));

				if(Constant.TRCK_PROC_STATUS_TASKKILL.equals(trck.getTrackingStatus()))
					map.put("mode", "F");
				else
					map.put("mode", "R");

				map.put("topic", (String) json.get("topic"));			
				map.put("payload", "Delete Message");				
				map.put("flag", "N");

				KafkaProducer kafkaProducer = ctx.getBean(KafkaProducer.class);

				//데이터 트래킹 -> 토픽전송해야 함.
				if(Constant.TRCK_CMD_TYPE_DATA.equals(trck.getTrackingProcessType()) && map.get("flag").equals("Y")) {
					kafkaProducer.sendTopic(map);
				} else {
					//이벤트 트래킹 토픽 전송 불 필요
					kafkaProducer.sendRabbitMqMsg(map);						
				}
			}
		} catch (Exception e) {
			log.error("Error Message : {} ", e);
		}
	}


	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	public int updateWithHisAndTrackingProcInfo(HashMap<String, Object> map) throws Exception {
		// 시퀀스 ID에 해당하는 시퀀스 정보를 상태만 변경하는 쿼리
		int proCnt = this.taskMapper.updateTrackingProcessInfoMap(map);

		// 상태정보 업데이트되야 이후 프로세스처리를 진행해야 한다.
		if (proCnt > 0) {
			// 변경된 시퀀스 정보의 이력을 남기는 쿼리
			this.taskMapper.insertTrackingProcChangeHisMultiList(map);

			// 최종 결과값 저장
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

}
