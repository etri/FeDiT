package net.jw.twin.repository.client.controller;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jw.twin.repository.client.service.CollectorService;
import net.jw.twin.repository.db.daemon.model.DaemonSearch;
import net.jw.twin.repository.db.daemon.service.DaemonService;
import net.jw.twin.repository.global.FrontGlobal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Controller
@Slf4j
public class CollectorController extends BaseController {

    @Autowired
    DaemonService daemonService;
    @Autowired
    CollectorService collectorService;

    @RequestMapping("/system/collector/monitor.mng")
    public String monitor (HttpServletRequest request, Model model) throws IOException {

        HttpSession session = request.getSession();
        if(request.getParameter("currentMenuId") != null) {
            Long currentMenuId = Long.parseLong(request.getParameter("currentMenuId"));
            session.setAttribute("currentMenuId", currentMenuId);
        }

        return "system/repository/CollectorMonitoring";
    }

    @ResponseBody
    @RequestMapping(value="/system/collector/getMonitoringDataList.json", method=RequestMethod.GET)
    public Map<String, Object> getAllMonitoringData(HttpServletRequest request, DaemonSearch search) {
        int totalCount = daemonService.count(search);
        search.setPagingYn(true);
        search.setStart(request.getParameter("start") == null ? 0 : Integer.valueOf(request.getParameter("start")));
        search.setLength(6);

        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> map = collectorService.getMonitoringDataList(search);

        result.put("data", map);
        result.put("recordsTotal", totalCount);
        if (map.get("data") instanceof ArrayList) {
            result.put("recordsFiltered", ((ArrayList<?>)map.get("data")).size());
        } else {
            result.put("recordsFiltered", 0);
        }
        result.put("result", "success");

        return result;
    }

    @RequestMapping (value="/system/collector/initial.json"
            , method= RequestMethod.POST
            , consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @ResponseBody
    public Map<String, Object> initial(HttpServletRequest request) {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> map = new HashMap<String, Object>();

        Boolean hasWritePermission = FrontGlobal.hasWritePermissionAsManager(request);
        map.put("hasWritePermission", hasWritePermission);

        result.put("data", map);
        result.put("result", "success");

        return result;
    }

    @RequestMapping (value="/system/collector/list.json", method=RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> list(HttpServletRequest request, DaemonSearch search) {
        Map<String, Object> result = new HashMap<String, Object>();
        String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
        String sortOder = request.getParameter("order[0][dir]");
        search.setSort(sort);
        search.setSortOrd(sortOder);
        search.setPagingYn(true);

        result.put("data", daemonService.selectList(search));

        search.setPagingYn(false);
        int totalCount = daemonService.count(search);
        result.put("recordsTotal", totalCount);
        result.put("recordsFiltered", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }
}
