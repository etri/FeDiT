package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stoneitgt.dt.data.platform.admin.mapper.UnitMapper;
import com.stoneitgt.dt.data.platform.domain.Unit;


@Service
public class UnitService {

	@Autowired
	private UnitMapper unitMapper;

	public List<Map<String, Object>> getUnitMasterList(Map<String, Object> params) {
		return unitMapper.getUnitMasterList(params);
	}
	
	public List<Map<String, Object>> getUnitDetailList(Map<String, Object> params) {
		return unitMapper.getUnitDetailList(params);
	}
	
	public Map<String, Object> getUnitMaster(Map<String, Object> params) {
		return unitMapper.getUnitMaster(params);
	}

	public Map<String, Object> getUnitDetail(Map<String, Object> params) {
		return unitMapper.getUnitDetail(params);
	}
	
	public int saveUnitDetail(Unit unit) {
		return unitMapper.saveUnitDetail(unit);
	}

	public int deleteUnitDetail(Unit unit) {
		return unitMapper.deleteUnitDetail(unit);
	}	
}
