package kr.co.n2m.platform.meta.architecture.config;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

	@Bean(name = "virtuosoExecutor")
	Executor virtuosoExecutor() {
		ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
		taskExecutor.setCorePoolSize(2);
		taskExecutor.setMaxPoolSize(2);
		taskExecutor.setQueueCapacity(300);
		taskExecutor.setThreadNamePrefix("VIRTUOSO-JOB-");
//		taskExecutor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		taskExecutor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
			@Override
			public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
				try {
					executor.getQueue().put(r);
				} catch (InterruptedException e) {
					throw new RejectedExecutionException("버투소 작업 rejectedExecution 중 InterruptedException 발생.", e);
				}
			}
		});		
		taskExecutor.initialize();
		
		return taskExecutor;
	}
	
	@Bean(name = "neo4jExecutor")
	Executor neo4jExecutor() {
		ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
		taskExecutor.setCorePoolSize(2);
		taskExecutor.setMaxPoolSize(2);
		taskExecutor.setQueueCapacity(300);
		taskExecutor.setThreadNamePrefix("NEO4J-JOB-");
//		taskExecutor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		taskExecutor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
			@Override
			public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
				try {
					executor.getQueue().put(r);
				} catch (InterruptedException e) {
					throw new RejectedExecutionException("Neo4j 작업 rejectedExecution 중 InterruptedException 발생.", e);
				}
			}
		});	
		taskExecutor.initialize();
		
		return taskExecutor;
	}
	
	@Bean(name = "collectExecutor")
	Executor collectExecutor() {
		ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
		taskExecutor.setCorePoolSize(4);
		taskExecutor.setMaxPoolSize(4);
		taskExecutor.setQueueCapacity(300);
		taskExecutor.setThreadNamePrefix("COLLECT-JOB-");
//		taskExecutor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		taskExecutor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
			@Override
			public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
				try {
					executor.getQueue().put(r);
				} catch (InterruptedException e) {
					throw new RejectedExecutionException("수집 작업 rejectedExecution 중 InterruptedException 발생.", e);
				}
			}
		});	
		taskExecutor.initialize();
		
		return taskExecutor;
	}	
	
}
