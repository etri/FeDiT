package com.federated.ontology.searchRule.dev.neo4jSync;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
public class Neo4jSyncThreadPoolConfig {

    private static final int PARTITION_COUNT = 4;

    private ExecutorService[] executors;

    @Bean("neo4jSyncPartitionedExecutors")
    public ExecutorService[] neo4jSyncPartitionedExecutors() {
        executors = new ExecutorService[PARTITION_COUNT];
        for (int i = 0; i < PARTITION_COUNT; i++) {
            final int idx = i;
            executors[i] = Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "neo4j-sync-" + idx);
                t.setDaemon(true);
                return t;
            });
        }
        log.info("[Neo4jSync] 파티셔닝 쓰레드풀 초기화 완료. partitions={}", PARTITION_COUNT);
        return executors;
    }

    @PreDestroy
    public void shutdown() {
        if (executors == null) return;
        for (ExecutorService executor : executors) {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
        log.info("[Neo4jSync] 파티셔닝 쓰레드풀 종료 완료.");
    }
}
