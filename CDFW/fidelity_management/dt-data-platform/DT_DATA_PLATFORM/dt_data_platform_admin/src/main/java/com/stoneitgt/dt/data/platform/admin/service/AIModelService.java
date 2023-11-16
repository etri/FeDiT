package com.stoneitgt.dt.data.platform.admin.service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.AIModelMapper;
import com.stoneitgt.dt.data.platform.domain.AugmentModel;
import com.stoneitgt.dt.data.platform.domain.AugmentModelColumn;
import com.stoneitgt.dt.data.platform.domain.AugmentModelParams;
import com.stoneitgt.dt.data.platform.domain.Menu;
import com.stoneitgt.dt.data.platform.domain.MenuAuth;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.StringUtil;

@Service
public class AIModelService {

	@Autowired
	private AIModelMapper aiModelMapper;
	
	@Autowired
	private BaseSystemProperties systemproperties;

	public List<Map<String, Object>> getAugmentModelList(Map<String, Object> params, Paging paging) {
		return aiModelMapper.getAugmentModelList(params, paging.getPaging());
	}
	
	public List<Map<String, Object>> getAugmentModelListSetUserSeq(Map<String, Object> params, Paging paging) {
		return aiModelMapper.getAugmentModelListSetUserSeq(params, paging.getPaging());
	}

	public List<Map<String, Object>> getAugmentModelSharedList(Map<String, Object> subParamsMap, Paging subPaging) {
		return aiModelMapper.getAugmentModelSharedList(subParamsMap, subPaging.getPaging());
	}
	

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public int saveModelOriginData(AugmentModel augmentModel) {
		aiModelMapper.saveModelOriginData(augmentModel);
		
		return augmentModel.getModelSeq();
	}

	public Map<String, Object> getOriginFileInfo(int modelSeq) {
		return aiModelMapper.getOriginFileInfo(modelSeq);
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public void insertInterpolateFileInfo(Map<String, Object> interpolateParam) {
		// TODO Auto-generated method stub
		aiModelMapper.insertIterpolatefile(interpolateParam);
		aiModelMapper.updateAugmentModel(interpolateParam);
	}

	public void insertValidFileInfo(Map<String, Object> interpolateParam) {
		// TODO Auto-generated method stub
		aiModelMapper.insertIterpolatefile(interpolateParam);
	}
	
	
	public Map<String, Object> getInterpolateFileInfo(int modelSeq) {
		return aiModelMapper.getInterpolateFileInfo(modelSeq);
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public void insertResampleFileInfo(Map<String, Object> resampleParam) {
		aiModelMapper.insertResamplefile(resampleParam);
		aiModelMapper.updateResampleAugmentModel(resampleParam);
	}

	public int getCountResampleFileInfo(Map<String, Object> resampleParam) {
		return aiModelMapper.getCountResampleFileInfo(resampleParam);
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public void updateResampleFileInfo(Map<String, Object> resampleParam) {
		aiModelMapper.updateResampleFileInfo(resampleParam);
		aiModelMapper.updateResampleAugmentModel(resampleParam);
	}

	public void insertUnitFileInfo(Map<String, Object> resampleParam) {
		aiModelMapper.insertResamplefile(resampleParam);
	}
	
	public void updateUnitFileInfo(Map<String, Object> resampleParam) {
		aiModelMapper.updateResampleFileInfo(resampleParam);
	}	
	
	public int insertTestFileInfo(Map<String, Object> testParam) {
		return aiModelMapper.insertTestFileInfo(testParam);
	}

	public int getCountTestFileInfo(Map<String, Object> testParam) {
		return aiModelMapper.getCountTestFileInfo(testParam);
	}

	public int updateTestFileInfo(Map<String, Object> testParam) {
		return aiModelMapper.updateTestFileInfo(testParam);
	}	
	
	
	public int insertPredFileInfo(Map<String, Object> predParam) {
		return aiModelMapper.insertPredFileInfo(predParam);
	}

	public int getCountPredFileInfo(Map<String, Object> predParam) {
		return aiModelMapper.getCountPredFileInfo(predParam);
	}

	public int updatePredFileInfo(Map<String, Object> predParam) {
		return aiModelMapper.updatePredFileInfo(predParam);
	}	
	
	
	
	
	
	
	public void insertOutlierFileInfo(Map<String, Object> OutlierParam) {
		// TODO Auto-generated method stub
		aiModelMapper.insertOutlierfile(OutlierParam);
	}
	
	public int getCountOutlierFileInfo(Map<String, Object> OutlierParam) {
		return aiModelMapper.getCountOutlierFileInfo(OutlierParam);
	}
	
	public void updateOutlierFileInfo(Map<String, Object> outlierParam) {
		aiModelMapper.updateOutlierFileInfo(outlierParam);
	}	
	
	
	public int getCountInterpolateFileInfo(Map<String, Object> interpolateParam) {
		return aiModelMapper.getCountInterpolateFileInfo(interpolateParam);
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public void updateInterpolateFileInfo(Map<String, Object> interpolateParam) {
		aiModelMapper.updateInterpolateFileInfo(interpolateParam);
		aiModelMapper.updateAugmentModel(interpolateParam);
	}
	
	
	public void updateValidFileInfo(Map<String, Object> interpolateParam) {
		aiModelMapper.updateInterpolateFileInfo(interpolateParam);
	}

	
	
	public List<Map<String, Object>> getAlgolithmList() {
		return aiModelMapper.getAlgolithmList();
	}

	public List<Map<String, Object>> getAlgolithmItemList(String value) {
		return aiModelMapper.getAlgolithmItemList(value);
	}

	public List<Map<String, Object>> getAlgolithmCodeList(String code) {
		return aiModelMapper.getAlgolithmCodeList(code);
	}

	public List<Map<String, Object>> getModelAlgorithmItem(int parseInt) {
		return aiModelMapper.getModelAlgorithmItem(parseInt);
	}

	public void saveAlgorithmModelParams(AugmentModelParams augmentModelParams) {
		aiModelMapper.saveAlgorithmModelParams(augmentModelParams);
		//aiModelMapper.saveAlgorithmModelColumn(augmentModelParams);
	}
	
	public void saveAlgorithmModelColumn(AugmentModelColumn augmentModelColumn) {
		aiModelMapper.saveAlgorithmModelColumn(augmentModelColumn);
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public void checkAlgorithmModelParams(AugmentModelParams augmentModelParams) {
		int cnt = aiModelMapper.getAlgorithmModelParamsCount(augmentModelParams);
		if (cnt > 0) {
			aiModelMapper.deleteAlgorithmModelParams(augmentModelParams);
			aiModelMapper.deleteAlgorithmModelColumn(augmentModelParams);
			
		} 
	}

	public AugmentModel getAugmentModel(int modelSeq) {
		return aiModelMapper.getAugmentModel(modelSeq);
	}

	public AugmentModel getAugmentModelSetUserSeq(AugmentModel augmentModel) {
		return aiModelMapper.getAugmentModelSetUserSeq(augmentModel);
	}
	
	public List<Map<String, Object>> getAugmentModelColumn(int modelSeq) {
		return aiModelMapper.getAugmentModelColumn(modelSeq);
	}

	public List<Map<String, Object>> getAugmentModelFID(int modelSeq) {
		return aiModelMapper.getAugmentModelFID(modelSeq);
	}

	public List<Map<String, Object>> getAugmentModelLoss(int modelSeq) {
		return aiModelMapper.getAugmentModelLoss(modelSeq);
	}

	public List<Map<String, Object>> getAugmentModelParams(int modelSeq) {
		return aiModelMapper.getAugmentModelParams(modelSeq);
	}

	public List<Map<String, Object>> getModelAlgorithmParamsList(Map<String, Object> map) {
		return aiModelMapper.getModelAlgorithmParamsList(map);
	}

	public int updateAlgorithmSeq(Map<String, Object> requestBody) {
		return aiModelMapper.updateAlgorithmSeq(requestBody);
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public void deleteModelOldFile(int modelSeq) {
		// TODO Auto-generated method stub
		String db_path = aiModelMapper.getModelFileDir(modelSeq);
		File directory = new File(systemproperties.getDtFilePath() + db_path);
		try {
			FileUtils.deleteDirectory(directory);
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		aiModelMapper.deleteModelFile(modelSeq);
		aiModelMapper.deleteModelColumn(modelSeq);
		aiModelMapper.deleteModelFid(modelSeq);
		aiModelMapper.deleteModelLoss(modelSeq);
		aiModelMapper.deleteModelParams(modelSeq);
		aiModelMapper.deleteUnitParamList(modelSeq);
		
	}

	public int updateModelOriginData(AugmentModel augmentModel) {
		return aiModelMapper.updateModelOriginData(augmentModel);
	}

	public List<Map<String, Object>> getResampleFileInfo(int modelSeq) {
		return aiModelMapper.getResampleFileInfo(modelSeq);
	}

	public int getCorrelationFileCnt(int modelSeq) {
		return aiModelMapper.getCorrelationFileCnt(modelSeq);
	}

	public int upCorrelationFileInfo(Map<String, Object> correlationParam) {
		return aiModelMapper.upCorrelationFileInfo(correlationParam);
		
	}

	public int insertCorrelationFileInfo(Map<String, Object> correlationParam) {
		return aiModelMapper.insertCorrelationFileInfo(correlationParam);
		
	}

	public List<String> getTargetColumnInfo(int modelSeq) {
		return aiModelMapper.getTargetColumnInfo(modelSeq);
	}

	public List<Map<String, Object>> resetFileList(int modelSeq) {
		return aiModelMapper.resetFileList(modelSeq);
	}
	
	public List<Map<String, Object>> resetProcTargetFileList(Map<String, Object> params) {
		return aiModelMapper.resetProcTargetFileList(params);
	}

	public int deleteResetFileList(Map<String, Object> tmp) {
		return aiModelMapper.deleteResetFileList(tmp);
	}

	public List<Map<String, Object>> getUnitCodeList() {
		return aiModelMapper.getUnitCodeList();
	}

	public String getUnitFormula(Map<String, Object> params) {
		return aiModelMapper.getUnitFormula(params);
	}
	
	public List<Map<String, Object>> getModelLossList(int modelSeq) {
		return aiModelMapper.getModelLoss(modelSeq);
	}
	
	public List<Map<String, Object>> getModelFIDList(int modelSeq) {
		return aiModelMapper.getModelFID(modelSeq);
	}
	
	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public HashMap<String, Object> getModelLoss(int modelSeq) {
		HashMap<String, Object> result = new HashMap<String, Object>();
		List<Map<String, Object>> dataList = new ArrayList<Map<String, Object>>();
		String title1="Training and Valdation loss"; 
		String title2="손실율";
		
		//데이터 생성
		HashMap<String, Object> data1 = new HashMap<String, Object>();					
		data1.put("chart", "line");
		data1.put("name", "Training loss");
		data1.put("unit", "");
				
		HashMap<String, Object> data2 = new HashMap<String, Object>();					
		data2.put("chart", "line");
		data2.put("name", "Validation loss");
		data2.put("unit", "");
		
		List<Map<String, Object>> resultList1 = new ArrayList<Map<String, Object>>();		
		List<Map<String, Object>> resultList2 = new ArrayList<Map<String, Object>>();
		List<Map<String, Object>> list = aiModelMapper.getModelLoss(modelSeq);
		
		for (Map<String, Object> info : list) {			
			Map<String, Object> temp1 = new HashMap<String, Object>();			
			Map<String, Object> temp2 = new HashMap<String, Object>();
						
			temp1.put("name", info.get("epochs").toString());
			temp1.put("value", String.format("%f", info.get("loss")));									
			resultList1.add(temp1);
			
			temp2.put("name", info.get("epochs").toString());
			temp2.put("value", String.format("%f", info.get("vrfc_loss")));									
			resultList2.add(temp2);				
		}
		
		data1.put("data", resultList1);		
		data2.put("data", resultList2);
				
		dataList.add(data1);		
		dataList.add(data2);
				
		result.put("title", title1);
		result.put("subtitle", title2);
		result.put("series", dataList);
		
		return result;
	}
	
	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public HashMap<String, Object> getModelFID(int modelSeq) {
		HashMap<String, Object> result = new HashMap<String, Object>();
		List<Map<String, Object>> dataList = new ArrayList<Map<String, Object>>();
		String title1="FID Score"; 
		String title2="FID 평가";
		
		//데이터 생성
		HashMap<String, Object> data1 = new HashMap<String, Object>();					
		data1.put("chart", "line");
		data1.put("name", "FID Score");
		data1.put("unit", "");
				
		List<Map<String, Object>> resultList1 = new ArrayList<Map<String, Object>>();		
		List<Map<String, Object>> list = aiModelMapper.getModelFID(modelSeq);
		
		for (Map<String, Object> info : list) {			
			Map<String, Object> temp1 = new HashMap<String, Object>();			
						
			temp1.put("name", info.get("epochs").toString());
			temp1.put("value", String.format("%f", info.get("fid_score")));									
			resultList1.add(temp1);							
		}
		
		data1.put("data", resultList1);		
				
		dataList.add(data1);		
				
		result.put("title", title1);
		result.put("subtitle", title2);
		result.put("series", dataList);
		
		return result;		
	}

	public int updateModelInfo(AugmentModel augmentModel) {
		return aiModelMapper.updateModelInfo(augmentModel);
	}

	public List<Map<String, Object>> getUnitTpList(String unit) {
		return aiModelMapper.getUnitTpList(unit);
	}

	public int getCountModelUnitParams(Map<String, Object> unitParam) {
		return aiModelMapper.getCountModelUnitParams(unitParam);
	}

	public int updateModelUnitParams(Map<String, Object> unitParam) {
		return aiModelMapper.updateModelUnitParams(unitParam);
	}

	public int insertModelUnitParams(Map<String, Object> unitParam) {
		return aiModelMapper.insertModelUnitParams(unitParam);
	}

	public List<Map<String, Object>> getUnitParamList(int modelSeq) {
		return aiModelMapper.getUnitParamList(modelSeq);
	}

	public int deleteUnitParamList(int model_seq) {
		return aiModelMapper.deleteUnitParamList(model_seq);
	}

	public int getCountModelFileInfo(Map<String, Object> modelParam) {
		return aiModelMapper.getCountModelFileInfo(modelParam);
	}

	public int updateModelFileInfo(Map<String, Object> modelParam) {
		return aiModelMapper.updateModelFileInfo(modelParam);
	}

	public int insertModelFileInfo(Map<String, Object> modelParam) {
		return aiModelMapper.insertModelFileInfo(modelParam);
	}

	public int deleteModel(AugmentModel augmentModel) {
		return aiModelMapper.deleteModel(augmentModel);
	}

	public Map<String, Object> getVerifyOption(int vrfcSeq) {
		return aiModelMapper.getVerifyOption(vrfcSeq);
	}

	public int getCountModelValidateParams(Map<String, Object> validParam) {
		return aiModelMapper.getCountModelValidateParams(validParam);
	}

	public int updateModelValidateParams(Map<String, Object> validParam) {
		return aiModelMapper.updateModelValidateParams(validParam);
	}

	public int insertModelValidateParams(Map<String, Object> validParam) {
		return aiModelMapper.insertModelValidateParams(validParam);
	}

	public List<Map<String, Object>> getValidateParamList(int modelSeq) {
		return aiModelMapper.getValidateParamList(modelSeq);
	}

	public int updateNullResmpltOptionDateTerm(AugmentModel augmentModel) {
		return aiModelMapper.updateNullResmpltOptionDateTerm(augmentModel);
	}

	public int updateTargetCollist(Map<String, Object> params) {
		params.put("trgt_col_list", params.get("checkHeader").toString().replace("[", "").replace("]", ""));
		return aiModelMapper.updateTargetCollist(params);
		
	}

	public Map<String, Object> selectColList(int modelSeq) {
		return aiModelMapper.selectColList(modelSeq);
	}

}
