package iitp.federatedTwins.DtEvtTracking.trackDataSub.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.ScheduledFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.concurrent.ConcurrentHashMap;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import iitp.federatedTwins.DtEvtTracking.common.dto.EventOccuredInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingDetectorProcInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseDataInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingResponseRecord;
import iitp.federatedTwins.DtEvtTracking.common.mapper.EventOccuredInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingDectorProcInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingResponseRecordMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.ConditionExpression;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.common.util.RabbitMQConstant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.component.RabbitMQComponent;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.mapper.TrackingTaskInfoMapper;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.ngsi.NgsiLdCollector;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.DataTrackingTaskProcessService;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;

@Service
public class DataTrackingTaskProcessServiceImpl implements DataTrackingTaskProcessService {

	private final Logger log = LoggerFactory.getLogger(this.getClass());

	private static final DateTimeFormatter CHECKED_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

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
	private TrackingResponseRecordMapper trackingResponseRecordMapper;

	@Autowired
	ApplicationContext ctx;

	@Autowired
	ConcurrentHashMap<String, ScheduledFuture> dataScheduledFutureInfo;

	@Autowired
	ConcurrentHashMap<String, ScheduledFuture> eventScheduledFutureInfo;

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
						trackingResponseRecord = trackingTaskInfoMapper.getDTResponseRecord(map);
					} else {
						trackingResponseRecord = trackingTaskInfoMapper.getDTResponseRecordEventDelay(map);
					}

					if (trackingResponseRecord != null && trackingResponseRecord.getTotalReceiveVal() != null) {
						map.put("trackingProcessIdentifier", prdInfo.getTrackingProcessIdentifier());
						map.put("resultValue", trackingResponseRecord.getTotalReceiveVal());

						trackingTaskInfoMapper.insertResultValue(map);						
					} 

					HashMap<String, Object> recordParam = new HashMap<>();
					recordParam.put("detectorProcId", trackingDectorProc.getDetectorProcId());
					recordParam.put("detectedStatus", Constant.TRCK_DECTOR_STATUS_COMPLETE);
					recordParam.put("trackingResultValue",
							trackingResponseRecord != null && trackingResponseRecord.getTotalReceiveVal() != null
							? trackingResponseRecord.getTotalReceiveVal()
									: "-");

					trackingDectorProcInfoMapper.updateTrackingDectorProcByParam(recordParam);

					JSONObject data = new JSONObject();
					JSONParser jsonParser = new JSONParser();
					data = (JSONObject) jsonParser.parse(prdInfo.getEventCondition());

					boolean hasValue = trackingResponseRecord != null
							&& trackingResponseRecord.getTotalReceiveVal() != null;

					if (data != null && (boolean) data.get("checkable") == true && hasValue) {

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
					} else if (data != null && (boolean) data.get("checkable") == true && !"OC".equals(map.get("mode"))) {
						String status = NgsiLdCollector.Outcome.FAILED.name().equals(map.get("collectOutcome"))
								? Constant.TRCK_STATUS_COLLECT_ERROR
								: Constant.TRCK_STATUS_NO_DATA;
						sendStatusMessage(prdInfo, status, prdInfo.getLastObservedAt(), null);
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

	@SuppressWarnings("unchecked")
	private void sendStatusMessage(TrackingProcessInfo prdInfo, String status, String lastObservedAt,
			List<String> noDataRefs) {
		JSONObject json = new JSONObject();
		json.put("requestTrackingId", String.valueOf(prdInfo.getRequestTrackingId()));
		json.put("trackingProcessId", String.valueOf(prdInfo.getTrackingProcessId()));
		json.put("status", status);
		if (lastObservedAt != null && !"".equals(lastObservedAt)) {
			json.put("lastObservedAt", lastObservedAt);
		}
		if (noDataRefs != null && !noDataRefs.isEmpty()) {
			JSONArray refs = new JSONArray();
			refs.addAll(noDataRefs);
			json.put("noDataRefs", refs);
		}
		json.put("checkedTime", LocalDateTime.now().format(CHECKED_TIME));

		sendRabbitMq(json, RabbitMQConstant.RABBITMQ_ROUTING_KEY_TGR_STATUS_TRANSMIT);
	}

	private static boolean isNumeric(String v) {
		if (v == null) {
			return false;
		}
		try {
			return !Double.isNaN(Double.parseDouble(v.trim()));
		} catch (NumberFormatException e) {
			return false;
		}
	}

	public void sendRabbitMq(JSONObject json, String routingKey) {
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					publish(json, routingKey);
				}
			});
		} else {
			publish(json, routingKey);
		}
	}

	private void publish(JSONObject json, String routingKey) {
		try {
			log.info("DataTrackingTaskProcessServiceImpl sendRabbitMq json : {}", json.toJSONString());
			log.info("DataTrackingTaskProcessServiceImpl sendRabbitMq routingKey : {}", routingKey);
			rabbitMQComponent.sendMessage(json, routingKey);
		} catch (Exception e) {
			log.error("Error Message : {}", e);
		}

	}

	@Transactional
	public void eventTrackingProcessTask(HashMap<String, Object> map) throws Exception {

		log.info("eventTrackingProcessTask trackingProcessId : {}", map.get("trackingProcessId"));

		TrackingDetectorProcInfo trackingDectorProc = new TrackingDetectorProcInfo();
		trackingDectorProc.setTrackingProcessId(Integer.parseInt((String) map.get("trackingProcessId")));
		trackingDectorProc.setRequestTrackingId(Integer.parseInt((String) map.get("requestTrackingId")));
		trackingDectorProc.setDetectedStatus(Constant.TRCK_DECTOR_STATUS_READY);

		int[] window = eventWindow(map);
		trackingDectorProc.setDetectRecordStartId(window[0]);
		trackingDectorProc.setDetectRecordEndId(window[1]);

		trackingDectorProcInfoMapper.insertTrackingDectorProc(trackingDectorProc);

		TrackingProcessInfo prdInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);

		if (prdInfo != null) {

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

				JSONObject data = new JSONObject();
				JSONParser jsonParser = new JSONParser();
				data = (JSONObject) jsonParser.parse(prdInfo.getEventCondition());

				String resultVal = "";
				if (data != null && (boolean) data.get("checkable") == true) {
					boolean checkExpr = true;

					if (!"".equals(prdInfo.getEventCondition())) {

						ArrayList<String> arr = this.getContentsParamNm(prdInfo.getEventCondition());
						HashMap<String, String> valueById = new HashMap<>();
						HashMap<String, String> displayById = new HashMap<>();

						HashMap<String, Object> itfr = new HashMap<>();
						HashMap<String, Object> itfrChk = new HashMap<>();

						JSONObject rtnJson = new JSONObject();
						JSONArray rtnArr = new JSONArray();
						for (int i = 0; i < arr.size(); i++) {
							rtnJson = new JSONObject();

							String refUuid = resolveProcessUuid(prdInfo.getRequestTrackingId(), arr.get(i));
							itfr.put("trackingProcessIdentifier", refUuid != null ? refUuid : arr.get(i));

							TrackingProcessInfo dtTrckInfo = trackingProcessInfoMapper.getTrackingProcessInfo(itfr);
							String windowValue = aggregateInWindow(dtTrckInfo, window);
							if (windowValue != null) {
								valueById.put(arr.get(i), windowValue);
							}

							if (itfrChk.get(arr.get(i)) == null) {
								itfrChk.put(arr.get(i), arr.get(i));

								rtnJson.put("trckPrcIdtifier",
										dtTrckInfo != null ? dtTrckInfo.getTrckPrcIdtifier() : arr.get(i));
								displayById.put(arr.get(i),
										dtTrckInfo != null ? dtTrckInfo.getTrckPrcIdtifier() : arr.get(i));
								rtnJson.put("trckValue", windowValue != null ? windowValue : "-");

								rtnArr.add(rtnJson);
							}
						}

						JSONObject json = new JSONObject();
						JSONObject evntCondition = new JSONObject();
						JSONObject json2 = (JSONObject) ((JSONObject) new JSONParser()
								.parse(prdInfo.getEventCondition())).get("expression");

						if (json2 == null || !(json2.get("ctrlStatement") instanceof String)) {
							log.warn("이벤트 조건에 expression.ctrlStatement 문자열이 없습니다. pro={} cond={}",
									map.get("trackingProcessId"), prdInfo.getEventCondition());
							return;
						}

						try {
							checkExpr = ConditionExpression.evaluate((String) json2.get("ctrlStatement"), valueById);
						} catch (IllegalArgumentException e) {
							log.warn("지원하지 않는 조건식이라 판정하지 않습니다. pro={} cause={}",
									map.get("trackingProcessId"), e.getMessage());
							checkExpr = false;
						}

						evntCondition.put("ctrlDataValues", rtnArr);
						evntCondition.put("evntCondition", checkExpr);

						resultVal = evntCondition.toJSONString();

						HashMap<String, Object> dectParam = new HashMap<>();
						dectParam.put("detectorProcId", trackingDectorProc.getDetectorProcId());
						dectParam.put("detectedStatus", Constant.TRCK_DECTOR_STATUS_COMPLETE);
						dectParam.put("trackingResultValue", resultVal);

						trackingDectorProcInfoMapper.updateTrackingDectorProcByParam(dectParam);

						if (!checkExpr) {
							List<String> noDataRefs = new ArrayList<>();
							for (String id : new LinkedHashSet<>(arr)) {
								if (!isNumeric(valueById.get(id))) {
									noDataRefs.add(displayById.getOrDefault(id, id));
								}
							}
							if (!noDataRefs.isEmpty()) {
								sendStatusMessage(prdInfo, Constant.TRCK_STATUS_NO_DATA, null, noDataRefs);
							}
						}

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

						}
					}
				}
			}
		} else {
			throw new RuntimeException("*********** TrackingProcessInfo not Exists ******** ");
		}

	}

	private int[] eventWindow(HashMap<String, Object> map) throws Exception {
		HashMap<String, Object> param = new HashMap<>();
		param.put("requestTrackingId", map.get("requestTrackingId"));
		param.put("trackingProcessId", map.get("trackingProcessId"));
		param.put("orderByDesc", "orderByDesc");
		param.put("limitOne", "limitOne");
		TrackingDetectorProcInfo prev = trackingDectorProcInfoMapper.getTrackingDectorProcInfo(param);
		int start = (prev != null ? prev.getDetectRecordEndId() : 0) + 1;

		param.clear();
		param.put("orderByDesc", "orderByDesc");
		param.put("limitBufferSize", 1);
		List<TrackingResponseRecord> last = trackingResponseRecordMapper.getResponseRecord(param);
		int end = last != null && !last.isEmpty() ? last.get(0).getTrackingResponseId() : 0;
		if (end < start - 1) {
			end = start - 1;
		}
		return new int[] { start, end };
	}

	private String aggregateInWindow(TrackingProcessInfo dataProc, int[] window) throws Exception {
		if (dataProc == null || window[1] < window[0]) {
			return null;
		}
		HashMap<String, Object> param = new HashMap<>();
		param.put("trackingProcessId", dataProc.getTrackingProcessId());
		param.put("detectRecordStartId", window[0]);
		param.put("detectRecordEndId", window[1]);
		param.put("dtFltTp", dataProc.getDataFilterType());
		param.put("orderById", "orderById");
		param.put("bufferSize", dataProc.getBufferSize());
		TrackingResponseRecord rec = trackingTaskInfoMapper.getDTResponseRecordEventDelay(param);
		return rec != null && rec.getTotalReceiveVal() != null ? String.valueOf(rec.getTotalReceiveVal()) : null;
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

	private String resolveProcessUuid(int requestTrackingId, String identifier) {
		try {
			HashMap<String, Object> param = new HashMap<>();
			param.put("requestTrackingId", requestTrackingId);
			param.put("trckPrcIdtifier", identifier);
			return trackingProcessInfoMapper.getProcessUuidByIdentifier(param);
		} catch (Exception e) {
			log.warn("조건식 식별자를 UUID 로 바꾸지 못했습니다. req={} id={}", requestTrackingId, identifier);
			return null;
		}
	}
}
