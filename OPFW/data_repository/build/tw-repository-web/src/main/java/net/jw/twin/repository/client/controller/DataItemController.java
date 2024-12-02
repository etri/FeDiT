package net.jw.twin.repository.client.controller;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.impl.UserServiceImpl;
import net.jcms.framework.util.PropertiesUtil;
import net.jw.twin.repository.annotation.HandleRuntimeException;
import net.jw.twin.repository.client.dbExt.dataItemExt.service.DataItemServiceExt;
import net.jw.twin.repository.client.dbExt.dataUseExt.service.DataUseServiceExt;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import net.jw.twin.repository.db.dataUse.service.DataUseService;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.global.CodeValue;
import net.jw.twin.repository.global.FrontGlobal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.*;


@Controller
@Slf4j
public class DataItemController extends BaseController {
    @Autowired
    @Qualifier("dataItemServiceExt")
    DataItemServiceExt dataItemServiceExt;

    @Autowired
    @Qualifier("dataUseServiceExt")
    DataUseServiceExt dataUseServiceExt;
    @Autowired
    private UserServiceImpl userService;


    @RequestMapping (value="/user/data-item/initial.json"
            , method=RequestMethod.POST
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

    @RequestMapping (value="/user/data-item/list.json", method=RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> list(HttpServletRequest request, DataItemSearch search) {
        Map<String, Object> result = new HashMap<String, Object>();
        String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
        String sortOder = request.getParameter("order[0][dir]");
        search.setSort(sort);
        search.setSortOrd(sortOder);
        search.setPagingYn(true);

        search.setStatus(CodeValue.DataUseStatus.approved.name());

        result.put("data", dataItemServiceExt.selectListDataDetail(search));

        search.setPagingYn(false);
        int totalCount = dataItemServiceExt.countDataDetail(search);
        result.put("recordsTotal", totalCount);
        result.put("recordsFiltered", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @RequestMapping (value="/user/data-item/tan-list.json", method=RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> tanstackTable(DataItemSearch search) {
        Long userId = Optional.ofNullable(getUserId()).orElseThrow(()->new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "유저정보 획득 실패."));

        search.setRegId(userId);

        Map<String, Object> result = new HashMap<String, Object>();

        result.put("data", dataItemServiceExt.selectListNullCheck(search));

        search.setPagingYn(false);
        int totalCount = dataItemServiceExt.countNullCheck(search);
        result.put("recordsTotal", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @RequestMapping (value="/user/data-item/select-list.json", method=RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> selectList(DataItemSearch search) {
        Long userId = Optional.ofNullable(getUserId()).orElseThrow(()->new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "유저정보 획득 실패."));

        search.setRegId(userId);
        Map<String, Object> result = new HashMap<>();

        Set<String> categorySet = new HashSet<>();
        Set<String> typeSet = new HashSet<>();
        Set<String> statusSet = new HashSet<>();
        List<DataItem> dataItemList = dataItemServiceExt.selectListNullCheck(search);

        dataItemList.stream().forEach(dataItem -> {
            categorySet.add(dataItem.getCategory());
            typeSet.add(dataItem.getType());
            statusSet.add(dataItem.getStatus());
        });

        result.put("category", categorySet);
        result.put("type", typeSet);
        result.put("status", statusSet);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @RequestMapping (value="/user/data-item/detail.json", method=RequestMethod.POST)
    @ResponseBody
    public Map<String, Object> detail(HttpServletRequest request, DataItemSearch search) {
        Map<String, Object> result = new HashMap<String, Object>();
        Map<String, Object> map = new HashMap<String, Object>();
        DataItem dataItem = Optional.ofNullable(dataItemServiceExt.select(search)).orElseThrow(() -> new CustomException(ErrorStatus.E_DB__NOT_FOUND, "Service 정보가 없습니다."));
        map.put("detail", dataItem);

        result.put("data", map);
        result.put("result", "success");

        return result;
    }

    @Transactional
    @RequestMapping (value="/user/data-item/delete.json", method=RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<?> delete (DataItem dataItem) {
        Map<String, Object> result = new HashMap<String, Object>();

        dataItemServiceExt.deleteSoft(dataItem);

        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @ResponseBody
    @RequestMapping (value = "/public/data-item/detail.json", method = RequestMethod.POST)
    public ResponseEntity<?> serviceDetail(HttpServletRequest request, DataItemSearch search) {
        Map<String, Object> result = new HashMap<String, Object>();
        String gatewayUrl = PropertiesUtil.getProperty("AppConf.gateway.Url");


        Map<String, Object> dataItem = dataItemServiceExt.selectDataDetail(search);

        result.put("data", dataItem);

        boolean alreadyRequested = false;
        Long userId = getUserId();
        if(userId != null) {
            DataUseSearch dataUseSearch = DataUseSearch.builder()
                    .dataId(search.getId())
                    .regId(userId)
                    .build();

            if(dataUseServiceExt.countAlreadyRequested(dataUseSearch)>0){
                alreadyRequested = true;
            }
        }

        result.put("alreadyRequested", alreadyRequested);


        result.put("gatewayUrl", gatewayUrl);

        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("user");
        Long institutionId = user!=null?user.getInstitutionId():null;
        result.put("userInstitutionId", institutionId);

        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @ResponseBody
    @RequestMapping(value = "/public/data-item/list.json", method = RequestMethod.GET)
    public ResponseEntity<?> serviceList(HttpServletRequest request, DataItemSearch search) {

        search.setStatus(CodeValue.DataUseStatus.approved.name());

        int totalCount = dataItemServiceExt.countNullCheck(search);
        String gatewayUrl = PropertiesUtil.getProperty("AppConf.gateway.Url");

        search.setPagingYn(true);
        search.setStart(request.getParameter("start") == null ? 0 : Integer.parseInt(request.getParameter("start")));
        search.setLength(10);


        Map<String, Object> result = new HashMap<String, Object>();
        List<DataItem> serviceList = dataItemServiceExt.selectListNullCheck(search);
        result.put("data", serviceList);
        result.put("gatewayUrl", gatewayUrl);
        result.put("recordsTotal", totalCount);
        result.put("recordsFiltered", serviceList.size());
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @Transactional
    @PatchMapping("/system/data-item.json")
    @HandleRuntimeException(ErrorStatus.E_COMMON__DATAITEM_MODIFY)
    public ResponseEntity<?> updateDataItem(@RequestBody DataItem dataItem) {
        int count = dataItemServiceExt.update(dataItem);
        if(count != 1) {
            throw new CustomException(ErrorStatus.E_COMMON__DATAITEM_MODIFY, "dataItem id : " + dataItem.getId());
        }
        return new ResponseEntity<>(HttpStatus.OK);
    }
}