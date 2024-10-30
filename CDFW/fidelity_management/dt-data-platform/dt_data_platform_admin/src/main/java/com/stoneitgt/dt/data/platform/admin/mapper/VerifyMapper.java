package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.stoneitgt.dt.data.platform.domain.Verify;

@Mapper
public interface VerifyMapper {

	List<Map<String, Object>> getVerifyMasterList(Map<String, Object> params);

	List<Map<String, Object>> getVerifyDetailList(Map<String, Object> params);

	Map<String, Object> getVerifyMaster(Map<String, Object> params);

	Map<String, Object> getVerifyDetail(Map<String, Object> params);

	int saveVerifyDetail(Verify verify);

	int deleteVerifyDetail(Verify verify);

	Map<String, Object> getVerifyOption(int parseInt);
}
