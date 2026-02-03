package iitp.federatedTwins.DtEvtTracking.trackCmdStsChecker.config;

import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.TimeValue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class ThreadPoolConfig {

	@Bean(name = "trackingTaskExecutor")
	public ThreadPoolTaskExecutor trackingTaskExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(100);
		executor.setMaxPoolSize(200);
		executor.setQueueCapacity(100);
		// executor.setKeepAliveSeconds(5);
		// executor.setRejectedExecutionHandler(new
		// ThreadPoolExecutor.DiscardOldestPolicy());
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(30);
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		executor.setThreadNamePrefix("Http-Task-");
		executor.initialize();

		return executor;
	}

	@Bean(name = "scheduledTrackingTaskExecutor")
	public ScheduledThreadPoolExecutor threadPoolIntervalTaskScheduler() {
		ScheduledThreadPoolExecutor scheduler = new ScheduledThreadPoolExecutor(
				Runtime.getRuntime().availableProcessors());
		scheduler.setCorePoolSize(100);
		scheduler.setMaximumPoolSize(200);

		return scheduler;
	}

	@Bean(name = "scheduledEndDateTaskExecutor")
	public ScheduledThreadPoolExecutor threadPoolIntervalEndDateScheduler() {
		ScheduledThreadPoolExecutor scheduler = new ScheduledThreadPoolExecutor(
				Runtime.getRuntime().availableProcessors());
		scheduler.setCorePoolSize(100);
		scheduler.setMaximumPoolSize(200);

		return scheduler;
	}

	@Bean(name = "poolHttpClientConnManager")
	public PoolingHttpClientConnectionManager poolHttpClientConnectManager() {
		PoolingHttpClientConnectionManager httpCnnMananger = new PoolingHttpClientConnectionManager();
		// defalut : 20
		httpCnnMananger.setMaxTotal(100);

		// defalut : 2
		httpCnnMananger.setDefaultMaxPerRoute(10);

		return httpCnnMananger;
	}

	@Bean(name = "defaultHttpClient")
	public HttpClient defaultHttpClient() {
		return HttpClients.createMinimal();
	}

	@Bean(name = "poolHttpClient")
	public CloseableHttpClient poolHttpClient() {
		PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
		cm.setMaxTotal(100);
		cm.setDefaultMaxPerRoute(10);

		cm.setValidateAfterInactivity(TimeValue.ofMilliseconds(20 * 1000L));

		int connTimeOut = 3, requestTimeOut = 3;

		RequestConfig requestConfig = RequestConfig.custom()
				.setConnectTimeout(connTimeOut * 1000, TimeUnit.MILLISECONDS)
				.setConnectionRequestTimeout(requestTimeOut * 1000, TimeUnit.MILLISECONDS).build();

		return HttpClientBuilder.create().setDefaultRequestConfig(requestConfig).setConnectionManager(cm).build();
	}

}
