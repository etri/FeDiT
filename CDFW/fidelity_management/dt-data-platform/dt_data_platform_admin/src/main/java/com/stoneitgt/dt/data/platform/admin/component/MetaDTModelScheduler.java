package com.stoneitgt.dt.data.platform.admin.component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.controller.BaseController;
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.admin.service.MakeMetaModelSchedulerService;
import com.stoneitgt.dt.data.platform.domain.ErrorLog;
import com.stoneitgt.dt.data.platform.util.StringUtil;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.map.HashedMap;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 스케줄 관리 클래스
 *
 * @author yh.kim
 */
@Slf4j
@Component
public class MetaDTModelScheduler extends BaseController {

    //"0 0 * * * *" = the top of every hour of every day.
    //"*/10 * * * * *" = 매 10초마다 실행한다.
    //"0 0 8-10 * * *" = 매일 8, 9, 10시에 실행한다
    //"0 0 6,19 * * *" = 매일 오전 6시, 오후 7시에 실행한다.
    //"0 0/30 8-10 * * *" = 8:00, 8:30, 9:00, 9:30, 10:00 and 10:30 every day.
    //"0 0 9-17 * * MON-FRI" = 오전 9시부터 오후 5시까지 주중(월~금)에 실행한다.
    //"0 0 0 25 12 ?" = every Christmas Day at midnight
    //@Scheduled(cron="0 0 0,12 * * *") 매일 12시 24시
    //@Scheduled(cron="0 30 0 1 * *") 매월 1일 0시 30분
    //1분 주기 : 0 * * * * *
    //5분 주기 : 0 */5 * * * *
    //매일 자정 : 0 0 0 * * *
    //@Scheduled(cron="*/30 * * * * *") 30초마다

    @Autowired
    private MakeMetaModelSchedulerService makeMetaModelSchedulerService;

    @Autowired
    private DTModelService augmentModelService;

    public void executeMakeMetaModel(HashMap<String, Object> job) {
        log.info("job -> {}", job);
        try {
            int modelSeq = Integer.parseInt(job.get("model_seq").toString());
            String modelAlgrm = job.get("model_algrm").toString();

            Map<String, Object> checkParams = new HashedMap<String, Object>();
            checkParams.put("model_seq", modelSeq);
            checkParams.put("ref_tp", "DATA");
            List<Map<String, Object>> setMakeModelOutputColumns = makeMetaModelSchedulerService.setMakeModelOutputColumns(checkParams);
            List<Map<String, Object>> setMakeModelFeatureColumns = makeMetaModelSchedulerService.setMakeModelFeatureColumns(checkParams);
            List<Map<String, Object>> setMakeModelParams = makeMetaModelSchedulerService.setMakeModelParams(checkParams);
            List<Map<String, Object>> setMakeModelFiles = makeMetaModelSchedulerService.setMakeModelFiles(checkParams);
            List<Map<String, Object>> getOriginFiles = makeMetaModelSchedulerService.getOriginFiles(checkParams);

            makeMetaModelSchedulerService.deleteSetRemodel(checkParams);


            ArrayList<String> outputs = new ArrayList<>();
            for (Map<String, Object> outputMap : setMakeModelOutputColumns) {
                String model_col_nm = outputMap.get("model_col_nm").toString();
                outputs.add(model_col_nm);
            }

            ArrayList<String> features = new ArrayList<>();
            for (Map<String, Object> featureMap : setMakeModelFeatureColumns) {
                String model_col_nm = featureMap.get("model_col_nm").toString();
                features.add(model_col_nm);
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("modelID", Integer.parseInt(job.get("model_seq").toString()));
            requestBody.put("indexColumn", job.get("index_trgt_col").toString());
            requestBody.put("outputs", outputs);
            requestBody.put("features", features);

            String json = job.get("user_pprcs_full_stng_value").toString();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(json);
            // preproc_trgt_col 값 추출
            JsonNode json_target_cols = rootNode.get("preproc_property_info").get(0).get("preproc_trgt_col");

            /**
             * 2024-09-10
             * 로컬 테스트 1208154650495552 모델 trgt_col_list 변경
             * 모델 생성할 때와 증강할때 해당 부분이 같음
             * */
            Set<String> target_cols_set = new LinkedHashSet<>(outputs);
            target_cols_set.addAll(features);
            ArrayList<String> target_cols = new ArrayList<>(target_cols_set);

            requestBody.put("trgt_col_list", target_cols);
            requestBody.put("filePath", systemProperties.getDtMetaFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
            requestBody.put("fileName", setMakeModelFiles.get(0).get("file_nm").toString());
            requestBody.put("targetFileName", getOriginFiles.get(0).get("file_nm").toString());

            requestBody.put("modelType", setMakeModelParams.get(0).get("model_algrm").toString().toLowerCase());
            LocalDateTime dateTime = LocalDateTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");
            String formattedDateTime = dateTime.format(formatter);


            String modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
            String modelFileName = null;
            log.info("modelAlgrm -> {}", modelAlgrm);
            if (Objects.equals(modelAlgrm, "SEG_RNN")) {
                /**
                 * SEG RNN은 폴더 형태로 나오기때문에 확장자 제거
                 * */
                modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime;
            } else {
                modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".h5";
            }

            requestBody.put("modelFilePath", systemProperties.getDtMetaFilePath() + "/" + modelFilePath);
            requestBody.put("modelFileName", modelFileName);

            log.info("setMakeModelParams -> {}", setMakeModelParams);

            for (Map<String, Object> itemMap : setMakeModelParams) {
                if (itemMap.containsKey("model_params_item")) {
                    if ("int".equals(itemMap.get("model_params_item_tp").toString())) {
                        requestBody.put((String) itemMap.get("model_params_item"), Integer.parseInt(itemMap.get("model_params_item_value").toString()));
                    } else if ("double".equals(itemMap.get("model_params_item_tp").toString())) {
                        requestBody.put((String) itemMap.get("model_params_item"), Double.parseDouble(itemMap.get("model_params_item_value").toString()));
                    } else {
                        requestBody.put((String) itemMap.get("model_params_item"), itemMap.get("model_params_item_value").toString().toLowerCase());
                    }
                }
            }

            //학습시작시간 업데이트
            makeMetaModelSchedulerService.updateLearningBgngDt(checkParams);
            /**
             * 1208300003284201 Deep AR 기능 추가
             * Deep AR 모델 추가로 인한 URL 분기
             * A1 LSTM, A2 GRU는 현재 로직
             * A3 로직은 그래도지만 URL 바뀜
             * */
            JSONObject result = null;
            switch (modelAlgrm) {
                case "LSTM":
                case "GRU": {
                    try {
                        result = makeMetaModelSchedulerService.createMetaBasicModel(requestBody);
                    } catch (Exception e) {
                        e.printStackTrace();
                        ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PYTHON").errLct("Make Data Twin Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                                .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                        handleProcessError(builder);
                        makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                        return;
                    }
                    break;
                }
                case "DEEP AR": {
                    try {
                        result = makeMetaModelSchedulerService.createMetaDeepARModel(requestBody);
                    } catch (Exception e) {
                        e.printStackTrace();
                        e.printStackTrace();
                        ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PYTHON").errLct("Make Data Twin Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                                .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                        handleProcessError(builder);
                        makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                        return;
                    }
                    break;
                }
                case "NBEATS": {
                    try {
                        result = makeMetaModelSchedulerService.createMetaNBeatsModel(requestBody);
                    } catch (Exception e) {
                        e.printStackTrace();
                        ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PYTHON").errLct("Make Data Twin Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                                .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                        handleProcessError(builder);
                        makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                        return;
                    }
                    break;
                }
                case "SEG_RNN": {
                    try {
                        result = makeMetaModelSchedulerService.createMetaSEG_RNNModel(requestBody);
                    } catch (Exception e) {
                        e.printStackTrace();
                        ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PYTHON").errLct("Make Data Twin Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                                .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                        handleProcessError(builder);
                        makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                        return;
                    }
                    break;
                }
                default: {
                    Exception e = new Exception("Model type is not matched");
                    e.printStackTrace();
                    ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PLATFORM").errLct("Make Data Twin Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                            .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                    handleProcessError(builder);
                    makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                    return;
                }
            }
            try {
                log.info("result -> {}", result);
                if (Integer.parseInt(result.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                    //모델 상태 완료로 변경
                    makeMetaModelSchedulerService.finishMakeModel(modelSeq, "DONE");

                    String setModelFilePath = systemProperties.getDtMetaFilePath() + "/" + modelFilePath + "/" + modelFileName;

                    File modelFile = new File(setModelFilePath);
                    long modelFileSize = modelFile.length();

                    Map<String, Object> modelParam = new HashMap<String, Object>();
                    modelParam.put("model_seq", Integer.parseInt(job.get("model_seq").toString()));
                    modelParam.put("ref_tp", FILE_REF_TYPE.MODEL.toUpperCase());
                    modelParam.put("file_nm", modelFileName);
                    modelParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                    modelParam.put("file_size", modelFileSize);
                    modelParam.put("file_extn", FileUtil.getFileExtension(modelFileName));
                    modelParam.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));

                    int modelCnt = augmentModelService.getCountModelFileInfo(modelParam);

                    if (modelCnt > 0) {
                        log.info("updateModelFileInfo -> {}", modelParam);
                        augmentModelService.updateModelFileInfo(modelParam);
                    } else {
                        augmentModelService.insertModelFileInfo(modelParam);
                    }

                    String testFileName = StringUtil.changeFileName(getOriginFiles.get(0).get("file_nm").toString(), "_test");
                    String setTestFilePath = systemProperties.getDtMetaFilePath() + setMakeModelFiles.get(0).get("file_path").toString() + testFileName;

                    File testFile = new File(setTestFilePath);
                    long testFileSize = testFile.length();

                    /**
                     * 1208734871825271 XAI 적용
                     * LSTM & GRU Algorithm
                     * TODO 2025-06-24
                     * SEG_RNN Algorithm Added
                     * */
                    if (Objects.equals(modelAlgrm, "LSTM") || Objects.equals(modelAlgrm, "GRU") || Objects.equals(modelAlgrm, "SEG_RNN")) {
                        String plot_file_name = (String) new org.json.JSONObject(result.get("data").toString()).getJSONArray("shap_plot").get(0);
                        String waterfall_file_name = (String) new org.json.JSONObject(result.get("data").toString()).getJSONArray("shap_plot").get(2);
                        String plot_bar_file_name = (String) new org.json.JSONObject(result.get("data").toString()).getJSONArray("shap_plot").get(1);

                        // 파일 이름만 추출
                        Path path = Paths.get(plot_file_name);
                        String plotFileName = path.getFileName().toString();
                        File plotFile = new File(plot_file_name);
                        long plotFileSize = plotFile.length();

                        Map<String, Object> XAI_Params = new HashMap<String, Object>();
                        XAI_Params.put("model_seq", Integer.parseInt(job.get("model_seq").toString()));
                        XAI_Params.put("ref_tp", FILE_REF_TYPE.XAI.PLOT);
                        XAI_Params.put("file_nm", plotFileName);
                        XAI_Params.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                        XAI_Params.put("file_size", plotFileSize);
                        XAI_Params.put("file_extn", FileUtil.getFileExtension(plotFileName));
                        XAI_Params.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));
                        int plotCnt = augmentModelService.getCountXAIFileInfo(XAI_Params);
                        log.info("plotCnt -> {}, {}", plotCnt, XAI_Params);
                        if (plotCnt > 0) {
                            log.info("updateXAIFileInfo -> {}", XAI_Params);
                            augmentModelService.updateXAIFileInfo(XAI_Params);
                        } else {
                            augmentModelService.insertXAIFileInfo(XAI_Params);
                        }

                        path = Paths.get(waterfall_file_name);
                        String waterfallFileName = path.getFileName().toString();
                        File waterFallFile = new File(waterfall_file_name);
                        long waterFallFileSize = waterFallFile.length();
                        XAI_Params = new HashMap<String, Object>();
                        XAI_Params.put("model_seq", Integer.parseInt(job.get("model_seq").toString()));
                        XAI_Params.put("ref_tp", FILE_REF_TYPE.XAI.WATERFALL);
                        XAI_Params.put("file_nm", waterfallFileName);
                        XAI_Params.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                        XAI_Params.put("file_size", waterFallFileSize);
                        XAI_Params.put("file_extn", FileUtil.getFileExtension(waterfallFileName));
                        XAI_Params.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));

                        int waterfallCnt = augmentModelService.getCountXAIFileInfo(XAI_Params);
                        log.info("waterfallCnt -> {}, {}", waterfallCnt, XAI_Params);
                        if (waterfallCnt > 0) {
                            log.info("updateXAIFileInfo -> {}", XAI_Params);
                            augmentModelService.updateXAIFileInfo(XAI_Params);
                        } else {
                            augmentModelService.insertXAIFileInfo(XAI_Params);
                        }

                        path = Paths.get(plot_bar_file_name);
                        String barFileName = path.getFileName().toString();
                        File barFile = new File(plot_bar_file_name);
                        long barFileSize = barFile.length();
                        XAI_Params = new HashMap<String, Object>();
                        XAI_Params.put("model_seq", Integer.parseInt(job.get("model_seq").toString()));
                        XAI_Params.put("ref_tp", FILE_REF_TYPE.XAI.BAR);
                        XAI_Params.put("file_nm", barFileName);
                        XAI_Params.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                        XAI_Params.put("file_size", barFileSize);
                        XAI_Params.put("file_extn", FileUtil.getFileExtension(barFileName));
                        XAI_Params.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));

                        int barCnt = augmentModelService.getCountXAIFileInfo(XAI_Params);
                        log.info("barCnt -> {}, {}", barCnt, XAI_Params);
                        if (barCnt > 0) {
                            log.info("updateXAIFileInfo -> {}", XAI_Params);
                            augmentModelService.updateXAIFileInfo(XAI_Params);
                        } else {
                            augmentModelService.insertXAIFileInfo(XAI_Params);
                        }
                    }

                    Map<String, Object> testParam = new HashMap<String, Object>();
                    testParam.put("model_seq", Integer.parseInt(job.get("model_seq").toString()));
                    testParam.put("ref_tp", FILE_REF_TYPE.TEST);
                    testParam.put("file_nm", testFileName);
                    testParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString());
                    testParam.put("file_size", testFileSize);
                    testParam.put("file_extn", FileUtil.getFileExtension(testFileName));
                    testParam.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));

                    int testCnt = augmentModelService.getCountTestFileInfo(testParam);
                    log.info("testCnt -> {}, {}", testCnt, testParam);
                    if (testCnt > 0) {
                        log.info("updateTestFileInfo -> {}", testParam);
                        augmentModelService.updateTestFileInfo(testParam);
                    } else {
                        augmentModelService.insertTestFileInfo(testParam);
                    }

                    String predFileName = StringUtil.changeFileName(getOriginFiles.get(0).get("file_nm").toString(), "_pred");
                    String setPredFilePath = systemProperties.getDtMetaFilePath() + setMakeModelFiles.get(0).get("file_path").toString() + predFileName;

                    File predFile = new File(setPredFilePath);
                    long predFileSize = predFile.length();

                    Map<String, Object> predParam = new HashMap<String, Object>();
                    predParam.put("model_seq", Integer.parseInt(job.get("model_seq").toString()));
                    predParam.put("ref_tp", FILE_REF_TYPE.PREDICTION);
                    predParam.put("file_nm", predFileName);
                    predParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString());
                    predParam.put("file_size", predFileSize);
                    predParam.put("file_extn", FileUtil.getFileExtension(predFileName));
                    predParam.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));

                    int predCnt = augmentModelService.getCountPredFileInfo(predParam);
                    log.info("predCnt -> {}, {}", predCnt, predParam);
                    if (predCnt > 0) {
                        log.info("updatePredFileInfo -> {}", predParam);
                        augmentModelService.updatePredFileInfo(predParam);
                    } else {
                        augmentModelService.insertPredFileInfo(predParam);
                    }
                } else {
                    ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq)
                            .augmentSeq(0).errTp("PYTHON").errLct("Make Data Twin Model").errCd(result.get("code").toString())
                            .errNm(result.get("message").toString()).errCn(result.get("detail").toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                    handleProcessError(builder);
                }
            } catch (Exception e) {
                e.printStackTrace();
                ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PLATFORM").errLct("Make Data Twin Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                        .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                handleProcessError(builder);
            } finally {
                makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
            }
        } catch (Exception e) {
            e.printStackTrace();
            ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(Integer.parseInt(job.get("model_seq").toString())).augmentSeq(0).errTp("PLATFORM").errLct("Make Data Twin Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                    .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
            handleProcessError(builder);
        }
    }

    // 에러 처리 메소드
    public void handleProcessError(ErrorLog.ErrorLogBuilder builder) {
        ErrorLog logEntry = builder.build();
        errorService.saveErrorLog(logEntry);
        makeMetaModelSchedulerService.finishMakeModel(logEntry.getModelSeq(), logEntry.getStatus());
    }
}