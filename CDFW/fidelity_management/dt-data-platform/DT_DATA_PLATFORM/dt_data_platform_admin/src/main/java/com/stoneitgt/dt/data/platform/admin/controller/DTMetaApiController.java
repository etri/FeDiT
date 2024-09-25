package com.stoneitgt.dt.data.platform.admin.controller;

import java.io.File;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import lombok.extern.slf4j.Slf4j;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.service.DTModelApiService;
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;


@Slf4j
@Controller
@RequestMapping("/dt/meta")
public class DTMetaApiController extends BaseController {

    @Autowired
    private DTModelApiService dtModelApiService;

    @Autowired
    private DTModelService dTModelService;

    @Autowired
    private BaseSystemProperties systemproperties;

    @PostMapping(value = "/api/v1/resource/dts")
    @ResponseBody
    public Map<String, Object> resourceDts(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();

        //param.put("srchText", "%ED%8A%B8%EC%9C%88");

        ResponseEntity<?> resultResourceObject = dtModelApiService.getResourceDts(param);
        ObjectMapper objectMapper = new ObjectMapper();
        List<Map<String, String>> resultList = new ArrayList<>();

        //log.info("rootNode::" + resultResourceObject);

        try {
            // JSON 문자열을 JsonNode 객체로 변환
            JsonNode rootNode = objectMapper.readTree(resultResourceObject.getBody().toString());

            // "list" 배열에 있는 각 객체에서 필요한 필드 추출
            for (JsonNode node : rootNode.path("list")) {
                /*
            	Map<String, String> map = new HashMap<>();
                map.put("metaModel", node.path("metaModel").asText());
                map.put("digitalObjectId", node.path("digitalObjectId").asText());
                map.put("digitalObjectName", node.path("digitalObjectName").asText());
                map.put("tags", node.path("tags").asText());
                map.put("subject", node.path("subject").asText());
                */

                Map<String, String> map = new HashMap<>();
                map.put("metaModel", node.path("metaModel").asText());
                map.put("digitalTwinId", node.path("digitalTwinId").asText());
                map.put("digitalTwinName", node.path("digitalTwinName").asText());
                map.put("tags", node.path("tags").asText());
                map.put("subject", node.path("subject").asText());
                map.put("description", node.path("description").asText());
                map.put("owner", node.path("owner").asText());

                resultList.add(map);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", resultList);
        return result;

    }

    @PostMapping(value = "/api/v1/resource/objects")
    @ResponseBody
    public Map<String, Object> resourceObject(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();

        ResponseEntity<?> resultResourceObject = dtModelApiService.getResourceObject(param);
        ObjectMapper objectMapper = new ObjectMapper();
        List<Map<String, String>> resultList = new ArrayList<>();

        try {
            // JSON 문자열을 JsonNode 객체로 변환
            JsonNode rootNode = objectMapper.readTree(resultResourceObject.getBody().toString());

            // "list" 배열에 있는 각 객체에서 필요한 필드 추출

            for (JsonNode node : rootNode.path("list")) {
                Map<String, String> map = new HashMap<>();
                map.put("metaModel", node.path("metaModel").asText());
                map.put("digitalObjectId", node.path("digitalObjectId").asText());
                map.put("digitalObjectName", node.path("digitalObjectName").asText());
                map.put("tags", node.path("tags").asText());
                map.put("subject", node.path("subject").asText());
                map.put("description", node.path("description").asText());
                map.put("objectdata", node.path("objectdata").asText());

                map.put("digitalTwinId", param.get("digitalTwinId").toString());
                resultList.add(map);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }    	
    	
    	
    	
    	/*
    	JsonNode jsonNode = objectMapper.valueToTree(resultResourceObject.getBody());
    	log.info("getBody::::" + resultResourceObject);
    	log.info("jsonNode::::" + jsonNode);
    	log.info("jsonNode:::" + MetaRelateUtil.getJsonSampleData("", jsonNode));
    	*/

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", resultList);
    	/*
		//결과 json을 먼저 풀고
		Map<String, Object> resultJson = extractDataKeyValues(resultBaseDataSetRangeCol);
		Map<String, Object> resultCsv = readCSV(resultJson.get("file_path").toString(), resultJson.get("base_file_nm_set_range_col").toString(), 0);
		
		result.put("code", GlobalConstant.API_STATUS.SUCCESS);
		
		result.put("base_file_nm_set_range_col", resultJson.get("preproc_trgt_col").toString());
		result.put("base_file_nm_set_range_col", resultJson.get("base_file_nm_set_range_col").toString());
		result.put("header_list", resultCsv.get("header_list").toString());
		result.put("data_list", resultCsv.get("data_list").toString());		
		*/
        return result;

    }

    @PostMapping(value = "/api/v1/resource/objects/detail")
    @ResponseBody
    public Map<String, Object> resourceObjectDetail(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();

        ResponseEntity<?> resultResourceFullObject = dtModelApiService.getResourceObjectDetailFull(param);
        String resourceObjectFullBody = resultResourceFullObject.getBody().toString();

        List<Map<String, Object>> resultList = new ArrayList<>();
        resultList = MetaRelateUtil.parsingN2mViewData(param.get("twin_id").toString(), resourceObjectFullBody, Integer.parseInt(param.get("row_count").toString()));

        result.put("data", resultList);
        return result;

    }

    @PostMapping(value = "/api/v1/resource/objects/detail/set/file")
    @ResponseBody
    public Map<String, Object> getBaseData(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getBaseData -> " + param.toString());
        Map<String, Object> findParsingParam = new HashMap<>();
        int limit = systemproperties.getLimitCsvRowCount();
        findParsingParam.put("limit", limit);
        //컬럼 정보
        //column_depth_1,column_depth_2,data_depth_1,data_depth_2, data_time_yn
        Map<String, Object> getMetaDepth = dTModelService.getMetaDataJsonDepth(param);
        log.info("getMetaDepth:col depth::" + getMetaDepth.get("column_depth_2").toString());
        log.info("getMetaDepth:data depth::" + getMetaDepth.get("data_depth_1").toString());

        String columnDepth = getMetaDepth.get("column_depth_2").toString();
        String dataDepth = getMetaDepth.get("data_depth_1").toString();
        String dataTimeYn = getMetaDepth.get("data_time_yn").toString();

        findParsingParam.put("column_depth", columnDepth);
        findParsingParam.put("data_depth", dataDepth);
        findParsingParam.put("data_time_yn", dataTimeYn);
        findParsingParam.put("digital_twins", param.get("digital_twins").toString());
        //api 초기 개발이랑 파라미터 달라서 통일 시킬 필요있음
        findParsingParam.put("digital_objects", param.get("digital_objects").toString());
        findParsingParam.put("object_id", param.get("digital_objects").toString());
        findParsingParam.put("target_row_count", param.get("target_row_count") != null ? param.get("target_row_count").toString() : limit);

        //List<String> headerList = getFindMetaColumnParsing(findParsingParam);
        List<Map<String, Object>> data = getFindMetaDataParsing(findParsingParam);

        //param.put("data", MetaRelateUtil.parsingKETIDataSetFile(resultResourceObjectData.getBody().toString(), limit));
        //data 정보
        //param.put("data", MetaRelateUtil.parsingKETIDataSetFile(resultResourceObjectData.getBody().toString(), limit));

        param.put("data", data);
        param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + currentTimeMillis());
        ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeBaseDataFile(param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        Map<String, Object> resultCsv = readCSV(resultJson.get("file_path").toString(), resultJson.get("file_name").toString(), limit);
        /**
         * 2024-07-26 정렬 로직 추가
         * */
        HashMap<String, Object> convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));
        if (convertHashMap != null) {
            result.put("header_list", convertHashMap.get("headers").toString());
            result.put("data_list", convertHashMap.get("datas").toString());
        } else {
            result.put("header_list", resultCsv.get("header_list").toString());
            result.put("data_list", resultCsv.get("data_list").toString());
        }
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("base_dir", resultJson.get("base_dir").toString());
        result.put("file_name", resultJson.get("file_name").toString());
        result.put("file_path", resultJson.get("file_path").toString());
        result.put("limit", limit);
        return result;
    }

    @PostMapping(value = "/api/v1/resource/objects/detail/reset/file")
    @ResponseBody
    public Map<String, Object> reGetBaseData(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        log.info("reGetBaseData -> " + param.toString());

        Map<String, Object> findParsingParam = new HashMap<>();
        int limit = systemproperties.getLimitCsvRowCount();
        findParsingParam.put("limit", limit);

        /**
         * TODO 파일 업로드 기능 추가
         * digital_twins null
         * digital_objects null
         * */
        if (param.get("digital_twins") != null && param.get("digital_objects") != null && !param.get("digital_twins").toString().isEmpty() && !param.get("digital_objects").toString().isEmpty()) {
            /**
             * 디렉토리 삭제 후 조회 다시 원본 파일 생성
             * 이후 조회 버튼 로직 그대로 수행하게된다.
             * */
            File directory = new File(systemproperties.getDtMetaFilePath().replace("\\", File.separator) + File.separator + "tmp" + File.separator + param.get("base_file_path").toString());
            log.info("Delete to " + directory.getAbsolutePath() + " directory");
            if (FileUtil.deleteDirectory(directory)) {
                log.info("Directory deleted successfully.");
            } else {
                log.info("Failed to delete the directory.");
            }

            //디지털 트윈 데이터
            //컬럼 정보
            //column_depth_1,column_depth_2,data_depth_1,data_depth_2, data_time_yn
            Map<String, Object> getMetaDepth = dTModelService.getMetaDataJsonDepth(param);
            log.info("getMetaDepth:col depth::" + getMetaDepth.get("column_depth_2").toString());
            log.info("getMetaDepth:data depth::" + getMetaDepth.get("data_depth_1").toString());

            String columnDepth = getMetaDepth.get("column_depth_2").toString();
            String dataDepth = getMetaDepth.get("data_depth_1").toString();
            String dataTimeYn = getMetaDepth.get("data_time_yn").toString();

            findParsingParam.put("column_depth", columnDepth);
            findParsingParam.put("data_depth", dataDepth);
            findParsingParam.put("data_time_yn", dataTimeYn);
            findParsingParam.put("digital_twins", param.get("digital_twins").toString());
            //api 초기 개발이랑 파라미터 달라서 통일 시킬 필요있음
            findParsingParam.put("digital_objects", param.get("digital_objects").toString());
            findParsingParam.put("object_id", param.get("digital_objects").toString());
            findParsingParam.put("target_row_count", param.get("target_row_count") != null ? param.get("target_row_count").toString() : limit);
            findParsingParam.put("target_start_date", param.get("target_start_date")!=null ? param.get("target_start_date").toString() : null);
            findParsingParam.put("target_end_date", param.get("target_end_date")!=null ? param.get("target_end_date").toString() : null);

            //List<String> headerList = getFindMetaColumnParsing(findParsingParam);
            List<Map<String, Object>> data = getFindMetaDataParsing(findParsingParam);

            param.put("data", data);
            param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + currentTimeMillis());
            ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeBaseDataFile(param);

            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

            //csv를 읽어들인다
            //가져올 갯수 0은 전체, 나머지는 환경세팅에서
            log.info("limit -> " + limit);
            Map<String, Object> resultCsv = readCSV(resultJson.get("file_path").toString(), resultJson.get("file_name").toString(), limit);
            /**
             * 2024-07-26 정렬 로직 추가
             * */
            HashMap<String, Object> convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));
            if (convertHashMap != null) {
                result.put("header_list", convertHashMap.get("headers").toString());
                result.put("data_list", convertHashMap.get("datas").toString());
            } else {
                result.put("header_list", resultCsv.get("header_list").toString());
                result.put("data_list", resultCsv.get("data_list").toString());
            }
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("base_dir", resultJson.get("base_dir").toString());
            result.put("file_name", resultJson.get("file_name").toString());
            result.put("file_path", resultJson.get("file_path").toString());
        } else {
            //파일 업로드 데이터
            //컬럼 정보
            //D:/DT_FILE_TMP/DT_META_FILE/files/storage/tmp/admin1724142593678/151_135_admin_20240820115457_interval.csv
            String file_path = systemproperties.getDtMetaFilePath().replace("\\", File.separator) + File.separator + "tmp" + File.separator + param.get("base_file_path") + File.separator + param.get("base_file_name");
            log.info("file_path -> {}", file_path);
            List<Map<String, Object>> data = JSONParser.readObjectCsv(file_path);
            param.put("data", data);
            param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + currentTimeMillis());
            ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeBaseDataFile(param);

            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

            //csv를 읽어들인다
            //가져올 갯수 0은 전체, 나머지는 환경세팅에서
            log.info("limit -> " + limit);
            Map<String, Object> resultCsv = readCSV(resultJson.get("file_path").toString(), resultJson.get("file_name").toString(), limit);
            /**
             * 2024-07-26 정렬 로직 추가
             * */
            HashMap<String, Object> convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));
            if (convertHashMap != null) {
                result.put("header_list", convertHashMap.get("headers").toString());
                result.put("data_list", convertHashMap.get("datas").toString());
            } else {
                result.put("header_list", resultCsv.get("header_list").toString());
                result.put("data_list", resultCsv.get("data_list").toString());
            }
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("base_dir", resultJson.get("base_dir").toString());
            result.put("file_name", resultJson.get("file_name").toString());
            result.put("file_path", resultJson.get("file_path").toString());
        }
        return result;
    }

    private List<String> getFindMetaColumnParsing(Map<String, Object> findParsingParam) throws Exception {
        ResponseEntity<?> resultResourceFullObject = dtModelApiService.getResourceObjectDetailFull(findParsingParam);
        String resourceObjectFullBody = resultResourceFullObject.getBody().toString();

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode rootNode = objectMapper.readTree(resourceObjectFullBody);
        String digitalObjectDataModelString = rootNode.path("objectdata").path("digitalObjectDataModel").asText();
        JsonNode digitalObjectDataModelNode = objectMapper.readTree(digitalObjectDataModelString);

        // col_depth를 '.'으로 분리하여 각 단계 추출
        String col_depth = findParsingParam.get("column_depth").toString();
        String[] keys = col_depth.split("\\.");
        log.info("col_depth::" + col_depth);
        // 필요한 노드로 이동
        JsonNode currentNode = digitalObjectDataModelNode;
        for (String key : keys) {
            currentNode = currentNode.get(key);
        }

        // 결과 추출
        List<String> col_list = new ArrayList<>();
        if (currentNode.isArray()) {
            Iterator<JsonNode> elements = currentNode.elements();
            while (elements.hasNext()) {
                JsonNode element = elements.next();
                col_list.add(element.asText());
            }
        }

        if ("N".equals(findParsingParam.get("data_time_yn"))) {
            col_list.add(0, "rowtime");
        }
        log.info("col_list::" + col_list);
        return col_list;
    }

    private List<Map<String, Object>> getFindMetaDataParsing(Map<String, Object> findParsingParam) throws Exception {
        /*TODO 2024-07-15 getFindMetaDataParsing 데이터 파싱 부분 날짜 조정 해야됩니다.
         * AE Model 생성 시 데이터 설정을 날짜가 미정이면 최근 일부터 limit개 가져오는 걸로 변경합니다.
         * */
        log.info("getFindMetaDataParsing -> " + findParsingParam.toString());
        ResponseEntity<?> resultResourceObjectData = dtModelApiService.getResourceObjectDataMetaFirst(findParsingParam);

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode rootNodePath = objectMapper.readTree(resultResourceObjectData.getBody().toString());

        String col_depth = findParsingParam.get("data_depth").toString();
        String[] depthKeys = col_depth.split("\\.");
        List<JsonNode> nodesToProcess = new ArrayList<>();


        if (rootNodePath.isArray()) {
            for (JsonNode arrayItem : rootNodePath) {
                nodesToProcess.add(arrayItem);
            }
        } else {
            nodesToProcess.add(rootNodePath);
        }

        for (String key : depthKeys) {
            List<JsonNode> nextNodesToProcess = new ArrayList<>();

            for (JsonNode node : nodesToProcess) {
                JsonNode nextNode = node.path(key);
                if (!nextNode.isMissingNode()) {
                    nextNodesToProcess.add(nextNode);
                }
            }

            nodesToProcess = nextNodesToProcess;
        }

        List<Map<String, Object>> resultList = new ArrayList<>();

        //for (JsonNode finalNode : nodesToProcess) {
        for (int i = 0; i < nodesToProcess.size(); i++) {
            JsonNode finalNode = nodesToProcess.get(i); // nodesToProcess의 i번째 노드 가져오기
            JsonNode rootNode = rootNodePath.get(i);

            if (finalNode.isArray()) {
                for (JsonNode arrayItem : finalNode) {
                    Map<String, Object> map = objectMapper.convertValue(arrayItem, new TypeReference<Map<String, Object>>() {
                    });

                    if ("N".equals(findParsingParam.get("data_time_yn"))) {
                        String rowtime = arrayItem.path("rowtime").asText();
                        if (rowtime.isEmpty()) {
                            rowtime = ketiTimeFormatSetDefault(rootNode.path("rowtime").asText());
                        }
                        map.put("rowtime", rowtime);
                    }

                    resultList.add(map);
                }
            } else {
                Map<String, Object> map = objectMapper.convertValue(finalNode, new TypeReference<Map<String, Object>>() {
                });

                if ("N".equals(findParsingParam.get("data_time_yn"))) {
                    String rowtime = finalNode.path("rowtime").asText();
                    if (rowtime.isEmpty()) {
                        rowtime = ketiTimeFormatSetDefault(rootNode.path("rowtime").asText());
                    }
                    map.put("rowtime", rowtime);
                }

                resultList.add(map);
            }
        }

        //log.info("result::" + resultList);
        //log.info("col_depth::" + col_depth);

        return resultList;
    }

    private String ketiTimeFormatSetDefault(String input) {
        //String input = "2024-06-26T03:25:28.578Z";

        // ZonedDateTime으로 파싱
        ZonedDateTime zonedDateTime = ZonedDateTime.parse(input);

        // 포맷 지정
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        // 포맷 적용하여 문자열로 변환
        String formattedDateTime = zonedDateTime.format(formatter);

        return formattedDateTime;
    }


}
