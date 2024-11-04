package iitp.federatedTwins.DtEvtTracking.trackDataSub.schedule;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTopicInfo;
import iitp.federatedTwins.DtEvtTracking.common.mapper.TrackingTopicMapper;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.component.KafkaConsumer;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.component.KafkaListenerAutomation;

@Component
public class KafkaScheduler {

	@Autowired
	ApplicationContext ctx;

	@Autowired
	private TrackingTopicMapper trackingTopicMapper;

	@Autowired
	private KafkaListenerAutomation kafkaListenerAutomation;

	@Autowired
	HashMap<String, KafkaConsumer> kafkaConsumerinfo;

	private final Logger logger = LoggerFactory.getLogger(KafkaScheduler.class);

	// 0.5초마다
	//	@Scheduled(initialDelay = 10000, fixedRate = 10000)
	public String execCtrlCmdStsCheckerScheduler() throws Exception {
		logger.info("execCtrlCmdStsCheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdStsCheckerScheduler => Start Time : " + LocalTime.now());

		try {
			// 리스너 상태 체크
			listenerChecker();
			logger.info("execCtrlCmdProduceScheduler => End Time : " + LocalTime.now());
		} catch (Exception e) {
			e.printStackTrace();
		}
		return "success";
	}

	public int listenerChecker() {

		int result = 0;
		try {
			// listener 목록 가져오기
			//			List<HashMap<String, String>> listenerList = kafkaListenerAutomation.searchListener();

			Collection<KafkaConsumer> consumerList = kafkaConsumerinfo.values();
			logger.info("listenerList Size : {}", consumerList.size());
			logger.info("listenerList toString : {}", consumerList.toString());

			// db 토픽 목록 가져오기
			List<TrackingTopicInfo> topicList = trackingTopicMapper.getTopicList(null);

			// 삭제할 목록 확인
			// 현재 DB에 있는 정보와 만들어진 리스너와 비교하여 삭제해야 할 리스너를 삭제부터 한다.
			// 여기에서는 토픽으로 삭제처리 한다.
			ArrayList<String> delListner = new ArrayList<String>();
			if (consumerList != null && !consumerList.isEmpty()) {
				for (KafkaConsumer consumer : consumerList) {

					// 생성된 리스너 정보가 DB정보게 없다면 삭제 목록으로 관리되어 이후 삭제처리 해야 한다.
					boolean checkB = false;
					if (topicList != null && !topicList.isEmpty()) {
						for (TrackingTopicInfo topicInfo : topicList) {
							// 기존 생성된 정보와 같은지 확인
							if (consumer.topic.equals(topicInfo.getTopicName())
									&& consumer.proId.equals(topicInfo.getTrackingProcessId())
									&& consumer.resId.equals(topicInfo.getRequestTrackingId())) {
								checkB = true;
								break;
							}
						}
					}

					if (!checkB) {
						delListner.add(consumer.consumerId);
					}
				}

				// 삭제처리햐야 할 대상이 있으며 삭제를 진행한다.
				for (String listenerId : delListner)
					kafkaListenerAutomation.deleteListener(listenerId);
			}

		} catch (Exception e) {
			result = 0;
			logger.error("Error Message : {} ", e);
		}

		return result;
	}
}
