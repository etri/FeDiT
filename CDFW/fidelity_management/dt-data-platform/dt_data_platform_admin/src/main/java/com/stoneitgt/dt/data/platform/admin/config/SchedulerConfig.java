package com.stoneitgt.dt.data.platform.admin.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

import javax.annotation.PostConstruct;
import java.util.concurrent.*;

@Slf4j
@Configuration
public class SchedulerConfig implements SchedulingConfigurer {
    public static final BlockingQueue<Runnable> taskQueue = new LinkedBlockingQueue<>();

    private final ExecutorService executorService = new ThreadPoolExecutor(
            3, // core pool size
            5, // max pool size
            60L,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>()
    );

    @Override
    public void configureTasks(ScheduledTaskRegistrar scheduledTaskRegistrar) {
        ThreadPoolTaskScheduler threadPoolTaskScheduler = new ThreadPoolTaskScheduler();

        int POOL_SIZE = 3;
        threadPoolTaskScheduler.setPoolSize(POOL_SIZE);
        threadPoolTaskScheduler.setThreadNamePrefix("twin-task-pool-");
        threadPoolTaskScheduler.initialize();

        scheduledTaskRegistrar.setTaskScheduler(threadPoolTaskScheduler);
    }

    @PostConstruct
    public void startTaskWorker() {
        log.info("startTaskWorker");
        Thread taskConsumerThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    log.info("Initialize Task Queue Size: {}개", taskQueue.size());
                    Runnable task = taskQueue.take(); // block until task available
                    executorService.execute(task);    // execute with thread pool
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });
        taskConsumerThread.setDaemon(true);
        taskConsumerThread.start();
    }
}
