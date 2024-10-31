package net.jw.twin.repository.client.controller;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jw.twin.repository.db.restKey.service.RestKeyService;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
@Slf4j
public class RestKeyController extends BaseController {
    @Autowired
    private RestKeyService restKeyService;

    @ResponseBody
    @RequestMapping(value="/user/rest-key/list.json", method= RequestMethod.GET)
    public ResponseEntity<?> getRestKeyList(RestKeySearch search) {
        Long userId = Optional.ofNullable(getUserId()).orElseThrow(()->new CustomException(ErrorStatus.E_COMMON__INTERNAL_ERROR, "유저정보 획득 실패."));

        search.setUserId(userId);

        Map<String, Object> result = new HashMap<String, Object>();

        result.put("data", restKeyService.selectList(search));

        search.setPagingYn(false);
        int totalCount = restKeyService.count(search);
        result.put("recordsTotal", totalCount);
        result.put("result", "success");

        return ResponseEntity.ok(result);
    }
}