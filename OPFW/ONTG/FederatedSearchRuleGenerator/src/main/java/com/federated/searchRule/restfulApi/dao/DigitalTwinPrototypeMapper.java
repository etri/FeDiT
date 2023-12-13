package com.federated.searchRule.restfulApi.dao;

import java.util.HashMap;

import org.apache.ibatis.annotations.Mapper;

import com.federated.searchRule.restfulApi.vo.DigitalTwinPrototype;

@Mapper
public interface DigitalTwinPrototypeMapper {

	DigitalTwinPrototype searchDigitalTwinPrototype(HashMap<String, Object> map);

	int createDigitalTwinPrototype(DigitalTwinPrototype digitalTwinPrototype);

	int deleteDigitalTwinPrototype(HashMap<String, Object> map);

	int updateDigitalTwinPrototype(DigitalTwinPrototype digitalTwinPrototype);

}
	