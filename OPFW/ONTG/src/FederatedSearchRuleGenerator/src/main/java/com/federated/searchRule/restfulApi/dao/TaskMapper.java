package com.federated.searchRule.restfulApi.dao;

import java.util.HashMap;

import org.apache.ibatis.annotations.Mapper;

import com.federated.searchRule.restfulApi.vo.Task;

@Mapper
public interface TaskMapper {

	Task searchTask(HashMap<String, Object> map);

	int createTask(Task task);

	int updateTask(Task task);

	int deleteTask(HashMap<String, Object> map);

}
