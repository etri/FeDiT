package net.jcms.framework.security.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.model.UserRole;
import net.jcms.framework.security.service.RoleService;
import net.jcms.framework.security.service.UserRoleService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@Slf4j
public class UserRoleController extends BaseController {

	@Resource(name="userRoleService")
	private UserRoleService userRoleService;
	
	@Resource(name="roleService")
	private RoleService roleService;
	
	
	@RequestMapping(value = "/system/user/userRole_list.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> list(HttpServletRequest request, UserRole userRole) {
		Map<String, Object> result = new HashMap<String, Object>();
		String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
		String sortOder = request.getParameter("order[0][dir]");
		userRole.setSort(sort);
		userRole.setSortOrd(sortOder);
		userRole.setPagingYn(true);

		HttpSession session = request.getSession();
		String userRoleStr = (session.getAttribute("userRole")).toString();

		int totalCount = userRoleService.count(userRole);
		result.put("recordsTotal", totalCount);
		result.put("recordsFiltered", totalCount);

		List<UserRole> list = userRoleService.selectRoleList(userRole);
		// TODO_bocos
		// if(!userRoleStr.equals(CodeValue.ROLE_AUTH.ROLE_SYSTEM.toString())) {
		if(!userRoleStr.equals("ROLE_SYSTEM")) {
			list.removeIf(x -> x.getRoleAuth().equals("ROLE_SYSTEM"));
		}

		result.put("data", list);

		result.put("result", "success");

		return result;
	}
	
	@RequestMapping(value="/system/user/userRole_insert.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> insert(HttpServletRequest request, UserRole userRole){
		Map<String, Object> result = new HashMap<String, Object>();
		userRoleService.insert(userRole);
		//userRoleService.initJson();
		result.put("result", "success");

		return result;
	}
	
		
	@RequestMapping(value="/system/user/userRole_update.mng", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> update(HttpServletRequest request, UserRole userRole){
		Map<String, Object> result = new HashMap<String, Object>();
		userRoleService.update(userRole);

		//userRoleService.initJson();
		result.put("result", "success");

		return result;
	}
	
	@RequestMapping(value="/system/userRole/delete.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> delete(HttpServletRequest request, UserRole userRole){
		Map<String, Object> result = new HashMap<String, Object>();
		userRoleService.delete(userRole);

		//userRoleService.initJson();
		result.put("result", "success");

		return result;
	}

}
