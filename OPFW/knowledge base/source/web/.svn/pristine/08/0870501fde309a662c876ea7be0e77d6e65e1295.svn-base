/*
 * Copyright 2008-2009 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package kr.udt.data.web;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import egovframework.rte.fdl.property.EgovPropertyService;
import egovframework.rte.psl.dataaccess.util.EgovMap;
import egovframework.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import kr.udt.data.service.UdtDataWebService;

@Controller
public class UdtDataWebController {

	/** EgovPropertyService */
	@Resource(name = "propertiesService")
	protected EgovPropertyService propertiesService;

	@Resource(name = "udtDataWebService")
	private UdtDataWebService udtDataWebService;

	@RequestMapping(value = "/udt/data/selectJobRunHstStatis.do", method = RequestMethod.POST)
	public String selectJobRunHstStatis(@RequestBody HashMap<String, Object> param, Model model) throws IOException {
		
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
		
		List<EgovMap> resultMapList = udtDataWebService.selectJobRunHstStatis(param);		
		model.addAttribute("resultList",resultMapList);
		
		int totCount = 0;
		if(resultMapList.size()>0) {
			totCount=(Integer)resultMapList.get(0).get("totcnt");
			model.addAttribute("lastUpdtDt", (String)resultMapList.get(0).get("lastUpdtDt"));
		}
		
		paginationInfo.setTotalRecordCount(totCount);
		model.addAttribute("paginationInfo", paginationInfo);
		
		
		return "udt/data/ajax/jobRunHstStatisList";
	}
	
	@RequestMapping(value = "/udt/data/selectJobRunDetailHstPop.do", method = RequestMethod.GET)
	public String selectJobRunDetailHstPop(HttpServletRequest request,HttpServletResponse response,ModelMap model) throws IOException {

		String execId = request.getParameter("execId");
		if(execId==null) throw new NullPointerException("execId(잡 실행번호)는 필수 입력값입니다.");
		Map<String,Object> param = new HashMap<String,Object>();
		param.put("execId", execId);
		
		List<EgovMap> resultMapList = udtDataWebService.selectJobRunHstDetailByExecId(param);		
		model.addAttribute("resultList",resultMapList);
		model.addAttribute("jobRunHstMap",resultMapList.get(0));
		 
		
		return "udt/data/pop/jobRunDetailHstPopUp";
	}
	
	
	
	@RequestMapping(value = "/udt/data/selectJobRunHstList.do", method = RequestMethod.POST)
	public String selectJobRunHstList(@RequestBody HashMap<String, Object> param, Model model) throws IOException {
		
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
		
		List<EgovMap> resultMapList = udtDataWebService.selectJobRunHstList(param);		
		model.addAttribute("resultList",resultMapList);
		
		int totCount = 0;
		if(resultMapList.size()>0) {
			totCount=(Integer)resultMapList.get(0).get("totcnt");
		}
		
		paginationInfo.setTotalRecordCount(totCount);
		model.addAttribute("paginationInfo", paginationInfo);
		
		
		return "udt/data/ajax/jobRunHstList";
	}
	
	
	@RequestMapping(value = "/udt/data/selectJobRunHstStatisIndicators.do", method = RequestMethod.POST)
	public String selectJobRunHstStatisIndicators(@RequestBody HashMap<String, Object> param, Model model) throws IOException {
		
		EgovMap returnMap = udtDataWebService.selectJobRunHstStatisIndicators(param);		
		model.addAttribute("returnMap", returnMap);
		
		return "jsonView";
	}
	
	@RequestMapping(value = "/udt/data/selectJobMntlyAccumulateData.do", method = RequestMethod.POST)
	public String selectJobMntlyAccumulateData(@RequestBody HashMap<String, Object> param, Model model) throws IOException {
		
		List<EgovMap> resultMapList = udtDataWebService.selectJobMntlyAccumulateData(param);		
		model.addAttribute("resultList",resultMapList);
		
		return "jsonView";
	}
	
	@RequestMapping(value = "/udt/data/callRetoreJobRunHstStatis.do", method = RequestMethod.POST)
	public String callRetoreJobRunHstStatis(@RequestBody HashMap<String, Object> param, Model model) throws IOException {
		udtDataWebService.callRetoreJobRunHstStatis(param);		
		model.addAttribute("result","S");
		
		return "jsonView";
	}	
}
