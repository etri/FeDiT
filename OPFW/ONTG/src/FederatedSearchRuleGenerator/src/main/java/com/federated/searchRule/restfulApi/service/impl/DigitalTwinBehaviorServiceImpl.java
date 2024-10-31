package com.federated.searchRule.restfulApi.service.impl;

import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.federated.searchRule.restfulApi.dao.CategoryMapper;
import com.federated.searchRule.restfulApi.dao.DigitalTwinBehaviorMapper;
import com.federated.searchRule.restfulApi.service.DigitalTwinBehaviorService;
import com.federated.searchRule.restfulApi.vo.DigitalTwinBehavior;

@Service
public class DigitalTwinBehaviorServiceImpl implements DigitalTwinBehaviorService {

	@Autowired
	public DigitalTwinBehaviorMapper digitalTwinBehaviorMapper;

	@Transactional(readOnly = true)
	public DigitalTwinBehavior searchDigitalTwinBehavior(HashMap<String, Object> map) throws Exception {
		return digitalTwinBehaviorMapper.searchDigitalTwinBehavior(map);
	}

	@Transactional
	public int createDigitalTwinBehavior(DigitalTwinBehavior digitalTwinBehavior) throws Exception {
		return digitalTwinBehaviorMapper.createDigitalTwinBehavior(digitalTwinBehavior);
	}

	@Transactional
	public int updateDigitalTwinBehavior(DigitalTwinBehavior digitalTwinBehavior) throws Exception {
		return digitalTwinBehaviorMapper.updateDigitalTwinBehavior(digitalTwinBehavior);
	}

	@Transactional
	public int deleteDigitalTwinBehavior(HashMap<String, Object> map) throws Exception {
		return digitalTwinBehaviorMapper.deleteDigitalTwinBehavior(map);
	}

}
