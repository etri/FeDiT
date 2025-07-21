package com.stoneitgt.dt.data.platform.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MakeMetaModelSchedulerMapper {

	List<Map<String, Object>> getMakeModelDoingList(Map<String, Object> targetParams);

	List<Map<String, Object>> setMakeModelOutputColumns(Map<String, Object> checkParams);

	List<Map<String, Object>> setMakeModelFeatureColumns(Map<String, Object> checkParams);

	List<Map<String, Object>> setMakeModelParams(Map<String, Object> checkParams);

	List<Map<String, Object>> setMakeModelFiles(Map<String, Object> checkParams);

	int finishMakeModel(Map<String, Object> checkParams);

	int deleteMakeModelFile(Map<String, Object> checkParams);

	int deleteMakeModelFid(Map<String, Object> checkParams);

	int deleteMakeModelLoss(Map<String, Object> checkParams);

	List<Map<String, Object>> getOriginFiles(Map<String, Object> checkParams);

	int updateLearningBgngDt(Map<String, Object> checkParams);

	int updateLearningDndDt(Map<String, Object> checkParams);

	boolean checkStatus(@Param("model_seq") int modelSeq, @Param("model_status") String status);

    List<Map<String, Object>> getMakeModelDoingListAll();

	List<Map<String, Object>> getMakeModelDoingToWaitListAll();
}
