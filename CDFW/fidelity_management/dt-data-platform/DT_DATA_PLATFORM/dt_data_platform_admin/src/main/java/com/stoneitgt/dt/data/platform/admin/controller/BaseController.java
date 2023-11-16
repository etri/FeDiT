package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.component.AuthenticationFacade;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.service.CodeService;
import com.stoneitgt.dt.data.platform.admin.service.ErrorService;
import com.stoneitgt.dt.data.platform.admin.service.FilesService;
//import com.stoneitgt.dt.data.platform.admin.service.CodeService;
//import com.stoneitgt.dt.data.platform.admin.service.FilesService;
import com.stoneitgt.dt.data.platform.admin.service.MenuService;
import com.stoneitgt.dt.data.platform.component.MessageByLocaleService;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.ErrorLog;
import com.stoneitgt.dt.data.platform.domain.User;
import com.stoneitgt.dt.data.platform.util.StringUtil;

import lombok.extern.slf4j.Slf4j;

/**
 * 기본 컨트롤러.
 *
 * @author yh.kim
 */
@Slf4j
public class BaseController {

	@Autowired
	public AuthenticationFacade authenticationFacade;

	@Autowired
	public SystemProperties systemProperties;

	@Autowired
	public MessageByLocaleService messageByLocaleService;

	@Autowired
	private CodeService codeService;

	@Autowired
	private MenuService menuService;

	@Autowired
	private FilesService filesService;

	@Autowired
	public ErrorService errorService;
	
	/**
	 * 사용자 IP 정보를 가져온다.
	 *
	 * @param request
	 * @return
	 */
	public String getClientIP(HttpServletRequest request) {
		String ip = request.getHeader("X-FORWARDED-FOR");
		if (ip == null) {
			ip = request.getRemoteAddr();
		}
		return ip;
	}

	public Map<String, Object> getBreadcrumb(String menuCode) {
		return menuService.getBreadcrumb(menuCode);
	}

	public List<Map<String, Object>> getCodeList(String groupCode) {
		return getCodeList(groupCode, true);
	}

	
	

	public List<Map<String, Object>> getCodeList(String groupCode, boolean addEmpty) {
		List<Map<String, Object>> list = codeService.getCodeList(groupCode);
		if (addEmpty) {
			Map<String, Object> map = new HashMap<String, Object>();
			map.put("dtl_cd", "");
			map.put("dtl_cd_nm", "선택하세요");
			map.put("ref_value", "");
			list.add(0, map);
		}
		return list;
	}
	
	public List<Map<String, Object>> getCodeList2(String groupCode, boolean addEmpty) {
		List<Map<String, Object>> list = codeService.getCodeList2(groupCode);
		if (addEmpty) {
			Map<String, Object> map = new HashMap<String, Object>();
			map.put("dtl_cd", "");
			map.put("dtl_cd_nm", "선택하세요");
			map.put("ref_value", "");
			list.add(0, map);
		}
		return list;
	}


	public int getSessionLoginUserSeq(HttpServletRequest request) {
		if (request.getSession() != null) {
			User user = (User) request.getSession().getAttribute(GlobalConstant.SESSION_ADMIN_KEY);
			return user.getUserSeq();
		} else {
			return -1;
		}
	}

	public String getBaseParameterString(BaseParameter params) {
		List<String> result = new ArrayList<String>();
		result.add("page=" + params.getPage());
		result.add("size=" + params.getSize());
		result.add("year=" + StringUtil.defaultString(params.getYear()));
		result.add("field=" + StringUtil.defaultString(params.getField()));
		try {
			result.add("keyword="
					+ URLEncoder.encode(StringUtil.defaultString(params.getKeyword()), StandardCharsets.UTF_8.name()));
		} catch (UnsupportedEncodingException e) {
			log.error("", e);
		}
		result.add("sortName=" + StringUtil.defaultString(params.getSortName()));
		result.add("sortType=" + StringUtil.defaultString(params.getSortType()));
		result.add("menuCd=" + StringUtil.defaultString(params.getMenuCd()));
		return String.join("&", result);
	}

	/*
	public List<Map<String, Object>> getFileList(String refType, int refSeq) {
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("ref_type", refType.toUpperCase());
		params.put("ref_seq", refSeq);
		return filesService.getFileList(params);
	}
	 */
	public List<String> getTimeHourList() {
		return getTimeList(23);
	}

	public List<String> getTimeHourList(int start, int end) {
		return getTimeList(start, end);
	}

	public List<String> getTimeMinList() {
		return getTimeList(59);
	}

	public List<String> getTimeMinList(int interval) {
		return getTimeList(0, 59, interval, true);
	}

	public List<String> getTimeList(int end) {
		return getTimeList(0, end, 0, true);
	}

	public List<String> getTimeList(int start, int end) {
		return getTimeList(start, end, 0, true);
	}

	public List<String> getTimeList(int start, int end, int interval, boolean addEmpty) {
		List<String> list = new ArrayList<String>();

		if (addEmpty) {
			list.add("");
		}
		for (int i = start; i < end + 1; i++) {
			if (interval > 0) {
				if (i % interval == 0) {
					list.add(StringUtil.leftPad("" + i, 2, "0"));
				}
			} else {
				list.add(StringUtil.leftPad("" + i, 2, "0"));
			}
		}
		return list;
	}
	
	//세션에 담긴 url 권한으로 각 컨트롤러 url과 매칭시켜 권한 체크
	public String getCrudAuth(String url) {
		String crudAuth = null;
		
		for(int i =0; i < WebConfig.getSessionInfo().getUseAuthMenu().size(); i++) {
			if (url.equals(WebConfig.getSessionInfo().getUseAuthMenu().get(i).get("page_url"))) {
				crudAuth = WebConfig.getSessionInfo().getUseAuthMenu().get(i).get("rwa_auth").toString();
				
				break;
			}
		}
		
		return crudAuth;
	}

	//세션에 담긴 url 권한으로 각 컨트롤러 url과 매칭시켜 권한 체크
	public String getMenuSrno(String url) {
		String menuSrno = null;
		
		for(int i =0; i < WebConfig.getSessionInfo().getUseAuthMenu().size(); i++) {
			if (WebConfig.getSessionInfo().getUseAuthMenu().get(i).get("page_url").equals(url)) {
				menuSrno = WebConfig.getSessionInfo().getUseAuthMenu().get(i).get("srno").toString();
				break;
			}
		}
		
		return menuSrno;
	}
	
	public List<Map<String, Object>> getFileList(String refType, int refSrno) {
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("refTp", refType.toUpperCase());
		params.put("refSeq", refSrno);
		return filesService.getFileList(params);
	}
	
	public List<Map<String, Object>> getDtFileList(String refType, int refSrno) {
		Map<String, Object> params = new HashMap<String, Object>();
		params.put("refTp", refType.toUpperCase());
		params.put("refSeq", refSrno);
		return filesService.getDtFileList(params);
	}
	
	public void insertErrorLog(int modelSeq, int augmentSeq, String errTp, String errLct, String errCd, String errNm, String errCn, int userSeq, String userIp) {
		ErrorLog errLog = new ErrorLog();
		errLog.setModelSeq(modelSeq);
		errLog.setAugmentSeq(augmentSeq);
		errLog.setErrTp(errTp);
		errLog.setErrLct(errLct);
		errLog.setErrCd(errCd);
		errLog.setErrNm(errNm);
		errLog.setErrCn(errCn);
		errLog.setLoginUserSeq(userSeq);	
		errLog.setLoginUserIp(userIp);
		
		errorService.saveErrorLog(errLog);
	}
	
}
