package com.stoneitgt.dt.data.platform.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.controller.DTModelController;
import com.stoneitgt.dt.data.platform.admin.mapper.DTSimulationMapper;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import com.stoneitgt.dt.data.platform.util.file.FileWriter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.map.HashedMap;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DTSimulationService extends BaseService {

    @Autowired
    private DTSimulationMapper dtSimulationMapper;

    @Autowired
    private DTModelApiService dtModelApiService;

    @Autowired
    private MakeMetaSimulationSchedulerService makeMetaSimulationSchedulerService;

    @Autowired
    private DTModelService dtModelService;

    @Autowired
    private VerifyService verifyService;

    @Autowired
    private DTSimulationService dtSimulationService;

    @Autowired
    private MakeMetaModelSchedulerService makeMetaModelSchedulerService;

    @Autowired
    private JSONPropertyService jsonPropertyService;

    public List<Map<String, Object>> getDTSimulationList(Map<String, Object> params, Paging paging) {
        return dtSimulationMapper.getDTSimulationList(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTSimulationListSetUserSeq(Map<String, Object> params, Paging paging) {
        return dtSimulationMapper.getDTSimulationListSetUserSeq(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTSimulationSharedList(Map<String, Object> subParamsMap, Paging subPaging) {
        return dtSimulationMapper.getDTSimulationSharedList(subParamsMap, subPaging.getPaging());
    }

    public List<Map<String, Object>> getSimulationSetModelList(Map<String, Object> param) {
        return dtSimulationMapper.getSimulationSetModelList(param);
    }

    public Map<String, Object> getSimulationSetModelProperty(Map<String, Object> param) {
        return dtSimulationMapper.getSimulationSetModelProperty(param);
    }

    public int getSimulationSaveAugment(Map<String, Object> param) {
        dtSimulationMapper.getSimulationSaveAugment(param);
        log.info("param : " + param.toString());
        int augment_seq = Integer.parseInt(param.get("AUGMENT_SEQ").toString());

        /**
         * Augment 정보 추출
         * Full Data로 Create 할것인지 정함
         * Data 생성
         * 디지털 트윈 객체 생성 로직 Call
         *
         * API 사용처에 대해서 물어봐야한다.
         * 시뮬레이션 등록할때, 최초 실행 후
         * @author kimwoosik
         * */
        DTAugment dtAugment = dtSimulationService.getDTSimulation(augment_seq);
        Map<String, Object> targetModel = makeMetaSimulationSchedulerService.getTargetModel(dtAugment.getModelSeq());
        boolean is_full = false;
        String DIGITAL_TWIN_ID = targetModel.get("sdt_id").toString();
        String DIGITAL_TWIN_OBJECT_ID = targetModel.get("sdt_obj_id").toString();
        if (!DIGITAL_TWIN_ID.isEmpty() && !DIGITAL_TWIN_OBJECT_ID.isEmpty()) {
            JSONObject jsonObject = JSONParser.formatDigitalTwinObjectCreated(is_full, DIGITAL_TWIN_ID, DIGITAL_TWIN_OBJECT_ID, dtAugment.getAugmentSeq(), dtAugment.getTitle());
            dtModelApiService.sendDigitalTwinObjectCreated(DIGITAL_TWIN_ID, jsonObject);
        }
        //dtModelApiService.sendDigitalTwinObjectDelete(DIGITAL_TWIN_ID, DIGITAL_TWIN_OBJECT_ID, dtAugment.getAugmentSeq());
        return dtAugment.getAugmentSeq();
    }

    public int getSimulationPredictSaveAugment(Map<String, Object> param) {
        dtSimulationMapper.getSimulationSaveAugment(param);
        log.info("param : " + param.toString());
        int augment_seq = Integer.parseInt(param.get("AUGMENT_SEQ").toString());

        /**
         * Augment 정보 추출
         * Full Data로 Create 할것인지 정함
         * Data 생성
         * 디지털 트윈 객체 생성 로직 Call
         *
         * API 사용처에 대해서 물어봐야한다.
         * 시뮬레이션 등록할때, 최초 실행 후
         * @author kimwoosik
         * */
        DTAugment dtAugment = dtSimulationService.getDTSimulation(augment_seq);
        return dtAugment.getAugmentSeq();
    }

    public int getSimulationSaveAugmentOnetime(DTAugment dtAugment) {
        return dtSimulationMapper.getSimulationSaveAugmentOnetime(dtAugment);
    }

    public DTAugment getDTSimulation(int augmentSeq) {
        return dtSimulationMapper.getDTSimulation(augmentSeq);
    }

    public List<Map<String, Object>> getDTSimulationFileList(int augmentSeq) {
        return dtSimulationMapper.getDTSimulationFileList(augmentSeq);
    }

    public List<Map<String, Object>> getDTSimulationLogList(int augmentSeq) {
        return dtSimulationMapper.getDTSimulationLogList(augmentSeq);
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    public Map<String, Object> getMetaContinuousAugmentInterpolationData(MetaSimulationModel metaSimulationModel, List<String> trgt_col_list, int continuousCount, String lastFileName, String from_date, String to_date, String originFilePath, String originFileName) {
        Map<String, Object> result = new HashMap<String, Object>();
        log.info("getMetaAugmentData -> from_date {}, to_date {}", from_date, to_date);
        Map<String, Object> modelInfo = dtSimulationMapper.getModelInfo(metaSimulationModel.getModelSeq());

        metaSimulationModel.setIndexColumn(modelInfo.get("index_trgt_col").toString());

        Map<String, Object> paramsModelParams = new HashMap<String, Object>();
        paramsModelParams.put("modelAlgrmSeq", modelInfo.get("model_algrm_seq"));
        paramsModelParams.put("modelSeq", metaSimulationModel.getModelSeq());

        List<Map<String, Object>> modelParams = dtSimulationMapper.getModelParams(paramsModelParams);

        for (int mp = 0; mp < modelParams.size(); mp++) {
            if ("windowSize".equals(modelParams.get(mp).get("model_algrm_nm"))) {
                metaSimulationModel.setWindowSize(Integer.parseInt(modelParams.get(mp).get("model_params_item_value").toString()));
            }
            if ("batchSize".equals(modelParams.get(mp).get("model_algrm_nm"))) {
                metaSimulationModel.setBatchSize(Integer.parseInt(modelParams.get(mp).get("model_params_item_value").toString()));
            }
        }

        Map<String, Object> modelFiles = dtSimulationMapper.getModelFiles(metaSimulationModel.getModelSeq());

        String model_file_name = modelFiles.get("file_nm").toString();
        metaSimulationModel.setModelFilePath(systemProperties.getDtMetaFilePath() + modelFiles.get("file_path").toString());
        metaSimulationModel.setModelFileName(model_file_name);

        String test_file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + metaSimulationModel.getBasePath() + "/";
        metaSimulationModel.setTestFilePath(test_file_path);

        metaSimulationModel.setModelUseFilePath(test_file_path);
        metaSimulationModel.setModelUseFileName(lastFileName);


        metaSimulationModel.setTestFileName(lastFileName.substring(0, lastFileName.lastIndexOf(".")) + "_simulation_target" + lastFileName.substring(lastFileName.lastIndexOf(".")));
        metaSimulationModel.setOutputFileName(lastFileName.substring(0, lastFileName.lastIndexOf(".")) + "_augment" + lastFileName.substring(lastFileName.lastIndexOf(".")));


        List<Map<String, Object>> modelColumns = dtSimulationMapper.getModelColumns(metaSimulationModel.getModelSeq());

        ArrayList<String> oc_col = new ArrayList<String>();
        ArrayList<String> fc_col = new ArrayList<String>();

        for (int mc = 0; mc < modelColumns.size(); mc++) {
            if ("OC".equals(modelColumns.get(mc).get("model_col_tp"))) {
                oc_col.add(modelColumns.get(mc).get("model_col_nm").toString());
            }
            if ("FC".equals(modelColumns.get(mc).get("model_col_tp"))) {
                fc_col.add(modelColumns.get(mc).get("model_col_nm").toString());
            }
        }
        metaSimulationModel.setOutputs(oc_col);
        metaSimulationModel.setFeatures(fc_col);

        metaSimulationModel.setModelId(metaSimulationModel.getModelSeq());
        metaSimulationModel.setUseModelYn("Y");
        metaSimulationModel.setRealTimeYn("N");

        Map<String, Object> params = new HashMap<String, Object>();
        params.put("model_file_path", metaSimulationModel.getModelFilePath());
        params.put("model_file_name", metaSimulationModel.getModelFileName());
        params.put("model_use_file_path", metaSimulationModel.getModelUseFilePath());
        params.put("model_use_file_name", metaSimulationModel.getModelUseFileName());
        params.put("test_file_path", metaSimulationModel.getTestFilePath());
        params.put("test_file_name", metaSimulationModel.getTestFileName());
        params.put("outputs", metaSimulationModel.getOutputs());
        params.put("features", metaSimulationModel.getFeatures());
        params.put("window_size", metaSimulationModel.getWindowSize());
        params.put("batch_size", metaSimulationModel.getBatchSize());
        params.put("model_id", metaSimulationModel.getModelId());
        params.put("index_column", metaSimulationModel.getIndexColumn());
        params.put("use_model_yn", metaSimulationModel.getUseModelYn());
        params.put("real_time_yn", metaSimulationModel.getRealTimeYn());
        params.put("original_file", originFilePath + File.separator + originFileName);

        //증강 날짜 수정
        params.put("target_start_date", from_date);
        params.put("target_last_date", to_date);

        if ("D".equals(metaSimulationModel.getResmplIntvlTp())) {
            params.put("resmpl_intvl_tp", "days");
        } else if ("H".equals(metaSimulationModel.getResmplIntvlTp())) {
            params.put("resmpl_intvl_tp", "hours");
        } else if ("T".equals(metaSimulationModel.getResmplIntvlTp())) {
            params.put("resmpl_intvl_tp", "minutes");
        } else if ("S".equals(metaSimulationModel.getResmplIntvlTp())) {
            params.put("resmpl_intvl_tp", "seconds");
        } else {
            params.put("resmpl_intvl_tp", "hours");
        }
        params.put("resmpl_intvl_value", metaSimulationModel.getResmplIntvlValue());

        //최종저장파일
        params.put("output_file_name", metaSimulationModel.getOutputFileName());
        params.put("output_file", metaSimulationModel.getTestFilePath() + metaSimulationModel.getOutputFileName());
        params.put("count", continuousCount);
        params.put("trgt_col_list", trgt_col_list);
        try {
            log.info("증강 API 파라미터 -> {}", params);
            ResponseEntity<?> augmentSet = null;
            int algorithm_no = (int) modelInfo.get("model_algrm_seq");
            log.info("modelInfo -> {}", modelInfo);
            switch (algorithm_no) {
                case 1:
                case 2: {
                    augmentSet = dtModelApiService.makeContinuousAugmentRepeatInterpolationSet(params);
                    break;
                }
                case 3: {
                    augmentSet = dtModelApiService.makeContinuousDeepARAugmentRepeatInterpolationSet(params);
                    break;
                }
                case 4: {
                    augmentSet = dtModelApiService.makeContinuousNBeatsAugmentRepeatInterpolationSet(params);
                    break;
                }
                case 5: {
                    augmentSet = dtModelApiService.makeContinuousSEGRNNAugmentRepeatInterpolationSet(params);
                    break;
                }
            }
            ObjectMapper mapper = new ObjectMapper();
            String bodyString = augmentSet.getBody().toString();
            JsonNode rootNode = mapper.readTree(bodyString);

            log.info("rootNode -> {}", rootNode);
            if (Objects.equals(rootNode.get("code").asText(), "AG-0006") || rootNode.get("message").asText().contains("Error")) {
                result.put("code", rootNode.get("code").asText());
                result.put("message", rootNode.get("message").asText());
                result.put("detail", rootNode.get("detail").asText());
                result.put("status", Boolean.valueOf(false));
            } else {
                String dataNode = rootNode.get("data").toString().replace("\\", "/").replaceAll("\"", "");
                // 경로에서 디렉토리와 파일명을 분리
                String directory = dataNode.substring(0, dataNode.lastIndexOf("/"));
                String filename = dataNode.substring(dataNode.lastIndexOf("/") + 1);
                result.put("directory", directory);
                result.put("filename", filename);
                result.put("status", Boolean.valueOf(true));
            }
        } catch (Exception e) {
            e.printStackTrace();
            //증강 로직이 실패하면 error 표출
            log.warn("증강 로직 실패");
            result.put("status", Boolean.valueOf(false));
        }
        log.info("getMetaAugmentData result -> {}", result);
        return result;
    }

    public int updateSimulationInfo(SimulationModel simulationModel) {
        return dtSimulationMapper.updateSimulationInfo(simulationModel);
    }

    public HashMap<String, Object> makePreProcessContinuousInterpolationAugment(String twin_id, String obj_id, DTModelJsonProperty dtModelJsonProperty, String base_dir, String file_path, String file_name, String index_trgt_col, String user_id, int model_seq, int augment_seq, String from_date, String to_date, String data_crt_last_hr, List<String> originTimeData, int stepCount) throws IOException {
        String errorcheckBody = null;
        String originFileName = file_name;
        String originFilePath = file_path;
        String resultTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";
        String prev_file_name = file_name;
        boolean isDecisionTree = false;
        DecisionTreeOption decisionTreeOption = null;
        String decisionKey = null;
        ArrayList<String> decisionLabels = new ArrayList<>();
        log.info("makePreProcessContinuousAugment 초기 타겟 파일 -> {}, makePreProcessContinuousAugment 초기 원본 파일 -> {}, makePreProcessContinuousAugment 초기 이전 파일 -> {}", resultTargetFileName, prev_file_name, prev_file_name);

        //유효성 맵
        List<Map<String, Object>> validations = new ArrayList<>();
        //이상치 맵
        List<Map<String, Object>> outliers = new ArrayList<>();
        //변환 데이터 맵 - 연계 처리 후
        List<Map<String, Object>> resultDataList = new ArrayList<>();
        Map<String, Object> resultData = new HashMap<>();

        String origin_from = from_date;
        String origin_to = to_date;

        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String notification_time = now.format(formatter);

        try {
            Map<String, Object> setParam = new HashMap<String, Object>();

            String lastFileName = file_name;
            setParam.put("file_name", lastFileName);
            setParam.put("target_file_name", resultTargetFileName);
            setParam.put("file_path", file_path);
            setParam.put("index_trgt_col", index_trgt_col);

            MetaSimulationModel metaSimulationModel = new MetaSimulationModel();
            List<DTModelJsonPropertySub> dtModelJsonPropertySubs = dtModelJsonProperty.getPreproc_property_info().get(0).getPreproc_property();
            for (DTModelJsonPropertySub dtModelJsonPropertySub : dtModelJsonPropertySubs) {
                int step = dtModelJsonPropertySub.getPreproc_order();
                setParam.put("file_path", file_path);
                setParam.put("preproc_order", step);
                switch (step) {
                    case 1: {
                        log.info("===========================유효성 검증 로직 시작===========================");
                        int subStepCount = 0;
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_valid" + ".csv";
                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            if (subStepCount == 0) {
                                setParam.put("file_name", file_name);
                            }

                            setParam.put("target_file_name", targetFileName);
                            setParam.put("set_order", subStep.getSet_order());
                            setParam.put("is_create", "Y");
                            setParam.put("index_trgt_col", index_trgt_col);

                            setParam.put("vrfc_tp", subStep.getVrfc_tp());
                            setParam.put("vrfc_trgt_col", subStep.getTrgt_col());
                            setParam.put("vrfc_clear_type", subStep.getVrfc_clear_tp());

                            Map<String, Object> verify_option = verifyService.getVerifyOption(Integer.parseInt(subStep.getVrfc_sub_tp()));
                            Map<String, Object> rule = processFindVerifyRule(verify_option, subStep);
                            setParam.putAll(rule);

                            log.info("Validate Parameter -> {}", setParam);
                            ResponseEntity<?> validSet = dtModelApiService.makeValidateSet(setParam);
                            log.info("validSet -> {}", validSet);
                            errorcheckBody = validSet.getBody().toString();
                            log.info("validSet errorcheckBody -> {}", errorcheckBody);

                            lastFileName = getResponseTargetFileName(validSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);

                            // 동기화 엔진에 업로드할 Validation 데이터 설정 부분
                            Map<String, Object> validation = processMakeValidate(subStep, file_path + "/" + "valid_" + subStep.getSet_order() + "_" + lastFileName);
                            validations.add(validation);

                            //Validate 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;
                            subStepCount++;
                        }
                        log.info("===========================유효성 검증 로직 종료===========================");
                        break;
                    }
                    case 2: {
                        log.info("===========================이상치 검증 로직 시작===========================");
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_outlier" + ".csv";
                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            //resultTargetFileName Validate 결과 파일
                            //lastFileName 프로세스의 마지막 결과 파일
                            //두개가 같다면 Validate 결과 파일과 프로세스의 마지막 결과 파일이 같으므로 Validate 프로세스를 타고 온것으로 간주
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);
                            setParam.put("set_order", subStep.getSet_order());
                            setParam.put("isCreate", "Y");
                            setParam.put("feature", subStep.getTrgt_col());
                            setParam.put("freq", Integer.parseInt(subStep.getFreq().replaceAll("\"", "")));

                            String outlierType = subStep.getOutlier_tp();
                            log.info("outlierType -> {}", outlierType);
                            switch (outlierType.toUpperCase()) {
                                case "STANDARD": {
                                    setParam.put("p_value", Float.parseFloat(subStep.getP_value().replaceAll("\"", "")));
                                    break;
                                }
                                case "KMEAN": {
                                    setParam.put("n_clusters", Integer.parseInt(subStep.getN_clusters().replaceAll("\"", "")));
                                    setParam.put("n_clusters_lable", 4);
                                    setParam.put("n_count", Integer.parseInt(subStep.getN_count().replaceAll("\"", "")));
                                    break;
                                }
                                case "DBSCAN": {
                                    setParam.put("eps", Float.parseFloat(subStep.getEps().replaceAll("\"", "")));
                                    setParam.put("min_samples", Integer.parseInt(subStep.getMin_samples().replaceAll("\"", "")));
                                    break;
                                }
                                default: {
                                    // Auto Encoder Model 정보 찾기
                                    Map<String, Object> modelInfo = dtModelService.getEtcModelInfo(Integer.parseInt(subStep.getEtc_model_seq()));
                                    // Auto Encoder Model 정보 담기
                                    Map<String, Object> modelParams = processFindAutoEncoder(subStep, modelInfo);
                                    setParam.putAll(modelParams);
                                    break;
                                }
                            }
                            log.info("Outlier Parameter -> {}", setParam);
                            ResponseEntity<?> outlierSet = dtModelApiService.makeOutlierSet(setParam, outlierType);
                            log.info("outlierSet -> {}", outlierSet);
                            errorcheckBody = outlierSet.getBody().toString();
                            log.info("outlierSet errorcheckBody -> {}", errorcheckBody);

                            lastFileName = getResponseTargetFileName(outlierSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);

                            // 동기화 엔진에 업로드할 Outlier 데이터 설정 부분
                            Map<String, Object> outlier = processMakeOutlier(subStep, file_path + "/" + "outlier_" + subStep.getSet_order() + "_" + lastFileName);
                            outliers.add(outlier);

                            //Outlier 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;
                            //이전 파일 정보 추가로 저장
                            prev_file_name = setParam.get("file_name").toString();
                        }
                        log.info("===========================이상치 검증 로직 종료===========================");
                        break;
                    }
                    case 3: {
                        log.info("===========================결측/보간 로직 시작===========================");
                        int subStepCount = 0;
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_interpolate" + ".csv";
                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            //resultTargetFileName Outlier 결과 파일
                            //lastFileName 프로세스의 마지막 결과 파일
                            //두개가 같다면 Outlier 결과 파일과 프로세스의 마지막 결과 파일이 같으므로 Outlier 프로세스를 타고 온것으로 간주
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);
                            String interpolationType = subStep.getInterpl_tp();
                            setParam.put("interpl_tp", interpolationType);
                            switch (interpolationType.toUpperCase()) {
                                case "DECISIONTREE": {
                                    //동기화 엔진 데이터 업로드 프로세스에서 사용할 변수 수정
                                    isDecisionTree = true;
                                    decisionKey = subStep.getInterpl_feature().replaceAll("\"", "");

                                    setParam.put("prev_file_name", file_path + File.separator + prev_file_name);
                                    setParam.put("index_column", index_trgt_col);
                                    setParam.put("set_order", (subStepCount + 1));
                                    setParam.put("isCreate", "Y");
                                    setParam.put("model_path", "");
                                    setParam.put("feature", decisionKey);
                                    setParam.put("outputs", subStep.getInterpl_outputs());

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    Map<String, Object> resultMap = DTModelController.extractDecisionDataKeyValues(interpolateSet);
                                    decisionLabels.addAll((ArrayList<String>) resultMap.get("labels"));
                                    lastFileName = FileUtil.getExtractFileNameToFilePath(resultMap.get("target_file_name").toString());

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;

                                    //DecisionTree를 사용하였다면 Interval Conversion 프로세스 진행 시 Decision Tree Interval Conversion 프로세스 실행
                                    //그전 사전 준비, 어떤 Decision Tree 옵션을 사용했는지에 대한 설정
                                    if (decisionTreeOption == null) {
                                        decisionTreeOption = new DecisionTreeOption(setParam.get("file_path").toString(), null, lastFileName,
                                                null, index_trgt_col, (ArrayList<String>) subStep.getInterpl_outputs(), subStep.getDecision_model_file_path() + subStep.getDecision_model_file_name(),
                                                subStep.getInterpl_feature().replaceAll("\"", ""), String.valueOf(subStepCount + 1), "Y");
                                    }
                                    break;
                                }
                                case "RANDOM FOREST": {
                                    setParam.put("outputs", subStep.getInterpl_outputs());
                                    setParam.put("features", subStep.getInterpl_labels());
                                    setParam.put("model_file_path", subStep.getInterpl_etc_model_file_path());
                                    setParam.put("model_file_name", subStep.getInterpl_etc_model_file_name());
                                    setParam.put("model_use_file_path", file_path);
                                    setParam.put("model_use_file_name", setParam.get("file_name"));
                                    setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                    setParam.put("index_column", index_trgt_col);
                                    setParam.put("trgt_col_list", "");

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    lastFileName = setParam.get("target_file_name").toString();

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;
                                    break;
                                }
                                case "BRITS": {
                                    setParam.put("outputs", subStep.getInterpl_outputs());
                                    setParam.put("model_file_path", subStep.getInterpl_etc_model_file_path());
                                    setParam.put("model_file_name", subStep.getInterpl_etc_model_file_name());
                                    setParam.put("model_use_file_path", file_path);
                                    setParam.put("model_use_file_name", setParam.get("file_name"));
                                    setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                    setParam.put("index_column", index_trgt_col);
                                    setParam.put("trgt_col_list", subStep.getInterpl_outputs());

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    lastFileName = setParam.get("target_file_name").toString();

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;
                                    break;
                                }
                                case "NAOMI": {
                                    setParam.put("outputs", subStep.getInterpl_outputs());
                                    setParam.put("model_file_path", subStep.getInterpl_etc_model_file_path());
                                    setParam.put("model_file_name", subStep.getInterpl_etc_model_file_name());
                                    setParam.put("windowSize", subStep.getInterpl_window_size());
                                    setParam.put("model_use_file_path", file_path);
                                    setParam.put("model_use_file_name", setParam.get("file_name"));
                                    setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                    setParam.put("index_column", index_trgt_col);
                                    setParam.put("trgt_col_list", subStep.getInterpl_outputs());

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    lastFileName = setParam.get("target_file_name").toString();

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;
                                    break;
                                }
                                default: {
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    lastFileName = getResponseTargetFileName(interpolateSet.getBody().toString());

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);
                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;
                                    break;
                                }
                            }
                            prev_file_name = setParam.get("file_name").toString();
                            subStepCount++;
                        }

                        // 결측 로직 끝난 직후 원본 필터링 대체 작업 시작
                        // 원본 데이터와 보조 데이터가 서로 일치하는것이 없다면 긁어온 데이터가 이미 전처리되어져있어 전처리 중복을 의미
                        // OriginTimeData 출처 = 처음 긁어온 데이터 양의 시간값만 있는 배열
                        // 처음 긁어온 데이터에서 데이터 부족시 더 많은 데이터를 긁어올때 처음 원본 데이터의 시간값 배열
                        if (originTimeData != null && !originTimeData.isEmpty()) {
                            log.info("원본 데이터 (OriginTimeData) 필터링 시작");
                            log.info("다시 쓰는 파일 -> {}", file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                            List<Map<String, Object>> readData = FileReader.getInstance().readCSVToListObjectMap(file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                            //log.info("originTimeData -> {}", originTimeData);
                            List<Map<String, Object>> filteredOriginData = originDataFilter(originTimeData, readData, index_trgt_col);
                            log.info("필터링 종료 -> filteredOriginData : {}", filteredOriginData);
                            log.info("원본 데이터 (OriginTimeData) 필터링 종료");

                            if (filteredOriginData.isEmpty()) {
                                log.info("원본 데이터와 보조데이터가 서로 일치하는것이 없습니다.");
                                HashMap<String, Object> resultHashMap = new HashMap<>();
                                resultHashMap.put("status", false);
                                resultHashMap.put("isSizeAvailable", false);
                                return resultHashMap;
                            }

                            FileWriter.getInstance().writeCSV(file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName), filteredOriginData);
                            log.info("파일 덮어 쓰기 종료 -> filePath : {}, fileName : {}", file_path, (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                        } else {
                            log.info("데이터가 최초 데이터에서 다 이루어졋습니다.");
                        }
                        log.info("===========================결측/보간 로직 종료===========================");
                        break;
                    }
                    case 4: {
                        log.info("===========================리샘플링 로직 시작===========================");
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_interval" + ".csv";

                        //리샘플링 로직
                        //시간의 단위를 판별해서 해당 시간 단위의 최저 값으로 먼저 샘플링 작업을 실행하여 최저 시간으로 인해 늘어난 데이터 중 원본데이터를 최대한 유지하는 로직
                        //EX) 시간 단위 데이터 1시간 단위로, 분 단위 데이터 1분 단위로, 초 단위 데이터 1초 단위로

                        //파일을 읽어드린다.
                        //파일의 데이터에서 일부 데이터만을 얻고 시계열 컬럼만 뽑아온 데이터를 얻어온다. (index_trgt_col 참조)
                        //시계열 컬럼만 얻어온 데이터에서 시간이 초단위인지 분단위인지 시간단위인지 일단위인지 얻는다. (time_rule과 resmpl_tp 지정)
                        //얻은 time_rule, resmpl_tp 파라미터로 resampling 로직을 굴린다.
                        //원래 클라이언트에게 받은 파라미터로 resampling 로직을 굴린다.

                        //시간 구분 로직
                        //원본 파일에서 파악한 데이터 시간의 기본값을 확인

                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            String dateKey = index_trgt_col;
                            Map<String, Object> prevResultCsv = FileReader.getInstance().readCSV(file_path + File.separator + file_name);
                            List<String> timeIndicatorHeaders = (List<String>) prevResultCsv.get("header_list");
                            List<List<String>> prevResultDataList = (List<List<String>>) prevResultCsv.get("data_list");
                            HashMap<String, Object> unitParam = dtModelApiService.dataTimeDivider(dateKey, timeIndicatorHeaders, prevResultDataList);
                            TimeUnit unit = (TimeUnit) unitParam.get("unit");
                            int delta = ((Double) unitParam.get("delta")).intValue();

                            log.info("Base Delta -> {}, Base Unit -> {}", delta, unit);

                            //데이터 시간의 기본값으로 리샘플링할 타겟 파일 이름
                            String prevTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_prev_interval" + ".csv";

                            Map<String, Object> setPrevParam = new HashMap<>();
                            setPrevParam.put("file_path", file_path);
                            setPrevParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setPrevParam.put("index_trgt_col", dateKey);
                            setPrevParam.put("target_file_name", prevTargetFileName);
                            setPrevParam.put("resmpl_tp", unit.getResampleType());
                            setPrevParam.put("time_rule", ("1" + unit.getResampleType()));

                            log.info("PrevResample -> {}", setPrevParam);
                            ResponseEntity<?> prevResampleSet = dtModelApiService.makeResampleSet(setPrevParam);
                            log.info("prevResampleSet -> {}", prevResampleSet);
                            errorcheckBody = prevResampleSet.getBody().toString();
                            log.info("prevResampleSet errorcheckBody -> {}", errorcheckBody);

                            lastFileName = getResponseTargetFileName(prevResampleSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);

                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);

                            //리샘플링을 설정 옵션으로 한번 더 진행해야되므로 타겟 파일 이름 설정
                            setParam.put("target_file_name", targetFileName);

                            // 동기화 엔진에 업로드할 Resample 데이터 설정 부분
                            // 업음

                            //Resample 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;

                            setParam.put("resmpl_tp", subStep.getResmpl_tp().replaceAll("\"", ""));
                            setParam.put("time_rule", subStep.getResmpl_intvl_value().replaceAll("\"", "") + subStep.getResmpl_tp().replaceAll("\"", ""));

                            log.info("Resample -> {}", setParam);
                            ResponseEntity<?> resampleSet = dtModelApiService.makeResampleSet(setParam);
                            log.info("resampleSet -> {}", resampleSet);
                            errorcheckBody = resampleSet.getBody().toString();
                            log.info("resampleSet errorcheckBody -> {}", errorcheckBody);

                            lastFileName = getResponseTargetFileName(resampleSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            // 동기화 엔진에 업로드할 Resample 데이터 설정 부분
                            // 업음

                            //Resample 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;

                            //Decision Tree 사용했을 시 Decision Tree 전용 Resample 사용
                            metaSimulationModel.setResmplIntvlTp(subStep.getResmpl_tp().replaceAll("\"", ""));
                            metaSimulationModel.setResmplIntvlValue(Integer.parseInt(subStep.getResmpl_intvl_value().replaceAll("\"", "").trim()));
                            if (isDecisionTree) {
                                String decisionTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_dt_resample_" + TimeUtil.getCurrentTimeMillis() + ".csv";
                                log.info("Decision Tree 전용 로직 시작");
                                log.info("Decision Tree Option -> {}", decisionTreeOption);
                                Map<String, Object> decisionTreeSetParam = decisionTreeOption.decisionTreeSetParam();
                                decisionTreeSetParam.put("file_name", lastFileName);
                                decisionTreeSetParam.put("target_file_name", decisionTargetFileName);

                                log.info("DecisionTree Resample -> {}", decisionTreeSetParam);
                                ResponseEntity<?> decisionTreeResampleSet = dtModelApiService.makeInterpolateModelDecisionSet(decisionTreeSetParam);
                                log.info("decisionTreeResampleSet -> {}", decisionTreeResampleSet);
                                errorcheckBody = decisionTreeResampleSet.getBody().toString();
                                log.info("decisionTreeResampleSet errorcheckBody -> {}", errorcheckBody);

                                //Resample 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                lastFileName = decisionTargetFileName;
                                setParam.clear();
                                setParam.put("file_name", lastFileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);

                                resultTargetFileName = lastFileName;
                                log.info("Decision Tree 전용 로직 종료");
                            }
                        }
                        log.info("===========================리샘플링 로직 종료===========================");
                        break;
                    }
                    case 5: {
                        log.info("===========================단위 변환 로직 시작===========================");
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_unit" + ".csv";
                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);

                            //단위 변환 공식 가져오기
                            Map<String, Object> params = new HashMap<String, Object>();
                            params.put("unit_tp", subStep.getUnit_tp().replaceAll("\"", ""));
                            params.put("unit_seq", Integer.parseInt(subStep.getUnit_cd_1().replaceAll("\"", "")));
                            String unitFormula = dtModelService.getUnitFormula(params);
                            setParam.put("unit_trgt_col", subStep.getTrgt_col().replaceAll("\"", ""));
                            setParam.put("unit_formula", unitFormula);

                            log.info("Unit -> {}", setParam);
                            ResponseEntity<?> unitSet = dtModelApiService.makeUnitSet(setParam);
                            log.info("unitSet -> {}", unitSet);
                            errorcheckBody = unitSet.getBody().toString();
                            log.info("unitSet errorcheckBody -> {}", errorcheckBody);
                            lastFileName = getResponseTargetFileName(unitSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            // 동기화 엔진에 업로드할 Resample 데이터 설정 부분
                            // 업음

                            //Resample 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;
                        }
                        log.info("===========================단위 변환 로직 종료===========================");
                        break;
                    }
                }
            }

            String fileName = lastFileName;

            log.info("{}번 증강 프로세스 시작", augment_seq);
            metaSimulationModel.setModelSeq(model_seq);
            metaSimulationModel.setBasePath(base_dir);

            log.info("metaSimulationModel -> {}", metaSimulationModel);

            /**
             * 2024-09-10
             * 로컬 테스트 1208154650495552 모델 trgt_col_list 변경
             * 모델 생성할 때와 증강할때 해당 부분이 같아야함
             * */
            Map<String, Object> checkParams = new HashedMap<String, Object>();
            checkParams.put("model_seq", model_seq);
            checkParams.put("ref_tp", "DATA");

            List<Map<String, Object>> setMakeModelOutputColumns = makeMetaModelSchedulerService.setMakeModelOutputColumns(checkParams);
            List<Map<String, Object>> setMakeModelFeatureColumns = makeMetaModelSchedulerService.setMakeModelFeatureColumns(checkParams);
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

            Set<String> target_cols_set = new LinkedHashSet<>(outputs);
            target_cols_set.addAll(features);
            ArrayList<String> target_cols = new ArrayList<>(target_cols_set);

            log.info("stepCount -> {}", stepCount);
            Map<String, Object> aug_api = null;
            int windowSize = Integer.parseInt(dtModelJsonProperty.getPreproc_property_info().get(0).getModel_property().get(0).getHyperparam().getWindow_size());

            //WindowSize에 맞춰서 짜르기
            boolean isCut = dtSimulationService.dataFinalCut(file_path + File.separator + lastFileName, windowSize);
            if (isCut) {
                log.info("전처리된 데이터에서 dataFinalCut이 성공적으로 되었습니다.");
            } else {
                HashMap<String, Object> resultHashMap = new HashMap<>();
                resultHashMap.put("status", false);
                resultHashMap.put("code", 500);
                resultHashMap.put("message", "전처리 설정 부족으로 데이터가 부족합니다.");
                resultHashMap.put("detail", "dataFinalCut을 진행하고자 하는 데이터가 부족합니다.");
                return resultHashMap;
            }

            //Target Start Date와 Target End Date 파악
            Map<String, Object> lastRowData = FileReader.getInstance().readCSVLastRowObjectData(file_path, lastFileName);
            log.info("lastRowData -> {}, {}, {}", lastRowData, index_trgt_col, lastRowData.get(index_trgt_col));
            String lastRowDataTime = lastRowData.get(index_trgt_col).toString().replaceAll("\"", "");
            DTModelJsonPropertySubSet intervalPropertySubSet = jsonPropertyService.getIntervalProperty(dtModelJsonProperty);
            int resampleType = TimeUnit.getTimeType(intervalPropertySubSet.getResmpl_tp());
            int resampleValue = Integer.parseInt(intervalPropertySubSet.getResmpl_intvl_value());
            log.info("lastRowDataTime -> {}", lastRowDataTime);


            String format = ConvertUtil.tryParseFindFormat(ConvertUtil.DATEFORMATS, lastRowDataTime);
            log.info("format -> {}", format);

            LocalDateTime targetStartDateTime = null;
            if (format.length() > 10) {
                targetStartDateTime = LocalDateTime.parse(lastRowDataTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).plusSeconds(resampleValue * resampleType);
            } else {
                // 날짜만 있을 때
                targetStartDateTime = LocalDate.parse(
                        lastRowDataTime,
                        DateTimeFormatter.ofPattern(format)
                ).atStartOfDay().plusSeconds(resampleValue * resampleType);
            }
            String target_start_date = targetStartDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            data_crt_last_hr = TimeUtil.parseToYYYYMMDDHHMMSS(false, target_start_date);
            log.info("data_crt_last_hr -> {}", data_crt_last_hr);

            /**
             * stepCount가 10이 넘어가면 서버 퍼포먼스 제한
             * */
            if (stepCount > 10) {
                stepCount = 10;
            }

            //IntervalConversion에서 지정된 시간차 * windowSize * stepCount + 1
            LocalDateTime targetEndDateTime = targetStartDateTime.plusSeconds(resampleValue * resampleType * windowSize * (stepCount + 1));
            String target_end_date = targetEndDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            log.info("now -> {}, targetEndDateTime -> {}", LocalDateTime.now(), targetEndDateTime);
            if (twin_id != null && obj_id != null) {
                aug_api = dtSimulationService.getMetaContinuousAugmentInterpolationData(metaSimulationModel, target_cols, (stepCount + 1), lastFileName, target_start_date, target_end_date, originFilePath, originFileName);
            } else {
                aug_api = dtSimulationService.getMetaContinuousAugmentInterpolationData(metaSimulationModel, target_cols, (stepCount + 1), lastFileName, from_date, to_date, originFilePath, originFileName);
            }
            if (Boolean.parseBoolean(aug_api.get("status").toString())) {
                fileName = aug_api.get("filename").toString();

                resultData = new HashMap<>();
                resultData.put("file_path", file_path + "/" + fileName);

                resultDataList.add(resultData);
                //추론 데이터 마지막 추론 기간에 따라 짜르기
                if (twin_id == null && obj_id == null) { //추론 데이터 컷
                    dtSimulationService.dataFinalDateCut(file_path + File.separator + fileName, index_trgt_col, to_date);
                }
            } else {
                /**
                 * 에러시 시간 다시 원래 시간으로 원상복구
                 * */
                HashMap<String, Object> resultHashMap = new HashMap<>();
                resultHashMap.put("status", false);
                if (aug_api.get("code") != null && aug_api.get("message") != null && aug_api.get("detail") != null) {
                    resultHashMap.put("code", aug_api.get("code").toString());
                    resultHashMap.put("message", aug_api.get("message").toString());
                    resultHashMap.put("detail", aug_api.get("detail").toString());
                }
                return resultHashMap;
            }

            String sourceDirectory = file_path;

            int fileSeq = filesService.saveAugmentFiles(sourceDirectory, base_dir, fileName, augment_seq);
            HashMap<String, Object> resultHashMap = new HashMap<>();
            resultHashMap.put("augmentFileSeq", fileSeq);

            DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder();
            makeMetaSimulationSchedulerService.saveAugmentLog(errorLogBuilder.errTp(null).errCd(null).errNm(null).errCn(null)
                    .augmentSeq(augment_seq).modelSeq(model_seq)
                    .augmentStatus("C").fileSeq(fileSeq).dataCrtLastHr(data_crt_last_hr)
                    .build());

            /**
             * 결과 데이터 관련
             * */
            JSONArray formattedIndividuallyDataArray = JSONParser.formatIndividuallyData(resultDataList);
            List<Map<String, Object>> csvData = FileReader.getInstance().readCSVToListObjectMap(file_path + File.separator + lastFileName);
            //log.info("augmentOriginCsvData -> {}", csvData);
            //log.info("formattedIndividuallyDataArray -> {}", formattedIndividuallyDataArray);
            JSONArray recoveredDataFormatArray = JSONParser.recoveredDataFormat(formattedIndividuallyDataArray, csvData);
            recoveredDataFormatArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, recoveredDataFormatArray);
            //log.info("recoveredDataFormatArray -> {}", recoveredDataFormatArray);
            List<Map<String, Object>> augmentData = JSONParser.convertJsonArrayToListOfMaps(recoveredDataFormatArray);
            //기존 증강 파일 또는 전처리 파일을 원본 데이터 형태로 다시 파일 쓰기
            FileWriter.getInstance().writeCSV(resultData.get("file_path").toString(), augmentData);

            //데이터 시간을 마지막 증강 데이터의 시간으로 변경
            data_crt_last_hr = augmentData.get(augmentData.size() - 1).get(index_trgt_col).toString().replaceAll("\"", "");
            data_crt_last_hr = TimeUtil.parseToYYYYMMDDHHMMSS(false, data_crt_last_hr);

            //2024-07-15 유효성 검증이나 이상치에 대한 데이터 파일 및 데이터 확인
            //2025-10-31 여기서 twin_id와 obj_id가 있든 없든 Validation 및 Outlier 데이터 파일 경로 및 이름 리런
            log.info("twin_id -> {}", twin_id);
            log.info("obj_id -> {}", obj_id);
            if (twin_id != null || obj_id != null) {
                /*Validation 데이터 업로드*/
                /**
                 * 2024-09-27 Validation 및 Outlier 부분 Data Cutting 이루어져야함
                 * */
                JSONObject validationUploadJson = new JSONObject();
                validationUploadJson.put("status", "success");
                validationUploadJson.put("type", "augment");
                validationUploadJson.put("twin_id", twin_id);
                validationUploadJson.put("obj_id", obj_id);
                validationUploadJson.put("index_col", index_trgt_col);
                validationUploadJson.put("origin_from", origin_from);
                validationUploadJson.put("origin_to", origin_to);
                validationUploadJson.put("notification_time", notification_time);
                JSONArray validationDataJsonArray = JSONParser.formatValidationData(validations, originTimeData);
                validationDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, validationDataJsonArray);
                validationUploadJson.put("validation", validationDataJsonArray);
                // 저장할 파일 경로
                /*TODO 2025-04-18
                 * 파일 임시 저장
                 * */
                // 저장할 파일 경로
                String validationFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_validation.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(validationFilePath)) {
                    fileWriter.write(validationUploadJson.toString());
                    log.info("JSON 저장 완료 -> {}", validationFilePath);
                    Files validationFiles = new Files();
                    File validationFile = new File(validationFilePath);
                    validationFiles.setAugmentFileSeq(fileSeq);
                    validationFiles.setFileNm(validationFile.getName());
                    validationFiles.setStrgFileNm(validationFile.getName());
                    validationFiles.setFilePath(base_dir);
                    validationFiles.setFileSz(validationFile.length());
                    validationFiles.setFileExtn(FileUtil.getFileExtension(validationFile.getName()));
                    validationFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.VALIDATE.toUpperCase());
                    validationFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(validationFilePath);
                    validationFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("validationFiles", validationFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                dtModelApiService.sendValidationData(validationUploadJson);

                /*Outlier 데이터 업로드*/
                JSONObject outlierUploadJson = new JSONObject();
                outlierUploadJson.put("status", "success");
                outlierUploadJson.put("type", "augment");
                validationUploadJson.put("error", new ArrayList<>());
                outlierUploadJson.put("twin_id", twin_id);
                outlierUploadJson.put("obj_id", obj_id);
                outlierUploadJson.put("index_col", index_trgt_col);
                outlierUploadJson.put("origin_from", origin_from);
                outlierUploadJson.put("origin_to", origin_to);
                outlierUploadJson.put("notification_time", notification_time);
                JSONArray outlierDataJsonArray = JSONParser.formatOutlierData(outliers);
                outlierDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, outlierDataJsonArray);
                outlierUploadJson.put("outlier", outlierDataJsonArray);
                //log.info("outlierUploadJson -> {}", outlierUploadJson);
                // 저장할 파일 경로
                String outlierFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_outlier.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(outlierFilePath)) {
                    fileWriter.write(outlierUploadJson.toString());
                    log.info("JSON 저장 완료 -> {}", outlierFilePath);
                    Files outlierFiles = new Files();
                    File outlierFile = new File(outlierFilePath);
                    outlierFiles.setAugmentFileSeq(fileSeq);
                    outlierFiles.setFileNm(outlierFile.getName());
                    outlierFiles.setStrgFileNm(outlierFile.getName());
                    outlierFiles.setFilePath(base_dir);
                    outlierFiles.setFileSz(outlierFile.length());
                    outlierFiles.setFileExtn(FileUtil.getFileExtension(outlierFile.getName()));
                    outlierFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.OUTLIER.toUpperCase());
                    outlierFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(outlierFilePath);
                    outlierFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("outlierFiles", outlierFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                dtModelApiService.sendOutlierData(outlierUploadJson);

                // 저장할 파일 경로
                String dataFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_data.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(dataFilePath)) {
                    fileWriter.write(recoveredDataFormatArray.toString());
                    log.info("JSON 저장 완료 -> {}", dataFilePath);
                    Files dataFiles = new Files();
                    File dataFile = new File(dataFilePath);
                    dataFiles.setAugmentFileSeq(fileSeq);
                    dataFiles.setFileNm(dataFile.getName());
                    dataFiles.setStrgFileNm(dataFile.getName());
                    dataFiles.setFilePath(base_dir);
                    dataFiles.setFileSz(dataFile.length());
                    dataFiles.setFileExtn(FileUtil.getFileExtension(dataFile.getName()));
                    dataFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.AUGMENT.toUpperCase());
                    dataFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(dataFilePath);
                    dataFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("dataFiles", dataFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                //증강 결과 데이터 업로드
                dtModelApiService.sendIndividuallyData(augment_seq, twin_id, obj_id, recoveredDataFormatArray, 1);
                /**
                 * 데이터 여러건 업로드
                 * */
                // dtModelApiService.sendIndividuallyData(augment_seq, twin_id, obj_id, recoveredDataFormatArray, 5);
            } else {
                /*Validation 데이터 업로드*/
                /**
                 * 2024-09-27 Validation 및 Outlier 부분 Data Cutting 이루어져야함
                 * */
                JSONObject validationUploadJson = new JSONObject();
                validationUploadJson.put("status", "success");
                validationUploadJson.put("type", "augment");
                validationUploadJson.put("twin_id", twin_id);
                validationUploadJson.put("obj_id", obj_id);
                validationUploadJson.put("index_col", index_trgt_col);
                validationUploadJson.put("origin_from", origin_from);
                validationUploadJson.put("origin_to", origin_to);
                validationUploadJson.put("notification_time", notification_time);

                JSONArray validationDataJsonArray = JSONParser.formatValidationData(validations, originTimeData);
                validationDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, validationDataJsonArray);
                validationUploadJson.put("validation", validationDataJsonArray);
                //log.info("validationUploadJson -> {}", validationUploadJson);
                /*TODO 2025-04-18
                 * 파일 임시 저장
                 * */
                // 저장할 파일 경로
                String validationFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_validation.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(validationFilePath)) {
                    fileWriter.write(validationUploadJson.toString());
                    log.info("JSON 저장 완료 -> {}", validationFilePath);
                    Files validationFiles = new Files();
                    File validationFile = new File(validationFilePath);
                    validationFiles.setAugmentFileSeq(fileSeq);
                    validationFiles.setFileNm(validationFile.getName());
                    validationFiles.setStrgFileNm(validationFile.getName());
                    validationFiles.setFilePath(base_dir);
                    validationFiles.setFileSz(validationFile.length());
                    validationFiles.setFileExtn(FileUtil.getFileExtension(validationFile.getName()));
                    validationFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.VALIDATE.toUpperCase());
                    validationFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(validationFilePath);
                    validationFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("validationFiles", validationFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                /*Outlier 데이터 업로드*/
                JSONObject outlierUploadJson = new JSONObject();
                outlierUploadJson.put("status", "success");
                outlierUploadJson.put("type", "augment");
                outlierUploadJson.put("twin_id", twin_id);
                outlierUploadJson.put("obj_id", obj_id);
                outlierUploadJson.put("index_col", index_trgt_col);
                outlierUploadJson.put("origin_from", origin_from);
                outlierUploadJson.put("origin_to", origin_to);
                outlierUploadJson.put("notification_time", notification_time);
                JSONArray outlierDataJsonArray = JSONParser.formatOutlierData(outliers);
                outlierDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, outlierDataJsonArray);
                outlierUploadJson.put("outlier", outlierDataJsonArray);
                //log.info("outlierUploadJson -> {}", outlierUploadJson);
                /*TODO 2025-04-18
                 * 파일 임시 저장
                 * */
                // 저장할 파일 경로
                String outlierFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_outlier.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(outlierFilePath)) {
                    fileWriter.write(outlierUploadJson.toString());
                    log.info("JSON 저장 완료 -> {}", outlierFilePath);
                    Files outlierFiles = new Files();
                    File outlierFile = new File(outlierFilePath);
                    outlierFiles.setAugmentFileSeq(fileSeq);
                    outlierFiles.setFileNm(outlierFile.getName());
                    outlierFiles.setStrgFileNm(outlierFile.getName());
                    outlierFiles.setFilePath(base_dir);
                    outlierFiles.setFileSz(outlierFile.length());
                    outlierFiles.setFileExtn(FileUtil.getFileExtension(outlierFile.getName()));
                    outlierFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.OUTLIER.toUpperCase());
                    outlierFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(outlierFilePath);
                    outlierFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("outlierFiles", outlierFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                /*TODO 2025-04-18
                 * 파일 임시 저장
                 * */
                // 저장할 파일 경로
                String dataFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_data.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(dataFilePath)) {
                    fileWriter.write(recoveredDataFormatArray.toString());
                    log.info("JSON 저장 완료 -> {}", dataFilePath);
                    Files dataFiles = new Files();
                    File dataFile = new File(dataFilePath);
                    dataFiles.setAugmentFileSeq(fileSeq);
                    dataFiles.setFileNm(dataFile.getName());
                    dataFiles.setStrgFileNm(dataFile.getName());
                    dataFiles.setFilePath(base_dir);
                    dataFiles.setFileSz(dataFile.length());
                    dataFiles.setFileExtn(FileUtil.getFileExtension(dataFile.getName()));
                    dataFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.AUGMENT.toUpperCase());
                    dataFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(dataFilePath);
                    dataFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("dataFiles", dataFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            resultHashMap.put("data_crt_last_hr", data_crt_last_hr);
            resultHashMap.put("status", true);
            return resultHashMap;
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorParams = errorMessageSave(errorcheckBody, augment_seq);
            try {
                DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder();
                makeMetaSimulationSchedulerService.saveAugmentLog(errorLogBuilder.errTp("P")
                        .errCd(errorParams.get("code").toString()).errNm(errorParams.get("message").toString()).errCn(errorParams.get("detail").toString())
                        .augmentSeq(augment_seq).modelSeq(model_seq)
                        .augmentStatus("E").dataCrtLastHr(data_crt_last_hr)
                        .build());
                if (twin_id != null || obj_id != null) {
                    Map<String, Object> errorInfo = new LinkedHashMap<>();
                    errorInfo.put("status", "fail");
                    errorInfo.put("twin_id", twin_id);
                    errorInfo.put("obj_id", obj_id);
                    errorInfo.put("index_col", index_trgt_col);
                    errorInfo.put("origin_from", origin_from);
                    errorInfo.put("origin_to", origin_to);
                    errorInfo.put("notification_time", notification_time);
                    errorInfo.put("augment_seq", augment_seq);
                    errorInfo.put("model_seq", model_seq);
                    errorInfo.put("err_cd", errorParams.get("code").toString());
                    errorInfo.put("err_nm", errorParams.get("message").toString());
                    errorInfo.put("err_cn", errorParams.get("detail").toString());
                    /**
                     * 에러 데이터 업로드
                     * */
                    dtModelApiService.sendErrorData(errorInfo);
                }
            } catch (Exception e1) {
                e1.printStackTrace();
            }
            HashMap<String, Object> resultHashMap = new HashMap<>();
            resultHashMap.put("status", false);
            return resultHashMap;
        }
    }

    private boolean dataFinalCut(String filePath, int windowSize) throws Exception {
        log.info("dataFinalCut -> {}, {}", filePath, windowSize);
        List<Map<String, Object>> data = FileReader.getInstance().readCSVToListObjectMap(filePath);
        if (data.size() > windowSize) {
            Collections.reverse(data);
            List<Map<String, Object>> cutData = data.subList(0, windowSize + 1);
            Collections.reverse(cutData);
            FileWriter.getInstance().writeCSV(filePath, cutData);
            return true;
        }
        return false;
    }

    private boolean dataFinalDateCut(String filePath, String timeIndex, String toDate) throws Exception {
        log.info("dataFinalDateCut -> {}, {}, {}", filePath, timeIndex, toDate);
        List<Map<String, Object>> data = FileReader.getInstance().readCSVToListObjectMap(filePath);
        Date cutoffDate = ConvertUtil.tryParse(ConvertUtil.DATEFORMATS, toDate);
        // 데이터를 필터링하여 timeIndex로 지정된 날짜가 toDate 이전인 항목들만 남김
        List<Map<String, Object>> filteredData = data.stream().filter(row -> {
            try {
                String dateString = row.get(timeIndex).toString();
                Date rowDate = ConvertUtil.tryParse(ConvertUtil.DATEFORMATS, dateString);
                return rowDate.before(cutoffDate);
            } catch (Exception e) {
                log.error("Date parsing error for row: {}", row, e);
                return false; // 날짜 파싱 오류 시 필터에서 제외
            }
        }).collect(Collectors.toList());
        FileWriter.getInstance().writeCSV(filePath, filteredData);
        // 필터링된 결과를 저장하거나 처리
        log.info("Filtered data count: {}", filteredData.size());

        // 예시로, 필터링된 데이터가 있으면 true 반환
        return !filteredData.isEmpty();
    }

    public HashMap<String, Object> makePreprocess(String twin_id, String obj_id, DTModelJsonProperty dtModelJsonProperty, String base_dir, String file_path, String file_name, String index_trgt_col, String user_id, int model_seq, int augment_seq, String from_date, String to_date, String data_crt_last_hr, List<String> originTimeData) throws IOException {
        String errorcheckBody = null;
        String resultTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";
        String prev_file_name = file_name;
        boolean isDecisionTree = false;
        DecisionTreeOption decisionTreeOption = null;
        String decisionKey = null;
        ArrayList<String> decisionLabels = new ArrayList<>();
        log.info("makePreprocess 초기 타겟 파일 -> {}, makePreprocess 초기 원본 파일 -> {}, makePreprocess 초기 이전 파일 -> {}", resultTargetFileName, prev_file_name, prev_file_name);

        //유효성 맵
        List<Map<String, Object>> validations = new ArrayList<>();
        //이상치 맵
        List<Map<String, Object>> outliers = new ArrayList<>();
        //변환 데이터 맵 - 연계 처리 후
        List<Map<String, Object>> resultDataList = new ArrayList<>();
        Map<String, Object> resultData = new HashMap<>();

        String origin_from = from_date;
        String origin_to = to_date;

        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String notification_time = now.format(formatter);

        try {
            Map<String, Object> setParam = new HashMap<String, Object>();

            String lastFileName = file_name;
            setParam.put("file_name", lastFileName);
            setParam.put("target_file_name", resultTargetFileName);
            setParam.put("file_path", file_path);
            setParam.put("index_trgt_col", index_trgt_col);

            List<DTModelJsonPropertySub> dtModelJsonPropertySubs = dtModelJsonProperty.getPreproc_property_info().get(0).getPreproc_property();
            for (DTModelJsonPropertySub dtModelJsonPropertySub : dtModelJsonPropertySubs) {
                int step = dtModelJsonPropertySub.getPreproc_order();
                setParam.put("file_path", file_path);
                setParam.put("preproc_order", step);
                switch (step) {
                    case 1: {
                        log.info("===========================유효성 검증 로직 시작===========================");
                        int subStepCount = 0;
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_valid" + ".csv";
                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            if (subStepCount == 0) {
                                setParam.put("file_name", file_name);
                            }

                            setParam.put("target_file_name", targetFileName);
                            setParam.put("set_order", subStep.getSet_order());
                            setParam.put("is_create", "Y");
                            setParam.put("index_trgt_col", index_trgt_col);

                            setParam.put("vrfc_tp", subStep.getVrfc_tp());
                            setParam.put("vrfc_trgt_col", subStep.getTrgt_col());
                            setParam.put("vrfc_clear_type", subStep.getVrfc_clear_tp());

                            Map<String, Object> verify_option = verifyService.getVerifyOption(Integer.parseInt(subStep.getVrfc_sub_tp()));
                            Map<String, Object> rule = processFindVerifyRule(verify_option, subStep);
                            setParam.putAll(rule);

                            log.info("Validate Parameter -> {}", setParam);
                            ResponseEntity<?> validSet = dtModelApiService.makeValidateSet(setParam);
                            log.info("validSet -> {}", validSet);
                            errorcheckBody = validSet.getBody().toString();
                            log.info("validSet errorcheckBody -> {}", errorcheckBody);

                            lastFileName = getResponseTargetFileName(validSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);

                            // 동기화 엔진에 업로드할 Validation 데이터 설정 부분
                            Map<String, Object> validation = processMakeValidate(subStep, file_path + "/" + "valid_" + subStep.getSet_order() + "_" + lastFileName);
                            validations.add(validation);

                            //Validate 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;
                            subStepCount++;
                        }
                        log.info("===========================유효성 검증 로직 종료===========================");
                        break;
                    }
                    case 2: {
                        log.info("===========================이상치 검증 로직 시작===========================");
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_outlier" + ".csv";
                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            //resultTargetFileName Validate 결과 파일
                            //lastFileName 프로세스의 마지막 결과 파일
                            //두개가 같다면 Validate 결과 파일과 프로세스의 마지막 결과 파일이 같으므로 Validate 프로세스를 타고 온것으로 간주
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);
                            setParam.put("set_order", subStep.getSet_order());
                            setParam.put("isCreate", "Y");
                            setParam.put("feature", subStep.getTrgt_col());
                            setParam.put("freq", Integer.parseInt(subStep.getFreq().replaceAll("\"", "")));

                            String outlierType = subStep.getOutlier_tp();
                            log.info("outlierType -> {}", outlierType);
                            switch (outlierType.toUpperCase()) {
                                case "STANDARD": {
                                    setParam.put("p_value", Float.parseFloat(subStep.getP_value().replaceAll("\"", "")));
                                    break;
                                }
                                case "KMEAN": {
                                    setParam.put("n_clusters", Integer.parseInt(subStep.getN_clusters().replaceAll("\"", "")));
                                    setParam.put("n_clusters_lable", 4);
                                    setParam.put("n_count", Integer.parseInt(subStep.getN_count().replaceAll("\"", "")));
                                    break;
                                }
                                case "DBSCAN": {
                                    setParam.put("eps", Float.parseFloat(subStep.getEps().replaceAll("\"", "")));
                                    setParam.put("min_samples", Integer.parseInt(subStep.getMin_samples().replaceAll("\"", "")));
                                    break;
                                }
                                default: {
                                    // Auto Encoder Model 정보 찾기
                                    Map<String, Object> modelInfo = dtModelService.getEtcModelInfo(Integer.parseInt(subStep.getEtc_model_seq()));
                                    // Auto Encoder Model 정보 담기
                                    Map<String, Object> modelParams = processFindAutoEncoder(subStep, modelInfo);
                                    setParam.putAll(modelParams);
                                    break;
                                }
                            }
                            log.info("Outlier Parameter -> {}", setParam);
                            ResponseEntity<?> outlierSet = dtModelApiService.makeOutlierSet(setParam, outlierType);
                            log.info("outlierSet -> {}", outlierSet);
                            errorcheckBody = outlierSet.getBody().toString();
                            log.info("outlierSet errorcheckBody -> {}", errorcheckBody);

                            lastFileName = getResponseTargetFileName(outlierSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);

                            // 동기화 엔진에 업로드할 Outlier 데이터 설정 부분
                            Map<String, Object> outlier = processMakeOutlier(subStep, file_path + "/" + "outlier_" + subStep.getSet_order() + "_" + lastFileName);
                            outliers.add(outlier);

                            //Outlier 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;
                            //이전 파일 정보 추가로 저장
                            prev_file_name = setParam.get("file_name").toString();
                        }
                        log.info("===========================이상치 검증 로직 종료===========================");
                        break;
                    }
                    case 3: {
                        log.info("===========================결측/보간 로직 시작===========================");
                        int subStepCount = 0;
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_interpolate" + ".csv";
                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            //resultTargetFileName Outlier 결과 파일
                            //lastFileName 프로세스의 마지막 결과 파일
                            //두개가 같다면 Outlier 결과 파일과 프로세스의 마지막 결과 파일이 같으므로 Outlier 프로세스를 타고 온것으로 간주
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);
                            String interpolationType = subStep.getInterpl_tp();
                            setParam.put("interpl_tp", interpolationType);
                            switch (interpolationType.toUpperCase()) {
                                case "DECISIONTREE": {
                                    //동기화 엔진 데이터 업로드 프로세스에서 사용할 변수 수정
                                    isDecisionTree = true;
                                    decisionKey = subStep.getInterpl_feature().replaceAll("\"", "");

                                    setParam.put("prev_file_name", file_path + File.separator + prev_file_name);
                                    setParam.put("index_column", index_trgt_col);
                                    setParam.put("set_order", (subStepCount + 1));
                                    setParam.put("isCreate", "Y");
                                    setParam.put("model_path", "");
                                    setParam.put("feature", decisionKey);
                                    setParam.put("outputs", subStep.getInterpl_outputs());

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    Map<String, Object> resultMap = DTModelController.extractDecisionDataKeyValues(interpolateSet);
                                    decisionLabels.addAll((ArrayList<String>) resultMap.get("labels"));
                                    lastFileName = FileUtil.getExtractFileNameToFilePath(resultMap.get("target_file_name").toString());

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;

                                    //DecisionTree를 사용하였다면 Interval Conversion 프로세스 진행 시 Decision Tree Interval Conversion 프로세스 실행
                                    //그전 사전 준비, 어떤 Decision Tree 옵션을 사용했는지에 대한 설정
                                    if (decisionTreeOption == null) {
                                        decisionTreeOption = new DecisionTreeOption(setParam.get("file_path").toString(), null, lastFileName,
                                                null, index_trgt_col, (ArrayList<String>) subStep.getInterpl_outputs(), subStep.getDecision_model_file_path() + subStep.getDecision_model_file_name(),
                                                subStep.getInterpl_feature().replaceAll("\"", ""), String.valueOf(subStepCount + 1), "Y");
                                    }
                                    break;
                                }
                                case "RANDOM FOREST": {
                                    setParam.put("outputs", subStep.getInterpl_outputs());
                                    setParam.put("features", subStep.getInterpl_labels());
                                    setParam.put("model_file_path", subStep.getInterpl_etc_model_file_path());
                                    setParam.put("model_file_name", subStep.getInterpl_etc_model_file_name());
                                    setParam.put("model_use_file_path", file_path);
                                    setParam.put("model_use_file_name", setParam.get("file_name"));
                                    setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                    setParam.put("index_column", index_trgt_col);
                                    setParam.put("trgt_col_list", "");

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    lastFileName = setParam.get("target_file_name").toString();

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;
                                    break;
                                }
                                case "BRITS": {
                                    setParam.put("outputs", subStep.getInterpl_outputs());
                                    setParam.put("model_file_path", subStep.getInterpl_etc_model_file_path());
                                    setParam.put("model_file_name", subStep.getInterpl_etc_model_file_name());
                                    setParam.put("model_use_file_path", file_path);
                                    setParam.put("model_use_file_name", setParam.get("file_name"));
                                    setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                    setParam.put("index_column", index_trgt_col);
                                    setParam.put("trgt_col_list", subStep.getInterpl_outputs());

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    lastFileName = setParam.get("target_file_name").toString();

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;
                                    break;
                                }
                                case "NAOMI": {
                                    setParam.put("outputs", subStep.getInterpl_outputs());
                                    setParam.put("model_file_path", subStep.getInterpl_etc_model_file_path());
                                    setParam.put("model_file_name", subStep.getInterpl_etc_model_file_name());
                                    setParam.put("windowSize", subStep.getInterpl_window_size());
                                    setParam.put("model_use_file_path", file_path);
                                    setParam.put("model_use_file_name", setParam.get("file_name"));
                                    setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                    setParam.put("index_column", index_trgt_col);
                                    setParam.put("trgt_col_list", subStep.getInterpl_outputs());

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    lastFileName = setParam.get("target_file_name").toString();

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;
                                    break;
                                }
                                default: {
                                    setParam.put("index_trgt_col", index_trgt_col);

                                    log.info("Interpolate -> {}", setParam);
                                    ResponseEntity<?> interpolateSet = dtModelApiService.makeInterpolateSet(setParam, interpolationType.toUpperCase());
                                    log.info("interpolateSet -> {}", interpolateSet);
                                    errorcheckBody = interpolateSet.getBody().toString();
                                    log.info("interpolateSet errorcheckBody -> {}", errorcheckBody);

                                    lastFileName = getResponseTargetFileName(interpolateSet.getBody().toString());

                                    setParam.clear();
                                    setParam.put("file_name", lastFileName);
                                    setParam.put("file_path", file_path);
                                    setParam.put("index_trgt_col", index_trgt_col);
                                    // 동기화 엔진에 업로드할 Interpolation 데이터 설정 부분
                                    // 업음

                                    //Interpolation 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                    resultTargetFileName = lastFileName;
                                    break;
                                }
                            }
                            prev_file_name = setParam.get("file_name").toString();
                            subStepCount++;
                        }

                        // 결측 로직 끝난 직후 원본 필터링 대체 작업 시작
                        // 원본 데이터와 보조 데이터가 서로 일치하는것이 없다면 긁어온 데이터가 이미 전처리되어져있어 전처리 중복을 의미
                        // OriginTimeData 출처 = 처음 긁어온 데이터 양의 시간값만 있는 배열
                        // 처음 긁어온 데이터에서 데이터 부족시 더 많은 데이터를 긁어올때 처음 원본 데이터의 시간값 배열
                        if (originTimeData != null && !originTimeData.isEmpty()) {
                            log.info("원본 데이터 (OriginTimeData) 필터링 시작");
                            log.info("다시 쓰는 파일 -> {}", file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                            List<Map<String, Object>> readData = FileReader.getInstance().readCSVToListObjectMap(file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                            //log.info("originTimeData -> {}", originTimeData);
                            List<Map<String, Object>> filteredOriginData = originDataFilter(originTimeData, readData, index_trgt_col);
                            //log.info("필터링 종료 -> filteredOriginData : {}", filteredOriginData);
                            log.info("원본 데이터 (OriginTimeData) 필터링 종료");

                            if (filteredOriginData.isEmpty()) {
                                log.info("원본 데이터와 보조데이터가 서로 일치하는것이 없습니다.");
                                HashMap<String, Object> resultHashMap = new HashMap<>();
                                resultHashMap.put("status", false);
                                resultHashMap.put("isSizeAvailable", false);
                                return resultHashMap;
                            }

                            FileWriter.getInstance().writeCSV(file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName), filteredOriginData);
                            log.info("파일 덮어 쓰기 종료 -> filePath : {}, fileName : {}", file_path, (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                        } else {
                            log.info("데이터가 최초 데이터에서 다 이루어졋습니다.");
                        }
                        log.info("===========================결측/보간 로직 종료===========================");
                        break;
                    }
                    case 4: {
                        log.info("===========================리샘플링 로직 시작===========================");
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_interval" + ".csv";

                        //리샘플링 로직
                        //시간의 단위를 판별해서 해당 시간 단위의 최저 값으로 먼저 샘플링 작업을 실행하여 최저 시간으로 인해 늘어난 데이터 중 원본데이터를 최대한 유지하는 로직
                        //EX) 시간 단위 데이터 1시간 단위로, 분 단위 데이터 1분 단위로, 초 단위 데이터 1초 단위로

                        //파일을 읽어드린다.
                        //파일의 데이터에서 일부 데이터만을 얻고 시계열 컬럼만 뽑아온 데이터를 얻어온다. (index_trgt_col 참조)
                        //시계열 컬럼만 얻어온 데이터에서 시간이 초단위인지 분단위인지 시간단위인지 일단위인지 얻는다. (time_rule과 resmpl_tp 지정)
                        //얻은 time_rule, resmpl_tp 파라미터로 resampling 로직을 굴린다.
                        //원래 클라이언트에게 받은 파라미터로 resampling 로직을 굴린다.

                        //시간 구분 로직
                        //원본 파일에서 파악한 데이터 시간의 기본값을 확인

                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            String dateKey = index_trgt_col;
                            Map<String, Object> prevResultCsv = FileReader.getInstance().readCSV(file_path + File.separator + file_name);
                            List<String> timeIndicatorHeaders = (List<String>) prevResultCsv.get("header_list");
                            List<List<String>> prevResultDataList = (List<List<String>>) prevResultCsv.get("data_list");
                            HashMap<String, Object> unitParam = dtModelApiService.dataTimeDivider(dateKey, timeIndicatorHeaders, prevResultDataList);
                            TimeUnit unit = (TimeUnit) unitParam.get("unit");
                            int delta = ((Double) unitParam.get("delta")).intValue();

                            log.info("Base Delta -> {}, Base Unit -> {}", delta, unit);

                            //데이터 시간의 기본값으로 리샘플링할 타겟 파일 이름
                            String prevTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_prev_interval" + ".csv";

                            Map<String, Object> setPrevParam = new HashMap<>();
                            setPrevParam.put("file_path", file_path);
                            setPrevParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setPrevParam.put("index_trgt_col", dateKey);
                            setPrevParam.put("target_file_name", prevTargetFileName);
                            setPrevParam.put("resmpl_tp", unit.getResampleType());
                            setPrevParam.put("time_rule", ("1" + unit.getResampleType()));

                            log.info("PrevResample -> {}", setPrevParam);
                            ResponseEntity<?> prevResampleSet = dtModelApiService.makeResampleSet(setPrevParam);
                            log.info("prevResampleSet -> {}", prevResampleSet);
                            errorcheckBody = prevResampleSet.getBody().toString();
                            log.info("prevResampleSet errorcheckBody -> {}", errorcheckBody);

                            lastFileName = getResponseTargetFileName(prevResampleSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);

                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);

                            //리샘플링을 설정 옵션으로 한번 더 진행해야되므로 타겟 파일 이름 설정
                            setParam.put("target_file_name", targetFileName);

                            // 동기화 엔진에 업로드할 Resample 데이터 설정 부분
                            // 업음

                            //Resample 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;

                            setParam.put("resmpl_tp", subStep.getResmpl_tp().replaceAll("\"", ""));
                            setParam.put("time_rule", subStep.getResmpl_intvl_value().replaceAll("\"", "") + subStep.getResmpl_tp().replaceAll("\"", ""));

                            log.info("Resample -> {}", setParam);
                            ResponseEntity<?> resampleSet = dtModelApiService.makeResampleSet(setParam);
                            log.info("resampleSet -> {}", resampleSet);
                            errorcheckBody = resampleSet.getBody().toString();
                            log.info("resampleSet errorcheckBody -> {}", errorcheckBody);

                            lastFileName = getResponseTargetFileName(resampleSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            // 동기화 엔진에 업로드할 Resample 데이터 설정 부분
                            // 업음

                            //Resample 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;

                            //Decision Tree 사용했을 시 Decision Tree 전용 Resample 사용
                            if (isDecisionTree) {
                                String decisionTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_dt_resample_" + TimeUtil.getCurrentTimeMillis() + ".csv";
                                log.info("Decision Tree 전용 로직 시작");
                                log.info("Decision Tree Option -> {}", decisionTreeOption);
                                Map<String, Object> decisionTreeSetParam = decisionTreeOption.decisionTreeSetParam();
                                decisionTreeSetParam.put("file_name", lastFileName);
                                decisionTreeSetParam.put("target_file_name", decisionTargetFileName);

                                log.info("DecisionTree Resample -> {}", decisionTreeSetParam);
                                ResponseEntity<?> decisionTreeResampleSet = dtModelApiService.makeInterpolateModelDecisionSet(decisionTreeSetParam);
                                log.info("decisionTreeResampleSet -> {}", decisionTreeResampleSet);
                                errorcheckBody = decisionTreeResampleSet.getBody().toString();
                                log.info("decisionTreeResampleSet errorcheckBody -> {}", errorcheckBody);

                                //Resample 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                                lastFileName = decisionTargetFileName;
                                setParam.clear();
                                setParam.put("file_name", lastFileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);

                                resultTargetFileName = lastFileName;
                                log.info("Decision Tree 전용 로직 종료");
                            }
                        }
                        log.info("===========================리샘플링 로직 종료===========================");
                        break;
                    }
                    case 5: {
                        log.info("===========================단위 변환 로직 시작===========================");
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_unit" + ".csv";
                        List<DTModelJsonPropertySubSet> subSteps = dtModelJsonPropertySub.getPreproc_set();
                        for (DTModelJsonPropertySubSet subStep : subSteps) {
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);

                            //단위 변환 공식 가져오기
                            Map<String, Object> params = new HashMap<String, Object>();
                            params.put("unit_tp", subStep.getUnit_tp().replaceAll("\"", ""));
                            params.put("unit_seq", Integer.parseInt(subStep.getUnit_cd_1().replaceAll("\"", "")));
                            String unitFormula = dtModelService.getUnitFormula(params);
                            setParam.put("unit_trgt_col", subStep.getTrgt_col().replaceAll("\"", ""));
                            setParam.put("unit_formula", unitFormula);

                            log.info("Unit -> {}", setParam);
                            ResponseEntity<?> unitSet = dtModelApiService.makeUnitSet(setParam);
                            log.info("unitSet -> {}", unitSet);
                            errorcheckBody = unitSet.getBody().toString();
                            log.info("unitSet errorcheckBody -> {}", errorcheckBody);
                            lastFileName = getResponseTargetFileName(unitSet.getBody().toString());

                            setParam.clear();
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            // 동기화 엔진에 업로드할 Resample 데이터 설정 부분
                            // 업음

                            //Resample 결과 파일을 다음 프로세스 타겟 파일이름으로 지정
                            resultTargetFileName = lastFileName;
                        }
                        log.info("===========================단위 변환 로직 종료===========================");
                        break;
                    }
                }
            }

            String fileName = lastFileName;
            resultData = new HashMap<>();
            resultData.put("file_path", file_path + "/" + lastFileName);

            resultDataList.add(resultData);

            String sourceDirectory = file_path;

            int fileSeq = filesService.saveAugmentFiles(sourceDirectory, base_dir, fileName, augment_seq);
            HashMap<String, Object> resultHashMap = new HashMap<>();
            resultHashMap.put("preprocessFileSeq", fileSeq);

            DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder();
            makeMetaSimulationSchedulerService.saveAugmentLog(errorLogBuilder.errTp(null)
                    .errCd(null).errNm(null).errCn(null)
                    .augmentSeq(augment_seq).modelSeq(model_seq)
                    .augmentStatus("C").fileSeq(fileSeq).dataCrtLastHr(data_crt_last_hr)
                    .build());

            /**
             * 결과 데이터 관련
             * */
            JSONArray formattedIndividuallyDataArray = JSONParser.formatIndividuallyData(resultDataList);
            List<Map<String, Object>> csvData = FileReader.getInstance().readCSVToListObjectMap(file_path + File.separator + lastFileName);
            JSONArray recoveredDataFormatArray = JSONParser.recoveredDataFormat(formattedIndividuallyDataArray, csvData);
            recoveredDataFormatArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, recoveredDataFormatArray);

            List<Map<String, Object>> preprocessData = JSONParser.convertJsonArrayToListOfMaps(recoveredDataFormatArray);
            //기존 증강 파일 또는 전처리 파일을 원본 데이터 형태로 다시 파일 쓰기
            FileWriter.getInstance().writeCSV(resultData.get("file_path").toString(), preprocessData);

            //평균 시간 뽑기(기존 로직 유지하기 위해서 나중에는 지워도 된다.)
            HashMap<String, Object> unitParam = dtSimulationService.getTimeUnit(index_trgt_col, preprocessData);
            TimeUnit unit = (TimeUnit) unitParam.get("unit");
            int delta = ((Double) unitParam.get("delta")).intValue();

            log.info("unit -> {}, delta -> {}", unit, delta);

            //데이터 시간을 마지막 전처리 데이터의 시간으로 변경
            int resampleType = TimeUnit.getTimeType(unit.getResampleType());
            int resampleValue = delta;
            String lastRowDataTime = preprocessData.get(preprocessData.size() - 1).get(index_trgt_col).toString();
            List<DTModelJsonPropertySubSet> dtModelJsonPropertySubSets = dtModelJsonProperty.getPreproc_property_info().get(0).getPreproc_property().get(3).getPreproc_set();
            if (dtModelJsonPropertySubSets.size() != 0 && dtModelJsonPropertySubSets.get(0).getResmpl_tp() != null) {
                resampleType = TimeUnit.getTimeType(dtModelJsonPropertySubSets.get(0).getResmpl_tp());
                resampleValue = Integer.parseInt(dtModelJsonPropertySubSets.get(0).getResmpl_intvl_value());
            }

            log.info("lastRowDataTime -> {}", lastRowDataTime);

            String format = ConvertUtil.tryParseFindFormat(ConvertUtil.DATEFORMATS, lastRowDataTime);
            log.info("format -> {}", format);

            LocalDateTime targetStartDateTime = null;
            if (format.length() > 10) {
                targetStartDateTime = LocalDateTime.parse(lastRowDataTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).plusSeconds(resampleValue * resampleType);
            } else {
                // 날짜만 있을 때
                targetStartDateTime = LocalDate.parse(
                        lastRowDataTime,
                        DateTimeFormatter.ofPattern(format)
                ).atStartOfDay().plusSeconds(resampleValue * resampleType);
            }
            String target_start_date = targetStartDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            data_crt_last_hr = target_start_date;
            //2024-07-15 유효성 검증이나 이상치에 대한 데이터 파일 및 데이터 확인
            //2025-10-31 여기서 twin_id와 obj_id가 있든 없든 Validation 및 Outlier 데이터 파일 경로 및 이름 리런
            if (twin_id != null || obj_id != null) {
                /*Validation 데이터 업로드*/
                /**
                 * 2024-09-27 Validation 및 Outlier 부분 Data Cutting 이루어져야함
                 * */
                JSONObject validationUploadJson = new JSONObject();
                validationUploadJson.put("status", "success");
                validationUploadJson.put("type", "preproc");
                validationUploadJson.put("twin_id", twin_id);
                validationUploadJson.put("obj_id", obj_id);
                validationUploadJson.put("index_col", index_trgt_col);
                validationUploadJson.put("origin_from", origin_from);
                validationUploadJson.put("origin_to", origin_to);
                validationUploadJson.put("notification_time", notification_time);
                JSONArray validationDataJsonArray = JSONParser.formatValidationData(validations, originTimeData);
                validationDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, validationDataJsonArray);
                validationUploadJson.put("validation", validationDataJsonArray);
                //log.info("validationUploadJson -> {}", validationUploadJson);
                String validationFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_validation.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(validationFilePath)) {
                    fileWriter.write(validationUploadJson.toString());
                    log.info("JSON 저장 완료 -> {}", validationFilePath);
                    Files validationFiles = new Files();
                    File validationFile = new File(validationFilePath);
                    validationFiles.setAugmentFileSeq(fileSeq);
                    validationFiles.setFileNm(validationFile.getName());
                    validationFiles.setStrgFileNm(validationFile.getName());
                    validationFiles.setFilePath(base_dir);
                    validationFiles.setFileSz(validationFile.length());
                    validationFiles.setFileExtn(FileUtil.getFileExtension(validationFile.getName()));
                    validationFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.VALIDATE.toUpperCase());
                    validationFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(validationFilePath);
                    validationFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("validationFiles", validationFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                dtModelApiService.sendValidationData(validationUploadJson);

                /*Outlier 데이터 업로드*/
                JSONObject outlierUploadJson = new JSONObject();
                outlierUploadJson.put("status", "success");
                outlierUploadJson.put("type", "preproc");
                outlierUploadJson.put("twin_id", twin_id);
                outlierUploadJson.put("obj_id", obj_id);
                outlierUploadJson.put("index_col", index_trgt_col);
                outlierUploadJson.put("origin_from", origin_from);
                outlierUploadJson.put("origin_to", origin_to);
                outlierUploadJson.put("notification_time", notification_time);
                JSONArray outlierDataJsonArray = JSONParser.formatOutlierData(outliers);
                outlierDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, outlierDataJsonArray);
                outlierUploadJson.put("outlier", outlierDataJsonArray);
                //log.info("outlierUploadJson -> {}", outlierUploadJson);
                String outlierFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_outlier.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(outlierFilePath)) {
                    fileWriter.write(outlierUploadJson.toString());
                    log.info("JSON 저장 완료 -> {}", outlierFilePath);
                    Files outlierFiles = new Files();
                    File outlierFile = new File(outlierFilePath);
                    outlierFiles.setAugmentFileSeq(fileSeq);
                    outlierFiles.setFileNm(outlierFile.getName());
                    outlierFiles.setStrgFileNm(outlierFile.getName());
                    outlierFiles.setFilePath(base_dir);
                    outlierFiles.setFileSz(outlierFile.length());
                    outlierFiles.setFileExtn(FileUtil.getFileExtension(outlierFile.getName()));
                    outlierFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.OUTLIER.toUpperCase());
                    outlierFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(outlierFilePath);
                    outlierFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("outlierFiles", outlierFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                dtModelApiService.sendOutlierData(outlierUploadJson);

                //증강 결과 데이터 업로드
                String dataFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_data.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(dataFilePath)) {
                    fileWriter.write(recoveredDataFormatArray.toString());
                    log.info("JSON 저장 완료 -> {}", dataFilePath);
                    Files dataFiles = new Files();
                    File dataFile = new File(dataFilePath);
                    dataFiles.setAugmentFileSeq(fileSeq);
                    dataFiles.setFileNm(dataFile.getName());
                    dataFiles.setStrgFileNm(dataFile.getName());
                    dataFiles.setFilePath(base_dir);
                    dataFiles.setFileSz(dataFile.length());
                    dataFiles.setFileExtn(FileUtil.getFileExtension(dataFile.getName()));
                    dataFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.PREPROCESS.toUpperCase());
                    dataFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(dataFilePath);
                    dataFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("dataFiles", dataFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                dtModelApiService.sendIndividuallyData(augment_seq, twin_id, obj_id, recoveredDataFormatArray, 1);
                /**
                 * 데이터 여러건 업로드
                 * */
                //dtModelApiService.sendIndividuallyData(systemProperties, augment_seq, twin_id, obj_id, recoveredDataFormatArray, 5);
            } else {
                /*Validation 데이터 업로드*/
                /**
                 * 2024-09-27 Validation 및 Outlier 부분 Data Cutting 이루어져야함
                 * */
                JSONObject validationUploadJson = new JSONObject();
                validationUploadJson.put("status", "success");
                validationUploadJson.put("type", "preproc");
                validationUploadJson.put("twin_id", twin_id);
                validationUploadJson.put("obj_id", obj_id);
                validationUploadJson.put("index_col", index_trgt_col);
                validationUploadJson.put("origin_from", origin_from);
                validationUploadJson.put("origin_to", origin_to);
                validationUploadJson.put("notification_time", notification_time);
                JSONArray validationDataJsonArray = JSONParser.formatValidationData(validations, originTimeData);
                validationDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, validationDataJsonArray);
                validationUploadJson.put("validation", validationDataJsonArray);
                String validationFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_validation.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(validationFilePath)) {
                    fileWriter.write(validationUploadJson.toString());
                    log.info("JSON 저장 완료 -> {}", validationFilePath);
                    Files validationFiles = new Files();
                    File validationFile = new File(validationFilePath);
                    validationFiles.setAugmentFileSeq(fileSeq);
                    validationFiles.setFileNm(validationFile.getName());
                    validationFiles.setStrgFileNm(validationFile.getName());
                    validationFiles.setFilePath(base_dir);
                    validationFiles.setFileSz(validationFile.length());
                    validationFiles.setFileExtn(FileUtil.getFileExtension(validationFile.getName()));
                    validationFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.VALIDATE.toUpperCase());
                    validationFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(validationFilePath);
                    validationFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("validationFiles", validationFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                /*Outlier 데이터 업로드*/
                JSONObject outlierUploadJson = new JSONObject();
                outlierUploadJson.put("status", "success");
                outlierUploadJson.put("type", "preproc");
                outlierUploadJson.put("twin_id", twin_id);
                outlierUploadJson.put("obj_id", obj_id);
                outlierUploadJson.put("index_col", index_trgt_col);
                outlierUploadJson.put("origin_from", origin_from);
                outlierUploadJson.put("origin_to", origin_to);
                outlierUploadJson.put("notification_time", notification_time);
                JSONArray outlierDataJsonArray = JSONParser.formatOutlierData(outliers);
                outlierDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, outlierDataJsonArray);
                outlierUploadJson.put("outlier", outlierDataJsonArray);
                String outlierFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_outlier.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(outlierFilePath)) {
                    fileWriter.write(outlierUploadJson.toString());
                    log.info("JSON 저장 완료 -> {}", outlierFilePath);
                    Files outlierFiles = new Files();
                    File outlierFile = new File(outlierFilePath);
                    outlierFiles.setAugmentFileSeq(fileSeq);
                    outlierFiles.setFileNm(outlierFile.getName());
                    outlierFiles.setStrgFileNm(outlierFile.getName());
                    outlierFiles.setFilePath(base_dir);
                    outlierFiles.setFileSz(outlierFile.length());
                    outlierFiles.setFileExtn(FileUtil.getFileExtension(outlierFile.getName()));
                    outlierFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.OUTLIER.toUpperCase());
                    outlierFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(outlierFilePath);
                    outlierFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("outlierFiles", outlierFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                //증강 결과 데이터 업로드
                String dataFilePath = file_path + File.separator + notification_time.replaceAll("[ :]", "") + "_data.json";
                try (java.io.FileWriter fileWriter = new java.io.FileWriter(dataFilePath)) {
                    fileWriter.write(recoveredDataFormatArray.toString());
                    log.info("JSON 저장 완료 -> {}", dataFilePath);
                    Files dataFiles = new Files();
                    File dataFile = new File(dataFilePath);
                    dataFiles.setAugmentFileSeq(fileSeq);
                    dataFiles.setFileNm(dataFile.getName());
                    dataFiles.setStrgFileNm(dataFile.getName());
                    dataFiles.setFilePath(base_dir);
                    dataFiles.setFileSz(dataFile.length());
                    dataFiles.setFileExtn(FileUtil.getFileExtension(dataFile.getName()));
                    dataFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.PREPROCESS.toUpperCase());
                    dataFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(dataFilePath);
                    dataFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    resultHashMap.put("dataFiles", dataFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            resultHashMap.put("data_crt_last_hr", data_crt_last_hr);
            resultHashMap.put("status", true);
            return resultHashMap;
        } catch (Exception e) {
            e.printStackTrace();
            HashMap<String, Object> resultHashMap = new HashMap<>();
            Map<String, Object> errorParams = errorMessageSave(errorcheckBody, augment_seq);
            try {
                DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder();
                makeMetaSimulationSchedulerService.saveAugmentLog(errorLogBuilder.errTp("P")
                        .errCd(errorParams.get("code").toString()).errNm(errorParams.get("message").toString()).errCn(errorParams.get("detail").toString())
                        .augmentSeq(augment_seq).modelSeq(model_seq)
                        .augmentStatus("E").dataCrtLastHr(data_crt_last_hr)
                        .build());
                if (twin_id != null || obj_id != null) {
                    Map<String, Object> errorInfo = new LinkedHashMap<>();
                    errorInfo.put("status", "fail");
                    errorInfo.put("twin_id", twin_id);
                    errorInfo.put("obj_id", obj_id);
                    errorInfo.put("index_col", index_trgt_col);
                    errorInfo.put("origin_from", origin_from);
                    errorInfo.put("origin_to", origin_to);
                    errorInfo.put("notification_time", notification_time);
                    errorInfo.put("augment_seq", augment_seq);
                    errorInfo.put("model_seq", model_seq);
                    errorInfo.put("err_cd", errorParams.get("code").toString());
                    errorInfo.put("err_nm", errorParams.get("message").toString());
                    errorInfo.put("err_cn", errorParams.get("detail").toString());
                    /**
                     * 에러 데이터 업로드
                     * */
                    dtModelApiService.sendErrorData(errorInfo);
                }
            } catch (Exception e1) {
                e1.printStackTrace();
            }
            resultHashMap.put("status", false);
            return resultHashMap;
        }
    }

    public String getResponseTargetFileName(String jsonBody) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> responseMap = objectMapper.readValue(jsonBody, new TypeReference<Map<String, Object>>() {
        });

        Map<String, Object> data = (Map<String, Object>) responseMap.get("data");
        String targetFileName = (String) data.get("target_file_name");

        return targetFileName;
    }

    public Map<String, Object> errorMessageSave(String body, int augment_seq) {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper objectMapper = new ObjectMapper();

        try {
            JsonNode rootNode = objectMapper.readTree(body);

            if (rootNode.has("code")) {
                String code = rootNode.path("code").asText();
                String message = rootNode.path("message").asText();
                String detail = rootNode.path("detail").asText();

                result.put("augment_seq", augment_seq);
                result.put("code", code);
                result.put("message", message);
                result.put("detail", detail);
            }
        } catch (IOException e) {
            e.printStackTrace();
            // 오류가 발생한 경우 처리할 로직을 추가할 수 있습니다.
        }

        return result;

    }

    public int simulationDataCount(JsonNode dataNode) {
        int dataCount = dataNode.size();
        return dataCount;
    }

    public List<String> extractTimeData(JsonNode dataNode) {
        //log.info("extractTimeData dataNode -> {}", dataNode);
        int dateColumnIndex = 0; //헤더 시간값 인덱스
        JsonNode firstObject = dataNode.get(0);
        Iterator<String> keys = firstObject.fieldNames();
        List<String> timeData = new ArrayList<>();

        List<String> keysList = new ArrayList<>();
        int count = 0;
        while (keys.hasNext()) {
            String key = keys.next();
            keysList.add(key);
            if (ConvertUtil.isDate(ConvertUtil.DATEFORMATS, String.valueOf(firstObject.get(key)).replaceAll("\"", ""))) {
                dateColumnIndex = count;
            }
            count++;
        }
        for (JsonNode data : dataNode) {
            String dateColumnValue = String.valueOf(data.get(keysList.get(dateColumnIndex)));
            timeData.add(dateColumnValue.replaceAll("\"", ""));
        }
        return timeData;
    }

    public List<String> extractTimeData(List<Map<String, Object>> datas) {
        int dateColumnIndex = 0; //헤더 시간값 인덱스
        Map<String, Object> firstObject = datas.get(0);
        Iterator<String> keys = firstObject.keySet().iterator();
        List<String> timeData = new ArrayList<>();

        List<String> keysList = new ArrayList<>();
        int count = 0;
        while (keys.hasNext()) {
            String key = keys.next();
            keysList.add(key);
            if (ConvertUtil.isDate(ConvertUtil.DATEFORMATS, String.valueOf(firstObject.get(key)).replaceAll("\"", ""))) {
                dateColumnIndex = count;
            }
            count++;
        }
        for (Map<String, Object> data : datas) {
            String dateColumnValue = String.valueOf(data.get(keysList.get(dateColumnIndex)));
            timeData.add(dateColumnValue.replaceAll("\"", ""));
        }
        return timeData;
    }

    public static List<Map<String, Object>> originDataFilter(List<String> originTimeData, List<Map<String, Object>> supplyAgainData, String index_trgt_col) {
        List<Map<String, Object>> filterData = new ArrayList<>();
        // Create a set of originTimeData for quick lookup
        for (int i = 0; i < supplyAgainData.size(); i++) {
            for (String time : originTimeData) {
                if (Objects.equals(supplyAgainData.get(i).get(index_trgt_col), time)) {
                    filterData.add(supplyAgainData.get(i));
                }
            }
        }
        return filterData;
    }

    public Map<String, Object> getSimulationPredictionView(int augmentSeq) {
        return dtSimulationMapper.getSimulationPredictionView(augmentSeq);
    }

    public HashMap<String, Object> getTimeUnit(String dateKey, List<Map<String, Object>> data) {
        List<String> keys = new ArrayList<>();
        List<List<String>> datas = new ArrayList<>();
        boolean check = false;
        for (Map<String, Object> map : data) {
            List<String> oneData = new ArrayList<>();
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (!check) {
                    keys.add(entry.getKey().replace("\"", ""));
                }
                oneData.add(entry.getValue().toString().replace("\"", ""));
            }
            check = true;
            datas.add(oneData);
        }
        log.info("keys -> {}", keys);
        return dtModelApiService.dataTimeDivider(dateKey, keys, datas);
    }

    public boolean checkUseDTModel(int modelSeq) {
        return dtSimulationMapper.checkUseDTModel(modelSeq);
    }

    public void deleteDTSimulation(Map<String, Object> parameters) {
        dtSimulationMapper.deleteDTSimulation(parameters);
    }

    public boolean checkUseRemakeDTModel(int modelSeq) {
        return dtSimulationMapper.checkUseRemakeDTModel(modelSeq);
    }

    public int countMetaSimulation() {
        return dtSimulationMapper.countMetaSimulation();
    }

    public List<Map<String, Object>> getModelDataTerm() {
        return dtSimulationMapper.getModelDataTerm();
    }

    public Map<String, Object> processFindVerifyRule(Map<String, Object> verifyOption, DTModelJsonPropertySubSet subStep) {
        Map<String, Object> result = new HashMap<>();
        if (verifyOption.get("rule_value_1") != null) {
            if (!verifyOption.get("rule_value_1").toString().equals("")) {
                result.put("rule1", verifyOption.get("rule_value_1").toString());
            } else {
                result.put("rule1", null);
            }
        }
        if (verifyOption.get("rule_value_2") != null) {
            if (!verifyOption.get("rule_value_2").toString().equals("")) {
                result.put("rule2", verifyOption.get("rule_value_2").toString());
            } else {
                result.put("rule2", null);
            }
        }
        if (verifyOption.get("rule_value_3") != null) {
            if (!verifyOption.get("rule_value_3").toString().equals("")) {
                result.put("rule3", verifyOption.get("rule_value_3").toString());
            } else {
                result.put("rule3", null);
            }
        }
        if (verifyOption.get("rule_value_4") != null) {
            if (!verifyOption.get("rule_value_4").toString().equals("")) {
                result.put("rule4", verifyOption.get("rule_value_4").toString());
            } else {
                result.put("rule4", null);
            }
        }
        /**
         * 특수한 로직 상태 처리
         * 타입이 범위이고 최소와 최대가 존재할때,
         * */
        if (verifyOption.get("vrfc_tp") != null && Objects.equals(verifyOption.get("vrfc_tp").toString(), "RG")) {
            if ((verifyOption.get("rule_value_2") != null && Objects.equals(verifyOption.get("rule_value_2").toString(), "MIN")) && (verifyOption.get("rule_value_3") != null && Objects.equals(verifyOption.get("rule_value_3").toString(), "MAX"))) {
                result.put("rule2", subStep.getRule2().replaceAll("\"", ""));
                result.put("rule3", subStep.getRule3().replaceAll("\"", ""));
            }
        }
        return result;
    }

    public Map<String, Object> processFindAutoEncoder(DTModelJsonPropertySubSet subStep, Map<String, Object> modelInfo) {
        Map<String, Object> result = new HashMap<>();
        result.put("model_file_path", systemProperties.getDtEtcMetaFilePath() + modelInfo.get("file_path").toString());
        result.put("model_file_name", modelInfo.get("file_nm").toString());
        result.put("etc_model_seq", Integer.parseInt(subStep.getEtc_model_seq()));
        result.put("output_cols", new String[]{subStep.getTrgt_col().replaceAll("\"", "")});
        result.put("window_size", Integer.parseInt(subStep.getWindow_size().replaceAll("\"", "")));
        result.put("threshold", Float.parseFloat(subStep.getThreshold().replaceAll("\"", "")));
        return result;
    }

    /*synchronization engine data upload*/
    public Map<String, Object> processMakeValidate(DTModelJsonPropertySubSet subStep, String validate_file_path) {
        Map<String, Object> result = new HashMap<>();
        result.put("set_order", subStep.getSet_order());
        result.put("valid_tp1", subStep.getVrfc_tp().toUpperCase());
        result.put("valid_tp2", subStep.getVrfc_clear_tp().toUpperCase());
        result.put("col", subStep.getTrgt_col().toUpperCase());
        result.put("file_path", validate_file_path);
        return result;
    }

    /*synchronization engine data upload*/
    public Map<String, Object> processMakeOutlier(DTModelJsonPropertySubSet subStep, String outlier_file_path) {
        Map<String, Object> result = new HashMap<>();
        result.put("set_order", subStep.getSet_order());
        result.put("outlier_tp", subStep.getOutlier_tp());
        result.put("col", subStep.getTrgt_col().toUpperCase());
        result.put("file_path", outlier_file_path);
        return result;
    }
}
