package com.stoneitgt.dt.data.platform.admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.service.DTModelApiService;
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.domain.DigitalObjectInfo;
import com.stoneitgt.dt.data.platform.enums.ModelType;
import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import com.stoneitgt.dt.data.platform.util.file.FileWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Controller
@RequestMapping("/dt/meta")
public class DTMetaApiController extends BaseController {

    @Autowired
    private DTModelApiService dtModelApiService;

    @Autowired
    private DTModelService dtModelService;

    @PostMapping(value = "/api/v1/resource/dts")
    @ResponseBody
    public Map<String, Object> resourceDts(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        ResponseEntity<?> resultResourceObject = dtModelApiService.getResourceDts(param);
        ObjectMapper objectMapper = new ObjectMapper();
        List<Map<String, String>> resultList = new ArrayList<>();
        try {
            // JSON 문자열을 JsonNode 객체로 변환
            JsonNode rootNode = objectMapper.readTree(resultResourceObject.getBody().toString());

            // "list" 배열에 있는 각 객체에서 필요한 필드 추출
            for (JsonNode node : rootNode.path("list")) {
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

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("data", resultList);
        return result;
    }

    @PostMapping(value = "/api/v1/resource/objects/detail")
    @ResponseBody
    public Map<String, Object> resourceObjectDetail(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("resourceObjectDetail param -> {}", param);
        ResponseEntity<?> resultResourceFullObject = dtModelApiService.getResourceObjectDetailFull(param);
        log.info("resultResourceFullObject.getBody() -> {}", resultResourceFullObject.getBody().toString());
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode infoNode = objectMapper.readTree(resultResourceFullObject.getBody().toString());

        // JsonNode를 DigitalObjectInfo 객체로 변환
        DigitalObjectInfo digitalObjectInfo = objectMapper.treeToValue(infoNode, DigitalObjectInfo.class);

        result.put("data", digitalObjectInfo);
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        //log.info("result -> {}", result);
        return result;
    }

    @PostMapping(value = "/api/v1/resource/objects/detail/set/file/{type}")
    @ResponseBody
    public Map<String, Object> getBaseData(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getBaseData -> " + param.toString());
        Map<String, Object> findParsingParam = new HashMap<>();
        int limit = systemProperties.getLimitCsvRowCount();
        findParsingParam.put("limit", limit);
        Map<String, Object> metaDepth = dtModelService.getMetaDataJsonDepth(param);
        findParsingParam.put("digital_twins", param.get("digital_twins").toString());
        findParsingParam.put("digital_objects", param.get("digital_objects").toString());
        findParsingParam.put("object_id", param.get("digital_objects").toString());
        findParsingParam.put("target_row_count", param.get("target_row_count") != null ? param.get("target_row_count").toString() : limit);

        List<Map<String, Object>> data = dtModelApiService.getResourceObjectDataAndParse(findParsingParam, metaDepth);
        //data 정보
        param.put("data", data);
        param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + TimeUtil.getCurrentTimeMillis());
        ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeBaseDataFile(type, param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSVWithLimit(resultJson.get("file_path") + File.separator + resultJson.get("file_name"), limit);

        /**
         * 가져온 데이터 날짜 중복 제거
         * */
        String indexColumn = ConvertUtil.findDateColumn((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));

        log.info("indexColumn -> {}", indexColumn);

        if (indexColumn != null) {
            List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(resultJson.get("file_path").toString() + File.separator + resultJson.get("file_name"));
            String findColumnKey = indexColumn;
            boolean duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
            if (duplicateDataCheck) {
                List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
                FileWriter.getInstance().writeCSV(resultJson.get("file_path").toString() + File.separator + resultJson.get("file_name"), removedDuplicatedData);
            }
        }

        resultCsv = fileReader.readCSVWithLimit(resultJson.get("file_path") + File.separator + resultJson.get("file_name"), limit);

        /**
         * 2024-07-26 정렬 로직 추가
         * */
        HashMap<String, Object> convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));

        ArrayList<String> headers = (ArrayList<String>) convertHashMap.get("headers");
        List<List<String>> rearrangedDataList = (List<List<String>>) convertHashMap.get("datas");

        FileWriter.getInstance().writeCSV(resultJson.get("file_path").toString() + File.separator + resultJson.get("file_name"), headers, rearrangedDataList);

        if (convertHashMap != null) {
            result.put("header_list", convertHashMap.get("headers"));
            result.put("data_list", convertHashMap.get("datas"));
        } else {
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
        }
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("base_dir", resultJson.get("base_dir").toString());
        result.put("file_name", resultJson.get("file_name").toString());
        result.put("file_path", resultJson.get("file_path").toString());
        result.put("limit", limit);
        result.put("target_row_count", findParsingParam.get("target_row_count").toString());
        return result;
    }

    @PostMapping(value = "/api/v1/resource/objects/detail/reset/file/{type}")
    @ResponseBody
    public Map<String, Object> reGetBaseData(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        log.info("reGetBaseData -> " + param.toString());

        Map<String, Object> findParsingParam = new HashMap<>();
        int limit = systemProperties.getLimitCsvRowCount();
        findParsingParam.put("limit", limit);

        /**
         * 파일 업로드 기능 추가
         * digital_twins null
         * digital_objects null
         * */
        if (param.get("digital_twins") != null && param.get("digital_objects") != null && !param.get("digital_twins").toString().isEmpty() && !param.get("digital_objects").toString().isEmpty()) {
            /**
             * 디렉토리 삭제 후 조회 다시 원본 파일 생성
             * 이후 조회 버튼 로직 그대로 수행하게된다.
             * */
            String filePath = type == ModelType.META_MODEL ? systemProperties.getDtMetaFilePath() : systemProperties.getDtEtcMetaFilePath();
            File directory = new File(filePath.replace("\\", File.separator) + File.separator + "tmp" + File.separator + param.get("base_file_path").toString());
            log.info("Delete to " + directory.getAbsolutePath() + " directory");
            if (FileUtil.deleteDirectory(directory)) {
                log.info("Directory deleted successfully.");
            } else {
                log.info("Failed to delete the directory.");
            }

            //디지털 트윈 데이터
            //컬럼 정보
            Map<String, Object> metaDepth = dtModelService.getMetaDataJsonDepth(param);
            findParsingParam.put("digital_twins", param.get("digital_twins").toString());
            findParsingParam.put("digital_objects", param.get("digital_objects").toString());
            findParsingParam.put("object_id", param.get("digital_objects").toString());
            findParsingParam.put("target_row_count", param.get("target_row_count") != null ? param.get("target_row_count").toString() : limit);
            findParsingParam.put("target_start_date", param.get("target_start_date") != null ? param.get("target_start_date").toString() : null);
            findParsingParam.put("target_end_date", param.get("target_end_date") != null ? param.get("target_end_date").toString() : null);

            List<Map<String, Object>> data = dtModelApiService.getResourceObjectDataAndParse(findParsingParam, metaDepth);

            param.put("data", data);
            param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + TimeUtil.getCurrentTimeMillis());
            ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeBaseDataFile(type, param);

            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

            //csv를 읽어들인다
            //가져올 갯수 0은 전체, 나머지는 환경세팅에서
            Map<String, Object> resultCsv = FileReader.getInstance().readCSVWithLimit(resultJson.get("file_path") + File.separator + resultJson.get("file_name"), limit);

            /**
             * 가져온 데이터 날짜 중복 제거
             * */
            String indexColumn = ConvertUtil.findDateColumn((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));

            log.info("indexColumn -> {}", indexColumn);

            if (indexColumn != null) {
                List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(resultJson.get("file_path").toString() + File.separator + resultJson.get("file_name").toString());
                String findColumnKey = indexColumn;
                boolean duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
                if (duplicateDataCheck) {
                    List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
                    FileWriter.getInstance().writeCSV(resultJson.get("file_path").toString() + File.separator + resultJson.get("file_name").toString(), removedDuplicatedData);
                }
            }

            resultCsv = FileReader.getInstance().readCSVWithLimit(resultJson.get("file_path") + File.separator + resultJson.get("file_name"), limit);

            /**
             * 2024-07-26 정렬 로직 추가
             * */
            HashMap<String, Object> convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));

            ArrayList<String> headers = (ArrayList<String>) convertHashMap.get("headers");
            List<List<String>> rearrangedDataList = (List<List<String>>) convertHashMap.get("datas");

            FileWriter.getInstance().writeCSV(resultJson.get("file_path").toString() + File.separator + resultJson.get("file_name").toString(), headers, rearrangedDataList);

            if (convertHashMap != null) {
                result.put("header_list", convertHashMap.get("headers"));
                result.put("data_list", convertHashMap.get("datas"));
            } else {
                result.put("header_list", resultCsv.get("header_list"));
                result.put("data_list", resultCsv.get("data_list"));
            }
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("base_dir", resultJson.get("base_dir").toString());
            result.put("file_name", resultJson.get("file_name").toString());
            result.put("file_path", resultJson.get("file_path").toString());
            result.put("target_row_count", param.get("target_row_count") != null ? Math.min(Integer.parseInt(param.get("target_row_count").toString()), limit) : limit);
        } else {
            //파일 업로드 데이터
            //컬럼 정보
            String filePath = type == ModelType.META_MODEL ? systemProperties.getDtMetaFilePath() : systemProperties.getDtEtcMetaFilePath();
            filePath = filePath.replace("\\", File.separator) + File.separator + "tmp" + File.separator + param.get("base_file_path") + File.separator + param.get("base_file_name");
            log.info("filePath -> {}", filePath);

            List<Map<String, Object>> data = FileReader.getInstance().readCSVToListObjectMap(filePath);
            param.put("data", data);
            param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + TimeUtil.getCurrentTimeMillis());
            ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeBaseDataFile(type, param);

            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

            //csv를 읽어들인다
            //가져올 갯수 0은 전체, 나머지는 환경세팅에서
            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSVWithLimit(resultJson.get("file_path") + File.separator + resultJson.get("file_name"), limit);

            /**
             * 2024-07-26 정렬 로직 추가
             * */
            HashMap<String, Object> convertHashMap = ConvertUtil.moveAndReOrderHeaderDatas((List<String>) resultCsv.get("header_list"), (List<List<String>>) resultCsv.get("data_list"));
            if (convertHashMap != null) {
                result.put("header_list", convertHashMap.get("headers"));
                result.put("data_list", convertHashMap.get("datas"));
            } else {
                result.put("header_list", resultCsv.get("header_list"));
                result.put("data_list", resultCsv.get("data_list"));
            }
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("base_dir", resultJson.get("base_dir").toString());
            result.put("file_name", resultJson.get("file_name").toString());
            result.put("file_path", resultJson.get("file_path").toString());
            result.put("target_row_count", param.get("target_row_count") != null ? Math.min(Integer.parseInt(param.get("target_row_count").toString()), ((List<List<String>>) resultCsv.get("data_list")).size()) : Math.min(((List<List<String>>) resultCsv.get("data_list")).size(), limit));
        }
        return result;
    }
}