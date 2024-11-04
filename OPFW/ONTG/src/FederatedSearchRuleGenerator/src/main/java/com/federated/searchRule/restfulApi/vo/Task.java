package com.federated.searchRule.restfulApi.vo;

import java.util.ArrayList;

public class Task {

	private int taskId;
	private String taskName;
	private String task;
	private ArrayList<String> behaviorList;

	public int getTaskId() {
		return taskId;
	}

	public void setTaskId(int taskId) {
		this.taskId = taskId;
	}

	public String getTaskName() {
		return taskName;
	}

	public void setTaskName(String taskName) {
		this.taskName = taskName;
	}

	public String getTask() {
		return task;
	}

	public void setTask(String task) {
		this.task = task;
	}

	public ArrayList<String> getBehaviorList() {
		return behaviorList;
	}

	public void setBehaviorList(ArrayList<String> behaviorList) {
		this.behaviorList = behaviorList;
	}

}
