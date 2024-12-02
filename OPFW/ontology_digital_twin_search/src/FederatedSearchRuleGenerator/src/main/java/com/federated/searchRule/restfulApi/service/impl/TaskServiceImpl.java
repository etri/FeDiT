package com.federated.searchRule.restfulApi.service.impl;

import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.federated.searchRule.restfulApi.dao.TaskMapper;
import com.federated.searchRule.restfulApi.service.TaskService;
import com.federated.searchRule.restfulApi.vo.Task;

@Service
public class TaskServiceImpl implements TaskService {

	@Autowired
	public TaskMapper taskMapper;

	@Transactional(readOnly = true)
	public Task searchTask(HashMap<String, Object> map) throws Exception {
		return taskMapper.searchTask(map);
	}

	@Transactional
	public int createTask(Task Task) throws Exception {
		return taskMapper.createTask(Task);
	}

	@Transactional
	public int updateTask(Task Task) throws Exception {
		return taskMapper.updateTask(Task);
	}

	@Transactional
	public int deleteTask(HashMap<String, Object> map) throws Exception {
		return taskMapper.deleteTask(map);
	}

}
