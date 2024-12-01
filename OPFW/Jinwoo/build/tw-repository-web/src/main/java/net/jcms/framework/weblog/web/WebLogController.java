package net.jcms.framework.weblog.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.weblog.model.WebLogSearch;
import net.jcms.framework.weblog.service.WebLogService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;


@Slf4j
@Controller
public class WebLogController extends BaseController {
	
		@Resource (name="webLogService")
		private WebLogService webLogService;
		
		@RequestMapping (value="/system/webLog/list.mng")
		public String list() {
			return "system/webLog/list";
		}
		
		@RequestMapping (value="/system/webLog/list.json")
		@ResponseBody
		public Map<String, Object> list(HttpServletRequest request, WebLogSearch webLogSearch) {
			Map<String, Object> result = new HashMap<String, Object>();
			String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
			String sortOder = request.getParameter("order[0][dir]");
			webLogSearch.setSort(sort);
			webLogSearch.setSortOrd(sortOder);
			webLogSearch.setPagingYn(true);

			int totalCount = webLogService.count(webLogSearch);
			result.put("recordsTotal", totalCount);
			result.put("recordsFiltered", totalCount);
			result.put("data", webLogService.selectList(webLogSearch));

			result.put("result", "success");
			return result;
		}
		
		@RequestMapping (value="/system/webLog/selectOne.json")
		@ResponseBody
		public Map<String, Object> selectOne(HttpServletRequest request, WebLogSearch webLogSearch) {
			Map<String, Object> result = new HashMap<String, Object>();
			result.put("data", webLogService.select(webLogSearch));
			result.put("result", "success");
			return result;
		}
		
}
