package net.jw.twin.repository.client.controller;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jw.twin.repository.client.dbExt.dataItemExt.service.DataItemServiceExt;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jw.twin.repository.global.CodeValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Controller
public class DataRegistRequestController extends BaseController {
    @Autowired
    @Qualifier("dataItemServiceExt")
    DataItemServiceExt dataItemServiceExt;

    @RequestMapping(value="/system/data-regist-request/list.json", method= RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> list(HttpServletRequest request, DataItemSearch search,
                                                    String status) {
        Map<String, Object> result = new HashMap<String, Object>();
        String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
        String sortOder = request.getParameter("order[0][dir]");
        search.setSort(sort);
        search.setSortOrd(sortOder);
        search.setPagingYn(true);

        result.put("data", dataItemServiceExt.selectListDataDetail(search));

        search.setPagingYn(false);
        int totalCount = dataItemServiceExt.countDataDetail(search);
        result.put("recordsTotal", totalCount);
        result.put("recordsFiltered", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @Transactional
    @RequestMapping (value="/system/data-regist-request/approve.json", method=RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> approve (DataItem dataItem) {
        Map<String, Object> result = new HashMap<String, Object>();

        dataItem.setStatus(CodeValue.DataItemStatus.approved.name());
        dataItem.setApprovalTime(LocalDateTime.now());
        dataItemServiceExt.update(dataItem);

        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @Transactional
    @RequestMapping (value="/system/data-regist-request/deny.json", method=RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> deny (DataItem dataItem) {
        Map<String, Object> result = new HashMap<String, Object>();

        dataItem.setStatus(CodeValue.DataItemStatus.denied.name());
        dataItem.setDenialTime(LocalDateTime.now());
        dataItemServiceExt.update(dataItem);

        result.put("result", "success");

        return ResponseEntity.ok(result);
    }
}
