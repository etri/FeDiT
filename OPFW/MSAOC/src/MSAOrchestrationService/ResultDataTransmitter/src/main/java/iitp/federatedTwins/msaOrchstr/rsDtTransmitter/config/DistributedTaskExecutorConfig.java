package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class DistributedTaskExecutorConfig {

	@Bean(name = "distribTaskExecutor")
	public ThreadPoolTaskExecutor excutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(10);
//		executor.setQueueCapacity(5);
//		executor.setMaxPoolSize(10);		
//		executor.setKeepAliveSeconds(5);
//		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardOldestPolicy()); // CallerRunsPolicy: 거부한 thread에서 처리가 다 되면 그 이후 거부된 작업 처리, DiscardPoliy: 거부된 작업을 무시하고 아무 작업도 수행하지 않음, DiscardOldestPolicy: 큐의 맨 앞에 있는 작업을 제거한 다음 새 작업을 큐에 넣음, AbortPolicy: RejectedExecutionException 발생. 
//		executor.setWaitForTasksToCompleteOnShutdown(true);
//		executor.setAwaitTerminationSeconds(10);
		executor.setThreadNamePrefix("Dstb-Exct-");

		return executor;
	}
}
