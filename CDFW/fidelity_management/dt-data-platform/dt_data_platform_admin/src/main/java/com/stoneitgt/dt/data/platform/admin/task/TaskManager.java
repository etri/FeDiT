package com.stoneitgt.dt.data.platform.admin.task;

import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.function.Supplier;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskManager {
    private final BlockingQueue<CustomTask> taskQueue = new LinkedBlockingQueue<>();
    // TaskType 별 고정 ThreadPoolExecutor (각 N개씩 처리 가능)
    private final Map<TaskType, ExecutorService> executors = new HashMap<>();
    private final SystemProperties systemProperties;

    @PostConstruct
    public void init() {
        // 각 타입별 Executor 생성 (병렬도 N)
        executors.put(TaskType.MODEL, Executors.newFixedThreadPool(systemProperties.getLimitMakeModelCnt()));
        executors.put(TaskType.ETC_MODEL, Executors.newFixedThreadPool(systemProperties.getLimitMakeModelCnt()));
        executors.put(TaskType.DATA_AUGMENT, Executors.newFixedThreadPool(systemProperties.getLimitMakeModelCnt()));

        // 워커 스레드 시작 - 큐에서 작업 꺼내서 타입별 Executor로 실행
        Thread worker = new Thread(new Runnable() {
            @Override
            public void run() {
                while (true) {
                    try {
                        CustomTask task = taskQueue.take();
                        TaskType type = task.getType();

                        ExecutorService executor = executors.get(type);
                        if (executor != null) {
                            executor.submit(task);
                        } else {
                            System.err.println("❌ Unknown TaskType: " + type);
                        }

                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        });

        worker.setDaemon(true); // Spring 종료 시 같이 종료
        worker.start();
    }

    /**
     * 작업을 큐에 등록
     */
    public void submitTask(TaskType type, Supplier<String> logic) {
        String taskId = UUID.randomUUID().toString();
        TaskResult result = new TaskResult(taskId, type);
        CustomTask task = new CustomTask(taskId, type, logic, result);
        log.info("submitTask Executed, taskId: {}, result: {}, task: {}", taskId, result, task);
        taskQueue.offer(task);
    }
}