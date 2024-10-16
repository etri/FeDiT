package com.stoneitgt.dt.data.platform.admin.component;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.map.HashedMap;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.admin.controller.BaseController;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.service.AIModelService;
import com.stoneitgt.dt.data.platform.admin.service.DjangoApiService;
import com.stoneitgt.dt.data.platform.admin.service.MakeModelSchedulerService;
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
public class SchedulerTasks extends BaseController {

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
    private DjangoApiService djangoApiService;

    @Autowired
    private SystemProperties systemProperties;

    @Autowired
    private MakeModelSchedulerService makeModelSchedulerService;

    @Autowired
    private AIModelService augmentModelService;

    @Autowired
    private BaseSystemProperties systemproperties;

    @Scheduled(initialDelay = 1000 * 10, fixedDelay = 1000 * 10)
    public void makeAugmentModel() throws ParseException, InterruptedException {

        Map<String, Object> targetParams = new HashedMap<String, Object>();
        targetParams.put("limitCnt", systemProperties.getLimitMakeModelCnt());

        List<Map<String, Object>> list = makeModelSchedulerService.getMakeModelDoingList(targetParams);

        if (list.size() > 0) {
            for (int i = 0; i < list.size(); i++) {
                Map<String, Object> requestBody = new HashMap<>();

                Map<String, Object> checkParams = new HashedMap<String, Object>();
                int modelSeq = Integer.parseInt(list.get(i).get("model_seq").toString());
                checkParams.put("model_seq", modelSeq);
                checkParams.put("ref_tp", list.get(i).get("prcs_level").toString());

                List<Map<String, Object>> setMakeModelOutputColumns = makeModelSchedulerService.setMakeModelOutputColumns(checkParams);
                List<Map<String, Object>> setMakeModelFeatureColumns = makeModelSchedulerService.setMakeModelFeatureColumns(checkParams);
                List<Map<String, Object>> setMakeModelParams = makeModelSchedulerService.setMakeModelParams(checkParams);
                List<Map<String, Object>> setMakeModelFiles = makeModelSchedulerService.setMakeModelFiles(checkParams);
                List<Map<String, Object>> getOriginFiles = makeModelSchedulerService.getOriginFiles(checkParams);

                makeModelSchedulerService.deleteSetRemodel(checkParams);


                Object[] outputArray = new Object[setMakeModelOutputColumns.size()];
                Object[] featureArray = new Object[setMakeModelFeatureColumns.size()];

                // for 문을 사용하여 특정 객체만 배열에 담기
                for (int op = 0; op < setMakeModelOutputColumns.size(); op++) {
                    Map<String, Object> outputMap = setMakeModelOutputColumns.get(op);
                    outputArray[op] = outputMap.get("model_col_nm");
                }

                for (int fp = 0; fp < setMakeModelFeatureColumns.size(); fp++) {
                    Map<String, Object> featureMap = setMakeModelFeatureColumns.get(fp);
                    featureArray[fp] = featureMap.get("model_col_nm");
                }

                requestBody.put("modelID", Integer.parseInt(list.get(i).get("model_seq").toString()));
                requestBody.put("indexColumn", list.get(i).get("index_trgt_col").toString());
                requestBody.put("outputs", outputArray);
                requestBody.put("features", featureArray);

                //20231110 모델에 문자열 컬럼을 제외하기 위한 작업
                String[] trgt_col_list = new String[list.get(i).get("trgt_col_list").toString().split(", ").length];
                trgt_col_list = list.get(i).get("trgt_col_list").toString().split(", ");

                requestBody.put("trgt_col_list", trgt_col_list);
                requestBody.put("filePath", systemproperties.getDtFilePath() + "/" + setMakeModelFiles.get(0).get("file_path").toString().replaceFirst("/", ""));
                requestBody.put("fileName", setMakeModelFiles.get(0).get("file_nm").toString());
                requestBody.put("targetFileName", getOriginFiles.get(0).get("file_nm").toString());

                requestBody.put("modelType", setMakeModelParams.get(0).get("model_algrm").toString().toLowerCase());

                LocalDateTime dateTime = LocalDateTime.now();
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");
                String formattedDateTime = dateTime.format(formatter);


                String modelFilePath = setMakeModelFiles.get(0).get("file_path").toString().replace("/data/", "/model/").replaceFirst("/", "");
                String modelFileName = "MODEL_" + modelSeq + "_" + formattedDateTime + ".h5";

                requestBody.put("modelFilePath", systemproperties.getDtFilePath() + "/" + modelFilePath);
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
                makeModelSchedulerService.updateLearningBgngDt(checkParams);

                try {
                    RestTemplate restTemplate = new RestTemplate();

                    String url = systemproperties.getDtApiUrl() + "/dt/learning/createModelGenerater/";
                    String contentType = "application/json";
                    String authKey = "Token " + systemproperties.getDtApiKey();

                    HttpHeaders headers = new HttpHeaders();
                    headers.add("Content-Type", contentType);
                    headers.add("Authorization", authKey);
                    log.info("/dt/learning/createModelGenerater/ requestBody -> {}", requestBody);
                    HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

                    ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
                    String responseBody = response.getBody();

                    JSONParser parser = new JSONParser();
                    JSONObject result = (JSONObject) parser.parse(responseBody);

                    log.info("/dt/learning/createModelGenerater/ result -> {}", result);

                    if (Integer.parseInt(result.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
                        checkParams.put("model_status", "DONE");
                        makeModelSchedulerService.finishMakeModel(checkParams);


                        String setModelFilePath = systemproperties.getDtFilePath() + "/" + modelFilePath + "/" + modelFileName;

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
                            augmentModelService.updateModelFileInfo(modelParam);
                        } else {
                            augmentModelService.insertModelFileInfo(modelParam);
                        }

                        String testFileName = StringUtil.changeFileName(getOriginFiles.get(0).get("file_nm").toString(), "_test");
                        String setTestFilePath = systemproperties.getDtFilePath() + setMakeModelFiles.get(0).get("file_path").toString() + testFileName;

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

                        if (testCnt > 0) {
                            augmentModelService.updateTestFileInfo(testParam);
                        } else {
                            augmentModelService.insertTestFileInfo(testParam);
                        }

                        String predFileName = StringUtil.changeFileName(getOriginFiles.get(0).get("file_nm").toString(), "_pred");
                        String setPredFilePath = systemproperties.getDtFilePath() + setMakeModelFiles.get(0).get("file_path").toString() + predFileName;

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

                        if (predCnt > 0) {
                            augmentModelService.updatePredFileInfo(predParam);
                        } else {
                            augmentModelService.insertPredFileInfo(predParam);
                        }
                    } else {
                        log.error("/dt/learning/createModelGenerater/ FAIL");
                        checkParams.put("model_status", "FAIL");
                        insertErrorLog(modelSeq, 0, "PYTHON", "createModelGenerater", result.get("code").toString(), result.get("message").toString(), result.get("detail").toString(), 1, "0:0:0:0:0:0:0:1");
                        makeModelSchedulerService.finishMakeModel(checkParams);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    makeModelSchedulerService.finishMakeModel(checkParams);
                }
                makeModelSchedulerService.updateLearningDndDt(checkParams);
            }
        }
    }
}
