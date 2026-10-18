package iitp.federatedTwins.DtEvtTracking.trackDataSub.config;

import java.util.HashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

@Configuration
public class SchedulerConfig implements AsyncConfigurer, SchedulingConfigurer {
	public ThreadPoolTaskScheduler threadPoolTaskScheduler() {
		ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
		scheduler.setPoolSize(Runtime.getRuntime().availableProcessors() * 2);
		scheduler.setThreadNamePrefix("IITP-FDT-SCHD-");
		scheduler.initialize();

		return scheduler;
	}

	@Override
	public Executor getAsyncExecutor() {
		return this.threadPoolTaskScheduler();
	}

	@Override
	public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
		taskRegistrar.setTaskScheduler(this.threadPoolTaskScheduler());
	}

	@Bean
	public ConcurrentHashMap<String, ScheduledFuture> eventScheduledFutureInfo() {
		return new ConcurrentHashMap<String, ScheduledFuture>();
	}

	@Bean
	public ConcurrentHashMap<String, ScheduledFuture> dataScheduledFutureInfo() {
		return new ConcurrentHashMap<String, ScheduledFuture>();
	}

	@Bean
	public ConcurrentHashMap<String, ScheduledFuture> eventEndDateScheduledFutureInfo() {
		return new ConcurrentHashMap<String, ScheduledFuture>();
	}

	@Bean
	public ConcurrentHashMap<String, ScheduledFuture> dataEndDateScheduledFutureInfo() {
		return new ConcurrentHashMap<String, ScheduledFuture>();
	}
}