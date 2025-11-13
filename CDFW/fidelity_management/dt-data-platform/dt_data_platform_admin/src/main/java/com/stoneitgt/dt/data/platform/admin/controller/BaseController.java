package com.stoneitgt.dt.data.platform.admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.component.AuthenticationFacade;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.service.CodeService;
import com.stoneitgt.dt.data.platform.admin.service.ErrorService;
import com.stoneitgt.dt.data.platform.admin.service.LogService;
import com.stoneitgt.dt.data.platform.admin.service.MenuService;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.User;
import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import com.stoneitgt.dt.data.platform.util.StringUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * 기본 컨트롤러.
 *
 * @author yh.kim
 */
@Slf4j
public class BaseController {

    @Autowired
    public AuthenticationFacade authenticationFacade;

    @Autowired
    public SystemProperties systemProperties;

    @Autowired
    public CodeService codeService;

    @Autowired
    public MenuService menuService;

    @Autowired
    public ErrorService errorService;

    @Autowired
    public LogService logService;

    /**
     * 사용자 IP 정보를 가져온다.
     *
     * @param request
     * @return
     */
    public String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-FORWARDED-FOR");
        if (ip == null) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    public Map<String, Object> getBreadcrumb(String menuCode) {
        return menuService.getBreadcrumb(menuCode);
    }

    public List<Map<String, Object>> getCodeList(String groupCode, boolean addEmpty) {
        List<Map<String, Object>> list = codeService.getCodeList(groupCode);
        if (addEmpty) {
            Map<String, Object> map = new HashMap<String, Object>();
            map.put("dtl_cd", "0");
            map.put("dtl_cd_nm", "선택 없음");
            map.put("ref_value", "");
            list.add(0, map);
        }
        return list;
    }

    public List<Map<String, Object>> getCodeList2(String groupCode, boolean addEmpty) {
        List<Map<String, Object>> list = codeService.getCodeList2(groupCode);
        if (addEmpty) {
            Map<String, Object> map = new HashMap<String, Object>();
            map.put("dtl_cd", "");
            map.put("dtl_cd_nm", "선택하세요");
            map.put("ref_value", "");
            list.add(0, map);
        }
        return list;
    }

    public List<Map<String, Object>> getCodeList3(String groupCode, boolean addEmpty) {
        List<Map<String, Object>> list = codeService.getCodeList(groupCode);
        if (addEmpty) {
            Map<String, Object> map = new HashMap<String, Object>();
            map.put("dtl_cd", "0");
            map.put("dtl_cd_nm", "선택하세요");
            map.put("ref_value", "");
            list.add(0, map);
        }
        return list;
    }

    public int getSessionLoginUserSeq(HttpServletRequest request) {
        if (request.getSession() != null) {
            User user = (User) request.getSession().getAttribute(GlobalConstant.SESSION_ADMIN_KEY);
            return user.getUserSeq();
        } else {
            return -1;
        }
    }

    public String getBaseParameterString(BaseParameter params) {
        List<String> result = new ArrayList<String>();
        result.add("page=" + params.getPage());
        result.add("size=" + params.getSize());
        result.add("year=" + StringUtil.defaultString(params.getYear()));
        result.add("field=" + StringUtil.defaultString(params.getField()));
        result.add("sortName=" + StringUtil.defaultString(params.getSortName()));
        result.add("sortType=" + StringUtil.defaultString(params.getSortType()));
        result.add("menuCd=" + StringUtil.defaultString(params.getMenuCd()));
        try {
            result.add("keyword=" + URLEncoder.encode(StringUtil.defaultString(params.getKeyword()), StandardCharsets.UTF_8.name()));
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return String.join("&", result);
    }

    public static Map<String, Object> extractDataKeyValues(ResponseEntity<?> responseEntity) {
        Map<String, Object> resultMap = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        try {
            // ResponseEntity의 body를 JSON 문자열로 변환
            String bodyString = responseEntity.getBody().toString();
            // JSON 문자열을 JsonNode로 변환
            JsonNode rootNode = mapper.readTree(bodyString);

            // data 키에 해당하는 JsonNode 가져오기
            JsonNode dataNode = rootNode.get("data");
            //log.info("dataNode::" + dataNode);

            // data 키 안의 모든 동적인 key-value 쌍을 추출하여 resultMap에 담기
            Iterator<String> fieldNames = dataNode.fieldNames();
            while (fieldNames.hasNext()) {

                String fieldName = fieldNames.next();
                if (dataNode.get(fieldName).isArray()) {
                    // If the value is an array, convert it to a list
                    List<String> arrayValues = new ArrayList<>();
                    for (final JsonNode objNode : dataNode.get(fieldName)) {
                        arrayValues.add(objNode.asText());
                    }
                    resultMap.put(fieldName, arrayValues);
                } else {
                    String fieldValue = dataNode.get(fieldName).asText();
                    resultMap.put(fieldName, fieldValue);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return resultMap;
    }

    public Map<String, Object> compareDatas(List<List<String>> prevResultDataList, List<List<String>> resultDataList) {
        Map<Long, List<String>> resultDataMapLongKey = new HashMap<>();
        Map<Long, List<String>> prevResultDataMapLongKey = new HashMap<>();

        // Convert lists to maps for easy comparison by date
        Map<String, List<String>> prevResultDataMap = ConvertUtil.listToMap(prevResultDataList);
        Map<String, List<String>> resultDataMap = ConvertUtil.listToMap(resultDataList);

        for (String resultDate : resultDataMap.keySet()) {
            resultDataMapLongKey.put(ConvertUtil.extractAndConvertToLong(resultDate), resultDataMap.get(resultDate));
        }

        for (String prevDate : prevResultDataMap.keySet()) {
            prevResultDataMapLongKey.put(ConvertUtil.extractAndConvertToLong(prevDate), prevResultDataMap.get(prevDate));
        }

        Set<Long> resultSet = resultDataMapLongKey.keySet();
        Set<Long> prevSet = prevResultDataMapLongKey.keySet();

        Set<Long> addedKeys = new HashSet<>(resultSet);
        addedKeys.removeAll(prevSet);

        Set<Long> removedKeys = new HashSet<>(prevSet);
        removedKeys.removeAll(resultSet);

        // Finding added and removed dates
        List<List<String>> addedData = new ArrayList<>();
        List<List<String>> removedData = new ArrayList<>();

        for (Long key : addedKeys) {
            addedData.add(resultDataMapLongKey.get(key));
        }

        for (Long key : removedKeys) {
            removedData.add(prevResultDataMapLongKey.get(key));
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("added_data", addedData);
        resultMap.put("removed_data", removedData);
        return resultMap;
    }
}