package iitp.federatedTwins.DtEvtTracking.trackDataSub.component;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.ConcurrentHashMap;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.messaging.handler.annotation.Headers;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;
import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTopicInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingProcessInfoMapper;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTopicMapper;
import iitp.federatedTwins.DtEvtTracking.common.util.Constant;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.task.DataEndDateScheduleProcess;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.task.DataTrackingTaskProcess;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.task.EventEndDateScheduleProcess;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.task.EventTrackingTaskProcess;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.ngsi.NgsiLdCollector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Repository
@RequiredArgsConstructor

public class RabbitMQComponent {
	private final Logger logger = LoggerFactory.getLogger(RabbitMQComponent.class);

	private static final long FIRST_COLLECT_DELAY_MS = 3000L;

	@Value("${rabbitmq.exchange.name}")
	private String exchangeName;

	@Value("${rabbitmq.routing.key}")
	private String routingKey;

	@Autowired
	public RabbitTemplate rabbitTemplate;

	@Autowired
	ApplicationContext ctx;

	@Autowired
	public TrackingProcessInfoMapper trackingProcessInfoMapper;

	@Autowired
	public TrackingTopicMapper trackingTopicMapper;

	@Autowired
	KafkaListenerAutomation kafkaListenerAutomation;

	@Autowired
	ConcurrentHashMap<String, KafkaConsumer> kafkaConsumerinfo;

	@Autowired
	@Qualifier("scheduledTrackingTaskExecutor")
	private ScheduledThreadPoolExecutor schdledTrckExecutor;

	@Autowired
	@Qualifier("scheduledEndDateTaskExecutor")
	private ScheduledThreadPoolExecutor schdledEndDtExecutor;

	@Autowired
	@Qualifier("scheduledEventTaskExecutor")
	private ScheduledThreadPoolExecutor schdledEventExecutor;

	@Autowired
	@Qualifier("scheduledNgsiCollectExecutor")
	private ScheduledThreadPoolExecutor schdledNgsiExecutor;

	@Autowired
	private TrackingDataSubscriberService trackingDataSubscriberService;

	@Autowired
	ConcurrentHashMap<String, ScheduledFuture> eventScheduledFutureInfo;

	@Autowired
	ConcurrentHashMap<String, ScheduledFuture> dataScheduledFutureInfo;

	@Autowired
	ConcurrentHashMap<String, ScheduledFuture> eventEndDateScheduledFutureInfo;

	@Autowired
	ConcurrentHashMap<String, ScheduledFuture> dataEndDateScheduledFutureInfo;

	public void sendMessage(JSONObject json) {
		rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	}

	public void sendMessage(JSONObject json, String sendRoutingKey) {
		logger.info("sendMessage json : {}", json.toJSONString());
		logger.info("sendMessage routingKey : {}", routingKey);

		rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);
	}

	@RabbitListener(queues = "#{kafkaListenerCreateQueue.getName()}")
	public void listenCreateTopic(JSONObject jsonObject, @Headers Map<String, Object> headers) throws Exception {
		HashMap<String, Object> pMap = new HashMap<>();

		if (jsonObject.get("requestTrackingId") == null 
				|| "".equals(jsonObject.get("requestTrackingId"))
				|| jsonObject.get("trackingProcessId") == null 
				|| "".equals(jsonObject.get("trackingProcessId"))
				) {
			return;
		}

		String resId = jsonObject.get("requestTrackingId").toString();
		String proId = jsonObject.get("trackingProcessId").toString();

		try {
			HashMap<String, Object> map = new HashMap<>();
			map.put("requestTrackingId", resId);
			map.put("trackingProcessId", proId);
			TrackingProcessInfo trackingProcessInfo = trackingProcessInfoMapper.getTrackingProcessInfo(map);

			if (trackingProcessInfo != null) {

				String linkType = trackingProcessInfo.getDataLinkType() == null
						|| "".equals(trackingProcessInfo.getDataLinkType())
						? Constant.DATA_LINK_TYPE_KAFKA
						: trackingProcessInfo.getDataLinkType();

				if (Constant.TRCK_CMD_TYPE_DATA.equals(trackingProcessInfo.getTrackingProcessType())
						&& Constant.DATA_LINK_TYPE_NGSILD.equals(linkType)) {

					String entityId = trackingProcessInfo.getEntityId();
					if (entityId == null || "".equals(entityId)) {
						throw new IllegalStateException("DL02 process has no entityId. pro=" + proId);
					}

					registerNgsiCollectSchedule(trackingProcessInfo, resId, proId, entityId);
					registerEndDateSchedule(trackingProcessInfo, resId, proId);

				} else if (Constant.TRCK_CMD_TYPE_DATA.equals(trackingProcessInfo.getTrackingProcessType())) {
					String topics = jsonObject.get("topic").toString();
					String csmId = resId + "-" + proId + "-" + UUID.randomUUID().toString();

					Collection<KafkaConsumer> consumerList = kafkaConsumerinfo.values();

					boolean check = false;
					if (consumerList != null && consumerList.size() > 0) {
						for (KafkaConsumer consumer : consumerList) {
							if (consumer.getTopic().equals(topics) && consumer.getProId().equals(proId)
									&& consumer.getResId().equals(resId)) {
								check = true;
								break;
							}
						}
					}

					if (!check) {
						KafkaConsumer consumer = (KafkaConsumer) ctx.getBean(KafkaConsumer.class, 
								csmId, 
								topics,
								"tracking", 
								resId, 
								proId, 
								trackingProcessInfo.getDigitalObjectId(),
								trackingProcessInfo.getTrackingValueInfo(),
								trackingProcessInfo.getDataFilterType()
								);
						kafkaConsumerinfo.put(csmId, consumer);
					} else {
						System.out.println("***  KafkaConsumer is already running using Topic  ***");
					}

					if (trackingProcessInfo.getEventDelay() > 0) {

						if (dataScheduledFutureInfo.get(resId + proId) == null) {
							DataTrackingTaskProcess evtTrckProc = ctx.getBean(DataTrackingTaskProcess.class, resId, proId, 0, 0, "ED");
							ScheduledFuture schFuture = schdledTrckExecutor.scheduleWithFixedDelay(evtTrckProc, 
									trackingProcessInfo.getEventDelay(), 
									trackingProcessInfo.getEventDelay(), 
									TimeUnit.MILLISECONDS
									);

							dataScheduledFutureInfo.put(resId + proId, schFuture);
						}
					}

					if (trackingProcessInfo.getEventEndDate() != null
							&& !"".equals(trackingProcessInfo.getEventEndDate())) {
						try {
							JSONParser parser = new JSONParser();
							JSONObject eventDt = (JSONObject) parser.parse(trackingProcessInfo.getEventEndDate());

							if (eventDt != null && eventDt.get("INTERVAL") != null
									&& !"".equals(eventDt.get("INTERVAL")) 
									&& eventDt.get("VALUE") != null
									&& !"".equals(eventDt.get("VALUE"))
									) {
								String interval = (String) eventDt.get("INTERVAL");
								int value = Integer.parseInt(String.valueOf(eventDt.get("VALUE")));

								TimeUnit unit = TimeUnit.MILLISECONDS;

								if ("MILLISECONDS".equals(interval))
									unit = TimeUnit.MILLISECONDS;
								else if ("SECONDS".equals(interval))
									unit = TimeUnit.SECONDS;
								else if ("MINUTES".equals(interval))
									unit = TimeUnit.MINUTES;
								else if ("HOURS".equals(interval))
									unit = TimeUnit.HOURS;
								else if ("DAYS".equals(interval))
									unit = TimeUnit.DAYS;

								DataEndDateScheduleProcess endDtTaskProc = ctx.getBean(DataEndDateScheduleProcess.class,
										resId, proId);
								ScheduledFuture schFuture = schdledEndDtExecutor.scheduleWithFixedDelay(endDtTaskProc, value, value, unit);

								dataEndDateScheduledFutureInfo.put(resId + proId, schFuture);
							}
						} catch (Exception e) {
							e.printStackTrace();
						}
					}

				} else {
					if (eventScheduledFutureInfo.get(resId + proId) == null) {
						EventTrackingTaskProcess evtTrckProc = ctx.getBean(EventTrackingTaskProcess.class, resId,
								proId);
						ScheduledFuture schFuture = schdledEventExecutor.scheduleWithFixedDelay(evtTrckProc,
								trackingProcessInfo.getEventDelay(), trackingProcessInfo.getEventDelay(),
								TimeUnit.MILLISECONDS);

						eventScheduledFutureInfo.put(resId + proId, schFuture);
					}

					if (trackingProcessInfo.getEventEndDate() != null
							&& !"".equals(trackingProcessInfo.getEventEndDate())) {
						try {
							JSONParser parser = new JSONParser();
							JSONObject eventDt = (JSONObject) parser.parse(trackingProcessInfo.getEventEndDate());

							if (eventDt != null && eventDt.get("INTERVAL") != null
									&& !"".equals(eventDt.get("INTERVAL")) && eventDt.get("VALUE") != null
									&& !"".equals(eventDt.get("VALUE"))) {
								String interval = (String) eventDt.get("INTERVAL");
								int value = Integer.parseInt(String.valueOf(eventDt.get("VALUE")));

								TimeUnit unit = TimeUnit.MILLISECONDS;

								if ("MILLISECONDS".equals(interval))
									unit = TimeUnit.MILLISECONDS;
								else if ("SECONDS".equals(interval))
									unit = TimeUnit.SECONDS;
								else if ("MINUTES".equals(interval))
									unit = TimeUnit.MINUTES;
								else if ("HOURS".equals(interval))
									unit = TimeUnit.HOURS;
								else if ("DAYS".equals(interval))
									unit = TimeUnit.DAYS;

								EventEndDateScheduleProcess endDtTaskProc = ctx.getBean(EventEndDateScheduleProcess.class, resId, proId);
								ScheduledFuture schFuture = schdledEndDtExecutor.scheduleWithFixedDelay(endDtTaskProc, value, value, unit);

								eventEndDateScheduledFutureInfo.put(resId + proId, schFuture);
							}
						} catch (Exception e) {
							e.printStackTrace();
						}
					}
				}

				pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_RUNNING);
				pMap.put("requestTrackingId", map.get("requestTrackingId"));
				pMap.put("trackingProcessId", map.get("trackingProcessId"));
				pMap.put("statusResultMsg", "Tracking Process STATUS RUNNING Update Success");

			}
		} catch (Exception e) {
			e.printStackTrace();

			pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_ERROR);
			pMap.put("requestTrackingId", resId);
			pMap.put("trackingProcessId", proId);
			pMap.put("statusResultMsg", "Tracking Process STATUS ERROR Update Success");
		} finally {
			try {
				int res = trackingDataSubscriberService.updateWithHisAndTrackingProcInfo(pMap);

				if (res > 0) {
					pMap.put("reqTrckCmdStatus", Constant.TRCK_CMD_STATUS_RUNNING);
					trackingDataSubscriberService.updateWithHisAndTrackingReqInfo(pMap);
				}

			} catch (Exception e) {
				e.printStackTrace();
			}
		}

	}

	private void registerNgsiCollectSchedule(TrackingProcessInfo trackingProcessInfo, String resId,
			String proId, String entityId) {
		if (dataScheduledFutureInfo.get(resId + proId) != null) {
			return;
		}

		long period = trackingProcessInfo.getEventDelay() > 0 ? trackingProcessInfo.getEventDelay()
				: NgsiLdCollector.DEFAULT_COLLECT_INTERVAL_MS;

		DataTrackingTaskProcess proc = ctx.getBean(DataTrackingTaskProcess.class, resId, proId, 0, 0,
				"ED");
		proc.setCollectEntityId(entityId);

		long firstDelay = Math.min(period, FIRST_COLLECT_DELAY_MS);
		ScheduledFuture schFuture = schdledNgsiExecutor.scheduleWithFixedDelay(proc, firstDelay, period,
				TimeUnit.MILLISECONDS);

		dataScheduledFutureInfo.put(resId + proId, schFuture);
		logger.info("NGSI-LD collect schedule started. pro={} entityId={} period={}ms", proId, entityId,
				period);
	}

	private void registerEndDateSchedule(TrackingProcessInfo trackingProcessInfo, String resId,
			String proId) {
		if (trackingProcessInfo.getEventEndDate() == null
				|| "".equals(trackingProcessInfo.getEventEndDate())) {
			return;
		}
		if (dataEndDateScheduledFutureInfo.get(resId + proId) != null) {
			return;
		}

		try {
			JSONParser parser = new JSONParser();
			JSONObject eventDt = (JSONObject) parser.parse(trackingProcessInfo.getEventEndDate());

			if (eventDt == null || eventDt.get("INTERVAL") == null || "".equals(eventDt.get("INTERVAL"))
					|| eventDt.get("VALUE") == null || "".equals(eventDt.get("VALUE"))) {
				return;
			}

			String interval = (String) eventDt.get("INTERVAL");
			int value = Integer.parseInt(String.valueOf(eventDt.get("VALUE")));

			TimeUnit unit = TimeUnit.MILLISECONDS;
			if ("MILLISECONDS".equals(interval))
				unit = TimeUnit.MILLISECONDS;
			else if ("SECONDS".equals(interval))
				unit = TimeUnit.SECONDS;
			else if ("MINUTES".equals(interval))
				unit = TimeUnit.MINUTES;
			else if ("HOURS".equals(interval))
				unit = TimeUnit.HOURS;
			else if ("DAYS".equals(interval))
				unit = TimeUnit.DAYS;

			DataEndDateScheduleProcess endDtTaskProc = ctx.getBean(DataEndDateScheduleProcess.class,
					resId, proId);
			ScheduledFuture schFuture = schdledEndDtExecutor.scheduleWithFixedDelay(endDtTaskProc,
					value, value, unit);

			dataEndDateScheduledFutureInfo.put(resId + proId, schFuture);
		} catch (Exception e) {
			logger.error("registerEndDateSchedule failed. res={} pro={}", resId, proId, e);
		}
	}

	@RabbitListener(queues = "#{kafkaListenerDeleteQueue.getName()}")
	public void listenDelTopic(JSONObject jsonObject, @Headers Map<String, Object> headers) throws Exception {
		HashMap<String, Object> pMap = new HashMap<>();

		int requestTrackingId = (int) jsonObject.get("requestTrackingId");
		int trackingProcessId = (int) jsonObject.get("trackingProcessId");

		if (requestTrackingId > 0 && trackingProcessId > 0 && jsonObject.get("topic") != null
				&& !"".equals(jsonObject.get("topic"))) {
			String topics = jsonObject.get("topic").toString();
			pMap.put("requestTrackingId", requestTrackingId);
			pMap.put("trackingProcessId", trackingProcessId);
			pMap.put("topicName", topics);

			Collection<KafkaConsumer> consumerList = kafkaConsumerinfo.values();
			logger.info("listenerList Size : {}", consumerList.size());
			logger.info("listenerList toString : {}", consumerList.toString());

			if (consumerList != null && !consumerList.isEmpty()) {
				for (KafkaConsumer consumer : consumerList) {
					if (consumer.getTopic().equals(topics) 
							&& consumer.getResId().equals(String.valueOf(requestTrackingId))
							&& consumer.getProId().equals(String.valueOf(trackingProcessId))) {
						kafkaListenerAutomation.deleteListener(consumer.getConsumerId());
						break;
					}
				}
			}

			TrackingTopicInfo topicInfo = trackingTopicMapper.getTopicInfo(pMap);

			if (topicInfo != null) {
				trackingDataSubscriberService.deleteTopic(pMap);
			}
		}

		String resId = String.valueOf(requestTrackingId), proId = String.valueOf(trackingProcessId);

		ScheduledFuture dtSchFuture = dataScheduledFutureInfo.get(resId + proId);

		if (dtSchFuture != null) {
			dtSchFuture.cancel(true);
			dtSchFuture = null;
			dataScheduledFutureInfo.remove(resId + proId);
		}

		ScheduledFuture dtEndDtFuture = dataEndDateScheduledFutureInfo.get(resId + proId);

		if (dtEndDtFuture != null) {
			dtEndDtFuture.cancel(true);
			dtEndDtFuture = null;
			dataEndDateScheduledFutureInfo.remove(resId + proId);
		}

		ScheduledFuture evSchFuture = eventScheduledFutureInfo.get(resId + proId);

		if (evSchFuture != null) {
			evSchFuture.cancel(true);
			evSchFuture = null;
			eventScheduledFutureInfo.remove(resId + proId);
		}

		ScheduledFuture evEndDtFuture = eventEndDateScheduledFutureInfo.get(resId + proId);

		if (evEndDtFuture != null) {
			evEndDtFuture.cancel(true);
			evEndDtFuture = null;
			eventEndDateScheduledFutureInfo.remove(resId + proId);
		}

	}

	@PostConstruct
	public void init() {
		System.out.println(">>>>>>>>>>  RabbitMQComponent 초기화 콜백  <<<<<<<<<<<<");
	}

	@PreDestroy
	public void close() {
		System.out.println(">>>>>>>>>>  RabbitMQComponent종료 전 콜백  <<<<<<<<<<<<");
	}
}
