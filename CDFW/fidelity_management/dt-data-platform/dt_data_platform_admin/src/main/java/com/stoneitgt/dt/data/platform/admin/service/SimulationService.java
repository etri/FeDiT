package com.stoneitgt.dt.data.platform.admin.service;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.SimulationMapper;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.domain.SimulationModel;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SimulationService {

	@Autowired
	private SimulationMapper simulationMapper;
	
	@Autowired
	private BaseSystemProperties systemproperties;

	@Autowired
	private DjangoApiService djangoApiService;
	
	@Autowired
	private FilesService filesService;
	
	public List<Map<String, Object>> getPredictionList(Map<String, Object> params, Paging paging) {
		return simulationMapper.getPredictionList(params, paging.getPaging());
	}
	
	public List<Map<String, Object>> getPredictionListSetUserSeq(Map<String, Object> params, Paging paging) {
		return simulationMapper.getPredictionListSetUserSeq(params, paging.getPaging());
	}

	public List<Map<String, Object>> getPredictionSharedList(Map<String, Object> subParamsMap, Paging subPaging) {
		return simulationMapper.getPredictionSharedList(subParamsMap, subPaging.getPaging());
	}	
	
	public List<Map<String, Object>> getPopupModelList() {
		return simulationMapper.getPopupModelList();
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public Map<String, Object> insertSimulationInfo(SimulationModel simulationModel) {
		Map<String, Object> result = new HashMap<String, Object>();
		
		//기본정보 인서트
		simulationMapper.insertAugmentInfo(simulationModel);
		
        Calendar calendar = Calendar.getInstance();
        Date now = calendar.getTime();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM");
        String currentYearMonthDir = sdf.format(now);				
		String basePath = "/augment/" + currentYearMonthDir + "/" + simulationModel.getAugmentSeq();
		
		//api 처리
		
		Map<String, Object> modelInfo = simulationMapper.getModelInfo(simulationModel.getModelSeq());
		
		simulationModel.setPrcsLevel(modelInfo.get("prcs_level").toString());
		simulationModel.setIndexColumn(modelInfo.get("index_trgt_col").toString());
		simulationModel.setResmplIntvlTp(modelInfo.get("resmpl_intvl_tp").toString());
		simulationModel.setResmplIntvlValue(Integer.parseInt(modelInfo.get("resmpl_intvl_value").toString()));
		
		Map<String, Object> paramsModelParams = new HashMap<String, Object>();
		paramsModelParams.put("modelAlgrmSeq", modelInfo.get("model_algrm_seq"));
		paramsModelParams.put("modelSeq", simulationModel.getModelSeq());
		
		List<Map<String, Object>> modelParams = simulationMapper.getModelParams(paramsModelParams);
		
		for (int mp = 0; mp < modelParams.size(); mp++) {
			if ("windowSize".equals(modelParams.get(mp).get("model_algrm_nm"))) {
				simulationModel.setWindowSize(Integer.parseInt(modelParams.get(mp).get("model_params_item_value").toString()));
			}
			if ("batchSize".equals(modelParams.get(mp).get("model_algrm_nm"))) {
				simulationModel.setBatchSize(Integer.parseInt(modelParams.get(mp).get("model_params_item_value").toString()));
			}
		}
		

		List<Map<String, Object>> modelFiles = simulationMapper.getModelFiles(simulationModel.getModelSeq());
		for (int mf = 0; mf < modelFiles.size(); mf++) {
			String file_name = modelFiles.get(mf).get("file_nm").toString();
			
			if ("MODEL".equals(modelFiles.get(mf).get("ref_tp"))) {
				simulationModel.setModelFilePath(systemproperties.getDtFilePath() + modelFiles.get(mf).get("file_path").toString());
				simulationModel.setModelFileName(file_name);
			}
			
			if (simulationModel.getPrcsLevel().equals(modelFiles.get(mf).get("ref_tp"))) {
				simulationModel.setModelUseFilePath(systemproperties.getDtFilePath() + modelFiles.get(mf).get("file_path").toString());
				simulationModel.setModelUseFileName(modelFiles.get(mf).get("file_nm").toString());
				String test_file_path = systemproperties.getDtFilePath().replace("\\", "/") + basePath + "/";
				simulationModel.setTestFilePath(test_file_path);
				simulationModel.setTestFileName(file_name.substring(0, file_name.lastIndexOf(".")) + "_simulation_target" + file_name.substring(file_name.lastIndexOf(".")));
				simulationModel.setOutputFileName(file_name.substring(0, file_name.lastIndexOf(".")) + "_augment" + file_name.substring(file_name.lastIndexOf(".")));
			}
		}
		
		List<Map<String, Object>> modelColumns = simulationMapper.getModelColumns(simulationModel.getModelSeq());
		
		ArrayList<String> oc_col = new ArrayList<String>();
		ArrayList<String> fc_col = new ArrayList<String>();
		
		for (int mc = 0; mc < modelColumns.size(); mc++) {
			if ("OC".equals(modelColumns.get(mc).get("model_col_tp"))) {
				oc_col.add(modelColumns.get(mc).get("model_col_nm").toString());
			}
			if ("FC".equals(modelColumns.get(mc).get("model_col_tp"))) {
				fc_col.add(modelColumns.get(mc).get("model_col_nm").toString());
			}			
		}
		simulationModel.setOutputs(oc_col);
		simulationModel.setFeatures(fc_col);
		
		simulationModel.setModelId(simulationModel.getModelSeq());
		simulationModel.setUseModelYn("Y");
		simulationModel.setRealTimeYn("N");
		
		String simulationUrl = systemproperties.getDtApiUrl() + "/dt/augment/augmentCreate/";
		
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("model_file_path",simulationModel.getModelFilePath());
		params.put("model_file_name",simulationModel.getModelFileName());
		params.put("model_use_file_path",simulationModel.getModelUseFilePath());
		params.put("model_use_file_name",simulationModel.getModelUseFileName());
		params.put("test_file_path",simulationModel.getTestFilePath());
		params.put("test_file_name",simulationModel.getTestFileName());
		
		params.put("output_file_name",simulationModel.getOutputFileName());
		params.put("outputs",simulationModel.getOutputs());
		params.put("features",simulationModel.getFeatures());
		params.put("window_size",simulationModel.getWindowSize());
		params.put("batch_size",simulationModel.getBatchSize());
		params.put("model_id",simulationModel.getModelId());
		params.put("index_column",simulationModel.getIndexColumn());
		params.put("use_model_yn",simulationModel.getUseModelYn());
		params.put("real_time_yn",simulationModel.getRealTimeYn());
				
		params.put("target_start_date",simulationModel.getDataCrtBgngDt());
		params.put("target_last_date",simulationModel.getDataCrtLastDt());
		
		//2023-11-10모델에서 object 컬럼을 제외하고 생성했음으로 추론도 마찬가지
		if (modelInfo.get("trgt_col_list") == null) {
			params.put("trgt_col_list","");
		} else {
			String[] trgt_col_list = modelInfo.get("trgt_col_list").toString().split(", ");
			params.put("trgt_col_list",trgt_col_list);	
		}
		
        if ("D".equals(simulationModel.getDataCrtIntvlTp())) {
        	params.put("date_term_tp","days");
        } else if ("H".equals(simulationModel.getDataCrtIntvlTp())) {
        	params.put("date_term_tp","hours");
        } else if ("T".equals(simulationModel.getDataCrtIntvlTp())) {
        	params.put("date_term_tp","minutes");
        } else if ("S".equals(simulationModel.getDataCrtIntvlTp())) {
        	params.put("date_term_tp","seconds");
        } else {
        	params.put("date_term_tp","hours");
        }		
		params.put("date_term_value",simulationModel.getDataCrtIntvlValue());
        
        
        if ("D".equals(simulationModel.getResmplIntvlTp())) {
        	params.put("resmpl_intvl_tp","days");
        } else if ("H".equals(simulationModel.getResmplIntvlTp())) {
        	params.put("resmpl_intvl_tp","hours");
        } else if ("T".equals(simulationModel.getResmplIntvlTp())) {
        	params.put("resmpl_intvl_tp","minutes");
        } else if ("S".equals(simulationModel.getResmplIntvlTp())) {
        	params.put("resmpl_intvl_tp","seconds");
        } else {
        	params.put("resmpl_intvl_tp","hours");
        }
		params.put("resmpl_intvl_value",simulationModel.getResmplIntvlValue());
		
		//최종저장파일
		params.put("output_file",simulationModel.getTestFilePath() + simulationModel.getOutputFileName());
		
		
		//기본정보 인서트
		simulationMapper.updateAugmentStartTime(simulationModel);
		
		String info = djangoApiService.requestDjangoApi(simulationUrl, params, simulationModel.getModelSeq());
		
        JSONObject jsonObject = new JSONObject(info);
        String infoString = jsonObject.getString("data");		
		
		
		simulationMapper.updateAugmentEndTime(simulationModel);
		
		simulationModel.setAugmentStatus("C");
		simulationMapper.updateAugmentStatus(simulationModel);

		//파일 정보 저장
		if (!"".equals(infoString) && infoString != null) {
			try {
				int file_seq = filesService.saveDtAugmentFiles(infoString, basePath, simulationModel.getPrcsLevel(), simulationModel.getAugmentSeq(), simulationModel.getLoginUserSeq(), simulationModel.getLoginUserIp());
				result.put("augmentFileSeq", file_seq);
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		result.put("data", infoString);
		result.put("augmentSeq", simulationModel.getAugmentSeq());
		
		result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);

		return result;
	}

	public SimulationModel getInsertSimulationViewResult(int augmentSeq) {
		return simulationMapper.getInsertSimulationViewResult(augmentSeq);
	}

	public SimulationModel getSimulation(int augmentSeq) {
		return simulationMapper.getSimulation(augmentSeq);
	}

	public SimulationModel getSimulationUserSeq(SimulationModel simulationModel) {
		return simulationMapper.getSimulationUserSeq(simulationModel);
	}

	public int updateSimulationInfo(SimulationModel simulationModel) {
		return simulationMapper.updateSimulationInfo(simulationModel);
	}

	public Map<String, Object> getModelFileInfo(int modelSeq) {
		return simulationMapper.getModelFileInfo(modelSeq);
	}

	@Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
	public void deleteAugement(SimulationModel simulationModel) {
		simulationMapper.deleteAugment(simulationModel);
		simulationMapper.deleteAugmentFile(simulationModel);
	}

	public List<Map<String, Object>> getModelDataTerm() {
		return simulationMapper.getModelDataTerm();
	}
}
