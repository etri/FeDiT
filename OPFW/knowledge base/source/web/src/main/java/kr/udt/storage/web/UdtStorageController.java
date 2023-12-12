package kr.udt.storage.web;


import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.support.JdbcUtils;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import egovframework.rte.psl.dataaccess.util.EgovMap;
import egovframework.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import kr.udt.storage.service.UdtStorageService;

@Controller
public class UdtStorageController {
	
	@Autowired
	private UdtStorageService udtStorageService;
	
	
	@RequestMapping(value="/udt/storage/main.do")
	public String fileMainPage(ModelMap model) throws IOException{
		model.addAttribute("menuNo", "menu-li-3");
		model.addAttribute("datasetTbList", udtStorageService.selectDatasetTbList()); // 데이터셋 저장 테이블 리스트 검색 결과
		return "udt/storage/storageManage";
	}
	
	/**
	 * 데이터셋 테이블명으로 테이블 데이터 조회
	 * @param param
	 * @param model
	 * @return
	 * @throws IOException
	 */
	@RequestMapping(value = "/udt/storage/selectStorageTblDataByTbNm.do", method = RequestMethod.POST)
	public String selectStorageTblDataByTbNm(@RequestBody HashMap<String, Object> param, Model model) throws IOException {
		
		/** pageing setting */
		param.put("pageUnit", 10);
		param.put("pageSize", 10);
		PaginationInfo paginationInfo = new PaginationInfo();
		paginationInfo.setCurrentPageNo((Integer)param.get("pageIndex"));
		paginationInfo.setRecordCountPerPage((Integer)param.get("pageUnit"));
		paginationInfo.setPageSize((Integer)param.get("pageSize"));

		param.put("firstIndex", paginationInfo.getFirstRecordIndex());
		param.put("lastIndex", paginationInfo.getLastRecordIndex());
		param.put("recordCountPerPage", paginationInfo.getRecordCountPerPage());
		
		// 데이터셋 정보의 필드 리스트를 조회
		EgovMap selectFieldList = udtStorageService.selectOneJobLinkConfig(param);

		model.addAttribute("fieldList", selectFieldList.get("udtApiFieldList"));
		
		//camelCase 적용 (조회 결과와 맞춤)
		String[] udtApiFieldList = selectFieldList.get("udtApiFieldList").toString().split(",");
		List<String> fieldList_camelCase = new ArrayList<String>();
		for(String field : udtApiFieldList) {
			fieldList_camelCase.add(JdbcUtils.convertUnderscoreNameToPropertyName(field));
		}
		model.addAttribute("fieldList_camelCase", fieldList_camelCase);
		
		// 대상 테이블의 데이터 조회
		List<EgovMap> resultDataMapList = udtStorageService.selectStorageTblDataByTbNm(param);	
		
		// 해당 데이터셋의 저장 성공 횟수를 가져옴
		int saveCnt = udtStorageService.selectSaveCountBySaveTbNm(param);
		
		String updtTimeStemp = "";
		String startUpdtDt = "";
		String endUpdtDt = "";
		int totCount= 0;
		if(resultDataMapList.size()>0) {
			updtTimeStemp = resultDataMapList.get(0).get("updtTimeStemp").toString();
			totCount=(Integer)resultDataMapList.get(0).get("totcnt");
			startUpdtDt = resultDataMapList.get(0).get("startUpdtDt").toString();
			endUpdtDt = resultDataMapList.get(0).get("endUpdtDt").toString();
		}
		
		paginationInfo.setTotalRecordCount(totCount);
		
		model.addAttribute("totCount", totCount);
		model.addAttribute("saveCnt", saveCnt);
		model.addAttribute("updtTimeStemp", updtTimeStemp);
		model.addAttribute("startUpdtDt", startUpdtDt);
		model.addAttribute("endUpdtDt", endUpdtDt);
		model.addAttribute("resultDataMapList", resultDataMapList);
		model.addAttribute("paginationInfo", paginationInfo);
		
		return "udt/storage/ajax/storageTblDataList";
	}
	
	
	
	
	
	
}
