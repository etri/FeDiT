package net.jcms.framework.menu.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.model.LoginLogSearch;
import net.jcms.framework.security.service.LoginLogService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@Controller
@Slf4j
public class CmsMenuStatsController extends BaseController {

	@Resource (name="loginLogService")
	private LoginLogService loginLogService;
	
	@RequestMapping (value="/system/siteStats/list.mng", method=RequestMethod.GET)
	public String siteList(Model model){
		return "system/stats/siteStatsList";
	}
	
	@RequestMapping (value="/system/siteStats/list.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> siteList(HttpServletRequest request, LoginLogSearch loginLogSearch){
		Map<String , Object> result = new HashMap<String, Object>();
		result.put("data", loginLogService.countByDate(loginLogSearch));
		result.put("result", "success");
		return result;
	}
}
