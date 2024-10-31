package iitp.federatedTwins.DtEvtTracking.trackCmdStsChecker.service.impl;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.DataEventTrackingRequestInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessStatusChangeRecord;
import iitp.federatedTwins.DtEvtTracking.common.mapper.DataEventTrackingRequestInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessStatusChangeRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.common.util.RabbitMQConstant;
import iitp.federatedTwins.DtEvtTracking.trackCmdStsChecker.component.RabbitMQComponent;
import iitp.federatedTwins.DtEvtTracking.trackCmdStsChecker.service.TrackCmdStsCheckerService;

@Service
public class TrackCmdStsCheckerServiceImpl implements TrackCmdStsCheckerService {

	private final Logger logger = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private DataEventTrackingRequestInfoMapper dataEventTrackingRequestInfoMapper;

	@Autowired
	private TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	private TrackingProcessStatusChangeRecordMapper trackingProcStatusChangeHisMapper;

	@Autowired
	public RabbitMQComponent rabbitMQComponent;

	public void checkRunningStatus() throws Exception {

		logger.info("checkRunningStatus Start...");
		// requestInfo status 01,02 가져오기
		HashMap<String, Object> map = new HashMap<>();
		map.put("reqTrckCmdStatus", Constant.TRCK_CMD_STATUS_RUNNING);
		List<DataEventTrackingRequestInfo> iList = dataEventTrackingRequestInfoMapper
				.getDataEventTrackingRequestList(map);

		for (int i = 0; i < iList.size(); i++) {
			map.put("requestTrackingId", iList.get(i).getRequestTrackingId());
			List<TrackingProcessInfo> trackProcList = trackingProcessInfoMapper.getTrackingProcessList(map);
			for (int j = 0; j < trackProcList.size(); j++) {
				if (trackProcList.get(j).getTrackingStatus().equals(Constant.TRCK_PROC_STATUS_ERROR)) {
					for (int k = 0; k < trackProcList.size(); k++) {
						if (trackProcList.get(k).getTrackingStatus().equals(Constant.TRCK_PROC_STATUS_RUNNING)) {
							JSONObject json = new JSONObject();
							json.put("topic",
									trackProcList.get(k).getTrackingKafkaTopic() != null
											? trackProcList.get(k).getTrackingKafkaTopic()
											: trackProcList.get(k).getFederatedDigitalObjectId());
							json.put("requestTrackingId", trackProcList.get(k).getRequestTrackingId());
							json.put("trackingProcessId", trackProcList.get(k).getTrackingProcessId());
							rabbitMQComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);
						}
						map.put("requestTrackingId", trackProcList.get(k).getRequestTrackingId());
						map.put("trackingProcessId", trackProcList.get(k).getTrackingProcessId());
						map.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);
						trackingProcessInfoMapper.updateTrackingProcessByParam(map);
					}
				}
			}

			DataEventTrackingRequestInfo dataEventTrackingRequestInfo = new DataEventTrackingRequestInfo();
			dataEventTrackingRequestInfo.setRequestTrackingId(iList.get(i).getRequestTrackingId());
			dataEventTrackingRequestInfo.setReqTrckCmdStatus(Constant.TRCK_CMD_STATUS_ERROR);
			dataEventTrackingRequestInfoMapper.updateDataEventTrackingRequest(dataEventTrackingRequestInfo);

		}
	}

	public void checkTopicErrStatus() throws Exception {
		logger.info("checkTopicErrStatus Start...");
		// requestInfo status 01,02 가져오기

		HashMap<String, Object> map = new HashMap<>();
		map.put("topicCheck", "check");

		ArrayList<String> trackingStatusList = new ArrayList<String>();
		trackingStatusList.add(Constant.TRCK_PROC_STATUS_COMPLETE);
		trackingStatusList.add(Constant.TRCK_PROC_STATUS_ERROR);
		trackingStatusList.add(Constant.TRCK_PROC_STATUS_TIMEOUT);

		map.put("trackingStatusList", trackingStatusList);

		List<TrackingProcessInfo> trackProcList = trackingProcessInfoMapper.getTrackingProcessList(map);
		for (int j = 0; j < trackProcList.size(); j++) {
			JSONObject json = new JSONObject();
			json.put("topic",
					trackProcList.get(j).getTrackingKafkaTopic() != null ? trackProcList.get(j).getTrackingKafkaTopic()
							: trackProcList.get(j).getFederatedDigitalObjectId());
			json.put("requestTrackingId", trackProcList.get(j).getRequestTrackingId());
			json.put("trackingProcessId", trackProcList.get(j).getTrackingProcessId());

			rabbitMQComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);
		}
	}

	public void forceProcessKilled() throws Exception {
		logger.info("checkTopicErrStatus Start...");
		// requestInfo status 01,02 가져오기

		HashMap<String, Object> map = new HashMap<>();
		// topicCheck 파라메터로 넣지 않는 이유는 Event Tracking에는 Topic이 없다.

		ArrayList<String> trackingStatusList = new ArrayList<String>();
		trackingStatusList.add(Constant.TRCK_PROC_STATUS_TASKKILL);

		map.put("trackingStatusList", trackingStatusList);

		List<TrackingProcessInfo> trackProcList = trackingProcessInfoMapper.getTrackingProcessList(map);
		for (int j = 0; j < trackProcList.size(); j++) {
			JSONObject json = new JSONObject();
			json.put("topic",
					trackProcList.get(j).getTrackingKafkaTopic() != null ? trackProcList.get(j).getTrackingKafkaTopic()
							: trackProcList.get(j).getFederatedDigitalObjectId());
			json.put("requestTrackingId", trackProcList.get(j).getRequestTrackingId());
			json.put("trackingProcessId", trackProcList.get(j).getTrackingProcessId());

			rabbitMQComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);
		}
	}

	public void checkTimeOutStatus() throws Exception {
		logger.info("updateStatusChecker Start...");

		HashMap<String, Object> map = new HashMap<>();

		long curTime = System.currentTimeMillis(), procTime = 0, stsChgTime = 0;
		Calendar cal = Calendar.getInstance();

		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");

		ArrayList<String> trackingStatusList = new ArrayList<String>();
		trackingStatusList.add(Constant.TRCK_PROC_STATUS_REG);
		trackingStatusList.add(Constant.TRCK_PROC_STATUS_READY);
		trackingStatusList.add(Constant.TRCK_PROC_STATUS_WAIT);
		trackingStatusList.add(Constant.TRCK_PROC_STATUS_RUNNING);

		map.put("trackingStatusList", trackingStatusList);

		List<TrackingProcessInfo> trackProcList = trackingProcessInfoMapper.getTrackingProcessList(map);
		for (int j = 0; j < trackProcList.size(); j++) {
			if (trackProcList.get(j).getEventEndDate() == null || "".equals(trackProcList.get(j).getEventEndDate())) {
				continue;
			}

			String stsChgDt = trackProcList.get(j).getTrackingStatusChangeTime();

			if (stsChgDt == null || "".equals(stsChgDt)) {
				continue;
			}

			try {
				Date date = sdf.parse(stsChgDt);
				stsChgTime = date.getTime();

				JSONParser parser = new JSONParser();
				JSONObject eventDt = (JSONObject) parser.parse(trackProcList.get(j).getEventEndDate());

				if (eventDt != null && eventDt.get("INTERVAL") != null && !"".equals(eventDt.get("INTERVAL"))
						&& eventDt.get("VALUE") != null && !"".equals(eventDt.get("VALUE"))) {

					// 비교 대상의 시간초기화
					cal.setTimeInMillis(stsChgTime);

					String interval = (String) eventDt.get("INTERVAL");
					int value = Integer.parseInt(String.valueOf(eventDt.get("VALUE")));

					int calType = -1;
					if ("MILLISECONDS".equals(interval))
						calType = Calendar.MILLISECOND;
					else if ("SECONDS".equals(interval))
						calType = Calendar.SECOND;
					else if ("MINUTES".equals(interval))
						calType = Calendar.MINUTE;
					else if ("HOURS".equals(interval))
						calType = Calendar.HOUR;
					else if ("DAYS".equals(interval))
						calType = Calendar.DATE;

					// 타임아웃 설정시간 지정
					cal.add(calType, value);

					procTime = cal.getTimeInMillis();

					// timeout 확인
					if (curTime > procTime) {
						// timeout 시 토픽 삭제(리스너 종료)
						JSONObject json = new JSONObject();
						json.put("topic",
								trackProcList.get(j).getTrackingKafkaTopic() != null
										? trackProcList.get(j).getTrackingKafkaTopic()
										: trackProcList.get(j).getFederatedDigitalObjectId());
						json.put("requestTrackingId", trackProcList.get(j).getRequestTrackingId());
						json.put("trackingProcessId", trackProcList.get(j).getTrackingProcessId());

						rabbitMQComponent.sendMessage(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);

						map.put("requestTrackingId", Integer.valueOf(trackProcList.get(j).getRequestTrackingId()));
						map.put("trackingProcessId", Integer.valueOf(trackProcList.get(j).getTrackingProcessId()));
						map.put("trackingStatus", Constant.TRCK_PROC_STATUS_TIMEOUT);

						this.updateProcessStsChange(map);
					}
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}

	@Transactional(readOnly = false, propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
	private int updateProcessStsChange(HashMap<String, Object> map) throws Exception {

		trackingProcessInfoMapper.updateTrackingProcessByParam(map);

		// 프로세스 상태는 timeout으로 변경처리
		TrackingProcessStatusChangeRecord trcksh = new TrackingProcessStatusChangeRecord();
		Integer ii = Integer.valueOf(0);

		trcksh.setTrackingProcessId(((Integer) map.get("requestTrackingId")).intValue());
		trcksh.setRequestTrackingId(((Integer) map.get("trackingProcessId")).intValue());
		trcksh.setChangeStatus((String) map.get("trackingStatus"));
		trcksh.setStatusResultMsg("Request Command Process Time Out Occured");

		trackingProcStatusChangeHisMapper.insertProcessStatusChangeHistory(trcksh);

		return 1;
	}
}
