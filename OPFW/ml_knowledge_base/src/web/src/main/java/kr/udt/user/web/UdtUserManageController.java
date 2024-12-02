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
package kr.udt.user.web;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;

import javax.annotation.Resource;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import egovframework.rte.fdl.property.EgovPropertyService;
import egovframework.rte.psl.dataaccess.util.EgovMap;
import egovframework.rte.ptl.mvc.tags.ui.pagination.PaginationInfo;
import kr.udt.user.service.UdtUserManageService;

@Controller
public class UdtUserManageController {

	/** EgovPropertyService */
	@Resource(name = "propertiesService")
	protected EgovPropertyService propertiesService;

	@Resource(name = "udtUserManageService")
	private UdtUserManageService udtUserManageService;

	
	@RequestMapping(value="/udt/user/main.do")
	public String userMainPage(ModelMap model) throws IOException{
		model.addAttribute("menuNo", "menu-li-4");
		//model.addAttribute("srcDataTbList", udtFileService.selectSrcTableInfo());
		return "udt/user/userManage";
	}
	
	@RequestMapping(value = "/udt/user/selectUdtWebUserList.do", method = RequestMethod.POST)
	public String selectUdtWebUserList(@RequestBody HashMap<String, Object> param, Model model) throws IOException {
		
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
		
		List<EgovMap> resultMapList = udtUserManageService.selectUdtWebUserList(param);		
		model.addAttribute("resultList",resultMapList);
		
		int totCount = 0;
		if(resultMapList.size()>0) {
			totCount=(Integer)resultMapList.get(0).get("totcnt");
		}
		
		paginationInfo.setTotalRecordCount(totCount);
		model.addAttribute("paginationInfo", paginationInfo);
		
		
		return "udt/user/ajax/userList";
	}

	@RequestMapping(value="/udt/user/doUserIdCheck.do")
	public String doUserIdCheck(@RequestBody HashMap<String, Object> param, ModelMap model) throws IOException{
		model.addAttribute("result", udtUserManageService.doUserIdCheck((String)param.get("userId")));
		//model.addAttribute("srcDataTbList", udtFileService.selectSrcTableInfo());
		return "jsonView";
	}
	
	@RequestMapping(value="/udt/user/insertUdtWebUser.do")
	public String insertUdtWebUser(@RequestBody HashMap<String, Object> param, ModelMap model) throws IOException{
		model.addAttribute("result", udtUserManageService.insertUdtWebUser(param));
		//model.addAttribute("srcDataTbList", udtFileService.selectSrcTableInfo());
		return "jsonView";
	}
	
	@RequestMapping(value="/udt/user/updateUdtWebUser.do")
	public String updateUdtWebUser(@RequestBody HashMap<String, Object> param, ModelMap model) throws IOException{
		model.addAttribute("result", udtUserManageService.updateUdtWebUser(param));
		//model.addAttribute("srcDataTbList", udtFileService.selectSrcTableInfo());
		return "jsonView";
	}
	
	@RequestMapping(value="/udt/user/selectOneUdtWebUser.do")
	public String selectOneUdtWebUser(@RequestBody HashMap<String, Object> param, ModelMap model) throws IOException{
		model.addAttribute("result", udtUserManageService.selectOneUdtWebUser(param));
		//model.addAttribute("srcDataTbList", udtFileService.selectSrcTableInfo());
		return "jsonView";
	}
	
	
}
