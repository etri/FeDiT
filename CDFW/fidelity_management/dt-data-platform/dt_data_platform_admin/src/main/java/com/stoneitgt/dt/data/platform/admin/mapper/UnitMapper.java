package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.stoneitgt.dt.data.platform.domain.Unit;

@Mapper
public interface UnitMapper {

	List<Map<String, Object>> getUnitMasterList(Map<String, Object> params);

	List<Map<String, Object>> getUnitDetailList(Map<String, Object> params);

	Map<String, Object> getUnitMaster(Map<String, Object> params);

	Map<String, Object> getUnitDetail(Map<String, Object> params);

	int saveUnitDetail(Unit unit);

	int deleteUnitDetail(Unit unit);
}
