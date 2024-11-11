package net.jcms.framework.error.web;

import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.service.UserRoleService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

@Controller
public class ErrorController extends BaseController {
	
	@Resource (name="userRoleService")
	private UserRoleService userRoleService;
	
	@RequestMapping("/error/error.mng")
	public String error(@RequestParam ("errorCode") String errorCode, ModelMap modelMap,HttpServletRequest request) {
		modelMap.addAttribute ("errorCode", errorCode);
		
		
		return "error/error";
	}
}
