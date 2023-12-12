package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

import javax.servlet.http.HttpServletRequest;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.service.AIModelService2;
import com.stoneitgt.dt.data.platform.admin.service.FilesService;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.Files;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.FileUtil;
import com.stoneitgt.dt.data.platform.util.StoneUtil;

@Slf4j
@Controller
@RequestMapping("/ai/model2")
public class AIModelController2 extends BaseController {
	
	@Autowired
	private AIModelService2 aiModelService;
	
	@Autowired
	private BaseSystemProperties systemproperties;
	
	@Autowired
	private FilesService filesService;
	
	@GetMapping("/result")
	public String getResult(@ModelAttribute BaseParameter params, Model model) throws IOException {
		//int modelSeq = Integer.parseInt(params.get("model_seq").toString());
		int modelSeq = 9999;
		
		model.addAttribute("list_loss", aiModelService.getModelLossList(modelSeq));
		model.addAttribute("list_fid", aiModelService.getModelFIDList(modelSeq));
		model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));		
		return "pages/ai_model2/result";
	}
	
	@PostMapping("/loss")
	@ResponseBody
	public Map<String, Object> getLoss(@RequestBody Map<String, Object> params) {
		int result = 1;
		Integer modelSeq = Integer.parseInt(params.get("modelSeq").toString());
		
		Map<String, Object> data = aiModelService.getModelLoss(modelSeq);
		log.info(data.toString());
		
		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put("result_code", result);
		map.put("loss",  data);
		
		return map;		
	}	
	
	@PostMapping("/fid")
	@ResponseBody
	public Map<String, Object> getFID(@RequestBody Map<String, Object> params) {
		int result = 1;
		Integer modelSeq = Integer.parseInt(params.get("modelSeq").toString());
		
		Map<String, Object> data = aiModelService.getModelFID(modelSeq);
		log.info(data.toString());
		
		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put("result_code", result);
		map.put("fid",  data);
		
		return map;		
	}
	
	@PostMapping("/testdata")
	@ResponseBody
	public Map<String, Object> getDataTest(@RequestBody Map<String, Object> params) throws IOException {
		int result = 1;
		
		Integer modelSeq = Integer.parseInt(params.get("modelSeq").toString());
		Integer count = Integer.parseInt(params.get("count").toString());
		
		String prctFilePath = systemproperties.getDtFilePath() + "\\dt_data_api\\storage\\data\\2023\\04\\9999\\201901_201912유동인구_pred.csv";
		String testFilePath = systemproperties.getDtFilePath() + "\\dt_data_api\\storage\\data\\2023\\04\\9999\\201901_201912유동인구_test.csv";
		
		HashMap<String, Object> r = new HashMap<String, Object>();
		List<Map<String, Object>> dataList = new ArrayList<Map<String, Object>>();
		String title1="학습데이터 검증"; 
		String title2="학습데이터 검증";
		
		ArrayList<String> columns = new ArrayList<String>();
		getTestData(prctFilePath, dataList, "P", columns, count);
		getTestData(testFilePath, dataList, "T", columns, count);
		
		ArrayList<String> data_test_header = new ArrayList<String>();
		ArrayList<String> data_pred_header = new ArrayList<String>();
		List<Map<String, Object>> data_test = getTestDataList(testFilePath, data_test_header, count);
		List<Map<String, Object>> data_pred = getTestDataList(prctFilePath, data_pred_header, count);
		
		r.put("title", title1);
		r.put("subtitle", title2);
		r.put("series", dataList);
		r.put("data_test", data_test);
		r.put("data_test_header", data_test_header);
		r.put("data_pred", data_pred);
		r.put("data_pred_header", data_pred_header);
		
		HashMap<String, Object> map = new HashMap<String, Object>();
		map.put("result_code", result);
		map.put("test",  r);
		
		return map;		
	}
	
	public void getTestData(String filePath, List<Map<String, Object>> dataList, String type, ArrayList<String> columns, int count) throws IOException {
		ArrayList<HashMap<String, Object>> alData = new ArrayList<HashMap<String,Object>>();
		ArrayList<List<Map<String, Object>>> alResultList = new ArrayList<List<Map<String,Object>>>();
		//String[] columns = {};
		ArrayList<Integer> columns_no = new ArrayList<Integer>();
		
		BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(new File(filePath))));
				
		String row;
		int n = 0;
		int colCount = 0;
		while((row=br.readLine()) != null) {
			if (n==0) {
				String[] temp = row.split(",");
				colCount = temp.length-1;
				for (int i=0; i<colCount; i++) {
					if ("P".equals(type)) {
						columns.add(temp[i+1]);
								
						HashMap<String, Object> data = new HashMap<String, Object>();					
						data.put("chart", "line");
						data.put("name", type + "_" + temp[i+1]);
						data.put("unit", "");
						alData.add(data);
						
						List<Map<String, Object>> resultList = new ArrayList<Map<String, Object>>();
						alResultList.add(resultList);
					} else {
						for (int j=0; j<columns.size(); j++) {
							if (columns.get(j).trim().equals(temp[i+1].trim())) {
								columns_no.add(j);
								
								HashMap<String, Object> data = new HashMap<String, Object>();					
								data.put("chart", "line");
								data.put("name", type + "_" + temp[i+1]);
								data.put("unit", "");
								alData.add(data);
								
								List<Map<String, Object>> resultList = new ArrayList<Map<String, Object>>();
								alResultList.add(resultList);								
							}
						}
					}					
				}
			} else {
				//log.info(row);
				String[] temp = row.split(",");
				
				if ("P".equals(type)) {
					for (int i=0; i<colCount; i++) {
						Map<String, Object> item = new HashMap<String, Object>();
						item.put("name", n);
						item.put("value", temp[i+1]);
						
						List<Map<String, Object>> resultList = alResultList.get(i);
						resultList.add(item);
					}				
				} else {
					for (int i=0; i<colCount; i++) {
						for (int j=0; j<columns_no.size(); j++) {
							if (columns_no.get(j) == i) {
								Map<String, Object> item = new HashMap<String, Object>();
								item.put("name", n);
								item.put("value", temp[i+1]);
								
								List<Map<String, Object>> resultList = alResultList.get(i);
								resultList.add(item);
							}
						}						
					}					
				}				
			}
			
			if (n==count)
				break;
			
			n++;
		}
		
		for (int i=0; i < alData.size(); i++) {
			Map<String, Object> data = alData.get(i);
			List<Map<String, Object>> resultList = alResultList.get(i);			
			data.put("data", resultList);
			
			dataList.add(data);
		}		
	}
	
	public List<Map<String, Object>> getTestDataList(String filePath, ArrayList<String> columns, int count) throws IOException {
		List<Map<String, Object>> resultList = new ArrayList<Map<String, Object>>();
		//ArrayList<String> columns = new ArrayList<String>();
		BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(new File(filePath))));
		
		String row;
		int n = 0;
		int colCount = 0;
		while((row=br.readLine()) != null) {
			if (n==0) {
				String[] temp = row.split(",");
				colCount = temp.length-1;
				for (int i=0; i<colCount; i++) {
					columns.add(temp[i+1]);
				}
			} else {
				String[] temp = row.split(",");
				Map<String, Object> item = new HashMap<String, Object>();
				for (int i=0; i<colCount; i++) {
					item.put(columns.get(i), temp[i+1]);										
				}
				resultList.add(item);
			}
			
			if (n==count)
				break;
			
			n++;			
		}
		
		return resultList;
	}
}
