package com.stoneitgt.dt.data.platform.admin.component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.controller.BaseController;
import com.stoneitgt.dt.data.platform.admin.service.MakeMetaEtcModelSchedulerService;
import com.stoneitgt.dt.data.platform.domain.ErrorLog;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.map.HashedMap;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.File;
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
public class MetaDTEtcModelScheduler extends BaseController {

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
    private MakeMetaEtcModelSchedulerService makeMetaEtcModelSchedulerService;

    public void executeMakeMetaEtcModel(HashMap<String, Object> job) {
        log.info("job -> {}", job);
        try {
            int modelSeq = Integer.parseInt(job.get("etc_model_seq").toString());
            Map<String, Object> checkParams = new HashedMap<String, Object>();
            checkParams.put("etc_model_seq", modelSeq);
            checkParams.put("ref_tp", "DATA");
            List<Map<String, Object>> setMakeModelOutputColumns = makeMetaEtcModelSchedulerService.setMakeModelOutputColumns(checkParams);
            List<Map<String, Object>> setMakeModelParams = makeMetaEtcModelSchedulerService.setMakeModelParams(checkParams);
            List<Map<String, Object>> setMakeModelFiles = makeMetaEtcModelSchedulerService.setMakeModelFiles(checkParams);
            List<Map<String, Object>> getOriginFiles = makeMetaEtcModelSchedulerService.getOriginFiles(checkParams);
            makeMetaEtcModelSchedulerService.deleteSetRemodel(checkParams);

            ArrayList<String> outputs = new ArrayList<>();
            for (Map<String, Object> outputMap : setMakeModelOutputColumns) {
                String model_col_nm = outputMap.get("model_col_nm").toString();
                outputs.add(model_col_nm);
            }

            String modelType = setMakeModelParams.get(0).get("model_algrm").toString().toLowerCase();
            String json = job.get("user_pprcs_full_stng_value").toString();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(json);
            Set<String> target_cols_set = new LinkedHashSet<>(outputs);
            ArrayList<String> target_cols = new ArrayList<>(target_cols_set);
            LocalDateTime dateTime = LocalDateTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");
            String formattedDateTime = dateTime.format(formatter);
            String modelFilePath, modelFileName;
            log.info("rootNode -> {}", rootNode);
            String index_trgt_col = rootNode.get("preproc_property_info").get(0).get("index_trgt_col").asText();
            Map<String, Object> requestBody = new HashMap<>();
            switch (modelType.toUpperCase()) {
                case "RANDOM FOREST": {
                    ArrayList<String> features = new ArrayList<>();
                    List<Map<String, Object>> setMakeModelFeatureColumns = makeMetaEtcModelSchedulerService.setMakeModelFeatureColumns(checkParams);
                    for (Map<String, Object> featureMap : setMakeModelFeatureColumns) {
                        String model_col_nm = featureMap.get("model_col_nm").toString();
                        features.add(model_col_nm);
                    }
                    target_cols_set.addAll(features);
                    target_cols = new ArrayList<>(target_cols_set);
                    log.info("target_cols -> {}", target_cols);

                    requestBody.put("modelID", Integer.parseInt(job.get("etc_model_seq").toString()));
                    requestBody.put("outputs", outputs);
                    requestBody.put("features", features);
                    requestBody.put("trgt_col_list", target_cols);
                    requestBody.put("filePath", systemProperties.getDtEtcMetaFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
                    requestBody.put("fileName", setMakeModelFiles.get(0).get("file_nm").toString());
                    requestBody.put("targetFileName", getOriginFiles.get(0).get("file_nm").toString());

                    modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
                    modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".pkl";

                    requestBody.put("modelFilePath", systemProperties.getDtEtcMetaFilePath() + "/" + modelFilePath);
                    requestBody.put("modelFileName", modelFileName);

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
                    if (requestBody.containsKey("test_size")) {
                        requestBody.put("testSize", requestBody.get("test_size"));
                        requestBody.remove("test_size");
                    }
                    log.info("requestBody -> {}", requestBody);
                    //학습시작시간 업데이트
                    makeMetaEtcModelSchedulerService.updateLearningBgngDt(checkParams);
                    try {
                        String responseBody = makeMetaEtcModelSchedulerService.createModelGenerater_randomForest(requestBody);
                        JSONParser parser = new JSONParser();
                        JSONObject result = (JSONObject) parser.parse(responseBody);
                        if (Integer.parseInt(result.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                            log.info("responseBody -> {}", responseBody);
                            log.info("AI 모델 {}번 생성 성공", modelSeq);
                            //모델 상태 완료로 변경
                            makeMetaEtcModelSchedulerService.finishMakeModel(modelSeq, "DONE");
                            String setModelFilePath = systemProperties.getDtEtcMetaFilePath() + "/" + modelFilePath + "/" + modelFileName;
                            File modelFile = new File(setModelFilePath);
                            long modelFileSize = modelFile.length();
                            Map<String, Object> modelParam = new HashMap<String, Object>();
                            modelParam.put("etc_model_seq", Integer.parseInt(job.get("etc_model_seq").toString()));
                            modelParam.put("ref_tp", FILE_REF_TYPE.MODEL.toUpperCase());
                            modelParam.put("file_nm", modelFileName);
                            modelParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                            modelParam.put("file_size", modelFileSize);
                            modelParam.put("file_extn", FileUtil.getFileExtension(modelFileName));
                            modelParam.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));
                            int modelCnt = makeMetaEtcModelSchedulerService.getCountModelFileInfo(modelParam);
                            if (modelCnt > 0) {
                                makeMetaEtcModelSchedulerService.updateModelFileInfo(modelParam);
                            } else {
                                makeMetaEtcModelSchedulerService.insertModelFileInfo(modelParam);
                            }
                        } else {
                            log.info("AI 모델 {}번 생성 실패", modelSeq);
                            ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq)
                                    .augmentSeq(0).errTp("PYTHON").errLct("Make AI Model").errCd(result.get("code").toString())
                                    .errNm(result.get("message").toString()).errCn(result.get("detail").toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                            handleProcessError(builder);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PLATFORM").errLct("Make AI Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                                .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                        handleProcessError(builder);
                    } finally {
                        makeMetaEtcModelSchedulerService.updateLearningDndDt(checkParams);
                    }
                    break;
                }
                case "AUTO ENCODER": {
                    target_cols = new ArrayList<>(target_cols_set);
                    requestBody.put("modelID", Integer.parseInt(job.get("etc_model_seq").toString()));
                    requestBody.put("output_cols", outputs);
                    log.info("target_cols -> {}", target_cols);
                    requestBody.put("trgt_col_list", target_cols);
                    requestBody.put("file_path", systemProperties.getDtEtcMetaFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
                    requestBody.put("file_name", setMakeModelFiles.get(0).get("file_nm").toString());
                    requestBody.put("target_file_name", getOriginFiles.get(0).get("file_nm").toString());
                    requestBody.put("modelType", modelType);

                    modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
                    modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".h5";

                    requestBody.put("model_file_path", systemProperties.getDtEtcMetaFilePath() + "/" + modelFilePath);
                    requestBody.put("model_file_name", modelFileName);

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
                    makeMetaEtcModelSchedulerService.updateLearningBgngDt(checkParams);

                    try {
                        String responseBody = makeMetaEtcModelSchedulerService.processorCreateAELearningModel(requestBody);
                        JSONParser parser = new JSONParser();
                        JSONObject result = (JSONObject) parser.parse(responseBody);
                        if (Integer.parseInt(result.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                            log.info("responseBody -> {}", responseBody);
                            log.info("AI 모델 {}번 생성 성공", modelSeq);
                            //모델 상태 완료로 변경
                            makeMetaEtcModelSchedulerService.finishMakeModel(modelSeq, "DONE");
                            String setModelFilePath = systemProperties.getDtEtcMetaFilePath() + "/" + modelFilePath + "/" + modelFileName;
                            File modelFile = new File(setModelFilePath);
                            long modelFileSize = modelFile.length();
                            Map<String, Object> modelParam = new HashMap<String, Object>();
                            modelParam.put("etc_model_seq", Integer.parseInt(job.get("etc_model_seq").toString()));
                            modelParam.put("ref_tp", FILE_REF_TYPE.MODEL.toUpperCase());
                            modelParam.put("file_nm", modelFileName);
                            modelParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                            modelParam.put("file_size", modelFileSize);
                            modelParam.put("file_extn", FileUtil.getFileExtension(modelFileName));
                            modelParam.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));
                            int modelCnt = makeMetaEtcModelSchedulerService.getCountModelFileInfo(modelParam);
                            if (modelCnt > 0) {
                                makeMetaEtcModelSchedulerService.updateModelFileInfo(modelParam);
                            } else {
                                makeMetaEtcModelSchedulerService.insertModelFileInfo(modelParam);
                            }
                        } else {
                            log.info("AI 모델 {}번 생성 실패", modelSeq);
                            ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq)
                                    .augmentSeq(0).errTp("PYTHON").errLct("Make AI Model").errCd(result.get("code").toString())
                                    .errNm(result.get("message").toString()).errCn(result.get("detail").toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                            handleProcessError(builder);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PLATFORM").errLct("Make AI Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                                .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                        handleProcessError(builder);
                    } finally {
                        makeMetaEtcModelSchedulerService.updateLearningDndDt(checkParams);
                    }
                    break;
                }
                case "BRITS": {
                    target_cols = new ArrayList<>(target_cols_set);
                    log.info("target_cols -> {}", target_cols);
                    requestBody.put("modelID", Integer.parseInt(job.get("etc_model_seq").toString()));
                    requestBody.put("outputs", outputs);
                    requestBody.put("trgt_col_list", target_cols);
                    requestBody.put("indexColumn", index_trgt_col);
                    requestBody.put("filePath", systemProperties.getDtEtcMetaFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
                    requestBody.put("fileName", setMakeModelFiles.get(0).get("file_nm").toString());
                    requestBody.put("targetFileName", getOriginFiles.get(0).get("file_nm").toString());

                    modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
                    modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".pkl";

                    requestBody.put("modelFilePath", systemProperties.getDtEtcMetaFilePath() + "/" + modelFilePath);
                    requestBody.put("modelFileName", modelFileName);

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

                    if (requestBody.containsKey("test_size")) {
                        requestBody.put("testSize", requestBody.get("test_size"));
                        requestBody.remove("test_size");
                    }

                    if (requestBody.containsKey("data_size")) {
                        requestBody.put("dataSize", requestBody.get("data_size"));
                        requestBody.remove("data_size");
                    }

                    if (requestBody.containsKey("time_steps")) {
                        requestBody.put("timeSteps", requestBody.get("time_steps"));
                        requestBody.remove("time_steps");
                    }

                    if (requestBody.containsKey("window_size")) {
                        requestBody.put("windowSize", requestBody.get("window_size"));
                        requestBody.remove("window_size");
                    }

                    if (requestBody.containsKey("batch_size")) {
                        requestBody.put("batchSize", requestBody.get("batch_size"));
                        requestBody.remove("batch_size");
                    }

                    log.info("requestBody -> {}", requestBody);
                    //학습시작시간 업데이트
                    makeMetaEtcModelSchedulerService.updateLearningBgngDt(checkParams);
                    try {
                        String responseBody = makeMetaEtcModelSchedulerService.createModelGenerater_brits_ori(requestBody);
                        JSONParser parser = new JSONParser();
                        JSONObject result = (JSONObject) parser.parse(responseBody);
                        if (Integer.parseInt(result.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                            log.info("responseBody -> {}", responseBody);
                            log.info("AI 모델 {}번 생성 성공", modelSeq);
                            //모델 상태 완료로 변경
                            makeMetaEtcModelSchedulerService.finishMakeModel(modelSeq, "DONE");
                            String setModelFilePath = systemProperties.getDtEtcMetaFilePath() + "/" + modelFilePath + "/" + modelFileName;
                            File modelFile = new File(setModelFilePath);
                            long modelFileSize = modelFile.length();
                            Map<String, Object> modelParam = new HashMap<String, Object>();
                            modelParam.put("etc_model_seq", Integer.parseInt(job.get("etc_model_seq").toString()));
                            modelParam.put("ref_tp", FILE_REF_TYPE.MODEL.toUpperCase());
                            modelParam.put("file_nm", modelFileName);
                            modelParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                            modelParam.put("file_size", modelFileSize);
                            modelParam.put("file_extn", FileUtil.getFileExtension(modelFileName));
                            modelParam.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));
                            int modelCnt = makeMetaEtcModelSchedulerService.getCountModelFileInfo(modelParam);
                            if (modelCnt > 0) {
                                makeMetaEtcModelSchedulerService.updateModelFileInfo(modelParam);
                            } else {
                                makeMetaEtcModelSchedulerService.insertModelFileInfo(modelParam);
                            }
                        } else {
                            log.info("AI 모델 {}번 생성 실패", modelSeq);
                            ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq)
                                    .augmentSeq(0).errTp("PYTHON").errLct("Make AI Model").errCd(result.get("code").toString())
                                    .errNm(result.get("message").toString()).errCn(result.get("detail").toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                            handleProcessError(builder);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PLATFORM").errLct("Make AI Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                                .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                        handleProcessError(builder);
                    } finally {
                        makeMetaEtcModelSchedulerService.updateLearningDndDt(checkParams);
                    }
                    break;
                }
                case "NAOMI": {
                    target_cols = new ArrayList<>(target_cols_set);
                    log.info("target_cols -> {}", target_cols);
                    requestBody.put("modelID", Integer.parseInt(job.get("etc_model_seq").toString()));
                    requestBody.put("outputs", outputs);
                    requestBody.put("trgt_col_list", target_cols);
                    requestBody.put("indexColumn", index_trgt_col);
                    requestBody.put("filePath", systemProperties.getDtEtcMetaFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
                    requestBody.put("fileName", setMakeModelFiles.get(0).get("file_nm").toString());
                    requestBody.put("targetFileName", getOriginFiles.get(0).get("file_nm").toString());

                    modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
                    modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".pth";

                    requestBody.put("modelFilePath", systemProperties.getDtEtcMetaFilePath() + "/" + modelFilePath);
                    requestBody.put("modelFileName", modelFileName);

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

                    if (requestBody.containsKey("test_size")) {
                        requestBody.put("testSize", requestBody.get("test_size"));
                        requestBody.remove("test_size");
                    }

                    if (requestBody.containsKey("data_size")) {
                        requestBody.put("dataSize", requestBody.get("data_size"));
                        requestBody.remove("data_size");
                    }

                    if (requestBody.containsKey("time_steps")) {
                        requestBody.put("timeSteps", requestBody.get("time_steps"));
                        requestBody.remove("time_steps");
                    }

                    if (requestBody.containsKey("window_size")) {
                        requestBody.put("windowSize", requestBody.get("window_size"));
                        requestBody.remove("window_size");
                    }

                    if (requestBody.containsKey("batch_size")) {
                        requestBody.put("batchSize", requestBody.get("batch_size"));
                        requestBody.remove("batch_size");
                    }

                    /**
                     * Naomi 추가 파라미터 (기본값, 터짐 방지)
                     * missingGroup, missingRange
                     * */
                    requestBody.put("missingGroup", 4);
                    ArrayList<Object> arrayList = new ArrayList<>();
                    arrayList.add(10);
                    arrayList.add(30);
                    requestBody.put("missingRange", arrayList);

                    log.info("requestBody -> {}", requestBody);
                    //학습시작시간 업데이트
                    makeMetaEtcModelSchedulerService.updateLearningBgngDt(checkParams);
                    try {
                        String responseBody = makeMetaEtcModelSchedulerService.createModelGenerater_naomi(requestBody);
                        JSONParser parser = new JSONParser();
                        JSONObject result = (JSONObject) parser.parse(responseBody);
                        if (Integer.parseInt(result.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                            log.info("responseBody -> {}", responseBody);
                            log.info("AI 모델 {}번 생성 성공", modelSeq);
                            //모델 상태 완료로 변경
                            makeMetaEtcModelSchedulerService.finishMakeModel(modelSeq, "DONE");
                            String setModelFilePath = systemProperties.getDtEtcMetaFilePath() + "/" + modelFilePath + "/" + modelFileName;
                            File modelFile = new File(setModelFilePath);
                            long modelFileSize = modelFile.length();
                            Map<String, Object> modelParam = new HashMap<String, Object>();
                            modelParam.put("etc_model_seq", Integer.parseInt(job.get("etc_model_seq").toString()));
                            modelParam.put("ref_tp", FILE_REF_TYPE.MODEL.toUpperCase());
                            modelParam.put("file_nm", modelFileName);
                            modelParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                            modelParam.put("file_size", modelFileSize);
                            modelParam.put("file_extn", FileUtil.getFileExtension(modelFileName));
                            modelParam.put("reg_user_seq", Integer.parseInt(job.get("reg_user_seq").toString()));
                            int modelCnt = makeMetaEtcModelSchedulerService.getCountModelFileInfo(modelParam);
                            if (modelCnt > 0) {
                                makeMetaEtcModelSchedulerService.updateModelFileInfo(modelParam);
                            } else {
                                makeMetaEtcModelSchedulerService.insertModelFileInfo(modelParam);
                            }
                        } else {
                            log.info("AI 모델 {}번 생성 실패", modelSeq);
                            ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq)
                                    .augmentSeq(0).errTp("PYTHON").errLct("Make AI Model").errCd(result.get("code").toString())
                                    .errNm(result.get("message").toString()).errCn(result.get("detail").toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                            handleProcessError(builder);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PLATFORM").errLct("Make AI Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                                .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                        handleProcessError(builder);
                    } finally {
                        makeMetaEtcModelSchedulerService.updateLearningDndDt(checkParams);
                    }
                    break;
                }
                default:
                    Exception e = new Exception("Model type is not matched");
                    e.printStackTrace();
                    ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(modelSeq).augmentSeq(0).errTp("PLATFORM").errLct("Make AI Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                            .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
                    handleProcessError(builder);
                    break;
            }
        } catch (Exception e) {
            e.printStackTrace();
            ErrorLog.ErrorLogBuilder builder = ErrorLog.builder().modelSeq(Integer.parseInt(job.get("etc_model_seq").toString())).augmentSeq(0).errTp("PLATFORM").errLct("Make AI Model").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()))
                    .errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).loginUserSeq(Integer.parseInt(job.get("reg_user_seq").toString())).status("FAIL");
            handleProcessError(builder);
        }
    }

    // 에러 처리 메소드
    private void handleProcessError(ErrorLog.ErrorLogBuilder builder) {
        ErrorLog logEntry = builder.build();
        errorService.saveErrorLog(logEntry);
        makeMetaEtcModelSchedulerService.finishMakeModel(logEntry.getModelSeq(), logEntry.getStatus());
    }
}
