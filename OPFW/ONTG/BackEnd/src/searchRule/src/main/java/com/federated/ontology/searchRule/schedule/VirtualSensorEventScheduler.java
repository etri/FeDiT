package com.federated.ontology.searchRule.schedule;

import java.time.LocalTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class VirtualSensorEventScheduler {
	
	@Autowired
	ApplicationContext ctx;

	private final Logger logger = LoggerFactory.getLogger(VirtualSensorEventScheduler.class);

	public void execRelearnEventCheckerScheduler() throws Exception {
		logger.info("execRelearnEventCheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execRelearnEventCheckerScheduler => Start Time : " + LocalTime.now());

		try {
			logger.info("execRelearnEventCheckerScheduler => End Time : " + LocalTime.now());
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void execErrorCheckerScheduler() throws Exception {
		logger.info("execErrorCheckerScheduler Current Thread : {}", Thread.currentThread().getName());
		logger.info("execErrorCheckerScheduler => Start Time : " + LocalTime.now());

		try {
			logger.info("execErrorCheckerScheduler => End Time : " + LocalTime.now());
						
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public void findFileProcess() throws Exception {
		logger.info("findFileProcess Current Thread : {}", Thread.currentThread().getName());
		logger.info("findFileProcess => Start Time : " + LocalTime.now());

		try {
			
			logger.info("findFileProcess => End Time : " + LocalTime.now());
						
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
