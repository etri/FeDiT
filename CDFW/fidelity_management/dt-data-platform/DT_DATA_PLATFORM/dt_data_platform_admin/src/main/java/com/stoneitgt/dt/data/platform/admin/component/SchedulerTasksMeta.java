package com.stoneitgt.dt.data.platform.admin.component;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import org.apache.commons.collections4.map.HashedMap;
import org.json.simple.JSONObject;
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
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.admin.service.MakeMetaModelSchedulerService;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import com.stoneitgt.dt.data.platform.util.StringUtil;

import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 관리 클래스
 *
 * @author yh.kim
 */
@Slf4j
@Component
@Profile("local")
public class SchedulerTasksMeta extends BaseController {

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
    private MakeMetaModelSchedulerService makeMetaModelSchedulerService;

    @Autowired
    private DTModelService augmentModelService;

    @Autowired
    private BaseSystemProperties systemproperties;

    @Scheduled(initialDelay = 1000 * 10, fixedDelay = 1000 * 10)
    public void makeMetaModel() {
        Map<String, Object> targetParams = new HashedMap<String, Object>();
        targetParams.put("limitCnt", systemProperties.getLimitMakeModelCnt());
        List<Map<String, Object>> list = makeMetaModelSchedulerService.getMakeModelDoingList(targetParams);
        if (list.size() > 0) {
            jobLoop:
            for (int i = 0; i < list.size(); i++) {
                try {
                    /**
                     * 1208486689012878 모델 상태 변경
                     * DOING CHECK 후 DOING으로 변경
                     * 처음 시작시 Status를 DOING으로 변경
                     * */
                    Map<String, Object> requestBody = new HashMap<>();
                    int modelSeq = Integer.parseInt(list.get(i).get("model_seq").toString());
                    boolean check = makeMetaModelSchedulerService.checkStatus(modelSeq, "DOING");
                    if (check) {
                        continue jobLoop;
                    }
                    Map<String, Object> statusParams = new HashMap<>();
                    statusParams.put("model_seq", modelSeq);
                    statusParams.put("model_status", "DOING");
                    makeMetaModelSchedulerService.finishMakeModel(statusParams);
                    Map<String, Object> checkParams = new HashedMap<String, Object>();
                    checkParams.put("model_seq", modelSeq);
                    checkParams.put("ref_tp", "DATA");

                    List<Map<String, Object>> setMakeModelOutputColumns = makeMetaModelSchedulerService.setMakeModelOutputColumns(checkParams);
                    List<Map<String, Object>> setMakeModelFeatureColumns = makeMetaModelSchedulerService.setMakeModelFeatureColumns(checkParams);
                    List<Map<String, Object>> setMakeModelParams = makeMetaModelSchedulerService.setMakeModelParams(checkParams);
                    List<Map<String, Object>> setMakeModelFiles = makeMetaModelSchedulerService.setMakeModelFiles(checkParams);
                    List<Map<String, Object>> getOriginFiles = makeMetaModelSchedulerService.getOriginFiles(checkParams);

                    log.info("setMakeModelOutputColumns -> {}", setMakeModelOutputColumns);
                    log.info("setMakeModelFeatureColumns -> {}", setMakeModelFeatureColumns);

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

                    requestBody.put("modelID", Integer.parseInt(list.get(i).get("model_seq").toString()));
                    requestBody.put("indexColumn", list.get(i).get("index_trgt_col").toString());
                    requestBody.put("outputs", outputs);
                    requestBody.put("features", features);

                    String json = list.get(i).get("user_pprcs_full_stng_value").toString();
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
                    requestBody.put("filePath", systemproperties.getDtMetaFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
                    requestBody.put("fileName", setMakeModelFiles.get(0).get("file_nm").toString());
                    requestBody.put("targetFileName", getOriginFiles.get(0).get("file_nm").toString());


                    requestBody.put("modelType", setMakeModelParams.get(0).get("model_algrm").toString().toLowerCase());

                    LocalDateTime dateTime = LocalDateTime.now();
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");
                    String formattedDateTime = dateTime.format(formatter);


                    String modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
                    String modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".h5";

                    requestBody.put("modelFilePath", systemproperties.getDtMetaFilePath() + "/" + modelFilePath);
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

                    //학습시작시간 업데이트
                    makeMetaModelSchedulerService.updateLearningBgngDt(checkParams);

                    /**
                     * 1208300003284201 Deep AR 기능 추가
                     * Deep AR 모델 추가로 인한 URL 분기
                     * A1 LSTM, A2 GRU는 현재 로직
                     * A3 로직은 그래도지만 URL 바뀜
                     * */
                    JSONObject result = null;
                    switch (list.get(i).get("model_algrm").toString()) {
                        case "LSTM":
                        case "GRU": {
                            try {
                                result = makeMetaModelSchedulerService.createMetaBasicModel(requestBody);
                            } catch (Exception e) {
                                e.printStackTrace();
                                checkParams.put("model_status", "FAIL");
                                insertErrorLog(modelSeq, 0, "PLATFORM", "Make Data Twin Model", "500", "INTERNAL_SERVER_ERROR", "JSON Exception", Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                                makeMetaModelSchedulerService.finishMakeModel(checkParams);
                                makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                                continue jobLoop;
                            }
                            break;
                        }
                        case "DEEP AR": {
                            try {
                                result = makeMetaModelSchedulerService.createMetaDeepARModel(requestBody);
                            } catch (Exception e) {
                                e.printStackTrace();
                                checkParams.put("model_status", "FAIL");
                                insertErrorLog(modelSeq, 0, "PLATFORM", "Make Data Twin Model", "500", "INTERNAL_SERVER_ERROR", "JSON Exception", Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                                makeMetaModelSchedulerService.finishMakeModel(checkParams);
                                makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                                continue jobLoop;
                            }
                            break;
                        }
                        default: {
                            checkParams.put("model_status", "FAIL");
                            insertErrorLog(modelSeq, 0, "PLATFORM", "Make Data Twin Model", "500", "INTERNAL_SERVER_ERROR", "Model Type is not correct", Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                            makeMetaModelSchedulerService.finishMakeModel(checkParams);
                            makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                            continue jobLoop;
                        }
                    }
                    try {
                        if (Integer.parseInt(result.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                            checkParams.put("model_status", "DONE");
                            makeMetaModelSchedulerService.finishMakeModel(checkParams);

                            String setModelFilePath = systemproperties.getDtMetaFilePath() + "/" + modelFilePath + "/" + modelFileName;

                            File modelFile = new File(setModelFilePath);
                            long modelFileSize = modelFile.length();

                            Map<String, Object> modelParam = new HashMap<String, Object>();
                            modelParam.put("model_seq", Integer.parseInt(list.get(i).get("model_seq").toString()));
                            modelParam.put("ref_tp", FILE_REF_TYPE.MODEL.toUpperCase());
                            modelParam.put("file_nm", modelFileName);
                            modelParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/"));
                            modelParam.put("file_size", modelFileSize);
                            modelParam.put("file_extn", FileUtil.getFileExtension(modelFileName));
                            modelParam.put("reg_user_seq", Integer.parseInt(list.get(i).get("reg_user_seq").toString()));

                            int modelCnt = augmentModelService.getCountModelFileInfo(modelParam);

                            if (modelCnt > 0) {
                                log.info("updateModelFileInfo -> {}", modelParam);
                                augmentModelService.updateModelFileInfo(modelParam);
                            } else {
                                augmentModelService.insertModelFileInfo(modelParam);
                            }

                            String testFileName = StringUtil.changeFileName(getOriginFiles.get(0).get("file_nm").toString(), "_test");
                            String setTestFilePath = systemproperties.getDtMetaFilePath() + setMakeModelFiles.get(0).get("file_path").toString() + testFileName;

                            File testFile = new File(setTestFilePath);
                            long testFileSize = testFile.length();

                            Map<String, Object> testParam = new HashMap<String, Object>();
                            testParam.put("model_seq", Integer.parseInt(list.get(i).get("model_seq").toString()));
                            testParam.put("ref_tp", FILE_REF_TYPE.TEST);
                            testParam.put("file_nm", testFileName);
                            testParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString());
                            testParam.put("file_size", testFileSize);
                            testParam.put("file_extn", FileUtil.getFileExtension(testFileName));
                            testParam.put("reg_user_seq", Integer.parseInt(list.get(i).get("reg_user_seq").toString()));

                            int testCnt = augmentModelService.getCountTestFileInfo(testParam);
                            log.info("testCnt -> {}, {}", testCnt, testParam);
                            if (testCnt > 0) {
                                log.info("updateTestFileInfo -> {}", testParam);
                                augmentModelService.updateTestFileInfo(testParam);
                            } else {
                                augmentModelService.insertTestFileInfo(testParam);
                            }

                            String predFileName = StringUtil.changeFileName(getOriginFiles.get(0).get("file_nm").toString(), "_pred");
                            String setPredFilePath = systemproperties.getDtMetaFilePath() + setMakeModelFiles.get(0).get("file_path").toString() + predFileName;

                            File predFile = new File(setPredFilePath);
                            long predFileSize = predFile.length();

                            Map<String, Object> predParam = new HashMap<String, Object>();
                            predParam.put("model_seq", Integer.parseInt(list.get(i).get("model_seq").toString()));
                            predParam.put("ref_tp", FILE_REF_TYPE.PREDICTION);
                            predParam.put("file_nm", predFileName);
                            predParam.put("file_path", setMakeModelFiles.get(0).get("file_path").toString());
                            predParam.put("file_size", predFileSize);
                            predParam.put("file_extn", FileUtil.getFileExtension(predFileName));
                            predParam.put("reg_user_seq", Integer.parseInt(list.get(i).get("reg_user_seq").toString()));

                            int predCnt = augmentModelService.getCountPredFileInfo(predParam);
                            log.info("predCnt -> {}, {}", predCnt, predParam);
                            if (predCnt > 0) {
                                log.info("updatePredFileInfo -> {}", predParam);
                                augmentModelService.updatePredFileInfo(predParam);
                            } else {
                                augmentModelService.insertPredFileInfo(predParam);
                            }
                        } else {
                            checkParams.put("model_status", "FAIL");
                            insertErrorLog(modelSeq, 0, "PYTHON", "Make Data Twin Model", result.get("code").toString(), result.get("message").toString(), result.get("detail").toString(), Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                            makeMetaModelSchedulerService.finishMakeModel(checkParams);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        checkParams.put("model_status", "FAIL");
                        insertErrorLog(modelSeq, 0, "PLATFORM", "Make Data Twin Model", "500", "INTERNAL_SERVER_ERROR", e.toString(), Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                        makeMetaModelSchedulerService.finishMakeModel(checkParams);
                    } finally {
                        makeMetaModelSchedulerService.updateLearningDndDt(checkParams);
                    }
                } catch (Exception e) {
                    Map<String, Object> statusParams = new HashMap<>();
                    int modelSeq = Integer.parseInt(list.get(i).get("etc_model_seq").toString());
                    statusParams.put("model_seq", modelSeq);
                    statusParams.put("model_status", "FAIL");
                    insertErrorLog(modelSeq, 0, "PLATFORM", "Make Data Twin Model", "500", "INTERNAL_SERVER_ERROR", e.toString(), Integer.parseInt(list.get(i).get("reg_user_seq").toString()), null);
                    makeMetaModelSchedulerService.finishMakeModel(statusParams);
                    continue;
                }
            }
        }
    }
}