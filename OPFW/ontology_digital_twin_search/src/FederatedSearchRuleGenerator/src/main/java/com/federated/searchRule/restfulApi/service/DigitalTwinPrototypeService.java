package com.federated.searchRule.restfulApi.service;

import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import com.federated.searchRule.restfulApi.dao.DigitalTwinBehaviorMapper;
import com.federated.searchRule.restfulApi.dao.DigitalTwinPrototypeMapper;
import com.federated.searchRule.restfulApi.vo.DigitalTwinBehavior;
import com.federated.searchRule.restfulApi.vo.DigitalTwinPrototype;

public interface DigitalTwinPrototypeService {

	DigitalTwinPrototype searchDigitalTwinPrototype(HashMap<String, Object> map) throws Exception;

	int createDigitalTwinPrototype(DigitalTwinPrototype digitalTwinPrototype) throws Exception;

	int deleteDigitalTwinPrototype(HashMap<String, Object> map) throws Exception;

	int updateDigitalTwinPrototype(DigitalTwinPrototype digitalTwinPrototype) throws Exception;

}
