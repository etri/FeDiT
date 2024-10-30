package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stoneitgt.dt.data.platform.admin.mapper.VerifyMapper;
import com.stoneitgt.dt.data.platform.domain.Verify;


@Service
public class VerifyService {

	@Autowired
	private VerifyMapper verifyMapper;

	public List<Map<String, Object>> getVerifyMasterList(Map<String, Object> params) {
		return verifyMapper.getVerifyMasterList(params);
	}
	
	public List<Map<String, Object>> getVerifyDetailList(Map<String, Object> params) {
		return verifyMapper.getVerifyDetailList(params);
	}
	
	public Map<String, Object> getVerifyMaster(Map<String, Object> params) {
		return verifyMapper.getVerifyMaster(params);
	}

	public Map<String, Object> getVerifyDetail(Map<String, Object> params) {
		return verifyMapper.getVerifyDetail(params);
	}
	
	public int saveVerifyDetail(Verify verify) {
		return verifyMapper.saveVerifyDetail(verify);
	}

	public int deleteVerifyDetail(Verify verify) {
		return verifyMapper.deleteVerifyDetail(verify);
	}

	public Map<String, Object> getVerifyOption(int parseInt) {
		return verifyMapper.getVerifyOption(parseInt);
	}	
}
