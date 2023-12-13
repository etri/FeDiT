package com.federated.searchRule.restfulApi.service;

import java.util.HashMap;

import com.federated.searchRule.restfulApi.vo.Task;

public interface TaskService {

	Task searchTask(HashMap<String, Object> map) throws Exception;

	int createTask(Task task) throws Exception;

	int updateTask(Task task) throws Exception;

	int deleteTask(HashMap<String, Object> map) throws Exception;

}
