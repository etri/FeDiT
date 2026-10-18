package com.federated.ontology.searchRule.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

import java.util.concurrent.Executor;

@EnableScheduling
@Configuration
public class SchedulerConfig implements AsyncConfigurer, SchedulingConfigurer {

    private ThreadPoolTaskScheduler mainScheduler;

    @Bean
    public ThreadPoolTaskScheduler threadPoolTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(Runtime.getRuntime().availableProcessors() * 2);
        scheduler.setThreadNamePrefix("IITP-FDT-SCHD-");
        scheduler.initialize();
        this.mainScheduler = scheduler;
        return scheduler;
    }

    @Override
    public Executor getAsyncExecutor() {
        return mainScheduler;
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        taskRegistrar.setTaskScheduler(mainScheduler);
    }
}
