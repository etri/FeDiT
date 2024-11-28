package net.jcms.framework.menu.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.menu.model.Menu;
import net.jcms.framework.menu.model.MenuSearch;
import net.jcms.framework.menu.service.MenuService;
import net.jcms.framework.pgm.model.PgmSearch;
import net.jcms.framework.pgm.service.PgmService;
import net.jcms.framework.util.StrUtil;
import net.jw.twin.repository.global.CodeValue;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@Slf4j
public class MenuController extends BaseController {

	@Resource (name="pgmService")
	private PgmService pgmService;

	@Resource (name="menuService")
	private MenuService menuService;

	@RequestMapping(value="/{authority}/repository/{page}/pageMain.mng", method= RequestMethod.GET)
	public String main(HttpServletRequest request
			, Model model
			, @PathVariable("authority") String authority
			, @PathVariable("page") String page){
		return pageMain(request, model, authority, page, null);
	}

	private String pageMain(HttpServletRequest request
			, Model model
			, String authority
			, String page
			, String searchUserType){
		HttpSession session = request.getSession();
		if(request.getParameter("currentMenuId") != null) {
			Long currentMenuId = Long.parseLong(request.getParameter("currentMenuId"));
			session.setAttribute("currentMenuId", currentMenuId);
		}

		model.addAttribute("searchUserType", searchUserType);

		return "system/repository/"+page;
	}

	@RequestMapping(value="/system/{page}/roleManagerMain.mng", method= RequestMethod.GET)
	public String operMain(HttpServletRequest request
			, Model model
			, @PathVariable("page") String page){
		String searchUserType = CodeValue.ROLE_AUTH.ROLE_MANAGER.toString();
		return pageMain(request, model, "system", page, searchUserType);
	}

	@RequestMapping(value="/system/cim/{page}/roleUserMain.mng", method= RequestMethod.GET)
	public String memberMain(HttpServletRequest request
			, Model model
			, @PathVariable("page") String page){
		String searchUserType = CodeValue.ROLE_AUTH.ROLE_USER.toString();
		return pageMain(request, model, "system", page, searchUserType);
	}

	@RequestMapping (value="/system/menu/list.mng", method=RequestMethod.GET)
	public String list(Model model) {
		//model.addAttribute("pgmList", pgmService.selectJson());
		PgmSearch pgmSearch = new PgmSearch();
		model.addAttribute("pgmList", pgmService.selectList(pgmSearch));
		return "system/menu/list";
	}

	@RequestMapping (value="/system/menu/list.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> list(HttpServletRequest request, MenuSearch menuSearch) {
		Map<String, Object> result = new HashMap<String, Object>();
		//result.put("data", menuService.selectJson());
		result.put("data", menuService.selectList(menuSearch));
		result.put("result", "success");

		return result;
	}

	@RequestMapping(value = "/system/role/jstreeList.json")
	@ResponseBody
	public Map<String, Object> jstreeList(HttpServletRequest request, String roleAuth) {
		Map<String, Object> result = new HashMap<String, Object>();
		List<Map<String, Object>> data = new ArrayList<Map<String, Object>>();
		//List<Menu> menuList = menuService.selectJson();
		MenuSearch menuSearch = new MenuSearch();
		List<Menu> menuList = menuService.selectList(menuSearch);

		for (Menu menu : menuList) {
			data = setChildList("#", menu, data);
		}

		result.put("data", data);
		result.put("result", "success");

		return result;
	}

	public List<Map<String, Object>> setChildList(String parentId, Menu menu, List<Map<String, Object>> data) {
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("parent", parentId);
		if(menu.childList != null) {
			for(Menu childMenu : menu.childList) {
				data = setChildList(String.valueOf(menu.getMenuId()), childMenu, data);
			}
		}
		map.put("id", menu.getMenuId());

		Map<String, Object> attr = new HashMap<String, Object>();
		attr.put("data-only-system", menu.getOnlySystem());
		map.put("li_attr", attr);
		map.put("text", menu.getMenuNm());
		Map<String, Object> status = new HashMap<String, Object>();
		status.put("opened", true);
//		status.put("checkbox_disabled", true);
//		status.put("disabled", true);
		map.put("state", status);

		data.add(map);
		return data;
	}

	@RequestMapping (value="/system/menu/view.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> detail(HttpServletRequest request, MenuSearch menuSearch) {
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("data", menuService.select(menuSearch));
		result.put("result", "success");

		return result;
	}

	@RequestMapping (value="/system/menu/insert.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> insert(HttpServletRequest request, Menu menu) {
		Map<String, Object> result = new HashMap<String, Object>();
		//메뉴순서를 마지막 순서로 지정
		MenuSearch menuSearch = new MenuSearch();
		menuSearch.setUpperMenuId(menu.getUpperMenuId());
		menu.setMenuOrd(menuService.selectMaxMenuOrder(menuSearch));

		menu.setRegId(getUserId());
		menuService.insert(menu);

		//menuService.initJson();
		menuService.initRoleMenuList();
		result.put("result", "success");

		return result;
	}

	@RequestMapping (value="/system/menu/update.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> update(HttpServletRequest request, Menu menu) {
		Map<String, Object> result = new HashMap<String, Object>();
		menu.setUpdId(getUserId());
		menuService.update(menu);

		//menuService.initJson();
		menuService.initRoleMenuList();
		result.put("result", "success");

		return result;
	}

	@RequestMapping (value="/system/menu/delete.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> delete(HttpServletRequest request, Menu menu) {
		Map<String, Object> result = new HashMap<String, Object>();
		MenuSearch menuSearch = new MenuSearch();
		menuSearch.setUpperMenuId(menu.getMenuId());
		int count = menuService.count(menuSearch);
		if (count > 0) {
			result.put("message", "하위 메뉴가 존재하지 않을 경우에만 삭제 가능합니다.");
			result.put("result", "alreay");
		} else {
			menu.setDelId(getUserId());
			menuService.delete(menu);

			//menuService.initJson();
			menuService.initRoleMenuList();
			result.put("result", "success");
		}

		return result;
	}

	@RequestMapping (value="/system/menu/changeOrder.mng", method=RequestMethod.GET)
	public String changeOrder(Model model) {
		return "system/menu/changeOrder";
	}

	@RequestMapping (value={"/system/menu/changeOrder.json"})
	@ResponseBody
	public Map<String, Object> changeOrder(HttpServletRequest request) {
		Map<String, Object> result = new HashMap<String, Object>();
		Map<String, String[]> orderMap = request.getParameterMap();

		Menu menu;
		String parent = null;
		Map<Integer, String> depthMap = new HashMap<Integer, String>();
		for (String key : orderMap.keySet()) {
			String value = orderMap.get(key)[0];
			parent = value;

			int cnt = 0;
			for (int i = 0; i < key.length(); i++) {
				if (key.charAt(i) == '[') cnt++;
			}

			String order = null;
			int startIndex = 0, endIndex = 0;
			switch (cnt) {
				case 2:
					order = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
					parent = null;

					depthMap = new HashMap<Integer, String>();
					depthMap.put(cnt / 2, value);
					break;
				default:
					for (int i = 0; i < cnt - 1; i++) startIndex = key.indexOf("[", startIndex + 1);
					endIndex = key.indexOf("]", startIndex);
					order = key.substring(startIndex + 1, endIndex);
					startIndex = 0;
					endIndex = 0;

					parent = depthMap.get(cnt / 2 - 1);
					depthMap.put(cnt / 2, value);
					break;
			}

			menu = new Menu();
			menu.setMenuId(Long.parseLong(value));
			if (parent != null) {
				menu.setUpperMenuId(Long.parseLong(parent));
			}
			menu.setMenuOrd(Integer.parseInt(order));
			menuService.updateOrder(menu);
		}

		//menuService.initJson();
		menuService.initRoleMenuList();
		result.put("result", "success");

		return result;
	}

	@RequestMapping (value="/menu/get-info-tag.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> get_info_tag(HttpServletRequest request) {
		Map<String, Object> result = new HashMap<String, Object>();
		Map<String, Object> map = new HashMap<String, Object>();

		HttpSession session = request.getSession();

		Long currentMenuId = null;
		if(request.getParameter("currentMenuId") != null) {
			currentMenuId = Long.parseLong(request.getParameter("currentMenuId"));
			session.setAttribute("currentMenuId", currentMenuId);
		}else {
			currentMenuId = (Long) session.getAttribute("currentMenuId");
		}

		if(currentMenuId != null) {
			List<Menu> menuList = menuService.selectJson();
			Menu currentMenu = null;
			for(Menu menu : menuList) {
				currentMenu = getMenu(menu, currentMenuId);
				if(currentMenu != null) break;
			}
			if(currentMenu != null) {
				map.put("currentMenuIcon", currentMenu.getIcon());
				map.put("currentMenuNm", currentMenu.getMenuNm());
				if(!StrUtil.isEmpty(currentMenu.getMenuDesc())){
					map.put("currentMenuDesc", currentMenu.getMenuDesc());
				}

				List<String> upperMenuNameList = new ArrayList<String>();
				makeUpperCourse(currentMenu, upperMenuNameList);
				map.put("upperMenuNameList",upperMenuNameList);
			}
		}

		result.put("data", map);
		result.put("result", "success");

		return result;
	}

	private Menu getMenu(Menu menu, Long currentMenuId) {
		Menu result = null;
		if(menu.getMenuId().compareTo(currentMenuId) == 0) {
			return menu;
		}

		for(Menu childMenu : menu.childList) {
			result = getMenu(childMenu, currentMenuId);
			if(result != null) return result;
		}
		return result;
	}

	private void makeUpperCourse(Menu menu, List<String> upperMenuNameList) {
		if(menu.getUpperMenuId() != null) {
			makeUpperCourse(menu.getUpperMenu(), upperMenuNameList);
		}
		upperMenuNameList.add(menu.getMenuNm());
	}
}
