package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stoneitgt.dt.data.platform.admin.mapper.MakeModelSchedulerMapper;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;

@Service
public class MakeModelSchedulerService {

	@Autowired
	private SystemProperties systemproperties;
	
	@Autowired
	private MakeModelSchedulerMapper makeModelSchedulerMapper;

	
	
	public List<Map<String, Object>> getMakeModelTarget(Map<String, Object> targetParams) {
		// TODO Auto-generated method stub
		return makeModelSchedulerMapper.getMakeModelTarget(targetParams);
	}

	public int updateMakeModelTarget(Map<String, Object> seqListParam) {
		return makeModelSchedulerMapper.updateMakeModelTarget(seqListParam);
	}

	public List<Map<String, Object>> getMakeModelDoingList(Map<String, Object> targetParams) {
		return makeModelSchedulerMapper.getMakeModelDoingList(targetParams);
	}

	public List<Map<String, Object>> setMakeModelOutputColumns(Map<String, Object> checkParams) {
		return makeModelSchedulerMapper.setMakeModelOutputColumns(checkParams);
	}

	public List<Map<String, Object>> setMakeModelFeatureColumns(Map<String, Object> checkParams) {
		return makeModelSchedulerMapper.setMakeModelFeatureColumns(checkParams);
	}

	public List<Map<String, Object>> setMakeModelParams(Map<String, Object> checkParams) {
		return makeModelSchedulerMapper.setMakeModelParams(checkParams);
	}

	public List<Map<String, Object>> setMakeModelFiles(Map<String, Object> checkParams) {
		return makeModelSchedulerMapper.setMakeModelFiles(checkParams);
	}

	public int finishMakeModel(Map<String, Object> checkParams) {
		return makeModelSchedulerMapper.finishMakeModel(checkParams);
	}

	public void deleteSetRemodel(Map<String, Object> checkParams) {
		makeModelSchedulerMapper.deleteMakeModelFile(checkParams);
		makeModelSchedulerMapper.deleteMakeModelFid(checkParams);
		makeModelSchedulerMapper.deleteMakeModelLoss(checkParams);
	}

	public List<Map<String, Object>> getOriginFiles(Map<String, Object> checkParams) {
		return makeModelSchedulerMapper.getOriginFiles(checkParams);
	}

	public int updateLearningBgngDt(Map<String, Object> checkParams) {
		return makeModelSchedulerMapper.updateLearningBgngDt(checkParams);
		
	}

	public int updateLearningDndDt(Map<String, Object> checkParams) {
		return makeModelSchedulerMapper.updateLearningDndDt(checkParams);
	}

}
