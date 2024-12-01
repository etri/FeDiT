package iitp.fedit.apiGateway.transmitter.schdule;

import java.time.LocalTime;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import iitp.fedit.apiGateway.transmitter.service.TransMitterMsgService;

@Component
public class FeDitApiTransmitterScheduler {
	@Autowired
	ApplicationContext ctx;

	@Autowired
	private TransMitterMsgService transMitterMsgService;

	private final Logger logger = LoggerFactory.getLogger(FeDitApiTransmitterScheduler.class);

	// 10초마다
	@Scheduled(initialDelay = 0, fixedDelay = 10000)
	public void execCtrlCmdSessionCheckerScheduler() throws Exception {
		logger.info("execCtrlCmdStsCheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdStsCheckerScheduler => Start Time : " + LocalTime.now());

		try {

			HashMap<String, Object> map = new HashMap<>();
			map.put("timeUnit", "M");
			map.put("timeSession", -1);

			map.put("execResultCode", "500");
			map.put("execResultValue", "500");
			map.put("execResultMsg", "*** Execute Control Command Time Out ***");

			// 1분이상 지난 상태값 조회 / 삭제
			transMitterMsgService.getReqCtrlCmdListAndDeleteCmd(map);

			logger.info("execCtrlCmdStsCheckerScheduler => End Time : " + LocalTime.now());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
