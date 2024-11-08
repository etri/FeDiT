package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

import javax.servlet.http.HttpServletRequest;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.component.AuthenticationFacade;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.service.CodeService;
import com.stoneitgt.dt.data.platform.admin.service.ErrorService;
import com.stoneitgt.dt.data.platform.admin.service.FilesService;
import com.stoneitgt.dt.data.platform.admin.service.MenuService;
import com.stoneitgt.dt.data.platform.component.MessageByLocaleService;
import com.stoneitgt.dt.data.platform.domain.BaseParameter;
import com.stoneitgt.dt.data.platform.domain.ErrorLog;
import com.stoneitgt.dt.data.platform.domain.User;
import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.StringUtil;

import lombok.extern.slf4j.Slf4j;

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
    public MessageByLocaleService messageByLocaleService;

    @Autowired
    private CodeService codeService;

    @Autowired
    private MenuService menuService;

    @Autowired
    private FilesService filesService;

    @Autowired
    public ErrorService errorService;

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

    public List<Map<String, Object>> getCodeList(String groupCode) {
        return getCodeList(groupCode, true);
    }

    public List<Map<String, Object>> getCodeList(String groupCode, boolean addEmpty) {
        List<Map<String, Object>> list = codeService.getCodeList(groupCode);
        if (addEmpty) {
            Map<String, Object> map = new HashMap<String, Object>();
            map.put("dtl_cd", "");
            map.put("dtl_cd_nm", "선택하세요");
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
        try {
            result.add("keyword=" + URLEncoder.encode(StringUtil.defaultString(params.getKeyword()), StandardCharsets.UTF_8.name()));
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            log.error("{}", e);
        }
        result.add("sortName=" + StringUtil.defaultString(params.getSortName()));
        result.add("sortType=" + StringUtil.defaultString(params.getSortType()));
        result.add("menuCd=" + StringUtil.defaultString(params.getMenuCd()));
        return String.join("&", result);
    }

    public List<Map<String, Object>> getDtMetaFileList(String refType, int refSrno) {
        Map<String, Object> params = new HashMap<String, Object>();
        params.put("refTp", refType.toUpperCase());
        params.put("refSeq", refSrno);
        return filesService.getDtMetaFileList(params);
    }

    public void insertErrorLog(int modelSeq, int augmentSeq, String errTp, String errLct, String errCd, String errNm, String errCn, int userSeq, String userIp) {
        ErrorLog errLog = new ErrorLog();
        errLog.setModelSeq(modelSeq);
        errLog.setAugmentSeq(augmentSeq);
        errLog.setErrTp(errTp);
        errLog.setErrLct(errLct);
        errLog.setErrCd(errCd);
        errLog.setErrNm(errNm);
        errLog.setErrCn(errCn);
        errLog.setLoginUserSeq(userSeq);
        errLog.setLoginUserIp(userIp);

        errorService.saveErrorLog(errLog);
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
        // Convert lists to maps for easy comparison by date
        Map<String, List<String>> prevResultDataMap = ConvertUtil.listToMap(prevResultDataList);
        Map<String, List<String>> resultDataMap = ConvertUtil.listToMap(resultDataList);

        // Finding added and removed dates
        List<List<String>> addedData = new ArrayList<>();
        List<List<String>> removedData = new ArrayList<>();

        for (String date : resultDataMap.keySet()) {
            if (!prevResultDataMap.containsKey(date)) {
                addedData.add(resultDataMap.get(date));
            }
        }

        for (String date : prevResultDataMap.keySet()) {
            if (!resultDataMap.containsKey(date)) {
                removedData.add(prevResultDataMap.get(date));
            }
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("added_data", addedData);
        resultMap.put("removed_data", removedData);
        return resultMap;
    }

    public Map<String, Object> propertyJsonParsingInfo(String requestJsonString) throws IOException {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();

        LinkedHashMap<String, Object> infoMap = new LinkedHashMap<>();
        LinkedHashMap<String, Object> propertyMap = new LinkedHashMap<>();
        List<LinkedHashMap<String, Object>> propertyMapList = new ArrayList<LinkedHashMap<String, Object>>();

        JSONParser parser = new JSONParser(requestJsonString);

        String twin_id = parser.getFirstNodeProcInfo("twin_id");
        String base_dir = parser.getFirstNodeProcInfo("base_dir");
        String base_file_nm = parser.getFirstNodeProcInfo("base_file_nm");
        String base_file_nm_set_range_row = parser.getFirstNodeProcInfo("base_file_nm_set_range_row");
        String base_file_nm_set_range_col = parser.getFirstNodeProcInfo("base_file_nm_set_range_col");
        String index_trgt_col = parser.getFirstNodeProcInfo("index_trgt_col");
        String target_start_date = parser.getFirstNodeProcInfo("target_start_date");
        String target_end_date = parser.getFirstNodeProcInfo("target_end_date");
        String target_row_count = parser.getFirstNodeProcInfo("target_row_count");
        String model_nm = parser.getFirstNodeProcInfo("target_row_count");
        String preproc_trgt_col = parser.getFirstNodeProcInfo("preproc_trgt_col");

        infoMap.put("twin_id", twin_id);
        infoMap.put("base_dir", base_dir);
        infoMap.put("base_file_nm", base_file_nm);
        infoMap.put("base_file_nm_set_range_row", base_file_nm_set_range_row);
        infoMap.put("base_file_nm_set_range_col", base_file_nm_set_range_col);
        infoMap.put("index_trgt_col", index_trgt_col);
        infoMap.put("target_start_date", target_start_date);
        infoMap.put("target_end_date", target_end_date);
        infoMap.put("target_row_count", target_row_count);
        infoMap.put("model_nm", model_nm);
        infoMap.put("preproc_trgt_col", preproc_trgt_col);

        //전처리 설정 하위뎁스
        JSONArray preprocProperty = parser.getPreprocProperty("preproc_property");
        int length = preprocProperty.length();

        for (int i = 0; i < length; i++) {
            try {
                JSONObject object = preprocProperty.getJSONObject(i);
                for (String key : object.keySet()) {
                    if ("preproc_set".equals(key)) {
                        // preproc_set 키의 값을 JSONArray로 가져오기
                        JSONArray preprocSet = object.getJSONArray("preproc_set");

                        for (int j = 0; j < preprocSet.length(); j++) {
                            JSONObject set = preprocSet.getJSONObject(j);
                            // 각 set의 키와 값을 출력
                            Iterator<String> keys = set.keys();
                            while (keys.hasNext()) {
                                String setKey = keys.next();
                                propertyMap.put(setKey, set.get(setKey));
                            }
                        }
                    } else {
                        // preproc_set 이 아닌 키는 기존과 동일하게 처리
                        propertyMap.put(key, object.get(key));
                    }
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }

            propertyMapList.add(propertyMap);
        }

        infoMap.put("preproc_property", propertyMapList);

        return infoMap;
    }

    public static long currentTimeMillis() {
        long currentTimeMillis = System.currentTimeMillis();
        return currentTimeMillis;
    }
}
    
    
    
