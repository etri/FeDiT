package com.federated.searchRule.restfulApi.dao;


import java.util.HashMap;

import org.apache.ibatis.annotations.Mapper;

import com.federated.searchRule.restfulApi.vo.DigitalTwinBehavior;


@Mapper	
public interface DigitalTwinBehaviorMapper {

	DigitalTwinBehavior searchDigitalTwinBehavior(HashMap<String, Object> map);

	int createDigitalTwinBehavior(DigitalTwinBehavior digitalTwinBehavior);

	int updateDigitalTwinBehavior(DigitalTwinBehavior digitalTwinBehavior);

	int deleteDigitalTwinBehavior(HashMap<String, Object> map);
	
}
