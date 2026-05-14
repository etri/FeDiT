package com.stoneitgt.dt.data.platform.admin.controller;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.service.DTModelApiService;
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.admin.service.MetaAPIService;
import com.stoneitgt.dt.data.platform.admin.service.SyncEngineAPIService;
import com.stoneitgt.dt.data.platform.domain.meta.BaseFileRequest;
import com.stoneitgt.dt.data.platform.domain.meta.DigitalTwinMetadata;
import com.stoneitgt.dt.data.platform.domain.meta.PaginatedDigitalTwinMetadata;
import com.stoneitgt.dt.data.platform.enums.ModelType;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.File;
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

    @Autowired
    private MetaAPIService metaAPIService;

    @Autowired
    private SyncEngineAPIService syncEngineAPIService;

    @GetMapping("/digital-twins")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDigitalTwins(@RequestParam(value = "curPage", defaultValue = "1") Integer curPage,
                                                               @RequestParam(value = "pageListSize", defaultValue = "10") Integer pageListSize,
                                                               @RequestParam(value = "arrayDataLimit", defaultValue = "200") Integer arrayDataLimit,
                                                               @RequestParam(value = "objectRefFormat", defaultValue = "object") String objectRefFormat,
                                                               @RequestParam(value = "dTw_objs_attr", defaultValue = "digitalTwinObjects") String dTw_objs_attr,
                                                               @RequestParam(value = "dTw_attr_name", required = false) String dTw_attr_name) {
        Map<String, Object> response = new HashMap<>();
        try {
            PaginatedDigitalTwinMetadata paginatedDigitalTwinMetadata = metaAPIService.getDigitalTwins(curPage, pageListSize, arrayDataLimit, objectRefFormat, dTw_objs_attr, dTw_attr_name);
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", paginatedDigitalTwinMetadata);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twins", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/digital-twins/{dTw_attr_dtid}/digital-objects")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDigitalTwinObjects(@RequestParam(value = "curPage", defaultValue = "1") Integer curPage,
                                                                     @RequestParam(value = "pageListSize", defaultValue = "10") Integer pageListSize,
                                                                     @RequestParam(value = "arrayDataLimit", defaultValue = "200") Integer arrayDataLimit,
                                                                     @RequestParam(value = "objectRefFormat", defaultValue = "object") String objectRefFormat,
                                                                     @RequestParam(value = "dTw_objs_attr", defaultValue = "digitalTwinObjects") String dTw_objs_attr,
                                                                     @PathVariable(value = "dTw_attr_dtid", required = false) String dTw_attr_dtid) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<DigitalTwinMetadata.DigitalTwinObject> digitalTwinObjects = metaAPIService.getDigitalTwinObjects(curPage, pageListSize, arrayDataLimit, objectRefFormat, dTw_objs_attr, dTw_attr_dtid);
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", digitalTwinObjects);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin objects", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/digital-twins/{dTw_attr_dtid}/digital-objects/{obj_attr_dtoid}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDigitalTwinObjectInfo(@RequestParam(value = "curPage", defaultValue = "1") Integer curPage,
                                                                        @RequestParam(value = "pageListSize", defaultValue = "10") Integer pageListSize,
                                                                        @RequestParam(value = "arrayDataLimit", defaultValue = "200") Integer arrayDataLimit,
                                                                        @RequestParam(value = "objectRefFormat", defaultValue = "object") String objectRefFormat,
                                                                        @RequestParam(value = "dTw_objs_attr", defaultValue = "digitalTwinObjects") String dTw_objs_attr,
                                                                        @PathVariable(value = "dTw_attr_dtid", required = false) String dTw_attr_dtid,
                                                                        @PathVariable(value = "obj_attr_dtoid", required = false) String obj_attr_dtoid) {
        Map<String, Object> response = new HashMap<>();
        try {
            DigitalTwinMetadata.DigitalTwinObject digitalTwinObject = metaAPIService.getDigitalTwinObject(curPage, pageListSize, arrayDataLimit, objectRefFormat, dTw_objs_attr, dTw_attr_dtid, obj_attr_dtoid);
            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", digitalTwinObject);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping(value = "/base/file/set/{type}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> setBaseFile(@RequestBody BaseFileRequest baseFileRequest, @PathVariable ModelType type) throws Exception {
        log.info("setBaseFile -> {}, {}", baseFileRequest, type);
        Map<String, Object> response = new HashMap<>();
        try {
            // 1. 메타데이터 Depth 정보 조회
            Map<String, Object> depthSearchParams = new HashMap<>();
            depthSearchParams.put("digital_twins", baseFileRequest.getDigital_twin_id());
            depthSearchParams.put("digital_objects", baseFileRequest.getDigital_twin_object_id());
            Map<String, Object> dataPathInfo = dtModelService.getMetaDataJsonDepth(depthSearchParams);

            String dataPath = null;
            String timePath = null;

            if (dataPathInfo.get("data_depth_1") != null && dataPathInfo.get("data_depth_2") != null) {
                dataPath = dataPathInfo.get("data_depth_1").toString();
                timePath = dataPathInfo.get("data_depth_2").toString();
                log.info("dataPath -> {}, timePath -> {}", dataPath, timePath);
            } else {
                response.put("status", GlobalConstant.API_STATUS.FAIL);
                response.put("message", "Data path information is missing.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }

            // 2. 디지털 트윈 오브젝트 데이터 조회
            List<Map<String, Object>> digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(
                    baseFileRequest.getDigital_twin_id(),
                    baseFileRequest.getDigital_twin_object_id(),
                    baseFileRequest.getCount() != null ? baseFileRequest.getCount() <= systemProperties.getLimitCsvRowCount() ? baseFileRequest.getCount() : systemProperties.getLimitCsvRowCount() : systemProperties.getLimitCsvRowCount(),
                    baseFileRequest.getFrom() != null ? baseFileRequest.getFrom() : null,
                    baseFileRequest.getTo() != null ? baseFileRequest.getTo() : null
            );

            // 3. 베이스 파일 생성 전 데이터 파싱 및 전처리
            log.info("digitalTwinObjectData Size -> {}", digitalTwinObjectData.size());
            List<Map<String, Object>> parsedData = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, dataPath, timePath);
            log.info("parsedData Size -> {}", parsedData.size());
            log.info("parsedData -> {}", parsedData.get(0));

            // 4. 베이스 파일 생성
            Map<String, Object> param = new HashMap<>();
            param.put("digital_twins", baseFileRequest.getDigital_twin_id());
            param.put("digital_objects", baseFileRequest.getDigital_twin_object_id());
            param.put("data", parsedData);
            param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + TimeUtil.getCurrentTimeMillis());
            Map<String, Object> makeDataFileResponse = extractDataKeyValues(dtModelApiService.makeBaseDataFile(type, param));
            log.info("makeDataFileResponse FilePath -> {}, FileName -> {}", makeDataFileResponse.get("file_path"), makeDataFileResponse.get("file_name"));

            response.put("status", GlobalConstant.API_STATUS.SUCCESS);
            response.put("data", parsedData);

            response.put("base_dir", makeDataFileResponse.get("base_dir").toString());
            response.put("file_name", makeDataFileResponse.get("file_name").toString());
            response.put("file_path", makeDataFileResponse.get("file_path").toString());

            // 5. UI 표시에 사용될 Data 추출
            response.put("limit", systemProperties.getLimitCsvRowCount());
            response.put("target_row_count", baseFileRequest.getCount() != null ? baseFileRequest.getCount() <= systemProperties.getLimitCsvRowCount() ? baseFileRequest.getCount() : systemProperties.getLimitCsvRowCount() : systemProperties.getLimitCsvRowCount());

            Map<String, Object> read = FileReader.getInstance().readCSVWithLimit(makeDataFileResponse.get("file_path") + File.separator + makeDataFileResponse.get("file_name"),
                    baseFileRequest.getCount() != null ? baseFileRequest.getCount() <= systemProperties.getLimitCsvRowCount() ? baseFileRequest.getCount() : systemProperties.getLimitCsvRowCount() : systemProperties.getLimitCsvRowCount());
            response.put("header_list", read.get("header_list"));
            response.put("data_list", read.get("data_list"));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping(value = "/base/file/reset/{type}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> resetBaseFile(@RequestBody BaseFileRequest baseFileRequest, @PathVariable ModelType type) throws Exception {
        log.info("resetBaseFile -> {}, {}", baseFileRequest, type);
        Map<String, Object> response = new HashMap<>();
        try {
            // 메타 연계 데이터 파일 재생성 로직
            if (baseFileRequest.getDigital_twin_id() != null && baseFileRequest.getDigital_twin_object_id() != null) {

                // 1. 디렉토리 삭제
                String filePath = type == ModelType.META_MODEL ? systemProperties.getDtMetaFilePath() : systemProperties.getDtEtcMetaFilePath();
                FileUtil.deleteDirectory(new File(filePath.replace("\\", File.separator) + File.separator + "tmp" + File.separator + baseFileRequest.getFile_path().toString()));

                // 2. 메타데이터 Depth 정보 조회
                Map<String, Object> depthSearchParams = new HashMap<>();
                depthSearchParams.put("digital_twins", baseFileRequest.getDigital_twin_id());
                depthSearchParams.put("digital_objects", baseFileRequest.getDigital_twin_object_id());
                Map<String, Object> dataPathInfo = dtModelService.getMetaDataJsonDepth(depthSearchParams);

                String dataPath = null;
                String timePath = null;

                if (dataPathInfo.get("data_depth_1") != null && dataPathInfo.get("data_depth_2") != null) {
                    dataPath = dataPathInfo.get("data_depth_1").toString();
                    timePath = dataPathInfo.get("data_depth_2").toString();
                    log.info("dataPath -> {}, timePath -> {}", dataPath, timePath);
                } else {
                    response.put("status", GlobalConstant.API_STATUS.FAIL);
                    response.put("message", "Data path information is missing.");
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
                }

                // 3. 디지털 트윈 오브젝트 데이터 조회
                List<Map<String, Object>> digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(
                        baseFileRequest.getDigital_twin_id(),
                        baseFileRequest.getDigital_twin_object_id(),
                        baseFileRequest.getCount() != null ? baseFileRequest.getCount() <= systemProperties.getLimitCsvRowCount() ? baseFileRequest.getCount() != 0 ? baseFileRequest.getCount() : systemProperties.getLimitCsvRowCount() : systemProperties.getLimitCsvRowCount() : systemProperties.getLimitCsvRowCount(),
                        baseFileRequest.getFrom() != null ? TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(TimeUtil.parseToYYYYMMDDHHMMSS(false, baseFileRequest.getFrom())) : null,
                        baseFileRequest.getTo() != null ? TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(TimeUtil.parseToYYYYMMDDHHMMSS(true, baseFileRequest.getTo())) : null
                );

                /*if (digitalTwinObjectData.isEmpty()) {
                    response.put("status", GlobalConstant.API_STATUS.FAIL);
                    response.put("message", "No data found for the specified digital twin object.");
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
                }*/

                // 4. 베이스 파일 생성 전 데이터 파싱 및 전처리
                log.info("digitalTwinObjectData Size -> {}", digitalTwinObjectData.size());
                List<Map<String, Object>> parsedData = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, dataPath, timePath);
                log.info("parsedData Size -> {}", parsedData.size());

                // 5. 베이스 파일 생성
                Map<String, Object> param = new HashMap<>();
                param.put("digital_twins", baseFileRequest.getDigital_twin_id());
                param.put("digital_objects", baseFileRequest.getDigital_twin_object_id());
                param.put("data", parsedData);
                param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + TimeUtil.getCurrentTimeMillis());
                Map<String, Object> makeDataFileResponse = extractDataKeyValues(dtModelApiService.makeBaseDataFile(type, param));
                log.info("makeDataFileResponse FilePath -> {}, FileName -> {}", makeDataFileResponse.get("file_path"), makeDataFileResponse.get("file_name"));

                response.put("status", GlobalConstant.API_STATUS.SUCCESS);
                response.put("data", parsedData);

                response.put("base_dir", makeDataFileResponse.get("base_dir").toString());
                response.put("file_name", makeDataFileResponse.get("file_name").toString());
                response.put("file_path", makeDataFileResponse.get("file_path").toString());

                // 5. UI 표시에 사용될 Data 추출
                response.put("limit", systemProperties.getLimitCsvRowCount());
                response.put("target_row_count", baseFileRequest.getCount() <= systemProperties.getLimitCsvRowCount() ? baseFileRequest.getCount() != 0 ? baseFileRequest.getCount() : systemProperties.getLimitCsvRowCount() : systemProperties.getLimitCsvRowCount());

                Map<String, Object> read = FileReader.getInstance().readCSVWithLimit(makeDataFileResponse.get("file_path") + File.separator + makeDataFileResponse.get("file_name"), baseFileRequest.getCount() <= systemProperties.getLimitCsvRowCount() ? baseFileRequest.getCount() != 0 ? baseFileRequest.getCount() : systemProperties.getLimitCsvRowCount() : systemProperties.getLimitCsvRowCount());
                response.put("header_list", read.get("header_list"));
                response.put("data_list", read.get("data_list"));
            }
            // 파일 연계 데이터 파일 재생성 로직
            else {
                int limit = systemProperties.getLimitCsvRowCount();
                //파일 업로드 데이터
                //컬럼 정보
                String filePath = type == ModelType.META_MODEL ? systemProperties.getDtMetaFilePath() : systemProperties.getDtEtcMetaFilePath();
                filePath = filePath.replace("\\", File.separator) + File.separator + "tmp" + File.separator + baseFileRequest.getFile_path() + File.separator + baseFileRequest.getFile_name();
                log.info("filePath -> {}", filePath);

                List<Map<String, Object>> data = FileReader.getInstance().readCSVToListObjectMap(filePath);
                Map<String, Object> param = new HashMap<>();
                param.put("data", data);
                param.put("user_tmp_key", WebConfig.getSessionInfo().getUserId() + TimeUtil.getCurrentTimeMillis());
                Map<String, Object> makeDataFileResponse = extractDataKeyValues(dtModelApiService.makeBaseDataFile(type, param));
                log.info("makeDataFileResponse FilePath -> {}, FileName -> {}", makeDataFileResponse.get("file_path"), makeDataFileResponse.get("file_name"));

                //csv를 읽어들인다
                //가져올 갯수 0은 전체, 나머지는 환경세팅에서
                Map<String, Object> read = FileReader.getInstance().readCSVWithLimit(makeDataFileResponse.get("file_path") + File.separator + makeDataFileResponse.get("file_name"), limit);

                response.put("status", GlobalConstant.API_STATUS.SUCCESS);
                response.put("data", data);
                response.put("base_dir", makeDataFileResponse.get("base_dir").toString());
                response.put("file_name", makeDataFileResponse.get("file_name").toString());
                response.put("file_path", makeDataFileResponse.get("file_path").toString());

                response.put("header_list", read.get("header_list"));
                response.put("data_list", read.get("data_list"));
                response.put("target_row_count", baseFileRequest.getCount() != null ? Math.min(baseFileRequest.getCount(), ((List<List<String>>) read.get("data_list")).size()) : Math.min(((List<List<String>>) read.get("data_list")).size(), limit));
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            response.put("status", GlobalConstant.API_STATUS.FAIL);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}