package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.schdule;

import java.time.LocalTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.service.CtrlCmdStsCheckerService;

@Component
public class CtrlCmdStsCheckerScheduler {
	@Autowired
	ApplicationContext ctx;

	private final CtrlCmdStsCheckerService ctrlCmdTaskInfoService;

	private final Logger logger = LoggerFactory.getLogger(CtrlCmdStsCheckerScheduler.class);

	public CtrlCmdStsCheckerScheduler(CtrlCmdStsCheckerService ctrlCmdTaskInfoService) {
		this.ctrlCmdTaskInfoService = ctrlCmdTaskInfoService;
	}

	//30초마다
	@Scheduled(initialDelay = 0, fixedDelay = 30000)
	public void execCtrlCmdStsErrorCheckerScheduler() throws Exception {
		logger.info("execCtrlCmdStsCheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execCtrlCmdStsCheckerScheduler => Start Time : " + LocalTime.now());

		try {
			// 에러 상태값 trn 전송
			this.ctrlCmdTaskInfoService.stsCheckerAndsendTrn();
			logger.info("execCtrlCmdStsCheckerScheduler => End Time : " + LocalTime.now());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	
	//0.5초마다
	@Scheduled(initialDelay = 0, fixedDelay = 5000)
	public void execTimeOutCheckerScheduler() throws Exception {
		logger.info("execTimeOutCheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execTimeOutCheckerScheduler => Start Time : " + LocalTime.now());

		try {
			// 30분 지난 준비 상태값을 에러 상태값으로 변경
			this.ctrlCmdTaskInfoService.timeoutCheckerAndStsUpdate();
			logger.info("execTimeOutCheckerScheduler => End Time : " + LocalTime.now());
						
			// 에러 상태값 trn 전송
			this.ctrlCmdTaskInfoService.stsCheckerAndsendTrn();
			logger.info("execCtrlCmdStsCheckerScheduler => End Time : " + LocalTime.now());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
