package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.session.RowBounds;

import com.stoneitgt.dt.data.platform.domain.CodeDtl;
import com.stoneitgt.dt.data.platform.domain.CodeMst;

@Mapper
public interface CodeMapper {

	List<Map<String, Object>> getCodeMasterList(Map<String, Object> params);

	List<Map<String, Object>> getCodeMasterList(Map<String, Object> params, RowBounds rowBounds);

	List<Map<String, Object>> getCodeDetailList(Map<String, Object> params);

	List<Map<String, Object>> getCodeDetailList(Map<String, Object> params, RowBounds rowBounds);

	List<Map<String, Object>> getCodeList(String groupCode);

	Map<String, Object> getCodeMaster(Map<String, Object> params);

	Map<String, Object> getCodeDetail(Map<String, Object> params);

	int saveCodeMaster(CodeMst codeMst);

	int deleteCodeMaster(CodeDtl codeDtl);

	int deleteCodeMasterDetail(CodeDtl codeDtl);

	int saveCodeDetail(CodeDtl codeDtl);

	int deleteCodeDetail(CodeDtl codeDtl);

	List<Map<String, Object>> getCodeTcList(String groupCode);

	List<Map<String, Object>> getCodeList2(String groupCode);
}
