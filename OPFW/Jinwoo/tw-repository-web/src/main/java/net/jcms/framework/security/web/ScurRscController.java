package net.jcms.framework.security.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.model.ScurRsc;
import net.jcms.framework.security.model.ScurRscRole;
import net.jcms.framework.security.service.ScurRscRoleService;
import net.jcms.framework.security.service.ScurRscService;
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
public class ScurRscController extends BaseController {

	@Resource (name="scurRscService")
	private ScurRscService scurRscService;
	
	@Resource (name="scurRscRoleService")
	private ScurRscRoleService scurRscRoleService;
	
	@RequestMapping (value="/system/scurRsc/list.mng", method=RequestMethod.GET)
	public String list() {
		return "system/scur/scurRscList";
	}
	
	@RequestMapping(value="/system/scurRsc/list.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> list(HttpServletRequest request, ScurRsc scurRsc){
		Map<String, Object> result = new HashMap<String, Object>();
		String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
		String sortOder = request.getParameter("order[0][dir]");
		scurRsc.setSort(sort);
		scurRsc.setSortOrd(sortOder);
		scurRsc.setPagingYn(true);

		int totalCount = scurRscService.count(scurRsc);
		result.put("recordsTotal", totalCount);
		result.put("recordsFiltered", totalCount);
		result.put("data", scurRscService.selectList(scurRsc));
		result.put("result", "success");
		return result;
	}
	
	@RequestMapping(value="/system/scurRsc/insert.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> insert(HttpServletRequest request, ScurRsc scurRsc) {
		Map<String, Object> result = new HashMap<String, Object>();
		int count = scurRscService.count(scurRsc);
		if (count > 0) {
			result.put("result", "duplicate");
			result.put("message", "이미 등록된 자원아이디 입니다. 다시 등록하여 주십시오.");
		} else {
			scurRsc.setRscId(request.getParameter("rscId"));
			scurRsc.setRscNm(request.getParameter("rscNm"));
			scurRsc.setRscTp(request.getParameter("rscTp"));
			scurRsc.setRscPatn(request.getParameter("rscPatn"));
			scurRsc.setRegId(getUserId());
			scurRscService.insert(scurRsc);
			result.put("result", "success");
		}

		return result;
	}
	
	@RequestMapping(value="/system/scurRsc/update.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> update(HttpServletRequest request, ScurRsc scurRsc) {
		Map<String, Object> result = new HashMap<String, Object>();
		scurRsc.setUpdId(getUserId());
		scurRscService.update(scurRsc);
		result.put("result", "success");

		return result;
	}	
	
	@RequestMapping (value="/system/scurRsc/delete.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> delete(HttpServletRequest request, ScurRsc scurRsc) {
		Map<String, Object> result = new HashMap<String, Object>();
		ScurRscRole scurRscRole = new ScurRscRole();
		scurRscRole.setRscId(scurRsc.getRscId());
		int count = scurRscRoleService.count(scurRscRole);
		if (count > 0) {
			result.put("result", "duplicate");
			result.put("message", "사용중인 자원아이디 입니다. 롤 관리를 확인하세요.(" + count + ")");
		} else {
			scurRscService.delete(scurRsc);
			result.put("result", "success");
		}
		return result;
	}
	
}