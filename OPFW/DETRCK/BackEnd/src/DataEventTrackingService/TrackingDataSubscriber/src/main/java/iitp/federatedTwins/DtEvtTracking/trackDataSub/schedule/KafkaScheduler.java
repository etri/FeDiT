package iitp.federatedTwins.DtEvtTracking.trackDataSub.schedule;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

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
	ConcurrentHashMap<String, KafkaConsumer> kafkaConsumerinfo;

	private final Logger logger = LoggerFactory.getLogger(KafkaScheduler.class);

	public String execCtrlCmdStsCheckerScheduler() throws Exception {
		logger.info("execCtrlCmdStsCheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdStsCheckerScheduler => Start Time : " + LocalTime.now());

		try {
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

			Collection<KafkaConsumer> consumerList = kafkaConsumerinfo.values();
			logger.info("listenerList Size : {}", consumerList.size());
			logger.info("listenerList toString : {}", consumerList.toString());

			List<TrackingTopicInfo> topicList = trackingTopicMapper.getTopicList(null);

			ArrayList<String> delListner = new ArrayList<String>();
			if (consumerList != null && !consumerList.isEmpty()) {
				for (KafkaConsumer consumer : consumerList) {

					boolean checkB = false;
					if (topicList != null && !topicList.isEmpty()) {
						for (TrackingTopicInfo topicInfo : topicList) {
							if (consumer.getTopic().equals(topicInfo.getTopicName())
									&& consumer.getProId().equals(String.valueOf(topicInfo.getTrackingProcessId()))
									&& consumer.getResId().equals(String.valueOf(topicInfo.getRequestTrackingId()))) {
								checkB = true;
								break;
							}
						}
					}

					if (!checkB) {
						delListner.add(consumer.getConsumerId());
					}
				}

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
