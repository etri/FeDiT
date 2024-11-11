package net.jcms.framework.cd.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.cd.model.Cd;
import net.jcms.framework.cd.model.CdDtl;
import net.jcms.framework.cd.service.CdDtlService;
import net.jcms.framework.cd.service.CdService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@Controller
@Slf4j
public class CdController extends BaseController {

	@Resource (name="cdService")
	private CdService cdService;
	
	@Resource (name="cdDtlService")
	private CdDtlService cdDtlService;
	
	@RequestMapping(value="/system/cd/list.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> list(HttpServletRequest request, Cd cd) {
		Map<String, Object> result = new HashMap<String, Object>();
		String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
		String sortOder = request.getParameter("order[0][dir]");
		cd.setSort(sort);
		cd.setSortOrd(sortOder);
		cd.setPagingYn(true);

		String recSt = request.getParameter("search[value]");
		if (recSt.equals("사용")) {
			cd.setUseSt("Y");
		} else if (recSt.equals("사용안함")) {
			cd.setUseSt("N");
		}

		int totalCount = cdService.count(cd);
		result.put("recordsTotal", totalCount);
		result.put("recordsFiltered", totalCount);

		result.put("data", cdService.selectList(cd));

		result.put("result", "success");

		return result;
	}
	
	@RequestMapping(value="/system/cd/select.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> select(HttpServletRequest request, Cd cd) {
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("data", cdService.select(cd));
		result.put("result", "success");

		return result;
	}

	@RequestMapping(value="/system/cd/insert.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> insert(HttpServletRequest request, Cd cd) {
		Map<String, Object> result = new HashMap<String, Object>();
		if (cdService.existCount(cd) > 0) {//코드분류아이디 또는 코드분류이름이 중복된 경우
			result.put("result", "duplicate");
			result.put("message", "이미 등록된 코드 입니다. 다시 등록하여 주십시오.");
		} else {
			cd.setRegId(getUserId());
			cdService.insert(cd);

			//cdDtlService.initJson();
			result.put("result", "success");
		}

		return result;
	}
	
	//수정
	@RequestMapping(value="/system/cd/update.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> update(HttpServletRequest request, Cd cd) {
		Map<String, Object> result = new HashMap<String, Object>();
		cd.setUpdId(getUserId());
		cdService.update(cd);

		//cdDtlService.initJson();
		result.put("result", "success");

		return result;
	}
	
	//삭제
	@RequestMapping(value="/system/cd/delete.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> delete(HttpServletRequest request, Cd cd) {
		Map<String, Object> result = new HashMap<String, Object>();
		CdDtl cdDtl = new CdDtl();
		cdDtl.setCdId(cd.getCdId());
		int cdDtlCnt = cdDtlService.countChek(cdDtl);
		if (cdDtlCnt > 0) {
			result.put("result", "cntFail");
		} else {
			cd.setDelId(getUserId());
			cdService.delete(cd);
			result.put("result", "success");
		}
		//cdDtlService.initJson();

		return result;
	}
}
