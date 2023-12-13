package com.federated.searchRule.restfulApi.service;

import java.util.HashMap;

import com.federated.searchRule.restfulApi.vo.DigitalTwinBehavior;

public interface DigitalTwinBehaviorService {

	DigitalTwinBehavior searchDigitalTwinBehavior(HashMap<String, Object> map) throws Exception;

	int updateDigitalTwinBehavior(DigitalTwinBehavior digitalTwinBehavior) throws Exception;

	int createDigitalTwinBehavior(DigitalTwinBehavior digitalTwinBehavior) throws Exception;

	int deleteDigitalTwinBehavior(HashMap<String, Object> map) throws Exception;

}
