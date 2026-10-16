package iitp.federatedTwins.DtEvtTracking.trackCmdStsChecker.schedule;

import java.time.LocalTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.DtEvtTracking.trackCmdStsChecker.service.TrackCmdStsCheckerService;

@Component
public class TrckCmdStsCheckerScheduler {

	@Autowired
	private TrackCmdStsCheckerService trackCmdStsCheckerService;

	private final Logger logger = LoggerFactory.getLogger(TrckCmdStsCheckerScheduler.class);

	@Scheduled(initialDelay = 60000, fixedRate = 30000)
	public String execTrckErrStsCheckScheduler() throws Exception {
		logger.info("exec Tracing Error Status CheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("exec Tracing Error Status CheckerScheduler => Start Time : " + LocalTime.now());

		try {
			trackCmdStsCheckerService.checkTopicErrStatus();

		} catch (Exception e) {
			e.printStackTrace();
		}

		logger.info("exec Tracing Error Status CheckScheduler => End Time : " + LocalTime.now());

		return "success";
	}

	@Scheduled(initialDelay = 30000, fixedRate = 10000)
	public String execTrckForceKilledStsCheckScheduler() throws Exception {
		logger.info("exec Tracing Force Killed Status CheckerScheduler Current Thread : {}",
				Thread.currentThread().getName());
		logger.info("exec Tracing Force Killed Status CheckerScheduler => Start Time : " + LocalTime.now());

		try {
			trackCmdStsCheckerService.forceProcessKilled();

		} catch (Exception e) {
			e.printStackTrace();
		}

		logger.info("exec Tracing Force Killed Status CheckScheduler => End Time : " + LocalTime.now());

		return "success";
	}

	@Scheduled(initialDelay = 60000, fixedRate = 10000)
	public String execTrckTimeOutCheckScheduler() throws Exception {
		logger.info("exec Tracing TimeOut CheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("exec Tracing TimeOut Status CheckerScheduler => Start Time : " + LocalTime.now());

		try {
			trackCmdStsCheckerService.checkTimeOutStatus();
		} catch (Exception e) {
			e.printStackTrace();
		}

		logger.info("exec Tracing TimeOut Status CheckScheduler => End Time : " + LocalTime.now());

		return "success";
	}

	@Scheduled(initialDelay = 300000, fixedRate = 86400000)
	public String execPurgeClosedTrackingDataScheduler() throws Exception {
		try {
			trackCmdStsCheckerService.purgeClosedTrackingData();
		} catch (Exception e) {
			logger.error("purgeClosedTrackingData failed", e);
		}
		return "success";
	}
}
