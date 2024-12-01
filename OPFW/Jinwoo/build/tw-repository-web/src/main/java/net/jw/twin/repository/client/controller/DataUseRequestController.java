package net.jw.twin.repository.client.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.UserService;
import net.jw.twin.repository.annotation.HandleRuntimeException;
import net.jw.twin.repository.client.dbExt.dataItemExt.service.DataItemServiceExt;
import net.jw.twin.repository.client.dbExt.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.client.dbExt.dataUseExt.service.DataUseServiceExt;
import net.jw.twin.repository.client.dto.DataUseRequestListSearchDto;
import net.jw.twin.repository.client.dto.DtoDataUseRequest;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.dataUse.service.DataUseService;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.global.CodeValue;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Controller
@RequiredArgsConstructor
public class DataUseRequestController extends BaseController {
    private final DataItemServiceExt dataItemServiceExt;

    private final DataUseService dataUseService;

    private final DataUseServiceExt dataUseServiceExt;

    private final UserService userService;

    private final ModelMapper modelMapper;


    @ResponseBody
    @RequestMapping(value="/user/data-use-request.json", method= RequestMethod.POST)
    public ResponseEntity<?> dataUseRequest(@RequestBody @Valid DtoDataUseRequest dto) {
        Long userId = Optional.ofNullable(getUserId()).orElseThrow(()->new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "유저정보 획득 실패."));

        DataUse dataUse= modelMapper.map(dto, DataUse.class);
        dataUse.setStatus(CodeValue.DataUseStatus.waiting.name());
        dataUse.setRegId(userId);
        dataUse.setRegDt(LocalDateTime.now());

        return ResponseEntity.ok(dataUseService.insert(dataUse));
    }

    @RequestMapping (value="/user/data-use-request/tan-list.json", method=RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> tanstackTable(DataUseSearchExt search) {
        Map<String, Object> result = new HashMap<String, Object>();
        List<Map<String, Object>> data = new ArrayList<Map<String, Object>>();

        Long userId = Optional.ofNullable(getUserId()).orElseThrow(()->new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "유저정보 획득 실패."));

        search.setRegId(userId);

        try {
            data = dataUseServiceExt.selectDataUseSearchExtList(search);
        } catch (Exception e) {
            log.error("failed to get dataItem. error :{}", e.getMessage());
        }

        result.put("data", data);

        search.setPagingYn(false);
        int totalCount = dataUseService.count(search);
        result.put("recordsTotal", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @RequestMapping(value="/system/data-use-request/list.json", method= RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> dataUseRequestList(HttpServletRequest request, DataUseRequestListSearchDto search) {
        Map<String, Object> result = new HashMap<String, Object>();
        List<Map<String, Object>> data = new ArrayList<Map<String, Object>>();

        String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
        String sortOder = request.getParameter("order[0][dir]");

        search.setSort(sort);
        search.setSortOrd(sortOder);
        search.setPagingYn(true);


        List<DataUse> dataUseList = dataUseService.selectList(search);
        for(DataUse dataUseElement : dataUseList) {
            DataItemSearch dataItemSearch = DataItemSearch.builder()
                    .id(dataUseElement.getDataId())
                    .build();
            DataItem dataItemElement = null;
            try {
                dataItemElement = dataItemServiceExt.select(dataItemSearch);
                if(null==dataItemElement){
                    throw new RuntimeException("select dataItem return null.");
                }
            } catch (Exception e) {
                log.error("failed to get dataItem. item id = {}, error :{}", dataItemSearch.getId(), e.getMessage());
                continue;
            }

            User registUser = null;
            try {
                registUser = userService.select(UserSearch.builder().userId(dataUseElement.getRegId()).build());
            } catch ( Exception e ) {
                log.error("failed to user data. user id = {}, error :{}", dataUseElement.getRegId(), e.getMessage());
            }

            Map<String, Object> map = new HashMap<String, Object>();

            map.put("dataUseId", dataUseElement.getId());
            map.put("name", dataItemElement.getName());
            map.put("userName", null!=registUser?registUser.getUserNm():null);
            map.put("regDt", dataUseElement.getRegDt());
            map.put("category", dataItemElement.getCategory());
            map.put("type", dataItemElement.getType());
            map.put("status", dataUseElement.getStatus());
            map.put("purpose", dataUseElement.getPurpose());
            map.put("expireTime", dataUseElement.getExpireTime());
            map.put("currentCallCount", dataUseElement.getCurrentCallCount());
            map.put("maxCallCount", dataUseElement.getMaxCallCount());

            data.add(map);
        }

        result.put("data", data);

        search.setPagingYn(false);
        int totalCount = dataUseService.count(search);
        result.put("recordsTotal", totalCount);
        result.put("recordsFiltered", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }

    @RequestMapping (value="/system/data-use-request/approve/{id}.json", method=RequestMethod.PATCH)
    @ResponseBody
    @HandleRuntimeException(ErrorStatus.E_DB__FAIL_MODIFY)
    public ResponseEntity<?> approve (@PathVariable Long id) {
        DataUse dataUse = DataUse.builder()
                .id(id)
                .status(CodeValue.DataUseStatus.approved.name())
                .approvalTime(LocalDateTime.now())
                .build();

        dataUseService.update(dataUse);

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @RequestMapping (value="/system/data-use-request/deny/{id}.json", method=RequestMethod.PATCH)
    @ResponseBody
    public ResponseEntity<?> deny (@PathVariable Long id) {
        DataUse dataUse = DataUse.builder()
                .id(id)
                .status(CodeValue.DataUseStatus.denied.name())
                .denialTime(LocalDateTime.now())
                .build();

        dataUseService.update(dataUse);

        return new ResponseEntity<>(HttpStatus.OK);
    }
}
