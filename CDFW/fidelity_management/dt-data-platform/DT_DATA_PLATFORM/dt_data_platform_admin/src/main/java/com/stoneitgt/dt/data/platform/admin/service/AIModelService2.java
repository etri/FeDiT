package com.stoneitgt.dt.data.platform.admin.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.AIModelMapper2;
import com.stoneitgt.dt.data.platform.domain.Menu;
import com.stoneitgt.dt.data.platform.domain.MenuAuth;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.util.StringUtil;

@Service
public class AIModelService2 {

	@Autowired
	private AIModelMapper2 aiModelMapper;

	public List<Map<String, Object>> getModelLossList(int modelSeq) {
		return aiModelMapper.getModelLoss(modelSeq);
	}
	
	public List<Map<String, Object>> getModelFIDList(int modelSeq) {
		return aiModelMapper.getModelFID(modelSeq);
	}
	
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
}
