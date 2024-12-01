package iitp.fedit.apiGateway.transmitter.config;

import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class HttpClientConfig {

	@Bean(name="poolHttpClient")
	public CloseableHttpClient poolHttpClient() {	   
		PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
		cm.setMaxTotal(100);
		cm.setDefaultMaxPerRoute(10);
		
		int connTimeOut = 3, requestTimeOut=3;
		
		RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(connTimeOut*1000, TimeUnit.MILLISECONDS)
				.setConnectionRequestTimeout(requestTimeOut*1000, TimeUnit.MILLISECONDS)
                .build();		
		
		return HttpClientBuilder.create().setDefaultRequestConfig(requestConfig).setConnectionManager(cm).build();
	}

	@Bean(name="httpTaskExecutor") 
	public ThreadPoolTaskExecutor httpTaskExcutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(100);
		executor.setMaxPoolSize(200);		
		executor.setQueueCapacity(100);
		//		executor.setKeepAliveSeconds(5);
		//		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardOldestPolicy()); 
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(30);
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());		
		executor.setThreadNamePrefix("Http-Task-");
		executor.initialize();

		return executor;
	}
}
