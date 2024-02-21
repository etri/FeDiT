package iitp.federatedTwins.DtEvtTracking.trackCmdDetector.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class DistributedTaskExecutorConfig {

	@Bean(name = "distribTaskExecutor")
	public ThreadPoolTaskExecutor excutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(10);
		executor.setThreadNamePrefix("Dstb-Exct-");

		return executor;
	}
}
