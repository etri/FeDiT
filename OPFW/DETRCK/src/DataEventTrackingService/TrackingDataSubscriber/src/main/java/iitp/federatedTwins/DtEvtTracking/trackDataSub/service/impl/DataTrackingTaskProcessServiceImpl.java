package iitp.federatedTwins.DtEvtTracking.trackDataSub.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ScheduledFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import javax.script.ScriptEngine;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import iitp.federatedTwins.DtEvtTracking.common.dto.EventOccuredInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingDetectorProcInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseDataInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.mapper.EventOccuredInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingDectorProcInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.common.util.RabbitMQConstant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.component.RabbitMQComponent;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.mapper.TrackingTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.DataTrackingTaskProcessService;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;

@Service
public class DataTrackingTaskProcessServiceImpl implements DataTrackingTaskProcessService {

	private final Logger log = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private ScriptEngine scriptEngine;

	@Autowired
	private TrackingDataSubscriberService trackingDataSubscriberService;

	@Autowired
	private TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	private TrackingTaskInfoMapper trackingTaskInfoMapper;

	@Autowired
	private EventOccuredInfoMapper eventOccuredInfoMapper;

	@Autowired
	private TrackingDectorProcInfoMapper trackingDectorProcInfoMapper;

	@Autowired
	ApplicationContext ctx;

	@Autowired
	HashMap<String, ScheduledFuture> dataScheduledFutureInfo;

	@Autowired
	HashMap<String, ScheduledFuture> eventScheduledFutureInfo;

	@Autowired
	public RabbitMQComponent rabbitMQComponent;

	@Transactional
	public void dataTrackingProcessTask(HashMap<String, Object> map) throws Exception {
		TrackingProcessInfo prdInfo = null;

		if ("OC".equals(map.get("mode"))) {
			log.info("DataTrackingTaskProcess mode OC - requestId, processId ==> " + map.get("requestTrackingId") + " : "
					+ map.get("trackingProcessId"));
			prdInfo = trackingDataSubscriberService.getTrackingProcessInfo(map);

			if (prdInfo != null) {
				map.put("detectRecordStartId", prdInfo.getDetectRecordStartId());
				map.put("detectRecordEndId", prdInfo.getDetectRecordEndId());

				log.info("DataTrackingTaskProcess mode OC - Start run() ==> " + prdInfo.getDetectRecordStartId() + " : "
						+ prdInfo.getDetectRecordEndId());
			}
		} else {
			log.info("DataTrackingTaskProcess mode ED - requestId, processId   ===>  " + map.get("requestTrackingId") + " : "
					+ map.get("trackingProcessId"));
			prdInfo = trackingDataSubscriberService.getDataTrackingDelayProcessInfo(map);

			if (prdInfo != null) {
				map.put("detectRecordStartId", prdInfo.getDetectRecordStartId());
				map.put("detectRecordEndId", prdInfo.getDetectRecordEndId());

				log.info("DataTrackingTaskProcess mode ED - Start run() ==> " + prdInfo.getDetectRecordStartId() + " : "
						+ prdInfo.getDetectRecordEndId());
			}
		}

		if (prdInfo != null) {

			log.info("prdInfo.getEventOccurredCount >>>>>>> : {}", prdInfo.getEventOccurredCount());
			log.info("prdInfo.getEventTotalCnt >>>>>>> : {}", prdInfo.getEventTotalCnt());

			if (prdInfo.getEventOccurredCount() > 0 && prdInfo.getEventOccurredCount() <= prdInfo.getEventTotalCnt()) {
				JSONObject json = new JSONObject();
				json.put("topic", prdInfo.getTrackingKafkaTopic() != null ? prdInfo.getTrackingKafkaTopic()
						: prdInfo.getFederatedTwinId());
				json.put("requestTrackingId", prdInfo.getRequestTrackingId());
				json.put("trackingProcessId", prdInfo.getTrackingProcessId());
				sendRabbitMq(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);

				ScheduledFuture schFuture = dataScheduledFutureInfo.get(String.valueOf(prdInfo.getRequestTrackingId())
						+ String.valueOf(prdInfo.getTrackingProcessId()));

				if (schFuture != null) {
					schFuture.cancel(true);
					schFuture = null;
					dataScheduledFutureInfo.remove(String.valueOf(prdInfo.getRequestTrackingId())
							+ String.valueOf(prdInfo.getTrackingProcessId()));
				}
			} else {

				// task 실행 시점에 저장
				TrackingDetectorProcInfo trackingDectorProc = new TrackingDetectorProcInfo();
				log.info("dataTrackingProcessTask trackingProcessId : {} ", map.get("trackingProcessId"));

				trackingDectorProc.setTrackingProcessId(prdInfo.getTrackingProcessId());
				trackingDectorProc.setRequestTrackingId(prdInfo.getRequestTrackingId());
				trackingDectorProc.setDetectedStatus(Constant.TRCK_DECTOR_STATUS_READY);
				trackingDectorProc.setDetectRecordStartId(prdInfo.getDetectRecordStartId());
				trackingDectorProc.setDetectRecordEndId(prdInfo.getDetectRecordEndId());

				trackingDectorProcInfoMapper.insertTrackingDectorProc(trackingDectorProc);

				if (trackingDectorProc.getDetectorProcId() > 0) {

					map.put("dtFltTp", prdInfo.getDataFilterType());

					TrackingResponseRecord trackingResponseRecord = null;
					if ("OC".equals(map.get("mode"))) {
						//OC 모드일때에는 start == end 동일한 값으로 셋팅되기도 함.
						map.put("occuredMode", "occuredMode");
						trackingResponseRecord = trackingTaskInfoMapper.getDTResponseRecord(map);
					} else {
						// ED
						//start == end 동일한 값으로 셋팅되도 조회가 안되어야 함.
						trackingResponseRecord = trackingTaskInfoMapper.getDTResponseRecordEventDelay(map);
					}

					// 이벤트 발생 조건 체크 및 트리커에 이벤트 정보 전송
					if (trackingResponseRecord != null && trackingResponseRecord.getTotalReceiveVal() != null) {
						map.put("trackingProcessIdentifier", prdInfo.getTrackingProcessIdentifier());
						map.put("resultValue", trackingResponseRecord.getTotalReceiveVal());

						// 결과값 저장
						trackingTaskInfoMapper.insertResultValue(map);						
					} 

					// 완료 업데이트
					HashMap<String, Object> recordParam = new HashMap<>();
					recordParam.put("detectorProcId", trackingDectorProc.getDetectorProcId());
					recordParam.put("detectedStatus", Constant.TRCK_DECTOR_STATUS_COMPLETE);
					recordParam.put("trackingResultValue",
							trackingResponseRecord != null && trackingResponseRecord.getTotalReceiveVal() != null
							? trackingResponseRecord.getTotalReceiveVal()
									: "-");

					trackingDectorProcInfoMapper.updateTrackingDectorProcByParam(recordParam);

					// true / false 분기처리
					JSONObject data = new JSONObject();
					JSONParser jsonParser = new JSONParser();
					data = (JSONObject) jsonParser.parse(prdInfo.getEventCondition());

					if (data != null && (boolean) data.get("checkable") == true) {

						EventOccuredInfo eventOccuredInfo = new EventOccuredInfo();
						eventOccuredInfo.setDetectorProcId(trackingDectorProc.getDetectorProcId());
						eventOccuredInfo.setEventTransMittedStatus(Constant.TRG_EVT_STATUS_READY);
						eventOccuredInfo.setTrackingProcessId(prdInfo.getTrackingProcessId());
						eventOccuredInfo.setRequestTrackingId(prdInfo.getRequestTrackingId());
						eventOccuredInfo.setEventOccuredMsg("** Event Occured By Data Trigger **");

						eventOccuredInfoMapper.insertEventOccured(eventOccuredInfo);

						JSONObject json = new JSONObject();
						json.put("trackingProcessId", map.get("trackingProcessId"));
						json.put("requestTrackingId", map.get("requestTrackingId"));
						json.put("detectorProcId", String.valueOf(trackingDectorProc.getDetectorProcId()));
						json.put("eventOccuredId", String.valueOf(eventOccuredInfo.getEventOccuredId()));

						sendRabbitMq(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT);
					}
				} else {
					throw new RuntimeException(
							"*********** TrackingDetectorProcInfo Insert Proc Runtime Error ******** ");
				}
			}

		} else {
			throw new RuntimeException("*********** TrackingProcessInfo not Exists ******** ");
		}
	}

	// RabbitMq 이벤트 전송 메소드
	public void sendRabbitMq(JSONObject json, String routingKey) {
		try {
			log.info("DataTrackingTaskProcessServiceImpl sendRabbitMq json : {}", json.toJSONString());
			log.info("DataTrackingTaskProcessServiceImpl sendRabbitMq routingKey : {}", routingKey);
			// 이벤트 전송
			rabbitMQComponent.sendMessage(json, routingKey);
		} catch (Exception e) {
			log.error("Error Message : {}", e);
		}

	}

	@Transactional
	public void eventTrackingProcessTask(HashMap<String, Object> map) throws Exception {

		// task 실행 시점에 저장
		log.info("eventTrackingProcessTask trackingProcessId : {}", map.get("trackingProcessId"));

		TrackingDetectorProcInfo trackingDectorProc = new TrackingDetectorProcInfo();
		trackingDectorProc.setTrackingProcessId(Integer.parseInt((String) map.get("trackingProcessId")));
		trackingDectorProc.setRequestTrackingId(Integer.parseInt((String) map.get("requestTrackingId")));
		trackingDectorProc.setDetectedStatus(Constant.TRCK_DECTOR_STATUS_READY);

		trackingDectorProcInfoMapper.insertTrackingDectorProc(trackingDectorProc);

		TrackingProcessInfo prdInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);

		if (prdInfo != null) {

			//-1 무제한
			if (prdInfo.getEventOccurredCount() > 0) {
				int eCnt = eventOccuredInfoMapper.getEventOccuredCnt(map);

				if (eCnt > 0) {
					prdInfo.setEventTotalCnt(eCnt);
				}
			}

			log.info("prdInfo.getEventOccurredCount >>>>>>> : {}", prdInfo.getEventOccurredCount());
			log.info("prdInfo.getEventTotalCnt >>>>>>> : {}", prdInfo.getEventTotalCnt());

			if (prdInfo.getEventOccurredCount() > 0 && prdInfo.getEventOccurredCount() <= prdInfo.getEventTotalCnt()) {
				JSONObject json = new JSONObject();
				json.put("topic", prdInfo.getTrackingKafkaTopic() != null ? prdInfo.getTrackingKafkaTopic()
						: prdInfo.getFederatedTwinId());
				json.put("requestTrackingId", prdInfo.getRequestTrackingId());
				json.put("trackingProcessId", prdInfo.getTrackingProcessId());
				sendRabbitMq(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_PUB_TOPIC_DELETE);

				ScheduledFuture schFuture = eventScheduledFutureInfo.get(String.valueOf(prdInfo.getRequestTrackingId())
						+ String.valueOf(prdInfo.getTrackingProcessId()));

				if (schFuture != null) {
					schFuture.cancel(true);
					schFuture = null;
					eventScheduledFutureInfo.remove(String.valueOf(prdInfo.getRequestTrackingId())
							+ String.valueOf(prdInfo.getTrackingProcessId()));
				}
			} else {

				// true / false 분기처리
				JSONObject data = new JSONObject();
				JSONParser jsonParser = new JSONParser();
				data = (JSONObject) jsonParser.parse(prdInfo.getEventCondition());

				String resultVal = "";
				if (data != null && (boolean) data.get("checkable") == true) {
					// 수식 결과값 처리
					boolean checkExpr = true;

					if (!"".equals(prdInfo.getEventCondition())) {

						ArrayList<String> arr = this.getContentsParamNm(prdInfo.getEventCondition());
						ArrayList<String> item = new ArrayList<>();
						HashMap<String, String> param = new HashMap<>();

						HashMap<String, Object> itfr = new HashMap<>();
						HashMap<String, Object> itfrChk = new HashMap<>();

						JSONObject rtnJson = new JSONObject();
						JSONArray rtnArr = new JSONArray();
						for (int i = 0; i < arr.size(); i++) {
							rtnJson = new JSONObject();
							itfr.put("trackingProcessIdentifier", arr.get(i));

							// 현재 식별자(프로세스) 정보의 응답값 조회
							TrackingResponseDataInfo trackingResponseDataInfo = trackingTaskInfoMapper
									.getTrackingResData(itfr);
							if (trackingResponseDataInfo != null) {
								item.add(trackingResponseDataInfo.getResultValue());
							}

							// 필터 변수 중복체크
							if (itfrChk.get(arr.get(i)) == null) {
								itfrChk.put(arr.get(i), arr.get(i));

								// 트래킹 프로세스 조회 및 식별자 셋팅
								TrackingProcessInfo dtTrckInfo = trackingProcessInfoMapper.getTrackingProcessInfo(itfr);
								rtnJson.put("trckPrcIdtifier", dtTrckInfo.getTrckPrcIdtifier());
								rtnJson.put("trckValue",
										trackingResponseDataInfo != null ? trackingResponseDataInfo.getResultValue()
												: "-");

								rtnArr.add(rtnJson);
							}

							param.put(arr.get(i), "rtnVal" + i);
						}

						String logicalExpr = this.madeToContentsValidParam(prdInfo.getEventCondition(), param);
						JSONObject json = new JSONObject();
						JSONObject evntCondition = new JSONObject();
						JSONObject json2 = new JSONObject();
						JSONParser parser = new JSONParser();

						ArrayList<String> keyName = this.getContentsParamNm(logicalExpr);

						List<String> keyName1 = keyName.stream().distinct().collect(Collectors.toList());

						json = (JSONObject) parser.parse(logicalExpr);
						json2 = (JSONObject) json.get("expression");

						checkExpr = procLogicalExpression(
								json2.get("ctrlStatement").toString().replaceAll("#\\{", "").replaceAll("\\}", ""),
								keyName.stream().distinct().collect(Collectors.toList()),
								item.stream().distinct().collect(Collectors.toList()));

						// 조회 조건 체크한 결과를 리턴값에 셋팅
						evntCondition.put("trckValue", rtnArr);
						evntCondition.put("evntCondition", checkExpr);

						resultVal = evntCondition.toJSONString();

						// 이벤트가 발생했을때만 이벤트를 발생하려 했지만 실패의 정보도 전송하는 것이 일관성측면에서 좋을 것으로 판단됨.
						//poc를 위해 발생했을 때만 이벤트를 발생하는 것으로 수정

						// 완료 업데이트
						HashMap<String, Object> dectParam = new HashMap<>();
						dectParam.put("detectorProcId", trackingDectorProc.getDetectorProcId());
						dectParam.put("detectedStatus", Constant.TRCK_DECTOR_STATUS_COMPLETE);
						dectParam.put("trackingResultValue", resultVal);

						trackingDectorProcInfoMapper.updateTrackingDectorProcByParam(dectParam);	

						if(checkExpr) {
							EventOccuredInfo eventOccuredInfo = new EventOccuredInfo();
							eventOccuredInfo.setDetectorProcId(trackingDectorProc.getDetectorProcId());
							eventOccuredInfo.setEventTransMittedStatus(Constant.TRG_EVT_STATUS_READY);
							eventOccuredInfo.setTrackingProcessId(prdInfo.getTrackingProcessId());
							eventOccuredInfo.setRequestTrackingId(prdInfo.getRequestTrackingId());
							eventOccuredInfo.setEventOccuredMsg("** Event Occured By Event Trigger **");

							eventOccuredInfoMapper.insertEventOccured(eventOccuredInfo);

							json.put("trackingProcessId", map.get("trackingProcessId"));
							json.put("requestTrackingId", map.get("requestTrackingId"));
							json.put("detectorProcId", String.valueOf(trackingDectorProc.getDetectorProcId()));
							json.put("eventOccuredId", String.valueOf(eventOccuredInfo.getEventOccuredId()));

							sendRabbitMq(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_EVENT_TRANSMIT);


							//사용한 데이터 트래킹 값을 초기화 시킨다.
							log.info(" 이벤트 트래킹 이후 trackingProcessIdentifier 값 초기화  >>>>>>>");

							for (int i = 0; i < arr.size(); i++) {
								map.put("trackingProcessIdentifier", arr.get(i));
								map.put("resultValue", "-");

								// 결과값 저장
								trackingTaskInfoMapper.updateResultValue(map);								
							}

						}
					}
				}
			}
		} else {
			throw new RuntimeException("*********** TrackingProcessInfo not Exists ******** ");
		}

	}

	private boolean procLogicalExpression(String logicalExpr, List<String> keyName, List<String> rtnVal) {
		Boolean procBool = false;

		StringBuilder sb = new StringBuilder();
		try {
			log.info("procLogicalExpression logicalExpr : {}", logicalExpr);
			log.info("procLogicalExpression keyName : {}", keyName);
			log.info("procLogicalExpression rtnVal : {}", rtnVal);

			if (rtnVal.size() != keyName.size()) {
				return false;
			} else {
				for (int i = 0; i < rtnVal.size(); i++) {
					sb.append("var " + keyName.get(i) + "=" + rtnVal.get(i) + "; ");
				}

				sb.append("if( ");
				sb.append(logicalExpr);
				sb.append(" ) ");
				sb.append(" true; ");
				sb.append(" else ");
				sb.append(" false; ");

				String expression = sb.toString();

				procBool = (Boolean) scriptEngine.eval(expression);

				log.info("procLogicalExpression procBool : {}", procBool);
			}
		} catch (Exception e) {
			log.error("Error Message : {}", e);
			System.out.println(String.format("ScriptException while running js code: {}", ""));
			procBool = false;
		}

		return procBool;
	}

	public String madeToContentsValidParam(String content, HashMap<String, String> param) {
		try {
			log.info("madeToContentsValidParam content : {}", content);
			log.info("madeToContentsValidParam param : {}", param);
			if (param != null && param.size() > 0) {
				Iterator<String> it = param.keySet().iterator();
				while (it.hasNext()) {
					String key = it.next();
					if (key != null && !"".equals(key)) {
						String value = param.get(key);
						if (value != null && !"".equals(value)) {
							System.out.println();
							content = content.replaceAll(key, value);
						}
					}
				}
			}

		} catch (Exception e) {
			log.error("Error Message : {}", e);
		}

		return content;
	}

	public ArrayList<String> getContentsParamNm(String contents) {
		ArrayList<String> paramArray = new ArrayList<String>();

		try {
			log.info("getContentsParamNm content : {}", contents);
			String regEx = "#\\{[^\\}]+\\}";
			Pattern pat = Pattern.compile(regEx);
			Matcher match = pat.matcher(contents);

			while (match.find()) {
				String groupParam = match.group();
				groupParam = groupParam.replaceAll("#\\{", "").replaceAll("\\}", "");
				paramArray.add(groupParam);
			}
		} catch (Exception e) {
			log.info("getContentsParamNm contents : {}", contents);
			paramArray = null;
		}

		return paramArray;
	}

}
