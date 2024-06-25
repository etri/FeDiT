package kr.co.n2m.platform.meta.architecture.config;

import java.util.concurrent.Callable;
import java.util.concurrent.Executor;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableAsync
@Slf4j
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
	
	@Bean(name = "elasticSearchExecutor")
	Executor elasticSearchExecutor() {
		ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
		taskExecutor.setCorePoolSize(2);
		taskExecutor.setMaxPoolSize(2);
		taskExecutor.setQueueCapacity(300);
		taskExecutor.setThreadNamePrefix("ELASTICSEARCH-JOB-");
//		taskExecutor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		taskExecutor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
			@Override
			public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
				try {
					executor.getQueue().put(r);
				} catch (InterruptedException e) {
					throw new RejectedExecutionException("ElasticSearch 작업 rejectedExecution 중 InterruptedException 발생.", e);
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
	
	@Bean(name = "kafkaSendExecutor")
	Executor kafkaSendExecutor() {
		ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
		taskExecutor.setCorePoolSize(4);
		taskExecutor.setMaxPoolSize(50);
		taskExecutor.setQueueCapacity(100);
		taskExecutor.setThreadNamePrefix("KAFKA-SENDER-JOB-");
		taskExecutor.initialize();
		
//		return new HandlingExecutor(taskExecutor);
		return taskExecutor;
	}
	
//	public class HandlingExecutor implements AsyncTaskExecutor {
//		
//		private AsyncTaskExecutor executor;
//		
//		public HandlingExecutor(AsyncTaskExecutor executor) {
//			this.executor = executor;
//		}
//
//		@Override
//		public void execute(Runnable task) {
//			executor.execute(task);
//		}
//		
//		@Override
//		@Deprecated
//		public void execute(Runnable task, long startTimeout) {
//			executor.execute(createWrappedRunnable(task), startTimeout);
//		}		
//
//		@Override
//		public Future<?> submit(Runnable task) {
//			return executor.submit(createWrappedRunnable(task));
//		}
//
//		@Override
//		public <T> Future<T> submit(Callable<T> task) {
//			return executor.submit(createCallable(task));
//		}
//		
//		private <T> Callable<T> createCallable(final Callable<T> task) {
//            return new Callable<T>() {
//                @Override
//                public T call() throws Exception {
//                    try {
//                        return task.call();
//                    } catch (Exception ex) {
//                        handle(ex);
//                        throw ex;
//                    }
//                }
//            };
//        }
// 
//        private Runnable createWrappedRunnable(final Runnable task) {
//            return new Runnable() {
//                @Override
//                public void run() {
//                    try {
//                        task.run();
//                    }catch (RuntimeException ex) {
//                        handle(ex);
//                    }catch (Exception ex) {
//                        handle(ex);
//                    }
//                }
//            };
//        }
// 
//        private void handle(Exception ex) {
//            log.info("Failed to execute task. : {}", ex.getMessage());
//            log.error("Failed to execute task. ",ex);
//        }
//	}	
}
