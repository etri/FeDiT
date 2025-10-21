package com.stoneitgt.dt.data.platform.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.service.*;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.enums.ModelType;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.util.*;

@Slf4j
@Controller
@RequiredArgsConstructor
@RequestMapping("/dt/dataset")
public class DataSetController extends BaseController {

    private final FilesService filesService;
    private final DTModelService dtModelService;
    private final DTEtcModelService dtEtcModelService;
    private final DTModelApiService dtModelApiService;
    private final JSONPropertyService jsonPropertyService;

    @PostMapping("/load/preprocFile/{type}")
    @ResponseBody
    public Map<String, Object> loadPreprocFile(@RequestBody Map<String, Object> params, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();

        String formType = params.get("form_type").toString();
        String file_path = null;

        switch (type) {
            case META_ETC_MODEL: {
                if ("I".equals(formType)) {
                    file_path = systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + "/tmp/" + params.get("file_path").toString();
                } else {
                    file_path = systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + File.separator + params.get("file_path").toString();
                }
                break;
            }
            case META_MODEL: {
                if ("I".equals(formType)) {
                    file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + "/tmp/" + params.get("file_path").toString();
                } else {
                    file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + File.separator + params.get("file_path").toString();
                }
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }

        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSV(file_path + File.separator + params.get("file_name").toString());

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("header_list", resultCsv.get("header_list"));
        result.put("data_list", resultCsv.get("data_list"));

        /**
         * Server Side Render Parameter
         * */
        result.put("file_path", file_path);
        result.put("file_name", params.get("file_name").toString());
        return result;
    }

    @PostMapping(value = "/csvFileUpload/{type}")
    @ResponseBody
    public Map<String, Object> csvFileUpload(@ModelAttribute AugmentModel augmentModel, HttpServletRequest request, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> param = new HashMap<>();

        //modal 에서 선택한 인덱스컬럼, 시간값을 python 에 보낸 후 가상으로 셀렉트 해온 데이터를 생성, 파일명은 java에서 우선 보냄
        String user_tmp_key = WebConfig.getSessionInfo().getUserId() + TimeUtil.getCurrentTimeMillis();
        switch (type) {
            case META_ETC_MODEL: {
                if (augmentModel.getAttachFilesCsv() != null && augmentModel.getAttachFilesCsv().size() > 0) {
                    MultipartFile attachFile = augmentModel.getAttachFilesCsv().get(0);
                    param = filesService.saveNewEtcDtFiles(attachFile, user_tmp_key);
                    param.put("user_tmp_key", user_tmp_key);
                }
                break;
            }
            case META_MODEL: {
                if (augmentModel.getAttachFilesCsv() != null && augmentModel.getAttachFilesCsv().size() > 0) {
                    MultipartFile attachFile = augmentModel.getAttachFilesCsv().get(0);
                    param = filesService.saveNewDtFiles(attachFile, user_tmp_key);
                    param.put("user_tmp_key", user_tmp_key);
                }
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        ResponseEntity<?> resultOriginFileSet = dtModelApiService.makeUserUploadBaseDataFile(type, param);

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultOriginFileSet);

        //csv를 읽어들인다
        Map<String, Object> resultCsv = FileReader.getInstance().readCSV(resultJson.get("file_path") + File.separator + resultJson.get("file_name"));

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("base_dir", resultJson.get("base_dir").toString());
        result.put("file_name", resultJson.get("file_name").toString());
        result.put("file_path", resultJson.get("file_path").toString());
        result.put("header_list", resultCsv.get("header_list"));
        result.put("data_list", resultCsv.get("data_list"));
        int limit = ((List<List<String>>) resultCsv.get("data_list")).size();
        result.put("limit", limit);
        result.put("target_row_count", limit);
        return result;
    }

    @PostMapping(value = "/checkIndexTimeColumn/{type}")
    @ResponseBody
    public Map<String, Object> checkIndexTimeColumn(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("checkIndexTimeColumn param : " + param.toString());
        ResponseEntity<?> checkIndexTimeColumn = null;
        String responseBody = null;
        switch (type) {
            case META_ETC_MODEL:
            case META_MODEL: {
                checkIndexTimeColumn = dtModelApiService.checkIndexTimeColumn(type, param);
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        responseBody = checkIndexTimeColumn.getBody().toString();

        // JSON 문자열을 Map으로 변환
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);

        // 결과를 저장할 Map 생성
        result.put("data", responseMap);
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    @PostMapping("/getDataTimeCheck/{type}")
    @ResponseBody
    public Map<String, Object> getDataTimeCheck(@RequestBody Map<String, Object> params, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();
        String file_path = null;
        switch (type) {
            case META_ETC_MODEL: {
                file_path = systemProperties.getDtEtcMetaFilePath() + "/tmp/" + params.get("file_path").toString();
                break;
            }
            case META_MODEL: {
                file_path = systemProperties.getDtMetaFilePath() + "/tmp/" + params.get("file_path").toString();
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        String file_name = params.get("file_name").toString();
        Map<String, Object> setParam = new HashMap<String, Object>();
        setParam.put("file_path", file_path);
        setParam.put("file_name", file_name);
        setParam.put("index_trgt_col", params.get("index_trgt_col").toString());

        try {
            log.info("getDataTimeCheck setParam -> {}", setParam);
            ResponseEntity<?> checkTime = dtModelApiService.getIndexColumnTimeCheck(setParam);

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", checkTime.getBody());
        } catch (Exception e) {
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "DataTimeCheck");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping(value = "/getBaseDataSetRangeRow/{type}")
    @ResponseBody
    public Map<String, Object> getBaseDataSetRangeRow(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        ResponseEntity<?> resultBaseDataSetRangeRow = null;
        switch (type) {
            case META_ETC_MODEL:
            case META_MODEL: {
                resultBaseDataSetRangeRow = dtModelApiService.makeBaseDataSetRangeRow(type, param);
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }

        //결과 json을 먼저 풀고
        Map<String, Object> resultJson = extractDataKeyValues(resultBaseDataSetRangeRow);

        //csv를 읽어들인다
        //가져올 갯수 0은 전체, 나머지는 환경세팅에서
        FileReader fileReader = FileReader.getInstance();
        Map<String, Object> resultCsv = fileReader.readCSV(resultJson.get("file_path") + File.separator + resultJson.get("base_file_nm_set_range_row"));

        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        result.put("index_trgt_col", resultJson.get("index_trgt_col").toString());
        result.put("target_start_date", resultJson.get("target_start_date").toString());
        result.put("target_end_date", resultJson.get("target_end_date").toString());
        result.put("base_file_nm_set_range_row", resultJson.get("base_file_nm_set_range_row").toString());
        result.put("file_path", resultJson.get("file_path"));
        result.put("file_name", resultJson.get("base_file_nm_set_range_row"));
        result.put("target_row_count", resultJson.get("target_row_count").toString());
        result.put("header_list", resultCsv.get("header_list"));
        result.put("data_list", resultCsv.get("data_list"));
        return result;
    }

    @PostMapping(value = "/getBaseDataSetRangeCol/{type}")
    @ResponseBody
    public Map<String, Object> getBaseDataSetRangeCol(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> paramSet = jsonPropertyService.propertyParsingMap(param.get("param").toString());
        paramSet.put("form_type", param.get("form_type").toString());
        paramSet.put("last_file_path", param.get("last_file_path").toString());
        try {
            ResponseEntity<?> resultBaseDataSetRangeCol = null;

            switch (type) {
                case META_ETC_MODEL:
                case META_MODEL: {
                    resultBaseDataSetRangeCol = dtModelApiService.makeBaseDataSetRangeCol(type, paramSet);
                    break;
                }
                default:
                    throw new RuntimeException("Model type is mismatched");
            }
            //결과 json을 먼저 풀고
            Map<String, Object> resultJson = extractDataKeyValues(resultBaseDataSetRangeCol);
            FileReader fileReader = FileReader.getInstance();
            Map<String, Object> resultCsv = fileReader.readCSV(resultJson.get("file_path") + File.separator + resultJson.get("base_file_nm_set_range_col"));

            result.put("base_file_nm_set_range_col", resultJson.get("preproc_trgt_col").toString());
            result.put("base_file_nm_set_range_col", resultJson.get("base_file_nm_set_range_col").toString());
            result.put("header_list", resultCsv.get("header_list"));
            result.put("data_list", resultCsv.get("data_list"));
            result.put("file_path", resultJson.get("file_path"));
            result.put("file_name", resultJson.get("base_file_nm_set_range_col"));
            result.put("target_row_count", ((List<List<String>>) resultCsv.get("data_list")).size());
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "BaseDataSetRangeCol");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping(value = "/getDataSetInfo/{type}")
    @ResponseBody
    public Map<String, Object> getDataSetInfo(@RequestBody Map<String, Object> param, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();

        try {
            ResponseEntity<?> resultDataSetColumnListInfo = null;
            switch (type) {
                case META_ETC_MODEL:
                case META_MODEL: {
                    resultDataSetColumnListInfo = dtModelApiService.getDataSetColumnListInfo(type, param);
                    break;
                }
                default:
                    throw new RuntimeException("Model type is mismatched");
            }
            if (param.get("proc_type") != null && "outlier".equals(param.get("proc_type"))) {
                Map<String, Object> etcParams = new HashMap<String, Object>();
                etcParams.put("session_userseq", String.valueOf(authenticationFacade.getLoginUserSeq()));
                List<Map<String, Object>> etc_outlier_list = dtEtcModelService.getEtcAEModelList(etcParams);
                result.put("etc_outlier_list", etc_outlier_list);
            }
            if (param.get("proc_type") != null && "interpolate".equals(param.get("proc_type"))) {
                Map<String, Object> etcParams = new HashMap<String, Object>();
                etcParams.put("session_userseq", String.valueOf(authenticationFacade.getLoginUserSeq()));
                List<Map<String, Object>> etc_interpolate_list = new ArrayList<>();

                List<Map<String, Object>> etc_rf_interpolate_list = dtEtcModelService.getEtcRFModelList(etcParams);
                for (Map<String, Object> map : etc_rf_interpolate_list) {
                    DTModelEtcMetaUserItem item = dtEtcModelService.selectMetaUserItem(Integer.parseInt(map.get("etc_model_seq").toString()));
                    map.put("user_pprcs_full_stng_value", item.getUserPprcsFullStngValue());
                }

                // etc_rf_interpolate_list를 etc_interpolate_list에 추가
                etc_interpolate_list.addAll(etc_rf_interpolate_list);

                List<Map<String, Object>> etc_brits_interpolate_list = dtEtcModelService.getEtcBritsModelList(etcParams);
                for (Map<String, Object> map : etc_brits_interpolate_list) {
                    DTModelEtcMetaUserItem item = dtEtcModelService.selectMetaUserItem(Integer.parseInt(map.get("etc_model_seq").toString()));
                    map.put("user_pprcs_full_stng_value", item.getUserPprcsFullStngValue());
                }

                // etc_brits_interpolate_list를 etc_interpolate_list에 추가
                etc_interpolate_list.addAll(etc_brits_interpolate_list);

                List<Map<String, Object>> etc_naomi_interpolate_list = dtEtcModelService.getEtcNaomiModelList(etcParams);
                for (Map<String, Object> map : etc_naomi_interpolate_list) {
                    DTModelEtcMetaUserItem item = dtEtcModelService.selectMetaUserItem(Integer.parseInt(map.get("etc_model_seq").toString()));
                    map.put("user_pprcs_full_stng_value", item.getUserPprcsFullStngValue());
                }

                // etc_naomi_interpolate_list를 etc_interpolate_list에 추가
                etc_interpolate_list.addAll(etc_naomi_interpolate_list);

                result.put("etc_interpolate_list", etc_interpolate_list);
            }

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            result.put("data", resultDataSetColumnListInfo.getBody());
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "DataSet Info");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
            return result;
        }
    }

    @PostMapping("/delete/files/{type}")
    @ResponseBody
    public Map<String, Object> deleteFiles(@RequestBody Map<String, Object> request, @PathVariable ModelType type) {
        Map<String, Object> result = new HashMap<String, Object>();
        try {
            List<String> filesList = (List<String>) request.get("files");
            String base_dir = null;
            switch (type) {
                case META_ETC_MODEL: {
                    base_dir = systemProperties.getDtEtcMetaFilePath() + "/tmp/" + request.get("file_path").toString();
                    break;
                }
                case META_MODEL: {
                    base_dir = systemProperties.getDtMetaFilePath() + "/tmp/" + request.get("file_path").toString();
                    break;
                }
                default:
                    throw new RuntimeException("Model type is mismatched");
            }
            for (String file : filesList) {
                FileUtil.delete(base_dir + "/" + file);
            }
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
        } catch (Exception e) {
            e.printStackTrace();
            /**
             * 에러 타입 errTp
             * 에러코드 errCd
             * 에러이름 errNm
             * 에러영역 errLct
             * 에러 날짜 errRegDt
             * 에러 내용 errCn
             * */
            result.put("result_code", GlobalConstant.API_STATUS.FAIL);
            result.put("errTp", "PLATFORM");
            result.put("errCd", GlobalConstant.API_STATUS.INTERNAL_SERVER_ERROR);
            result.put("errNm", "INTERNAL_SERVER_ERROR");
            result.put("errLct", "Delete Reference Temp File");
            result.put("errRegDt", TimeUtil.getCurrentDateTime());
            result.put("errCn", e.getMessage());
        }
        return result;
    }

    @PostMapping(value = "/correlation/{corType}/{type}")
    @ResponseBody
    public Map<String, Object> getCorrelation(@RequestBody Map<String, Object> param, @PathVariable String corType, @PathVariable ModelType type) throws Exception {
        Map<String, Object> result = new HashMap<>();
        log.info("getCorrelation -> {}, {}", param, corType);
        int modelSeq = Integer.parseInt(param.get("model_seq").toString());
        String filePath = null;
        switch (type) {
            case META_ETC_MODEL: {
                DTModelEtc dtModelEtc = dtEtcModelService.getAugmentModel(modelSeq);
                filePath = systemProperties.getDtEtcMetaFilePath().replace("\\", "/") + dtModelEtc.getFilePath();
                break;
            }
            case META_MODEL: {
                DTModel dtModel = dtModelService.getAugmentModel(modelSeq);
                filePath = systemProperties.getDtMetaFilePath().replace("\\", "/") + dtModel.getFilePath();
                break;
            }
            default:
                throw new RuntimeException("Model type is mismatched");
        }
        String fileName = param.get("file_name").toString();
        String indexTrgtCol = param.get("index_trgt_col").toString();
        ArrayList<String> headers = (ArrayList<String>) param.get("checkHeader");

        /**
         * Python 상관관계 API 파라미터
         * */
        HashMap<String, Object> correlationParameters = new HashMap<>();
        correlationParameters.put("file_path", filePath);
        correlationParameters.put("file_name", fileName);
        correlationParameters.put("index_trgt_col", indexTrgtCol);
        correlationParameters.put("columns", headers);
        correlationParameters.put("type", corType);

        ResponseEntity<?> correlationSet = null;
        JSONObject correlationObj = null;

        switch (corType) {
            case "pandas": {
                String method = param.get("method").toString();
                correlationParameters.put("method", method);
                correlationSet = dtModelApiService.correlation(correlationParameters);
                break;
            }
            case "ddtw": {
                correlationSet = dtModelApiService.correlation(correlationParameters);
                break;
            }
            case "granger": {
                if (param.get("maxlag") != null) {
                    int maxlag = Integer.parseInt(param.get("maxlag").toString());
                    correlationParameters.put("maxlag", maxlag);
                }
                correlationSet = dtModelApiService.correlation(correlationParameters);
                break;
            }
            default:
                Exception e = new Exception("Calculate Correlation Process");
                errorService.saveErrorLog(ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PLATFORM").errLct("Calculate Correlation Process").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                        .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(authenticationFacade.getLoginUserSeq()).loginUserIp(authenticationFacade.getLoginUserIp()).status("FAIL").build());
                result.put("result_code", GlobalConstant.API_STATUS.FAIL);
                return result;
        }

        if (correlationSet != null && correlationSet.getBody() != null) {
            correlationObj = new JSONObject(Objects.requireNonNull(correlationSet.getBody()).toString());
        }

        if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
            result.put("result_code", GlobalConstant.API_STATUS.SUCCESS);
            JSONObject dataObj = correlationObj.getJSONObject("data");

            // JSONArray → Java List로 변환
            List<Object> dataArr = dataObj.getJSONArray("data").toList();
            List<Object> xdataArr = dataObj.getJSONArray("xdata").toList();
            List<Object> ydataArr = dataObj.getJSONArray("ydata").toList();

            // JSONObject 대신 Map 사용
            Map<String, Object> payload = new HashMap<>();
            payload.put("data", dataArr);
            payload.put("xdata", xdataArr);
            payload.put("ydata", ydataArr);

            result.put("correlation_data", payload);
        }
        log.info("correlation_data -> {}", result.get("correlation_data"));
        return result;
    }
}