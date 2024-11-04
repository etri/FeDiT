package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.config;

import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.ThreadPoolExecutor;

import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class HttpTaskExecutorConfig {

	@Bean(name = "httpTaskExecutor")
	public ThreadPoolTaskExecutor httpTaskExcutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(100);
		executor.setMaxPoolSize(200);
		executor.setQueueCapacity(100);
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(30);
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

		executor.setThreadNamePrefix("Http-Task-");
		executor.initialize();

		return executor;
	}

	@Bean(name = "scheduleHttpTaskExecutor")
	public ScheduledThreadPoolExecutor threadPoolIntervalTaskScheduler() {
		ScheduledThreadPoolExecutor scheduler = new ScheduledThreadPoolExecutor(
				Runtime.getRuntime().availableProcessors());
		scheduler.setCorePoolSize(100);
		scheduler.setMaximumPoolSize(200);

		return scheduler;
	}

	@Bean(name = "poolHttpClientConnManager")
	public PoolingHttpClientConnectionManager poolHttpClientConnectManager() {
		PoolingHttpClientConnectionManager httpCnnMananger = new PoolingHttpClientConnectionManager();

		httpCnnMananger.setMaxTotal(1000);

		httpCnnMananger.setDefaultMaxPerRoute(1000);

		return httpCnnMananger;
	}

}
