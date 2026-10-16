package iitp.federatedTwins.DtEvtTracking.trackDataSub.task;

import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.DataTrackingTaskProcessService;

@Component
@Scope(value = "prototype")
public class EventTrackingTaskProcess implements Runnable {

	private final Logger logger = LoggerFactory.getLogger(EventTrackingTaskProcess.class);

	@Autowired
	private DataTrackingTaskProcessService trackingSubTaskInfoService;

	public String resId;
	public String proId;

	public EventTrackingTaskProcess(String resId, String proId) {
		this.resId = resId;
		this.proId = proId;
	}

	@Override
	public void run() {
		logger.info("EventTrackingTaskProcess - Start run() ==> " + resId + " : " + proId);

		HashMap<String, Object> param = new HashMap<>();
		param.put("requestTrackingId", resId);
		param.put("trackingProcessId", proId);

		try {
			trackingSubTaskInfoService.eventTrackingProcessTask(param);

		} catch (Exception e) {
			logger.error("Error Message : {}", e);
		}

	}

}
