package com.federated.searchRule.restfulApi.service.impl;

import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.federated.searchRule.restfulApi.dao.DigitalTwinPrototypeMapper;
import com.federated.searchRule.restfulApi.service.DigitalTwinPrototypeService;
import com.federated.searchRule.restfulApi.vo.DigitalTwinPrototype;

@Service
public class DigitalTwinPrototypeServiceImpl implements DigitalTwinPrototypeService {

	@Autowired
	public DigitalTwinPrototypeMapper digitalTwinPrototypeMapper;

	@Transactional(readOnly = true)
	public DigitalTwinPrototype searchDigitalTwinPrototype(HashMap<String, Object> map) throws Exception {
		return digitalTwinPrototypeMapper.searchDigitalTwinPrototype(map);
	}

	@Transactional
	public int createDigitalTwinPrototype(DigitalTwinPrototype DigitalTwinPrototype) throws Exception {
		return digitalTwinPrototypeMapper.createDigitalTwinPrototype(DigitalTwinPrototype);
	}

	@Transactional
	public int updateDigitalTwinPrototype(DigitalTwinPrototype DigitalTwinPrototype) throws Exception {
		return digitalTwinPrototypeMapper.updateDigitalTwinPrototype(DigitalTwinPrototype);
	}

	@Transactional
	public int deleteDigitalTwinPrototype(HashMap<String, Object> map) throws Exception {
		return digitalTwinPrototypeMapper.deleteDigitalTwinPrototype(map);
	}

}
