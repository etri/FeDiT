package com.stoneitgt.dt.data.platform.admin.task;

import lombok.Data;

import java.util.function.Supplier;

@Data
public class CustomTask implements Runnable {

    private final String taskId;
    private final TaskType type;
    private final Supplier<String> logic;
    private final TaskResult taskResult;

    public CustomTask(String taskId, TaskType type, Supplier<String> logic, TaskResult taskResult) {
        this.taskId = taskId;
        this.type = type;
        this.logic = logic;
        this.taskResult = taskResult;
    }

    @Override
    public void run() {
        try {
            String output = logic.get();
            taskResult.markCompleted(output);
        } catch (Exception e) {
            taskResult.markFailed(e.getMessage());
        }
    }
}