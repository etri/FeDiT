package com.stoneitgt.dt.data.platform.admin.component;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.apache.commons.collections4.map.HashedMap;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.controller.BaseController;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.service.MakeMetaEtcModelSchedulerService;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;

import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 관리 클래스
 *
 * @author yh.kim
 */
@Slf4j
@Component
@Profile("local")
public class SchedulerTasksMetaEtcModel extends BaseController {

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
    private SystemProperties systemProperties;

    @Autowired
    private MakeMetaEtcModelSchedulerService makeMetaEtcModelSchedulerService;

    @Autowired
    private BaseSystemProperties systemproperties;

    @Scheduled(initialDelay = 1000 * 10, fixedDelay = 1000 * 10)
    public void makeMetaModel() {
        Map<String, Object> targetParams = new HashedMap<String, Object>();
        targetParams.put("limitCnt", systemProperties.getLimitMakeModelCnt());

        List<Map<String, Object>> list = makeMetaEtcModelSchedulerService.getMakeModelDoingList(targetParams);
        if (list.size() > 0) {
            for (int i = 0; i < list.size(); i++) {
                try {
                    /**
                     * 1208486689012878 모델 상태 변경
                     * DOING CHECK 후 DOING으로 변경
                     * 처음 뽑히면 Status를 DOING으로 바꾼다.
                     * */
                    Map<String, Object> requestBody = new HashMap<>();
                    Map<String, Object> statusParams = new HashMap<>();
                    int modelSeq = Integer.parseInt(list.get(i).get("etc_model_seq").toString());

                    boolean check = makeMetaEtcModelSchedulerService.checkStatus(modelSeq, "DOING");
                    if (check) {
                        continue;
                    }
                    statusParams.put("etc_model_seq", modelSeq);
                    statusParams.put("model_status", "DOING");

                    makeMetaEtcModelSchedulerService.finishMakeModel(statusParams);
                    Map<String, Object> checkParams = new HashedMap<String, Object>();
                    checkParams.put("etc_model_seq", modelSeq);
                    checkParams.put("ref_tp", "DATA");

                    log.info("AE / RF 모델 학습 시작 -> {}", modelSeq);

                    List<Map<String, Object>> setMakeModelOutputColumns = makeMetaEtcModelSchedulerService.setMakeModelOutputColumns(checkParams);
                    List<Map<String, Object>> setMakeModelParams = makeMetaEtcModelSchedulerService.setMakeModelParams(checkParams);
                    List<Map<String, Object>> setMakeModelFiles = makeMetaEtcModelSchedulerService.setMakeModelFiles(checkParams);
                    List<Map<String, Object>> getOriginFiles = makeMetaEtcModelSchedulerService.getOriginFiles(checkParams);
                    String modelType = setMakeModelParams.get(0).get("model_algrm").toString().toLowerCase();
                    log.info("modelType -> {}", modelType.toUpperCase());
                    makeMetaEtcModelSchedulerService.deleteSetRemodel(checkParams);

                    ArrayList<String> outputs = new ArrayList<>();
                    for (Map<String, Object> outputMap : setMakeModelOutputColumns) {
                        String model_col_nm = outputMap.get("model_col_nm").toString();
                        outputs.add(model_col_nm);
                    }

                    String json = list.get(i).get("user_pprcs_full_stng_value").toString();
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode rootNode = mapper.readTree(json);
                    Set<String> target_cols_set = new LinkedHashSet<>(outputs);
                    ArrayList<String> target_cols = new ArrayList<>(target_cols_set);
                    LocalDateTime dateTime = LocalDateTime.now();
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");
                    String formattedDateTime = dateTime.format(formatter);
                    String modelFilePath, modelFileName;
                    switch (modelType.toUpperCase()) {
                        case "RANDOM FOREST":
                            ArrayList<String> features = new ArrayList<>();
                            List<Map<String, Object>> setMakeModelFeatureColumns = makeMetaEtcModelSchedulerService.setMakeModelFeatureColumns(checkParams);
                            for (Map<String, Object> featureMap : setMakeModelFeatureColumns) {
                                String model_col_nm = featureMap.get("model_col_nm").toString();
                                features.add(model_col_nm);
                            }
                            target_cols_set.addAll(features);
                            target_cols = new ArrayList<>(target_cols_set);
                            log.info("target_cols -> {}", target_cols);
                            if (requestBody.containsKey("test_size")) {
                                requestBody.put("testSize", requestBody.get("test_size"));
                                requestBody.remove("test_size");
                            }
                            requestBody.put("modelID", Integer.parseInt(list.get(i).get("etc_model_seq").toString()));
                            requestBody.put("outputs", outputs);
                            requestBody.put("features", features);
                            requestBody.put("trgt_col_list", target_cols);
                            requestBody.put("filePath", systemproperties.getDtEtcMetaFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
                            requestBody.put("fileName", setMakeModelFiles.get(0).get("file_nm").toString());
                            requestBody.put("targetFileName", getOriginFiles.get(0).get("file_nm").toString());

                            modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
                            modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".pkl";

                            requestBody.put("modelFilePath", systemproperties.getDtEtcMetaFilePath() + "/" + modelFilePath);
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

                            log.info("requestBody -> {}", requestBody);
                            //학습시작시간 업데이트
                            makeMetaEtcModelSchedulerService.updateLearningBgngDt(checkParams);
                            try {
                                String responseBody = makeMetaEtcModelSchedulerService.createModelGenerater_randomForest(requestBody);
                                JSONParser parser = new JSONParser();
                                JSONObject result = (JSONObject) parser.parse(responseBody);
                                if (Integer.parseInt(result.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                                    log.info("AE 모델 {}번 생성 성공", modelSeq);
                                    checkParams.put("model_status", "DONE");
                                    makeMetaEtcModelSchedulerService.finishMakeModel(checkParams);
                                    String setModelFilePath = systemproperties.getDtEtcMetaFilePath() + "/" + modelFilePath + "/" + modelFileName;
                                    File modelFile = new File(setModelFilePath);
                                    long modelFileSize = modelFile.length();
                                    Map<String, Object> modelParam = new HashMap<String, Object>();
                                    modelParam.put("etc_model_seq", Integer.parseInt(list.get(i).get("etc_model_seq").toString()));
                                    modelParam.put("ref_tp", FILE_REF_TYPE.MODEL.toUpperCase());
                                    modelParam.put("file_nm", modelFileName);
                                    modelParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                                    modelParam.put("file_size", modelFileSize);
                                    modelParam.put("file_extn", FileUtil.getFileExtension(modelFileName));
                                    modelParam.put("reg_user_seq", Integer.parseInt(list.get(i).get("reg_user_seq").toString()));
                                    int modelCnt = makeMetaEtcModelSchedulerService.getCountModelFileInfo(modelParam);
                                    if (modelCnt > 0) {
                                        makeMetaEtcModelSchedulerService.updateModelFileInfo(modelParam);
                                    } else {
                                        makeMetaEtcModelSchedulerService.insertModelFileInfo(modelParam);
                                    }
                                } else {
                                    log.info("AE 모델 {}번 생성 실패", modelSeq);
                                    checkParams.put("model_status", "FAIL");
                                    insertErrorLog(modelSeq, 0, "PYTHON", "Make AI Model", result.get("code").toString(), result.get("message").toString(), result.get("detail").toString(), Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null); //authenticationFacade.getLoginUserIp()
                                    makeMetaEtcModelSchedulerService.finishMakeModel(checkParams);
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                                checkParams.put("model_status", "FAIL");
                                insertErrorLog(modelSeq, 0, "PLATFORM", "Make AI Model", "500", "INTERNAL_SERVER_ERROR", e.toString(), Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                                makeMetaEtcModelSchedulerService.finishMakeModel(checkParams);
                            } finally {
                                makeMetaEtcModelSchedulerService.updateLearningDndDt(checkParams);
                            }
                            break;
                        case "AUTO ENCODER":
                            target_cols = new ArrayList<>(target_cols_set);
                            requestBody.put("modelID", Integer.parseInt(list.get(i).get("etc_model_seq").toString()));
                            requestBody.put("output_cols", outputs);
                            log.info("target_cols -> {}", target_cols);
                            requestBody.put("trgt_col_list", target_cols);
                            requestBody.put("file_path", systemproperties.getDtEtcMetaFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
                            requestBody.put("file_name", setMakeModelFiles.get(0).get("file_nm").toString());
                            requestBody.put("target_file_name", getOriginFiles.get(0).get("file_nm").toString());
                            requestBody.put("modelType", modelType);

                            modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
                            modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".h5";

                            requestBody.put("model_file_path", systemproperties.getDtEtcMetaFilePath() + "/" + modelFilePath);
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
                                    log.info("AE 모델 {}번 생성 성공", modelSeq);
                                    checkParams.put("model_status", "DONE");
                                    makeMetaEtcModelSchedulerService.finishMakeModel(checkParams);
                                    String setModelFilePath = systemproperties.getDtEtcMetaFilePath() + "/" + modelFilePath + "/" + modelFileName;
                                    File modelFile = new File(setModelFilePath);
                                    long modelFileSize = modelFile.length();
                                    Map<String, Object> modelParam = new HashMap<String, Object>();
                                    modelParam.put("etc_model_seq", Integer.parseInt(list.get(i).get("etc_model_seq").toString()));
                                    modelParam.put("ref_tp", FILE_REF_TYPE.MODEL.toUpperCase());
                                    modelParam.put("file_nm", modelFileName);
                                    modelParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                                    modelParam.put("file_size", modelFileSize);
                                    modelParam.put("file_extn", FileUtil.getFileExtension(modelFileName));
                                    modelParam.put("reg_user_seq", Integer.parseInt(list.get(i).get("reg_user_seq").toString()));
                                    int modelCnt = makeMetaEtcModelSchedulerService.getCountModelFileInfo(modelParam);
                                    if (modelCnt > 0) {
                                        makeMetaEtcModelSchedulerService.updateModelFileInfo(modelParam);
                                    } else {
                                        makeMetaEtcModelSchedulerService.insertModelFileInfo(modelParam);
                                    }
                                } else {
                                    log.info("AE 모델 {}번 생성 실패", modelSeq);
                                    checkParams.put("model_status", "FAIL");
                                    insertErrorLog(modelSeq, 0, "PYTHON", "Make AI Model", result.get("code").toString(), result.get("message").toString(), result.get("detail").toString(), Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null); //authenticationFacade.getLoginUserIp()
                                    makeMetaEtcModelSchedulerService.finishMakeModel(checkParams);
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                                checkParams.put("model_status", "FAIL");
                                insertErrorLog(modelSeq, 0, "PLATFORM", "Make AI Model", "500", "INTERNAL_SERVER_ERROR", e.toString(), Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                                makeMetaEtcModelSchedulerService.finishMakeModel(checkParams);
                            } finally {
                                makeMetaEtcModelSchedulerService.updateLearningDndDt(checkParams);
                            }
                            break;
                    }
                } catch (Exception e) {
                    Map<String, Object> statusParams = new HashMap<>();
                    int modelSeq = Integer.parseInt(list.get(i).get("etc_model_seq").toString());
                    statusParams.put("etc_model_seq", modelSeq);
                    statusParams.put("model_status", "FAIL");
                    insertErrorLog(modelSeq, 0, "PLATFORM", "Make AI Model", "500", "INTERNAL_SERVER_ERROR", e.toString(), Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                    makeMetaEtcModelSchedulerService.finishMakeModel(statusParams);
                    continue;
                }
            }
        }
    }
}
