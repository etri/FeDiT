package kr.udt.schedule.web;

import java.io.IOException;
import java.io.StringReader;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.Resource;
import javax.crypto.NoSuchPaddingException;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import egovframework.rte.psl.dataaccess.util.EgovMap;
import egovframework.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import kr.udt.cmmn.util.UdtRestApiUtil;
import kr.udt.schedule.service.UdtScheduleService;

/**
 * @설명 :  UDT 연계ㆍ데이터셋  컨트롤러
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 10. 14
 * @비고 :  
 */
@Controller
public class UdtScheduleController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(UdtScheduleController.class);
	
	@Resource(name = "udtScheduleService")
	private UdtScheduleService udtScheduleService;
	
	@Autowired
	private UdtRestApiUtil udtRestApiUtil;
	
	@Autowired
	private Properties property;
	

	@RequestMapping(value="/udt/schedule/scheduleManage.do")
	public String scheduleMainPage(ModelMap model) throws IOException{
		model.addAttribute("menuNo", "menu-li-2");
		return "udt/schedule/scheduleManage";
	}
	
	@RequestMapping(value="/udt/schedule/pop/cronExplain.do")
	public String cronExplainPage(ModelMap model) throws IOException{
		return "udt/schedule/pop/cronExplain";
	}
	
	
	@RequestMapping(value="/udt/schedule/selectAllJobMstWithJobConfig.do")
	public String selectAllJobMstWithJobConfig(@RequestBody HashMap<String, Object> param, Model model) throws IOException{
		
		/** pageing setting */
		param.put("pageUnit", 5);
		param.put("pageSize", 5);
		PaginationInfo paginationInfo = new PaginationInfo();
		paginationInfo.setCurrentPageNo((Integer)param.get("pageIndex"));
		paginationInfo.setRecordCountPerPage((Integer)param.get("pageUnit"));
		paginationInfo.setPageSize((Integer)param.get("pageSize"));

		param.put("firstIndex", paginationInfo.getFirstRecordIndex());
		param.put("lastIndex", paginationInfo.getLastRecordIndex());
		param.put("recordCountPerPage", paginationInfo.getRecordCountPerPage());
		
		List<EgovMap> resultMapList = udtScheduleService.selectAllJobMstWithJobConfig(param);		
		model.addAttribute("resultList",resultMapList);
		
		int totCount = 0;
		if(resultMapList.size()>0) totCount=(Integer)resultMapList.get(0).get("totcnt");
		
		paginationInfo.setTotalRecordCount(totCount);
		model.addAttribute("paginationInfo", paginationInfo);
		
		return "udt/schedule/ajax/scheduleJobConfigList";
	}
	
	
	@RequestMapping(value="/udt/schedule/loadingDataSetMetaDiv.do")
	public String loadingDataSetMetaDiv(@RequestBody HashMap<String, Object> param, Model model) throws IOException{
		List<EgovMap> resultMapList = udtScheduleService.selectRdfMetaDatasetTitleList();
		model.addAttribute("resultList",resultMapList);
		return "udt/schedule/ajax/jobDatasetMetaList";
	}
	
	@RequestMapping(value="/udt/schedule/selectOneRdfMetaDataset.do")
	public String selectOneRdfMetaDataset(@RequestBody HashMap<String, Object> param, Model model) throws IOException{
		EgovMap resultMap = udtScheduleService.selectOneRdfMetaDataset(param);
		model.addAttribute("resultMap",resultMap);
		return "udt/schedule/ajax/subJobDatasetMetaList";
	}
	
	/**
	 * 데이터셋 상세보기/편집 수행을 위한 데이터셋 정보 조회
	 * @param param
	 * @param model
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/udt/schedule/selectOneJobDetailView.do")
	public String selectOneJobDetailView(@RequestBody HashMap<String, Object> param, Model model) throws IOException{		
		EgovMap resultMap = udtScheduleService.selectOneJobLinkConfig(param);
		
		Map<String, String> paramMap = new HashMap<String, String>();
		List<String> fieldList = new ArrayList<String>();
		if(resultMap != null) {
			
			// 데이터셋 상세 페이지에 기존 요청변수 항목 표시를 위해 데이터 리스트틑 생성
			Iterator<String> keys = resultMap.keySet().iterator();
			while (keys.hasNext()) {
				String strKey = keys.next();
				String strValue = resultMap.get(strKey).toString();
				if(strKey.equals("udtApiParam")) {
					Properties props = new Properties(); // Properties를 이용해 {키=값,키=값..}형태의 문자열을 쉽게 파싱
					props.load(new StringReader(strValue.substring(1, strValue.length() - 1).replace(", ", "\n")));       
					for (Map.Entry<Object, Object> e : props.entrySet()) {
						paramMap.put((String)e.getKey(), (String)e.getValue());
					}
				}
			}
			
			// 저장필드 선택 리스트 생성 udt_api_field_list
			String strFieldList = resultMap.get("udtApiFieldList").toString();
			// 문자열 쉼표로 리스트화 및 앞뒤 공백 제거(trim)
			fieldList = Stream.of(strFieldList.split(","))
					.map(String::trim)
					.collect(Collectors.toList());
		}
		
		model.addAttribute("paramMap", paramMap);
		model.addAttribute("fieldList", fieldList);
		model.addAttribute("resultMap",resultMap);
		
		return "udt/schedule/ajax/jobDetailView";
	}
	
	@RequestMapping(value="/udt/schedule/selectOneRdfMetaCommon.do")
	public String selectOneRdfMetaCommon(@RequestBody HashMap<String, Object> param, Model model) throws IOException{
				
		EgovMap resultMap = udtScheduleService.selectOneRdfMetaCommon(param);	
		
		String[] vcardHasemailArr = ((String)resultMap.get("vcardHasemail")).split("@");
		String[] foatMboxArr = ((String)resultMap.get("foafMbox")).split("@");
		
		resultMap.put("vcardHasemail1", vcardHasemailArr[0]);
		resultMap.put("vcardHasemail2", vcardHasemailArr[1]);
		resultMap.put("foafMbox1", foatMboxArr[0]);
		resultMap.put("foafMbox2", foatMboxArr[1]);
		model.addAttribute("resultMap",resultMap);
		return "udt/schedule/ajax/jobCommonMetaList";
	}
	
	@RequestMapping(value="/udt/schedule/insertNewRdfMetaCommon.do")
	public String insertNewRdfMetaCommon(@RequestBody HashMap<String, Object> param, Model model) throws IOException{
				
		int result = udtScheduleService.insertNewRdfMetaCommon(param);
		
		if(result>0)model.addAttribute("result","S");
		else model.addAttribute("result","F");
		return "jsonView";
	}
	
	@RequestMapping(value="/udt/schedule/insertNewRdfMetaDataset.do")
	public String insertNewRdfMetaDataset(@RequestBody HashMap<String, Object> param, Model model) throws IOException{
				
		int result = udtScheduleService.insertNewRdfMetaDataset(param);
		
		if(result>0)model.addAttribute("result","S");
		else model.addAttribute("result","F");
		return "jsonView";
	}
	
	
	@SuppressWarnings("unchecked")
	@RequestMapping(value="/udt/schedule/reqControllJobApi.do")
	public String reqControllJobApi(@RequestBody HashMap<String, Object> param, Model model) throws IOException, NoSuchAlgorithmException, NoSuchPaddingException{
		
		String apiNm = (String)param.get("apiNm");
		Map<String,Object> apiParam = (HashMap<String,Object>)param.get("apiParams");
		try {
			String apiEndpoint = property.getProperty("Batch.Apisvr.Endpoint");
			apiEndpoint+="/"+apiNm+"/"+(String)apiParam.get("jobNmEn"); //jobNm -> jobNmEn (저장소 테이블명과 동일)
			
			String jsonString = udtRestApiUtil.callPostApi(apiEndpoint, null, null, apiEndpoint+"호출");
			
			JSONObject result = udtRestApiUtil.parsingJsonObjects(jsonString);
			String resultCode = (String)result.get("resultStatusCode");
			
			if(resultCode.equals("200")) {
				model.addAttribute("result","S");
			}else {
				model.addAttribute("result","F");
			}
		}catch(IOException e) {
			LOGGER.error("에러발생");
			model.addAttribute("result","F");
		}catch(NullPointerException e) {
			LOGGER.error("에러발생");
			model.addAttribute("result","F");
		}
		return "jsonView";
	}
	
	
	@RequestMapping(value="/udt/schedule/selectOneJobLinkConfig.do")
	public String selectOneJobLinkConfig(@RequestBody HashMap<String, Object> param, Model model) throws IOException{
				
		EgovMap resultMap = udtScheduleService.selectOneJobLinkConfig(param);	
		model.addAttribute("resultMap",resultMap);
		return "jsonView";
	}
	
	@RequestMapping(value="/udt/schedule/updateJobLinkConfigByJobId.do")
	public String updateJobLinkConfigByJobId(@RequestBody HashMap<String, Object> param, Model model) throws IOException, NoSuchAlgorithmException, NoSuchPaddingException {
				
		int rsult = udtScheduleService.updateJobLinkConfigByJobId(param);
		
		if(rsult>0) {
			//배치 api 스케줄정보 변경 api 호출
			String apiEndpoint = property.getProperty("Batch.Apisvr.Endpoint");
			apiEndpoint+="/update/"+(String)param.get("jobNmEn");
			
			String jsonString = udtRestApiUtil.callPostApi(apiEndpoint, null, null, apiEndpoint+"호출");
			
			JSONObject result = udtRestApiUtil.parsingJsonObjects(jsonString);
			String resultCode = (String)result.get("resultStatusCod"
					+ "e");
			if(resultCode.equals("200")) {
				model.addAttribute("result","success");
			}else {
				model.addAttribute("result","failed");
			}
			
		}else {
			model.addAttribute("result","failed");
		}
		return "jsonView";
	}
	
	/**
	 * 신규 데이터셋 생성
	 * @param param
	 * @param model
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/udt/schedule/insertNewDataset.do")
	public String insertNewDataset(@RequestBody HashMap<String, Object> param, Authentication authentication, Model model) throws IOException{
				
		String loginUserName = String.valueOf(authentication.getPrincipal()); // 데이터셋 등록 사용자명
		param.put("userId", loginUserName);
		
		int result = udtScheduleService.insertNewDataset(param);

		if(result>0)model.addAttribute("result","S");
		else model.addAttribute("result","F");
		
		return "jsonView";
	}
	
	/**
	 * 데이터셋 삭제
	 * @param param
	 * @param model
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value="/udt/schedule/deleteDataset.do")
	public String deleteDataset(@RequestBody HashMap<String, Object> param, Model model) throws IOException {
		
		int result = udtScheduleService.deleteDataset(param);
		
		if(result>0)model.addAttribute("result","S");
		else model.addAttribute("result","F");
		
		return "jsonView";
	}
	
	/**
	 * 데이터셋 수정 (수정기능 사용안함)
	 * @param param
	 * @param model
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value = "/udt/schedule/updateDataset.do")
	public String updateDataset(@RequestBody HashMap<String, Object> param, Authentication authentication, Model model) throws IOException {
		
		String loginUserName = String.valueOf(authentication.getPrincipal()); //업데이트 사용자명
		param.put("userId", loginUserName);
		
		//int result = udtScheduleService.updateDataset(param);
		
		//if(result>0)model.addAttribute("result","S");
		//else model.addAttribute("result","F");
		
		return "jsonView";
	}
	
	/**
	 * 데이터셋의 테이블 리스트를 조회
	 * @param param
	 * @param model
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value="/udt/schedule/selectJobTblNmList.do")
	public String selectJobTblNmList(@RequestBody HashMap<String, Object> param, Model model) throws Exception{
		
		List<EgovMap> resultMap = udtScheduleService.selectJobSaveTblNmList(param);	
		
		model.addAttribute("result", resultMap);
		
		return "jsonView";
	}
	
}