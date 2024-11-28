package net.jcms.framework.pgm.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.menu.service.MenuService;
import net.jcms.framework.pgm.model.Pgm;
import net.jcms.framework.pgm.model.PgmSearch;
import net.jcms.framework.pgm.service.PgmService;
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
public class PgmController extends BaseController {
	
	@Resource (name="menuService")
	private MenuService menuService;
	
	@Resource (name="pgmService")
	private PgmService pgmService;
	
	@RequestMapping (value="/system/pgm/list.mng", method=RequestMethod.GET)
	public String list(Model model) {
		return "system/pgm/list";
	}
	
	@RequestMapping (value="/system/pgm/list.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> list(HttpServletRequest request, PgmSearch pgmSearch) {
		Map<String, Object> result = new HashMap<String, Object>();
		String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
		String sortOder = request.getParameter("order[0][dir]");
		pgmSearch.setSort(sort);
		pgmSearch.setSortOrd(sortOder);
		pgmSearch.setPagingYn(true);

		int totalCount = pgmService.count(pgmSearch);
		result.put("recordsTotal", totalCount);
		result.put("recordsFiltered", totalCount);

		result.put("data", pgmService.selectList(pgmSearch));

		result.put("result", "success");

		return result;
	}
	
	@RequestMapping (value="/system/pgm/view.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> detail(HttpServletRequest request, PgmSearch pgmSearch) {
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("data", pgmService.select(pgmSearch));
		result.put("result", "success");

		return result;
	}
	
	@RequestMapping (value="/system/pgm/insert.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> insert(HttpServletRequest request, Pgm pgm) {
		Map<String, Object> result = new HashMap<String, Object>();
		pgm.setRegId(getUserId());
		pgmService.insert(pgm);

		//pgmService.initJson();
		//menuService.initJson();
		menuService.initRoleMenuList();
		result.put("result", "success");

		return result;
	}
	
	@RequestMapping (value="/system/pgm/update.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> update(HttpServletRequest request, Pgm pgm) {
		Map<String, Object> result = new HashMap<String, Object>();
		pgm.setUpdId(getUserId());
		pgmService.update(pgm);

		//pgmService.initJson();
		//menuService.initJson();
		menuService.initRoleMenuList();
		result.put("result", "success");

		return result;
	}

	@RequestMapping (value="/system/pgm/delete.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> delete(HttpServletRequest request, Pgm pgm) {
		Map<String, Object> result = new HashMap<String, Object>();
		pgm.setDelId(getUserId());
		pgmService.delete(pgm);

		//pgmService.initJson();
		//menuService.initJson();
		menuService.initRoleMenuList();
		result.put("result", "success");

		return result;
	}
}
