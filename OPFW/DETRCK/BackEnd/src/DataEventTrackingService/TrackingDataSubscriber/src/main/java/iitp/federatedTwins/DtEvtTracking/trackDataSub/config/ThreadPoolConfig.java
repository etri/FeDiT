package iitp.federatedTwins.DtEvtTracking.trackDataSub.config;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.TimeValue;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class ThreadPoolConfig {

	@Bean(name = "trackingTaskExecutor")
	public ThreadPoolTaskExecutor trackingTaskExecutor(
			@Value("${tracking.pool.kafka-oc-size:5}") int size) {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(Math.max(1, size));
		executor.setMaxPoolSize(Math.max(1, size) * 2);
		executor.setQueueCapacity(100);
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(30);
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		executor.setThreadNamePrefix("Http-Task-");
		executor.initialize();

		return executor;
	}

	@Bean(name = "scheduledTrackingTaskExecutor")
	public ScheduledThreadPoolExecutor threadPoolIntervalTaskScheduler(
			@Value("${tracking.pool.data-schedule-size:5}") int size) {
		return namedScheduler("Trk-Data-", size);
	}

	@Bean(name = "scheduledEventTaskExecutor")
	public ScheduledThreadPoolExecutor scheduledEventTaskExecutor(
			@Value("${tracking.pool.event-schedule-size:50}") int size) {
		return namedScheduler("Trk-Event-", size);
	}

	@Bean(name = "scheduledNgsiCollectExecutor")
	public ScheduledThreadPoolExecutor scheduledNgsiCollectExecutor(
			@Value("${tracking.pool.ngsi-collect-size:60}") int size) {
		return namedScheduler("Trk-Ngsi-", size);
	}

	@Bean(name = "ngsiDetailFetchExecutor", destroyMethod = "shutdown")
	public ExecutorService ngsiDetailFetchExecutor(
			@Value("${ngsi.detail-fetch-parallelism:8}") int size) {
		AtomicInteger seq = new AtomicInteger();
		return Executors.newFixedThreadPool(Math.max(1, size), r -> {
			Thread t = new Thread(r, "Ngsi-Fetch-" + seq.incrementAndGet());
			t.setDaemon(true);
			return t;
		});
	}

	private ScheduledThreadPoolExecutor namedScheduler(String prefix, int size) {
		AtomicInteger seq = new AtomicInteger();
		return new ScheduledThreadPoolExecutor(Math.max(1, size), r -> {
			Thread t = new Thread(r, prefix + seq.incrementAndGet());
			t.setDaemon(true);
			return t;
		});
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
		httpCnnMananger.setMaxTotal(100);

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
