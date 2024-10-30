package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.service.AIModelService;
import com.stoneitgt.dt.data.platform.admin.service.DjangoApiService;
import com.stoneitgt.dt.data.platform.admin.service.SimulationService;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.domain.SimulationModel;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.StoneUtil;

import lombok.extern.slf4j.Slf4j;


@Slf4j
@Controller
@RequestMapping("/simulation")
public class SimulationController extends BaseController {
	
	@Autowired
	private SimulationService simulationService;

	@Autowired
	private DjangoApiService djangoApiService;
	
	@Autowired
	private BaseSystemProperties systemproperties;

	@Autowired
	private AIModelService aiModelService;
	
	@GetMapping("/list")
	public String getPredictList(@ModelAttribute BaseParameter params, Model model, HttpServletRequest request, HttpServletResponse response) {
		
		Paging paging = new Paging();
		paging.setPage(params.getPage());
		paging.setSize(params.getSize());

		Map<String, Object> paramsMap = StoneUtil.convertObjectToMap(params);
		
		List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
		
		if (authenticationFacade.getAuth().equals("AU00")) {
			list = simulationService.getPredictionList(paramsMap, paging);	
		} else {
			paramsMap.put("user_seq", authenticationFacade.getLoginUserSeq());
			list = simulationService.getPredictionListSetUserSeq(paramsMap, paging);
		}
		model.addAttribute("list", list);
		model.addAttribute("paging", StoneUtil.setTotalPaging(list, paging));
		model.addAttribute("params", params);
		
		
		Paging subPaging = new Paging();
		subPaging.setSubPage(params.getSubPage());
		subPaging.setSubSize(params.getSubSize());

		Map<String, Object> subParamsMap = StoneUtil.convertObjectToMap(params);
		
		List<Map<String, Object>> share_list = simulationService.getPredictionSharedList(subParamsMap, subPaging);
		model.addAttribute("share_list", share_list);
		model.addAttribute("subPaging", StoneUtil.setTotalPaging(share_list, subPaging));
		model.addAttribute("subParams", params);
		

		model.addAttribute("pageParams", getBaseParameterString(params));
		model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));

		return "pages/simulation/list";
	}	
	
	
	@GetMapping("/form")
	public String modelForm(@ModelAttribute BaseParameter params, Model model) {
		SimulationModel simulationModel = new SimulationModel();
		model.addAttribute("simulationModel", simulationModel);
		model.addAttribute("menuCd", params.getMenuCd());
		model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
		model.addAttribute("pageParams", getBaseParameterString(params));
		
		List<Map<String, Object>> model_list = simulationService.getPopupModelList();
		model.addAttribute("modal_model_list", model_list);		
		
		List<Map<String, Object>> data_crt_intvl_tp_list = simulationService.getModelDataTerm();
		model.addAttribute("data_crt_intvl_tp_list", data_crt_intvl_tp_list);
		
		model.addAttribute("formType", "I");
		
		return "pages/simulation/form";
	}	
	
	@PostMapping("/form")
	public String updateForm(@RequestParam(required = false) String menuCd,
			@ModelAttribute BaseParameter params, @ModelAttribute SimulationModel simulationModel, BindingResult bindingResult, Model model,
			RedirectAttributes redirectAttributes) {

		String returnUrl = "redirect:/simulation/" + simulationModel.getAugmentSeq() + "?";
		returnUrl += getBaseParameterString(params);
	
		simulationModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
		simulationModel.setLoginUserIp(authenticationFacade.getLoginUserIp());
		simulationService.updateSimulationInfo(simulationModel);
		
		return returnUrl;
	}	

	@GetMapping("/{augmentSeq}")
	public String modelView(@PathVariable int augmentSeq, @ModelAttribute BaseParameter params, Model model) {
		SimulationModel simulationModel = new SimulationModel();

		if (authenticationFacade.getAuth().equals("AU00")) {
			simulationModel = simulationService.getSimulation(augmentSeq);
		} else {
			simulationModel.setAugmentSeq(augmentSeq);
			simulationModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
			simulationModel = simulationService.getSimulationUserSeq(simulationModel);
		}		
		
		
		model.addAttribute("simulationModel", simulationModel);
		model.addAttribute("menuCd", params.getMenuCd());
		model.addAttribute("breadcrumb", getBreadcrumb(params.getMenuCd()));
		model.addAttribute("pageParams", getBaseParameterString(params));

		List<Map<String, Object>> model_list = simulationService.getPopupModelList();
		model.addAttribute("modal_model_list", model_list);		
		
		List<Map<String, Object>> data_crt_intvl_tp_list = simulationService.getModelDataTerm();
		model.addAttribute("data_crt_intvl_tp_list", data_crt_intvl_tp_list);
		
		model.addAttribute("formType", "U");
		
		return "pages/simulation/form";
	}	

	@PostMapping(value="/insertSimulationInfo")
	@ResponseBody
	public Map<String, Object> insertSimulationInfo(@ModelAttribute SimulationModel simulationModel, HttpServletRequest request) throws IOException, ParseException {

		simulationModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
		simulationModel.setLoginUserId(WebConfig.getSessionInfo().getUserId());
		simulationModel.setLoginUserIp(authenticationFacade.getLoginUserIp());

		//대기중
		simulationModel.setAugmentStatus("W");
		simulationModel.setAugmentTp("P");
		Map<String, Object> result =  simulationService.insertSimulationInfo(simulationModel);
		
		return result;
	}	
	
	@PostMapping(value="/insertSimulationViewResult")
	@ResponseBody
	public Map<String, Object> insertSimulationViewResult(@RequestBody Map<String, Object> params, HttpServletRequest request) throws IOException, ParseException {
		
		SimulationModel simulationModel = new SimulationModel();
		simulationModel.setAugmentSeq(Integer.parseInt(params.get("augmentSeq").toString()));
		simulationModel = simulationService.getInsertSimulationViewResult(simulationModel.getAugmentSeq());
		
		return readCsvToMap(systemproperties.getDtFilePath() + simulationModel.getAugmentFilePath(), Integer.parseInt(simulationModel.getAugmentFileSeq()));
	}		

	public Map<String, Object> readCsvToMap(String filePath, int augmentFileSeq) throws IOException {
		List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
		List<String> headerList = new ArrayList<String>();
				
		String line;
		int rowCount = 0;
		
		FileInputStream fileInputStream = new FileInputStream(filePath);
		InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
		BufferedReader br = new BufferedReader(inputStreamReader);
		
		while((line=br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
			List<String> stringList = new ArrayList<String>();
			String stringArray[] = line.split(",", -1);
			stringList = Arrays.asList(stringArray);
            
			// csv 1열 데이터를 header로 인식
			if(headerList.size() == 0){
				for (int i = 0; i < stringArray.length; i++) {
					headerList.add(stringArray[i].replace("\"", ""));
				}
				
			} else {
 				Map<String, Object> map = new LinkedHashMap<String, Object>();
				// header 컬럼 개수를 기준으로 데이터 set
				for(int i = 0; i < headerList.size(); i++){
					map.put(headerList.get(i), stringList.get(i).replace("\"", ""));
				}
				mapList.add(map);
			}
			
			rowCount++;
		}
		br.close();		
			
		
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
		result.put("data", mapList);
		result.put("header_data", headerList);
		result.put("augmentFileSeq", augmentFileSeq);
		
		return result;
	}		
	
	@PostMapping("/make/correlation")
	@ResponseBody
	public Map<String, Object> makeResampleSetView(@RequestBody Map<String, Object> params) throws JsonParseException, JsonMappingException, IOException, ParseException {
		//log.info("=========resample_set_view===========");
		Map<String, Object> result = new HashMap<String, Object>();
		
		int modelSeq = Integer.parseInt(params.get("model_seq").toString());
		
		String line;
		int rowCount = 0;

		List<Map<String, Object>> mapList = new ArrayList<Map<String, Object>>();
		List<String> headerList = new ArrayList<String>();
		//Map<String, Object> file_info = setFileNamePath(params.get("file_path").toString());
		Map<String, Object> file_info = simulationService.getModelFileInfo(modelSeq);
		
		if (file_info.size() > 0) {
			String filePath = systemproperties.getDtFilePath().replace("\\", "/") + file_info.get("file_path") + file_info.get("file_nm");	
			
			FileInputStream fileInputStream = new FileInputStream(filePath);
			
			InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, "UTF-8");
			BufferedReader br = new BufferedReader(inputStreamReader);

			while((line=br.readLine()) != null && rowCount <= systemproperties.getLimitCsvRowCount()) {
				String stringArray[] = line.split(",", -1);
	            
				// csv 1열 데이터를 header로 인식
				if(headerList.size() == 0){
					for (int i = 0; i < stringArray.length; i++) {
						headerList.add(stringArray[i].replace("\"", ""));
					}
				}
			}
			br.close();				
			
			List<Map<String, Object>> augment_column_list = aiModelService.getAugmentModelColumn(modelSeq);
			
			//상관그래프 이미지
			//dt/processor/datasetCorrelation/
			//datasetCorrelation
			//List<Map<String, Object>> resampleFileInfo = aiModelService.getResampleFileInfo(modelSeq);
			
			String correlationUrl = systemproperties.getDtApiUrl() + "/dt/preprocess/processorDatasetCorrelation/";
			
			List<String> checkHeaderList = aiModelService.getTargetColumnInfo(modelSeq);
			Map<String, Object>correlationParam = new HashMap<String, Object>();
			correlationParam.put("file_path", systemproperties.getDtFilePath().replace("\\", "/") + file_info.get("file_path"));
			correlationParam.put("file_name", file_info.get("file_nm"));
			correlationParam.put("index_trgt_col", file_info.get("index_trgt_col"));
			correlationParam.put("columns", checkHeaderList);
			
			String correlationString = djangoApiService.requestDjangoApi(correlationUrl, correlationParam, modelSeq);
			
			JSONParser correlationParser = new JSONParser();
		    JSONObject correlationObj = (JSONObject) correlationParser.parse(correlationString);		
		    
		    if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
		    	 //log.info("correlationObj:::" + correlationObj.get("data"));
		    	 result.put("correlation_data", correlationObj.get("data"));
		    } else {
		    	 //log.info("실패:::" + correlationObj);;
		    }
			
			result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
			result.put("augment_column_list", augment_column_list);
			result.put("header_data", headerList);
		} else {
			result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
			result.put("augment_column_list", "");
			result.put("header_data", "");
		}
		
		return result;
	}
	
	@PostMapping("/delete")
	public String deleteModel(@RequestParam int augmentSeq,
			@RequestParam(required = false) String menuCd, Model model, RedirectAttributes rttr) throws IOException {
		SimulationModel simulationModel = new SimulationModel();
		simulationModel.setAugmentSeq(augmentSeq);
		simulationModel.setLoginUserSeq(authenticationFacade.getLoginUserSeq());
		simulationModel.setLoginUserIp(authenticationFacade.getLoginUserIp());
		
		simulationService.deleteAugement(simulationModel);
		//rttr.addFlashAttribute("result_code", GlobalConstant.CRUD_TYPE.DELETE);
		
		return "redirect:/simulation/list?menuCd=" + menuCd;
	}	
	
	
	
	
}
