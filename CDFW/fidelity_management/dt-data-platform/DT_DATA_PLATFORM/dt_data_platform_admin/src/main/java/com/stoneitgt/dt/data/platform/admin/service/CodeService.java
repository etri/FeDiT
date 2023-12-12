package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stoneitgt.dt.data.platform.admin.mapper.CodeMapper;
import com.stoneitgt.dt.data.platform.domain.CodeDtl;
import com.stoneitgt.dt.data.platform.domain.CodeMst;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;


@Service
public class CodeService {

	@Autowired
	private CodeMapper codeMapper;

	public List<Map<String, Object>> getCodeMasterList(Map<String, Object> params) {
		return codeMapper.getCodeMasterList(params);
	}

	public List<Map<String, Object>> getCodeMasterList(Map<String, Object> params, Paging paging) {
		return codeMapper.getCodeMasterList(params, paging.getPaging());
	}

	public List<Map<String, Object>> getCodeDetailList(Map<String, Object> params) {
		return codeMapper.getCodeDetailList(params);
	}

	public List<Map<String, Object>> getCodeDetailList(Map<String, Object> params, Paging paging) {
		return codeMapper.getCodeDetailList(params, paging.getPaging());
	}

	public List<Map<String, Object>> getCodeList(String groupCode) {
		return codeMapper.getCodeList(groupCode);
	}

	public Map<String, Object> getCodeMaster(Map<String, Object> params) {
		return codeMapper.getCodeMaster(params);
	}

	public Map<String, Object> getCodeDetail(Map<String, Object> params) {
		return codeMapper.getCodeDetail(params);
	}

	public int saveCodeMaster(CodeMst codeMst) {
		return codeMapper.saveCodeMaster(codeMst);
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public int deleteCodeMaster(CodeDtl codeDtl) {
		int result = codeMapper.deleteCodeMaster(codeDtl);
		result += codeMapper.deleteCodeMasterDetail(codeDtl);
		return result;
	}

	public int saveCodeDetail(CodeDtl codeDtl) {
		return codeMapper.saveCodeDetail(codeDtl);
	}

	public int deleteCodeDetail(CodeDtl codeDtl) {
		return codeMapper.deleteCodeDetail(codeDtl);
	}

	public List<Map<String, Object>> getCodeTcList(String groupCode) {
		return codeMapper.getCodeTcList(groupCode);
	}

	public List<Map<String, Object>> getCodeList2(String groupCode) {
		return codeMapper.getCodeList2(groupCode);
	}
}
