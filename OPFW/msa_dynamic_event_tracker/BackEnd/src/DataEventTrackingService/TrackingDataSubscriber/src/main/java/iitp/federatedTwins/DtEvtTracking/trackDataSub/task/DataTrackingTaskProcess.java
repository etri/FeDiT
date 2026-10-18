package iitp.federatedTwins.DtEvtTracking.trackDataSub.task;

import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.trackDataSub.ngsi.NgsiLdCollector;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.DataTrackingTaskProcessService;
import iitp.federatedTwins.DtEvtTracking.trackDataSub.service.TrackingDataSubscriberService;

@Component
@Scope(value = "prototype")
public class DataTrackingTaskProcess implements Runnable {

	private final Logger logger = LoggerFactory.getLogger(DataTrackingTaskProcess.class);

	private static final ConcurrentHashMap<String, Object> PROCESS_LOCKS = new ConcurrentHashMap<>();

	private String resId;
	private String proId;
	private int startId;
	private int endId;
	private String mode;

	@Autowired
	public TrackingDataSubscriberService rsDtConsumerService;

	@Autowired
	private DataTrackingTaskProcessService trackingSubTaskInfoService;

	@Autowired
	private NgsiLdCollector ngsiLdCollector;

	private String collectEntityId;

	public void setCollectEntityId(String collectEntityId) {
		this.collectEntityId = collectEntityId;
	}

	public DataTrackingTaskProcess(String resId, String proId, int startId, int endId, String mode) {
		this.resId = resId;
		this.proId = proId;
		this.startId = startId;
		this.endId = endId;
		this.mode = mode;
	}

	@Override
	public void run() {

		HashMap<String, Object> param = new HashMap<>();
		param.put("requestTrackingId", resId);
		param.put("trackingProcessId", proId);
		param.put("mode", this.mode);

		if ("OC".equals(mode)) {
			param.put("startId", startId);
			param.put("endId", endId);
			logger.info("DataTrackingTaskProcess mode OC - Start run() ==> " + resId + " : " + proId + " : " + startId
					+ " : " + endId);
		}

		Object lock = PROCESS_LOCKS.computeIfAbsent(resId + "-" + proId, k -> new Object());

		try {
			synchronized (lock) {
				if (collectEntityId != null) {
					param.put("collectOutcome", ngsiLdCollector.collect(collectEntityId).name());
				}
				trackingSubTaskInfoService.dataTrackingProcessTask(param);
			}
		} catch (Exception e) {
			logger.error("Error Message : {}", e);
		}

	}

}
