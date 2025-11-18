package com.stoneitgt.dt.data.platform.admin.task;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskResult {
    private final String taskId;
    private final TaskType type;
    private String status;
    private String result;
    private final LocalDateTime createdAt;

    public TaskResult(String taskId, TaskType type) {
        this.taskId = taskId;
        this.type = type;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    public void markCompleted(String result) {
        this.status = "COMPLETED";
        this.result = result;
    }

    public void markFailed(String reason) {
        this.status = "FAILED";
        this.result = reason;
    }
}