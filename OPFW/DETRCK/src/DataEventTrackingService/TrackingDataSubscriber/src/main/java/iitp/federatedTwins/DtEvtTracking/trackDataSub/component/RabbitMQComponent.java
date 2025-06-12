package iitp.federatedTwins.DtEvtTracking.trackDataSub.component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Repository
@RequiredArgsConstructor

public class RabbitMQComponent {
	private final Logger logger = LoggerFactory.getLogger(RabbitMQComponent.class);

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
	HashMap<String, KafkaConsumer> kafkaConsumerinfo;

	@Autowired
	@Qualifier("scheduledTrackingTaskExecutor")
	private ScheduledThreadPoolExecutor schdledTrckExecutor;

	@Autowired
	@Qualifier("scheduledEndDateTaskExecutor")
	private ScheduledThreadPoolExecutor schdledEndDtExecutor;

	@Autowired
	private TrackingDataSubscriberService trackingDataSubscriberService;

	@Autowired
	HashMap<String, ScheduledFuture> eventScheduledFutureInfo;

	@Autowired
	HashMap<String, ScheduledFuture> dataScheduledFutureInfo;

	@Autowired
	HashMap<String, ScheduledFuture> eventEndDateScheduledFutureInfo;

	@Autowired
	HashMap<String, ScheduledFuture> dataEndDateScheduledFutureInfo;

	/**
	 * Queue로 메시지를 발행
	 *
	 * @param messageDto 발행할 메시지의 DTO 객체
	 */
	/**
	 * Queue로 메시지를 발행
	 *
	 * @param messageDto 발행할 메시지의 DTO 객체
	 */
	public void sendMessage(JSONObject json) {
		rabbitTemplate.convertAndSend(exchangeName, routingKey, json);
	}

	public void sendMessage(JSONObject json, String sendRoutingKey) {
		logger.info("sendMessage json : {}", json.toJSONString());
		logger.info("sendMessage routingKey : {}", routingKey);

		// 이벤트 전송
		rabbitTemplate.convertAndSend(exchangeName, sendRoutingKey, json);
	}

	/**
	 * Queue에서 메시지를 구독
	 *
	 * @param messageDto 구독한 메시지를 담고 있는 MessageDto 객체
	 * @throws Exception
	 */
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

				// 데이터 트래킹일 경우 카프카 리스너를 생성하여 데이터를 수신처리하는 타스크를 생성한다.
				if (Constant.TRCK_CMD_TYPE_DATA.equals(trackingProcessInfo.getTrackingProcessType())) {
					String topics = jsonObject.get("topic").toString();
					String csmId = String.valueOf(System.currentTimeMillis());

					Collection<KafkaConsumer> consumerList = kafkaConsumerinfo.values();

					boolean check = false;
					if (consumerList != null && consumerList.size() > 0) {
						for (KafkaConsumer consumer : consumerList) {
							// 기존 생성된 정보와 같은지 확인
							if (consumer.getTopic().equals(topics) && consumer.getTopic().equals(proId)
									&& consumer.getTopic().equals(resId)) {
								check = true;
								break;
							}
						}
					}

					// 같으면 못만들게 함.
					if (!check) {
						KafkaConsumer consumer = (KafkaConsumer) ctx.getBean(KafkaConsumer.class, 
								csmId, 
								topics,
								"tracking", 
								resId, 
								proId, 
//								trackingProcessInfo.getDigitalTwinId(),
								trackingProcessInfo.getDigitalObjectId(),
								trackingProcessInfo.getTrackingValueInfo(),
								trackingProcessInfo.getDataFilterType()
								);
						kafkaConsumerinfo.put(csmId, consumer);
					} else {
						System.out.println("***  KafkaConsumer is already running using Topic  ***");
					}

					if (trackingProcessInfo.getEventDelay() > 0) {
						// 데이터트래킹일 경우 트래킹 딜레이 시간을 기준으로 데이터타스크를 실행(스케줄 쓰레드 풀) mode : ED(event delay)

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

					// evntEndDt 설정 체크 ==> {"INTERVAL":"SECOND","VALUE":60}
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
					// 이벤트트래킹일 트래킹 딜레이 시간을 기준으로 이벤트타스크를 실행(스케줄 쓰레드 풀)
					// 이 경우 버퍼사이즈보다 스레드 풀 시간이 우선시 된다.
					if (eventScheduledFutureInfo.get(resId + proId) == null) {
						EventTrackingTaskProcess evtTrckProc = ctx.getBean(EventTrackingTaskProcess.class, resId,
								proId);
						ScheduledFuture schFuture = schdledTrckExecutor.scheduleWithFixedDelay(evtTrckProc,
								trackingProcessInfo.getEventDelay(), trackingProcessInfo.getEventDelay(),
								TimeUnit.MILLISECONDS);

						eventScheduledFutureInfo.put(resId + proId, schFuture);
					}

					// evntEndDt 설정 체크 {"INTERVAL":"SECOND","VALUE":60}
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

				// 트래킹 프로세스 상태정보 변경 : 생성/등록-> 준비 상태
				pMap.put("trackingStatus", Constant.TRCK_PROC_STATUS_RUNNING);
				pMap.put("requestTrackingId", map.get("requestTrackingId"));
				pMap.put("trackingProcessId", map.get("trackingProcessId"));
				pMap.put("statusResultMsg", "Tracking Process STATUS RUNNING Update Success");

			}
		} catch (Exception e) {
			e.printStackTrace();

			// 트래킹 프로세스 상태정보 변경 : 생성/등록-> 준비 상태
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
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
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

			// 삭제할 목록 확인
			// 현재 DB에 있는 정보와 만들어진 리스너와 비교하여 삭제해야 할 리스너를 삭제부터 한다.
			// 여기에서는 토픽으로 삭제처리 한다.
			if (consumerList != null && !consumerList.isEmpty()) {
				for (KafkaConsumer consumer : consumerList) {
					// 생성되어 있는 리스너 정보를 확인하여 기존 생성된 정보가 있으면 리스너 삭제
					if (consumer.getTopic().equals(topics) 
							&& consumer.getResId().equals(String.valueOf(requestTrackingId))
							&& consumer.getProId().equals(String.valueOf(trackingProcessId))) {
						kafkaListenerAutomation.deleteListener(consumer.getConsumerId());
						break;
					}
				}
			}

			// db 토픽 목록 가져오기
			TrackingTopicInfo topicInfo = trackingTopicMapper.getTopicInfo(pMap);

			// DB에 Topic 정보가 있다면 생성된 정보를 삭제처리
			if (topicInfo != null) {
				trackingDataSubscriberService.deleteTopic(pMap);
			}
		}

		/**
		 * TODO 스케줄러가 잘 삭제되는지 확인해 봐야 한다.
		 **/

		// 토픽정보 제거 이후 스케줄러 제거 작업을 시작해야 한다.
		String resId = String.valueOf(requestTrackingId), proId = String.valueOf(trackingProcessId);

		// 데이터 트래킹 스케줄이 있으면 삭제
		ScheduledFuture dtSchFuture = dataScheduledFutureInfo.get(resId + proId);

		if (dtSchFuture != null) {
			dtSchFuture.cancel(true);
			dtSchFuture = null;
			dataScheduledFutureInfo.remove(resId + proId);
		}

		// 데이터 트래킹 종료 스케줄이 있으면 삭제
		ScheduledFuture dtEndDtFuture = dataEndDateScheduledFutureInfo.get(resId + proId);

		if (dtEndDtFuture != null) {
			dtEndDtFuture.cancel(true);
			dtEndDtFuture = null;
			dataEndDateScheduledFutureInfo.remove(resId + proId);
		}

		// 데이터 트래킹 스케줄이 있으면 삭제
		ScheduledFuture evSchFuture = eventScheduledFutureInfo.get(resId + proId);

		if (evSchFuture != null) {
			evSchFuture.cancel(true);
			evSchFuture = null;
			eventScheduledFutureInfo.remove(resId + proId);
		}

		// 데이터 트래킹 스케줄이 있으면 삭제
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
