package com.stoneitgt.dt.data.platform.admin.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.controller.DTModelController;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.ConvertUtil;
import org.apache.commons.collections4.map.HashedMap;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.simple.parser.ParseException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.mapper.DTSimulationMapper;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DTSimulationService {

    @Autowired
    private DTSimulationMapper dtSimulationMapper;

    @Autowired
    private BaseSystemProperties systemproperties;

    @Autowired
    private FilesService filesService;

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
    private DjangoApiService djangoApiService;

    @Autowired
    private MakeMetaModelSchedulerService makeMetaModelSchedulerService;

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
            JSONParser.sendDigitalTwinObjectCreated(systemproperties, DIGITAL_TWIN_ID, jsonObject);
        }
        //JSONParser.sendDigitalTwinObjectDelete(systemproperties, DIGITAL_TWIN_ID, DIGITAL_TWIN_OBJECT_ID, dtAugment.getAugmentSeq());
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
        metaSimulationModel.setModelFilePath(systemproperties.getDtMetaFilePath() + modelFiles.get("file_path").toString());
        metaSimulationModel.setModelFileName(model_file_name);

        String test_file_path = systemproperties.getDtMetaFilePath().replace("\\", "/") + metaSimulationModel.getBasePath() + "/";
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

    public HashMap<String, Object> makePreProcessContinuousInterpolationAugment(String twin_id, String obj_id, String full_json, String base_dir, String file_path, String file_name, String index_trgt_col, String user_id, int model_seq, int augment_seq, String from_date, String to_date, String data_crt_last_hr, List<String> originTimeData, int stepCount) throws IOException {
        String errorcheckBody = null;
        String originFileName = file_name;
        String originFilePath = file_path;
        String resultTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";
        String prev_file_name = file_name;
        boolean isDecisionTree = false;
        DecisionTreeOption decisionTreeOption = null;
        String decisionKey = null;
        ArrayList<String> decisionLabels = new ArrayList<>();
        log.info("makePreProcessContinuousAugment 초기 타겟 파일 -> {}", resultTargetFileName);
        log.info("makePreProcessContinuousAugment 초기 원본 파일 -> {}", prev_file_name);
        log.info("makePreProcessContinuousAugment 초기 이전 파일 -> {}", prev_file_name);

        //유효성 맵
        List<Map<String, Object>> validationList = new ArrayList<>();
        Map<String, Object> validation = new HashMap<>();

        //이상치 맵
        List<Map<String, Object>> outlierList = new ArrayList<>();
        Map<String, Object> outlier = new HashMap<>();

        //변환 데이터 맵 - 연계 처리 후
        List<Map<String, Object>> resultDataList = new ArrayList<>();
        Map<String, Object> resultData = new HashMap<>();

        //에러 맵 - 연계 처리 후
        //List<Map<String, Object>> errorInfoList = new ArrayList<>();
        //Map<String, Object> errorInfo = new HashMap<>();

        String origin_from = from_date;
        String origin_to = to_date;

        ObjectMapper mapper = new ObjectMapper();
        JsonNode rootNode = mapper.readTree(full_json);
        JsonNode preprocProperty = rootNode.get("preproc_property_info").get(0).get("preproc_property");

        JsonNode preprocPropertyInfo = rootNode.path("preproc_property_info").get(0);
        String twinid = preprocPropertyInfo.path("twin_id").asText();
        String objid = preprocPropertyInfo.path("twin_obj_id").asText();
        String index_col = preprocPropertyInfo.path("index_trgt_col").asText();

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

            for (int j = 0; j < preprocProperty.size(); j++) {
                int preproc_order = Integer.parseInt(preprocProperty.get(j).get("preproc_order").toString());
                setParam.put("file_path", file_path);
                setParam.put("preproc_order", preproc_order);
                if (preproc_order == 1) {
                    String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_valid" + ".csv";
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");

                        for (int p1 = 0; p1 < preprocSetArray.size(); p1++) {
                            if (p1 == 0) {
                                setParam.put("file_name", file_name);
                            }

                            setParam.put("target_file_name", targetFileName);
                            setParam.put("vrfc_trgt_col", preprocSetArray.get(p1).get("trgt_col").asText());
                            setParam.put("set_order", preprocSetArray.get(p1).get("set_order").asText());
                            Map<String, Object> verify_option = verifyService.getVerifyOption(Integer.parseInt(preprocSetArray.get(p1).get("vrfc_sub_tp").asText()));
                            setParam.put("vrfc_tp", verify_option.get("vrfc_tp").toString());

                            if (verify_option.get("rule_value_1") != null) {
                                if (!verify_option.get("rule_value_1").toString().equals("")) {
                                    setParam.put("rule1", verify_option.get("rule_value_1").toString());
                                } else {
                                    setParam.put("rule1", null);
                                }
                            }
                            if (verify_option.get("rule_value_2") != null) {
                                if (!verify_option.get("rule_value_2").toString().equals("")) {
                                    setParam.put("rule2", verify_option.get("rule_value_2").toString());
                                } else {
                                    setParam.put("rule2", null);
                                }
                            }
                            if (verify_option.get("rule_value_3") != null) {
                                if (!verify_option.get("rule_value_3").toString().equals("")) {
                                    setParam.put("rule3", verify_option.get("rule_value_3").toString());
                                } else {
                                    setParam.put("rule3", null);
                                }
                            }
                            if (verify_option.get("rule_value_4") != null) {
                                if (!verify_option.get("rule_value_4").toString().equals("")) {
                                    setParam.put("rule4", verify_option.get("rule_value_4").toString());
                                } else {
                                    setParam.put("rule4", null);
                                }
                            }

                            /**
                             * 특수한 로직 상태 처리
                             * 타입이 범위이고 최소와 최대가 존재할때,
                             * */
                            if (verify_option.get("vrfc_tp") != null && Objects.equals(verify_option.get("vrfc_tp").toString(), "RG")) {
                                if ((verify_option.get("rule_value_2") != null && Objects.equals(verify_option.get("rule_value_2").toString(), "MIN")) && (verify_option.get("rule_value_3") != null && Objects.equals(verify_option.get("rule_value_3").toString(), "MAX"))) {
                                    setParam.put("rule2", preprocSetArray.get(p1).get("rule2").toString().replaceAll("\"", ""));
                                    setParam.put("rule3", preprocSetArray.get(p1).get("rule3").toString().replaceAll("\"", ""));
                                }
                            }

                            setParam.put("is_create", "Y");

                            setParam.put("vrfc_clear_type", preprocSetArray.get(p1).get("vrfc_clear_tp").asText());
                            setParam.put("index_trgt_col", index_trgt_col);
                            /*if (Objects.equals(verify_option.get("vrfc_tp").toString().toUpperCase(), "DT") && Objects.equals(preprocSetArray.get(p1).get("vrfc_clear_tp").asText(), "O")) {
                                try {
                                    List<Map<String, String>> data = com.stoneitgt.dt.data.platform.util.JSONParser.readCsv(file_path + File.separator + file_name);
                                    List<Map<String, String>> temp = new ArrayList<>();
                                    String vrfc_trgt_col = setParam.get("vrfc_trgt_col").toString();
                                    for (Map<String, String> map : data) {
                                        String colValueTemp = map.get(vrfc_trgt_col);
                                        Integer colValueInt = -1;
                                        try {
                                            colValueInt = Integer.parseInt(colValueTemp);
                                            map.put(vrfc_trgt_col, colValueInt.toString());
                                        } catch (Exception e) {
                                            try {
                                                Float calValueFloat = Float.parseFloat(colValueTemp);
                                                map.put(vrfc_trgt_col, calValueFloat.toString());
                                            } catch (Exception ex) {
                                                map.put(vrfc_trgt_col, "");
                                            }
                                        }
                                        temp.add(map);
                                    }
                                    com.stoneitgt.dt.data.platform.util.JSONParser.writeCsv(file_path + File.separator + file_name, temp);
                                } catch (Exception e) {
                                    throw new RuntimeException(e);
                                }
                            }*/
                            log.info("validSet setParam ->" + setParam.toString());
                            ResponseEntity<?> validSet = dtModelApiService.makeValidateSet(setParam);
                            log.info("validSet -> {}", validSet);
                            errorcheckBody = validSet.getBody().toString();
                            log.info("validSet errorcheckBody -> {}", errorcheckBody);
                            setParam = new HashMap<String, Object>();
                            setParam.put("file_name", getResponseTargetFileName(validSet.getBody().toString()));
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            lastFileName = getResponseTargetFileName(validSet.getBody().toString());
                            validation = new HashMap<>();
                            validation.put("set_order", preprocSetArray.get(p1).get("set_order"));
                            validation.put("valid_tp1", preprocSetArray.get(p1).get("vrfc_tp").toString().toUpperCase());
                            validation.put("valid_tp2", preprocSetArray.get(p1).get("vrfc_clear_tp").toString().toUpperCase());
                            validation.put("col", preprocSetArray.get(p1).get("trgt_col").toString().toUpperCase());
                            /**
                             * TODO Python
                             * frontName = 'valid_' + str(paramData['set_order']) + '_'
                             * verifyFilterFile = os.path.join(paramData['file_path'],  frontName + paramData['target_file_name'])
                             * */
                            resultTargetFileName = lastFileName;

                            validation.put("file_path", file_path + "/" + "valid_" + preprocSetArray.get(p1).get("set_order") + "_" + lastFileName);
                            validationList.add(validation);
                            prev_file_name = setParam.get("file_name").toString();
                        }
                    }
                    log.info("유효성 검증 로직 종료");
                }

                if (preproc_order == 2) {
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_outlier" + ".csv";
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");
                        for (int p2 = 0; p2 < preprocSetArray.size(); p2++) {
                            //log.info("" + preprocSetArray.get(p2).get("set_order"));
                            //같다면 validate 로직 타고온것
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);

                            setParam.put("feature", preprocSetArray.get(p2).get("trgt_col"));
                            setParam.put("freq", Integer.parseInt(preprocSetArray.get(p2).get("freq").toString().replaceAll("\"", "")));
                            setParam.put("isCreate", "Y");
                            setParam.put("set_order", preprocSetArray.get(p2).get("set_order"));

                            String outlier_tp = preprocSetArray.get(p2).get("outlier_tp").toString().replaceAll("\"", "");
                            setParam.put("target_file_name", targetFileName);
                            if ("standard".equals(outlier_tp)) {
                                setParam.put("p_value", Float.parseFloat(preprocSetArray.get(p2).get("p_value").toString().replaceAll("\"", "")));
                            } else if ("kmean".equals(outlier_tp)) {
                                setParam.put("n_clusters", Integer.parseInt(preprocSetArray.get(p2).get("n_clusters").toString().replaceAll("\"", "")));
                                setParam.put("n_clusters_lable", 4);
                                setParam.put("n_count", Integer.parseInt(preprocSetArray.get(p2).get("n_count").toString().replaceAll("\"", "")));
                            } else if ("dbscan".equals(outlier_tp)) {
                                setParam.put("eps", Float.parseFloat(preprocSetArray.get(p2).get("eps").toString().replaceAll("\"", "")));
                                setParam.put("min_samples", Integer.parseInt(preprocSetArray.get(p2).get("min_samples").toString().replaceAll("\"", "")));
                            } else {
                                Map<String, Object> modelParams = new HashMap<String, Object>();
                                modelParams.put("etc_model_seq", Integer.parseInt(preprocSetArray.get(p2).get("etc_model_seq").toString().replaceAll("\"", "")));

                                Map<String, Object> model_info = dtModelService.getEtcModelInfo(modelParams);

                                setParam.put("model_file_path", systemproperties.getDtEtcMetaFilePath() + model_info.get("file_path").toString());
                                setParam.put("model_file_name", model_info.get("file_nm").toString());
                                setParam.put("etc_model_seq", Integer.parseInt(preprocSetArray.get(p2).get("etc_model_seq").toString().replaceAll("\"", "")));

                                String[] output_cols = {preprocSetArray.get(p2).get("trgt_col").toString().replaceAll("\"", "")};
                                setParam.put("output_cols", output_cols);
                                setParam.put("window_size", Integer.parseInt(preprocSetArray.get(p2).get("window_size").toString().replaceAll("\"", "")));
                                setParam.put("threshold", Float.parseFloat(preprocSetArray.get(p2).get("threshold").toString().replaceAll("\"", "")));
                            }
                            ResponseEntity<?> outlierSet = dtModelApiService.makeOutlierSet(setParam, outlier_tp);
                            errorcheckBody = outlierSet.getBody().toString();
                            setParam = new HashMap<String, Object>();
                            setParam.put("file_name", getResponseTargetFileName(outlierSet.getBody().toString()));
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            lastFileName = getResponseTargetFileName(outlierSet.getBody().toString());

                            outlier = new HashMap<>();
                            outlier.put("set_order", preprocSetArray.get(p2).get("set_order"));
                            outlier.put("outlier_tp", outlier_tp.toUpperCase());
                            outlier.put("col", preprocSetArray.get(p2).get("trgt_col").toString().toUpperCase());
                            outlier.put("file_path", file_path + "/" + "outlier_" + preprocSetArray.get(p2).get("set_order") + "_" + lastFileName);

                            outlierList.add(outlier);
                            resultTargetFileName = lastFileName;
                            prev_file_name = setParam.get("file_name").toString();
                        }
                    }
                    log.info("이상치 로직 종료");
                }

                if (preproc_order == 3) {
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_interpolate" + ".csv";
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");
                        for (int p3 = 0; p3 < preprocSetArray.size(); p3++) {
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);
                            setParam.put("interpl_tp", preprocSetArray.get(p3).get("interpl_tp").asText());
                            log.info("interpolateSet setParam -> {}", setParam);
                            ResponseEntity<?> interpolateSet = null;
                            if (Objects.equals(setParam.get("interpl_tp"), "decisiontree")) {
                                isDecisionTree = true;
                                setParam.put("prev_file_name", file_path + File.separator + prev_file_name);
                                setParam.put("index_column", index_trgt_col);
                                setParam.put("set_order", (p3 + 1));
                                setParam.put("isCreate", "Y");
                                setParam.put("model_path", "");
                                setParam.put("feature", preprocSetArray.get(p3).get("interpl_feature").toString().replaceAll("\"", ""));
                                decisionKey = setParam.get("feature").toString();
                                Iterator<JsonNode> elements = preprocSetArray.get(p3).get("interpl_outputs").elements();
                                ArrayList<String> outputs = new ArrayList<>();
                                while (elements.hasNext()) {
                                    outputs.add(elements.next().asText());
                                }
                                setParam.put("outputs", outputs);
                                log.info("interpolate decision tree setParam -> {}", setParam);
                                interpolateSet = dtModelApiService.makeInterpolateDecisionSet(setParam);
                                log.info("interpolateSet -> {}", interpolateSet);
                                /*TODO 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때*/
                                Map<String, Object> resultMap = DTModelController.extractDecisionDataKeyValues(interpolateSet);
                                log.info("resultMap -> {}", resultMap);
                                decisionLabels = (ArrayList<String>) resultMap.get("labels");
                                log.info("decisionLabels -> {}", decisionLabels);
                                errorcheckBody = interpolateSet.getBody().toString();
                                setParam = new HashMap<String, Object>();
                                // Path 객체 생성
                                Path path = Paths.get((String) resultMap.get("target_file_name"));

                                // 파일명 추출
                                String fileName = path.getFileName().toString();

                                lastFileName = fileName;
                                setParam.put("file_name", fileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);
                                resultTargetFileName = fileName;
                                if (decisionTreeOption == null) {
                                    decisionTreeOption = new DecisionTreeOption(setParam.get("file_path").toString(), null, lastFileName, null, index_trgt_col, outputs, preprocSetArray.get(p3).get("decision_model_file_path").asText() + preprocSetArray.get(p3).get("decision_model_file_name").asText(), preprocSetArray.get(p3).get("interpl_feature").toString().replaceAll("\"", ""), String.valueOf((p3 + 1)), "Y");
                                }
                            } else if (Objects.equals(setParam.get("interpl_tp"), "random forest")) {
                                Iterator<JsonNode> elements = preprocSetArray.get(p3).get("interpl_outputs").elements();
                                ArrayList<String> outputs = new ArrayList<>();
                                while (elements.hasNext()) {
                                    outputs.add(elements.next().asText());
                                }
                                elements = preprocSetArray.get(p3).get("interpl_labels").elements();
                                ArrayList<String> features = new ArrayList<>();
                                while (elements.hasNext()) {
                                    features.add(elements.next().asText());
                                }
                                setParam.put("outputs", outputs);
                                setParam.put("features", features);
                                setParam.put("model_file_path", preprocSetArray.get(p3).get("interpl_etc_model_file_path").asText());
                                setParam.put("model_file_name", preprocSetArray.get(p3).get("interpl_etc_model_file_name").asText());
                                setParam.put("model_use_file_path", file_path);
                                setParam.put("model_use_file_name", setParam.get("file_name"));
                                setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                setParam.put("index_column", index_trgt_col);
                                setParam.put("trgt_col_list", "");

                                log.info("makeInterpolateRF setParam -> {}", setParam);
                                interpolateSet = dtModelApiService.makeInterpolateSetRF(setParam);
                                log.info("makeInterpolateRF Set -> {}", interpolateSet);
                                errorcheckBody = interpolateSet.getBody().toString();
                                lastFileName = setParam.get("target_file_name").toString();
                                setParam = new HashMap<String, Object>();
                                setParam.put("file_name", lastFileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);
                                resultTargetFileName = lastFileName;
                            } else if (Objects.equals(setParam.get("interpl_tp"), "brits")) {
                                Iterator<JsonNode> elements = preprocSetArray.get(p3).get("interpl_outputs").elements();
                                ArrayList<String> outputs = new ArrayList<>();
                                while (elements.hasNext()) {
                                    outputs.add(elements.next().asText());
                                }

                                setParam.put("outputs", outputs);
                                setParam.put("model_file_path", preprocSetArray.get(p3).get("interpl_etc_model_file_path").asText());
                                setParam.put("model_file_name", preprocSetArray.get(p3).get("interpl_etc_model_file_name").asText());
                                setParam.put("model_use_file_path", file_path);
                                setParam.put("model_use_file_name", setParam.get("file_name"));
                                setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                setParam.put("index_column", index_trgt_col);
                                setParam.put("trgt_col_list", outputs);

                                log.info("makeInterpolateBrits setParam -> {}", setParam);
                                interpolateSet = dtModelApiService.makeInterpolateSetBrits(setParam);
                                log.info("makeInterpolateBrits Set -> {}", interpolateSet);
                                errorcheckBody = interpolateSet.getBody().toString();
                                lastFileName = setParam.get("target_file_name").toString();
                                setParam = new HashMap<String, Object>();
                                setParam.put("file_name", lastFileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);
                                resultTargetFileName = lastFileName;
                            } else {
                                setParam.put("index_trgt_col", index_trgt_col);
                                interpolateSet = dtModelApiService.makeInterpolateSet(setParam);
                                log.info("interpolateSet -> {}", interpolateSet);
                                errorcheckBody = interpolateSet.getBody().toString();
                                setParam = new HashMap<String, Object>();
                                lastFileName = getResponseTargetFileName(interpolateSet.getBody().toString());
                                setParam.put("file_name", lastFileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);
                                resultTargetFileName = lastFileName;
                            }
                            prev_file_name = setParam.get("file_name").toString();
                        }
                    }
                    /**
                     * 결측 로직 끝난 즉시 원본 필터링 대체
                     * */
                    if (originTimeData != null && !originTimeData.isEmpty()) {
                        log.info("다시 쓰는 파일 -> {}", file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                        List<Map<String, String>> readData = JSONParser.readCsv(file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                        log.info("originTimeData -> {}", originTimeData);
                        List<Map<String, String>> originData = originDataFilter(originTimeData, readData, index_trgt_col);
                        log.info("필터링 종료 -> originData : {}", originData);
                        /**
                         * 원본 데이터와 보조 데이터가 서로 일치 하는것이 없다면 긁어온 데이터가 의미 없음 전처리 종료
                         * 사이즈 부족하다는 에러 남기고 로직 종료
                         * */
                        if (originData.isEmpty()) {
                            log.info("원본 데이터와 보조데이터가 서로 일치하는것이 없습니다.");
                            HashMap<String, Object> resultHashMap = new HashMap<>();
                            resultHashMap.put("status", false);
                            resultHashMap.put("isSizeAvailable", false);
                            return resultHashMap;
                        }
                        JSONParser.writeCsv(file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName), originData);
                        log.info("파일 덮어 쓰기 종료 -> filePath : {}, fileName : {}", file_path, (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                    } else {
                        log.info("데이터가 최초 데이터에서 다 이루어졋습니다.");
                    }
                    log.info("결측/보간 로직 종료");
                }

                if (preproc_order == 4) {
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_interval" + ".csv";
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");
                        for (int p4 = 0; p4 < preprocSetArray.size(); p4++) {
                            /**
                             * 리샘플링 로직 수정
                             * [기능] 전처리
                             * [메뉴] Data Twin Model
                             * [동작] U
                             * [작업내용]
                             * 시간의 단위를 판별해서 해당 시간 단위의 최저 값으로 먼저 샘플링 작업을 실행하여 최저 시간으로 인해 늘어난 데이터 중 원본데이터를 최대한 유지하는 로직으로 수정합니다.
                             * EX) 시간 단위 데이터 1시간 단위로, 분 단위 데이터 1분 단위로, 초 단위 데이터 1초 단위로
                             *
                             * 프리컨디션
                             * resampling 함수화 및 데이터의 파일을 어떻게 할건지 JSON에서 파일에 관련된 수정사항이 필요.
                             *
                             * 프로세스
                             * 1. 파일을 읽어드린다.
                             * 2. 파일의 데이터에서 일부 데이터만을 얻고 시계열 컬럼만 뽑아온 데이터를 얻어온다. (index_trgt_col 참조)
                             * 3. 시계열 컬럼만 얻어온 데이터에서 시간이 초단위인지 분단위인지 시간단위인지 일단위인지 얻는다. (time_rule과 resmpl_tp 지정)
                             * 4. 얻은 time_rule, resmpl_tp 파라미터로 resampling 로직을 굴린다.
                             * 5. 원래 클라이언트에게 받은 파라미터로 resampling 로직을 굴린다.
                             * */

                            /**
                             * 시간 구분 로직
                             * */
                            String dateKey = index_trgt_col;
                            Map<String, Object> prevResultCsv = MetaRelateUtil.readCSV(file_path, file_name, 0);
                            List<String> timeIndicatorHeaders = (List<String>) prevResultCsv.get("header_list");
                            List<List<String>> prevResultDataList = (List<List<String>>) prevResultCsv.get("data_list");
                            TimeUnit unit = dtModelApiService.reSampleTimeDivider(dateKey, timeIndicatorHeaders, prevResultDataList);
                            /**
                             * 데이터 유효성 유지 하면서 리샘플 로직
                             * */
                            String prevTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_prev_interval" + ".csv";
                            {
                                JsonNode jsonNode = null;
                                ResponseEntity<?> resampleSet = null;
                                ResponseEntity<?> prevResampleSet = null;
                                log.info("Base Unit -> {}", unit);
                                //시간 구문 후 생성할 파일
                                Map<String, Object> setBaseParam = new HashMap<>();
                                setBaseParam.put("file_path", file_path);
                                setBaseParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                                setBaseParam.put("index_trgt_col", dateKey);
                                setBaseParam.put("target_file_name", prevTargetFileName);
                                setBaseParam.put("resmpl_tp", unit.getResampleType());
                                setBaseParam.put("time_rule", ("1" + unit.getResampleType()));

                                log.info("prevResampleSet setBaseParam -> {}", setBaseParam);
                                prevResampleSet = dtModelApiService.makeResampleSet(setBaseParam);
                                errorcheckBody = prevResampleSet.getBody().toString();
                                log.info("prevResampleSet errorcheckBody -> " + errorcheckBody);
                                lastFileName = getResponseTargetFileName(prevResampleSet.getBody().toString());
                                setParam.put("file_name", lastFileName);
                                setParam.put("target_file_name", targetFileName);
                            }
                            setParam.put("resmpl_tp", preprocSetArray.get(p4).get("resmpl_tp").toString().replaceAll("\"", ""));
                            setParam.put("time_rule", preprocSetArray.get(p4).get("resmpl_intvl_value").toString().replaceAll("\"", "").trim() + preprocSetArray.get(p4).get("resmpl_tp").toString().replaceAll("\"", ""));
                            setParam.put("index_trgt_col", index_trgt_col);
                            log.info("resampleSet setParam -> " + setParam.toString());
                            ResponseEntity<?> resampleSet = dtModelApiService.makeResampleSet(setParam);
                            errorcheckBody = resampleSet.getBody().toString();
                            log.info("resampleSet errorcheckBody -> " + errorcheckBody);
                            setParam = new HashMap<String, Object>();
                            lastFileName = getResponseTargetFileName(resampleSet.getBody().toString());
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            metaSimulationModel.setResmplIntvlTp(preprocSetArray.get(p4).get("resmpl_tp").toString().replaceAll("\"", ""));
                            metaSimulationModel.setResmplIntvlValue(Integer.parseInt(preprocSetArray.get(p4).get("resmpl_intvl_value").toString().replaceAll("\"", "").trim()));
                            resultTargetFileName = lastFileName;
                            if (isDecisionTree) {
                                log.info("decisionTreeOption -> {}", decisionTreeOption);
                                Map<String, Object> decisionTreeSetParam = decisionTreeOption.decisionTreeSetParam();
                                decisionTreeSetParam.put("file_name", lastFileName);
                                String decisionTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_dt_resample_" + System.currentTimeMillis() + ".csv";
                                decisionTreeSetParam.put("target_file_name", decisionTargetFileName);
                                log.info("decisionTreeSetParam -> {}", decisionTreeSetParam);

                                /**
                                 * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
                                 * */
                                ResponseEntity<?> interpolateModelDecisionSet = dtModelApiService.makeInterpolateModelDecisionSet(decisionTreeSetParam);
                                log.info("interpolateModelDecisionSet -> {}", interpolateModelDecisionSet);
                                Map<String, Object> resultMap = DTModelController.extractDecisionDataKeyValues(interpolateModelDecisionSet);
                                log.info("resultMap -> {}", resultMap);
                                lastFileName = decisionTargetFileName;
                                log.info("DECISION TREE Interval Conversion lastFileName -> {}", lastFileName);
                                resultTargetFileName = lastFileName;
                            }
                        }
                    }
                    log.info("리샘플 로직 종료");
                }

                if (preproc_order == 5) {
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_unit" + ".csv";
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");
                        for (int p5 = 0; p5 < preprocSetArray.size(); p5++) {
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);
                            Map<String, Object> params = new HashMap<String, Object>();
                            params.put("unit_tp", preprocSetArray.get(p5).get("unit_tp").toString().replaceAll("\"", ""));
                            params.put("unit_seq", Integer.parseInt(preprocSetArray.get(p5).get("unit_cd_1").toString().replaceAll("\"", "")));
                            String unitFormula = dtModelService.getUnitFormula(params);

                            setParam.put("unit_trgt_col", preprocSetArray.get(p5).get("trgt_col").toString().replaceAll("\"", ""));
                            setParam.put("unit_formula", unitFormula);
                            setParam.put("index_trgt_col", index_trgt_col);
                            log.info("unitSet setParam -> " + setParam.toString());
                            ResponseEntity<?> unitSet = dtModelApiService.makeUnitSet(setParam);
                            log.info("unitSet -> {}", unitSet);
                            errorcheckBody = unitSet.getBody().toString();
                            log.info("unitSet errorcheckBody -> {}", errorcheckBody);
                            setParam = new HashMap<String, Object>();
                            setParam.put("file_name", getResponseTargetFileName(unitSet.getBody().toString()));
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            lastFileName = getResponseTargetFileName(unitSet.getBody().toString());
                            resultTargetFileName = lastFileName;
                        }
                    }
                    log.info("단위 변환 로직 종료");
                }
            }

            String fileName = lastFileName;

            log.info("{}번 증강 프로세스 시작", augment_seq);
            metaSimulationModel.setModelSeq(model_seq);
            metaSimulationModel.setBasePath(base_dir);

            // 날짜 범위 설정
            SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            Calendar calendar = Calendar.getInstance();
            log.info("metaSimulationModel -> {}", metaSimulationModel);

            JsonNode json_target_cols = rootNode.get("preproc_property_info").get(0).get("preproc_trgt_col");

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
            int windowSize = Integer.parseInt(rootNode.get("preproc_property_info").get(0).get("model_property").get(0).get("hyperparam").get("window_size").asText().replaceAll("\"", ""));

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
            Map<String, Object> lastRowData = JSONParser.readCSVLastRowData(file_path, lastFileName);
            log.info("lastRowData -> {}, {}, {}", lastRowData, index_trgt_col, lastRowData.get(index_trgt_col));
            String lastRowDataTime = lastRowData.get(index_trgt_col).toString().replaceAll("\"", "");
            JsonNode intervalNode = preprocProperty.get(3).get("preproc_set");
            int resampleType = TimeUnit.getTimeType(String.valueOf(intervalNode.get(0).get("resmpl_tp").asText()));
            int resampleValue = Integer.parseInt(String.valueOf(intervalNode.get(0).get("resmpl_intvl_value").asText()));
            log.info("lastRowDataTime -> {}", lastRowDataTime);
            LocalDateTime targetStartDateTime = LocalDateTime.parse(lastRowDataTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).plusSeconds(resampleValue * resampleType);
            String target_start_date = targetStartDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            log.info("targetStartDateTime -> {}", targetStartDateTime);

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

            Map<String, Object> logParams = new HashMap<String, Object>();
            logParams.put("err_tp", null);
            logParams.put("err_cd", null);
            logParams.put("err_nm", null);
            logParams.put("err_cn", null);
            logParams.put("augment_seq", augment_seq);
            logParams.put("model_seq", model_seq);
            logParams.put("augment_status", "C");
            logParams.put("file_seq", fileSeq);
            logParams.put("data_crt_last_hr", data_crt_last_hr);

            makeMetaSimulationSchedulerService.saveAugmentLog(logParams);

            /**
             * 결과 데이터 관련
             * */
            JSONArray formattedIndividuallyDataArray = JSONParser.formatIndividuallyData(resultDataList);
            List<Map<String, String>> csvData = JSONParser.readCsv(file_path + File.separator + lastFileName);
            //log.info("augmentOriginCsvData -> {}", csvData);
            //log.info("formattedIndividuallyDataArray -> {}", formattedIndividuallyDataArray);
            JSONArray recoveredDataFormatArray = JSONParser.recoveredDataFormat(formattedIndividuallyDataArray, csvData);
            recoveredDataFormatArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, recoveredDataFormatArray);
            //log.info("recoveredDataFormatArray -> {}", recoveredDataFormatArray);
            List<Map<String, String>> augmentData = JSONParser.convertJsonArrayToListOfMaps(recoveredDataFormatArray);
            //기존 증강 파일 또는 전처리 파일을 원본 데이터 형태로 다시 파일 쓰기
            JSONParser.writeCsv(resultData.get("file_path").toString(), augmentData);

            //데이터 시간을 마지막 증강 데이터의 시간으로 변경
            data_crt_last_hr = augmentData.get(augmentData.size() - 1).get(index_trgt_col).replaceAll("\"", "");

            //2024-07-15 유효성 검증이나 이상치에 대한 데이터 파일 및 데이터 확인
            if (twin_id != null || obj_id != null) {
                /*Validation 데이터 업로드*/
                /**
                 * 2024-09-27 Validation 및 Outlier 부분 Data Cutting 이루어져야함
                 * */
                JSONObject validationUploadJson = new JSONObject();
                validationUploadJson.put("status", "success");
                validationUploadJson.put("type", "augment");
                validationUploadJson.put("twin_id", twinid);
                validationUploadJson.put("obj_id", objid);
                validationUploadJson.put("index_col", index_col);
                validationUploadJson.put("origin_from", origin_from);
                validationUploadJson.put("origin_to", origin_to);
                validationUploadJson.put("notification_time", notification_time);
                JSONArray validationDataJsonArray = JSONParser.formatValidationData(validationList, originTimeData);
                validationDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, validationDataJsonArray);
                validationUploadJson.put("validation", validationDataJsonArray);
                //log.info("validationUploadJson -> {}", validationUploadJson);
                JSONParser.sendValidationData(systemproperties, validationUploadJson);

                /*Outlier 데이터 업로드*/
                JSONObject outlierUploadJson = new JSONObject();
                outlierUploadJson.put("status", "success");
                outlierUploadJson.put("type", "augment");
                outlierUploadJson.put("twin_id", twinid);
                outlierUploadJson.put("obj_id", objid);
                outlierUploadJson.put("index_col", index_col);
                outlierUploadJson.put("origin_from", origin_from);
                outlierUploadJson.put("origin_to", origin_to);
                outlierUploadJson.put("notification_time", notification_time);
                JSONArray outlierDataJsonArray = JSONParser.formatOutlierData(outlierList);
                outlierDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, outlierDataJsonArray);
                outlierUploadJson.put("outlier", outlierDataJsonArray);
                //log.info("outlierUploadJson -> {}", outlierUploadJson);
                JSONParser.sendOutlierData(systemproperties, outlierUploadJson);

                //증강 결과 데이터 업로드
                JSONParser.sendIndividuallyData(systemproperties, augment_seq, twin_id, obj_id, recoveredDataFormatArray, 1);
                /**
                 * 데이터 여러건 업로드
                 * */
                //JSONParser.sendIndividuallyData(systemproperties, augment_seq, twin_id, obj_id, recoveredDataFormatArray, 5);
            }
            HashMap<String, Object> resultHashMap = new HashMap<>();
            resultHashMap.put("data_crt_last_hr", data_crt_last_hr);
            resultHashMap.put("status", true);
            return resultHashMap;
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorParams = errorMessageSave(errorcheckBody, augment_seq);
            try {
                errorParams.put("err_tp", "P");
                errorParams.put("err_cd", errorParams.get("code").toString());
                errorParams.put("err_nm", errorParams.get("message").toString());
                errorParams.put("err_cn", errorParams.get("detail").toString());
                errorParams.put("augment_seq", augment_seq);
                errorParams.put("model_seq", model_seq);
                errorParams.put("augment_status", "E");
                errorParams.put("file_seq", null);
                errorParams.put("data_crt_last_hr", data_crt_last_hr);

                log.info("errorParams -> {}", errorParams);
                makeMetaSimulationSchedulerService.saveAugmentLog(errorParams);
                if (twin_id != null || obj_id != null) {
                    Map<String, Object> errorInfo = new LinkedHashMap<>();
                    errorInfo.put("status", "fail");
                    errorInfo.put("twin_id", twinid);
                    errorInfo.put("obj_id", objid);
                    errorInfo.put("index_col", index_col);
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
                    JSONParser.sendErrorToJson(systemproperties, errorInfo);
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
        List<Map<String, String>> data = JSONParser.readCsv(filePath);
        if (data.size() > windowSize) {
            Collections.reverse(data);
            List<Map<String, String>> cutData = data.subList(0, windowSize + 1);
            Collections.reverse(cutData);
            JSONParser.writeCsv(filePath, cutData);
            return true;
        }
        return false;
    }

    private boolean dataFinalDateCut(String filePath, String timeIndex, String toDate) throws Exception {
        log.info("dataFinalDateCut -> {}, {}, {}", filePath, timeIndex, toDate);
        List<Map<String, String>> data = JSONParser.readCsv(filePath);
        Date cutoffDate = ConvertUtil.tryParse(ConvertUtil.DATEFORMATS, toDate);
        // 데이터를 필터링하여 timeIndex로 지정된 날짜가 toDate 이전인 항목들만 남김
        List<Map<String, String>> filteredData = data.stream().filter(row -> {
            try {
                String dateString = row.get(timeIndex);
                Date rowDate = ConvertUtil.tryParse(ConvertUtil.DATEFORMATS, dateString);
                return rowDate.before(cutoffDate);
            } catch (Exception e) {
                log.error("Date parsing error for row: {}", row, e);
                return false; // 날짜 파싱 오류 시 필터에서 제외
            }
        }).collect(Collectors.toList());
        JSONParser.writeCsv(filePath, filteredData);
        // 필터링된 결과를 저장하거나 처리
        log.info("Filtered data count: {}", filteredData.size());

        // 예시로, 필터링된 데이터가 있으면 true 반환
        return !filteredData.isEmpty();
    }

    public HashMap<String, Object> makePreProcess(String twin_id, String obj_id, String full_json, String base_dir, String file_path, String file_name, String index_trgt_col, String user_id, int model_seq, int augment_seq, String from_date, String to_date, String data_crt_last_hr, List<String> originTimeData) throws IOException {
        String errorcheckBody = null;
        String resultTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";
        String prev_file_name = file_name;
        boolean isDecisionTree = false;
        DecisionTreeOption decisionTreeOption = null;
        String decisionKey = null;
        ArrayList<String> decisionLabels = new ArrayList<>();
        log.info("makePreProcess 초기 타겟 파일 -> {}", resultTargetFileName);
        log.info("makePreProcess 초기 원본 파일 -> {}", prev_file_name);
        log.info("makePreProcess 초기 이전 파일 -> {}", prev_file_name);

        //유효성 맵
        List<Map<String, Object>> validationList = new ArrayList<>();
        Map<String, Object> validation = new HashMap<>();

        //이상치 맵
        List<Map<String, Object>> outlierList = new ArrayList<>();
        Map<String, Object> outlier = new HashMap<>();

        //변환 데이터 맵 - 연계 처리 후
        List<Map<String, Object>> resultDataList = new ArrayList<>();
        Map<String, Object> resultData = new HashMap<>();

        //에러 맵 - 연계 처리 후
        //List<Map<String, Object>> errorInfoList = new ArrayList<>();
        //Map<String, Object> errorInfo = new HashMap<>();

        String origin_from = from_date;
        String origin_to = to_date;

        ObjectMapper mapper = new ObjectMapper();
        JsonNode rootNode = mapper.readTree(full_json);
        JsonNode preprocProperty = rootNode.get("preproc_property_info").get(0).get("preproc_property");

        JsonNode preprocPropertyInfo = rootNode.path("preproc_property_info").get(0);
        String twinid = preprocPropertyInfo.path("twin_id").asText();
        String objid = preprocPropertyInfo.path("twin_obj_id").asText();
        String index_col = preprocPropertyInfo.path("index_trgt_col").asText();

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

            for (int j = 0; j < preprocProperty.size(); j++) {
                int preproc_order = Integer.parseInt(preprocProperty.get(j).get("preproc_order").toString());
                setParam.put("file_path", file_path);
                setParam.put("preproc_order", preproc_order);
                if (preproc_order == 1) {
                    String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_valid" + ".csv";
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");

                        for (int p1 = 0; p1 < preprocSetArray.size(); p1++) {
                            if (p1 == 0) {
                                setParam.put("file_name", file_name);
                            }

                            setParam.put("target_file_name", targetFileName);
                            setParam.put("vrfc_trgt_col", preprocSetArray.get(p1).get("trgt_col").asText());
                            setParam.put("set_order", preprocSetArray.get(p1).get("set_order").asText());
                            Map<String, Object> verify_option = verifyService.getVerifyOption(Integer.parseInt(preprocSetArray.get(p1).get("vrfc_sub_tp").asText()));
                            setParam.put("vrfc_tp", verify_option.get("vrfc_tp").toString());

                            if (verify_option.get("rule_value_1") != null) {
                                if (!verify_option.get("rule_value_1").toString().equals("")) {
                                    setParam.put("rule1", verify_option.get("rule_value_1").toString());
                                } else {
                                    setParam.put("rule1", null);
                                }
                            }
                            if (verify_option.get("rule_value_2") != null) {
                                if (!verify_option.get("rule_value_2").toString().equals("")) {
                                    setParam.put("rule2", verify_option.get("rule_value_2").toString());
                                } else {
                                    setParam.put("rule2", null);
                                }
                            }
                            if (verify_option.get("rule_value_3") != null) {
                                if (!verify_option.get("rule_value_3").toString().equals("")) {
                                    setParam.put("rule3", verify_option.get("rule_value_3").toString());
                                } else {
                                    setParam.put("rule3", null);
                                }
                            }
                            if (verify_option.get("rule_value_4") != null) {
                                if (!verify_option.get("rule_value_4").toString().equals("")) {
                                    setParam.put("rule4", verify_option.get("rule_value_4").toString());
                                } else {
                                    setParam.put("rule4", null);
                                }
                            }

                            /**
                             * 특수한 로직 상태 처리
                             * 타입이 범위이고 최소와 최대가 존재할때,
                             * */
                            if (verify_option.get("vrfc_tp") != null && Objects.equals(verify_option.get("vrfc_tp").toString(), "RG")) {
                                if ((verify_option.get("rule_value_2") != null && Objects.equals(verify_option.get("rule_value_2").toString(), "MIN")) && (verify_option.get("rule_value_3") != null && Objects.equals(verify_option.get("rule_value_3").toString(), "MAX"))) {
                                    setParam.put("rule2", preprocSetArray.get(p1).get("rule2").toString().replaceAll("\"", ""));
                                    setParam.put("rule3", preprocSetArray.get(p1).get("rule3").toString().replaceAll("\"", ""));
                                }
                            }

                            setParam.put("is_create", "Y");

                            setParam.put("vrfc_clear_type", preprocSetArray.get(p1).get("vrfc_clear_tp").asText());
                            setParam.put("index_trgt_col", index_trgt_col);
                            log.info("validSet setParam ->" + setParam.toString());
                            /*if (Objects.equals(verify_option.get("vrfc_tp").toString().toUpperCase(), "DT") && Objects.equals(preprocSetArray.get(p1).get("vrfc_clear_tp").asText(), "O")) {
                                try {
                                    List<Map<String, String>> data = com.stoneitgt.dt.data.platform.util.JSONParser.readCsv(file_path + File.separator + file_name);
                                    List<Map<String, String>> temp = new ArrayList<>();
                                    String vrfc_trgt_col = setParam.get("vrfc_trgt_col").toString();
                                    for (Map<String, String> map : data) {
                                        String colValueTemp = map.get(vrfc_trgt_col);
                                        Integer colValueInt = -1;
                                        try {
                                            colValueInt = Integer.parseInt(colValueTemp);
                                            map.put(vrfc_trgt_col, colValueInt.toString());
                                        } catch (Exception e) {
                                            try {
                                                Float calValueFloat = Float.parseFloat(colValueTemp);
                                                map.put(vrfc_trgt_col, calValueFloat.toString());
                                            } catch (Exception ex) {
                                                map.put(vrfc_trgt_col, "");
                                            }
                                        }
                                        temp.add(map);
                                    }
                                    com.stoneitgt.dt.data.platform.util.JSONParser.writeCsv(file_path + File.separator + file_name, temp);
                                } catch (Exception e) {
                                    throw new RuntimeException(e);
                                }
                            }*/
                            ResponseEntity<?> validSet = dtModelApiService.makeValidateSet(setParam);
                            log.info("validSet -> {}", validSet);
                            errorcheckBody = validSet.getBody().toString();
                            log.info("validSet errorcheckBody -> {}", errorcheckBody);
                            setParam = new HashMap<String, Object>();
                            setParam.put("file_name", getResponseTargetFileName(validSet.getBody().toString()));
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            lastFileName = getResponseTargetFileName(validSet.getBody().toString());
                            validation = new HashMap<>();
                            validation.put("set_order", preprocSetArray.get(p1).get("set_order"));
                            validation.put("valid_tp1", preprocSetArray.get(p1).get("vrfc_tp").toString().toUpperCase());
                            validation.put("valid_tp2", preprocSetArray.get(p1).get("vrfc_clear_tp").toString().toUpperCase());
                            validation.put("col", preprocSetArray.get(p1).get("trgt_col").toString().toUpperCase());
                            /**
                             * TODO Python
                             * frontName = 'valid_' + str(paramData['set_order']) + '_'
                             * verifyFilterFile = os.path.join(paramData['file_path'],  frontName + paramData['target_file_name'])
                             * */
                            resultTargetFileName = lastFileName;

                            validation.put("file_path", file_path + "/" + "valid_" + preprocSetArray.get(p1).get("set_order") + "_" + lastFileName);
                            validationList.add(validation);
                            prev_file_name = setParam.get("file_name").toString();
                        }
                    }
                    log.info("유효성 검증 로직 종료");
                }

                if (preproc_order == 2) {
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_outlier" + ".csv";
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");
                        for (int p2 = 0; p2 < preprocSetArray.size(); p2++) {
                            //log.info("" + preprocSetArray.get(p2).get("set_order"));
                            //같다면 validate 로직 타고온것
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);

                            setParam.put("feature", preprocSetArray.get(p2).get("trgt_col"));
                            setParam.put("freq", Integer.parseInt(preprocSetArray.get(p2).get("freq").toString().replaceAll("\"", "")));
                            setParam.put("isCreate", "Y");
                            setParam.put("set_order", preprocSetArray.get(p2).get("set_order"));

                            String outlier_tp = preprocSetArray.get(p2).get("outlier_tp").toString().replaceAll("\"", "");
                            setParam.put("target_file_name", targetFileName);
                            if ("standard".equals(outlier_tp)) {
                                setParam.put("p_value", Float.parseFloat(preprocSetArray.get(p2).get("p_value").toString().replaceAll("\"", "")));
                            } else if ("kmean".equals(outlier_tp)) {
                                setParam.put("n_clusters", Integer.parseInt(preprocSetArray.get(p2).get("n_clusters").toString().replaceAll("\"", "")));
                                setParam.put("n_clusters_lable", 4);
                                setParam.put("n_count", Integer.parseInt(preprocSetArray.get(p2).get("n_count").toString().replaceAll("\"", "")));
                            } else if ("dbscan".equals(outlier_tp)) {
                                setParam.put("eps", Float.parseFloat(preprocSetArray.get(p2).get("eps").toString().replaceAll("\"", "")));
                                setParam.put("min_samples", Integer.parseInt(preprocSetArray.get(p2).get("min_samples").toString().replaceAll("\"", "")));
                            } else {
                                Map<String, Object> modelParams = new HashMap<String, Object>();
                                modelParams.put("etc_model_seq", Integer.parseInt(preprocSetArray.get(p2).get("etc_model_seq").toString().replaceAll("\"", "")));

                                Map<String, Object> model_info = dtModelService.getEtcModelInfo(modelParams);

                                setParam.put("model_file_path", systemproperties.getDtEtcMetaFilePath() + model_info.get("file_path").toString());
                                setParam.put("model_file_name", model_info.get("file_nm").toString());
                                setParam.put("etc_model_seq", Integer.parseInt(preprocSetArray.get(p2).get("etc_model_seq").toString().replaceAll("\"", "")));

                                String[] output_cols = {preprocSetArray.get(p2).get("trgt_col").toString().replaceAll("\"", "")};
                                setParam.put("output_cols", output_cols);
                                setParam.put("window_size", Integer.parseInt(preprocSetArray.get(p2).get("window_size").toString().replaceAll("\"", "")));
                                setParam.put("threshold", Float.parseFloat(preprocSetArray.get(p2).get("threshold").toString().replaceAll("\"", "")));
                            }
                            ResponseEntity<?> outlierSet = dtModelApiService.makeOutlierSet(setParam, outlier_tp);
                            errorcheckBody = outlierSet.getBody().toString();
                            setParam = new HashMap<String, Object>();
                            setParam.put("file_name", getResponseTargetFileName(outlierSet.getBody().toString()));
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            lastFileName = getResponseTargetFileName(outlierSet.getBody().toString());

                            outlier = new HashMap<>();
                            outlier.put("set_order", preprocSetArray.get(p2).get("set_order"));
                            outlier.put("outlier_tp", outlier_tp.toUpperCase());
                            outlier.put("col", preprocSetArray.get(p2).get("trgt_col").toString().toUpperCase());
                            outlier.put("file_path", file_path + "/" + "outlier_" + preprocSetArray.get(p2).get("set_order") + "_" + lastFileName);

                            outlierList.add(outlier);
                            resultTargetFileName = lastFileName;
                            prev_file_name = setParam.get("file_name").toString();
                        }
                    }
                    log.info("이상치 로직 종료");
                }

                if (preproc_order == 3) {
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_interpolate" + ".csv";
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");
                        for (int p3 = 0; p3 < preprocSetArray.size(); p3++) {
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);
                            setParam.put("interpl_tp", preprocSetArray.get(p3).get("interpl_tp").asText());
                            ResponseEntity<?> interpolateSet = null;
                            if (Objects.equals(setParam.get("interpl_tp"), "decisiontree")) {
                                isDecisionTree = true;
                                setParam.put("prev_file_name", file_path + File.separator + prev_file_name);
                                setParam.put("index_column", index_trgt_col);
                                setParam.put("set_order", (p3 + 1));
                                setParam.put("isCreate", "Y");
                                setParam.put("model_path", "");
                                setParam.put("feature", preprocSetArray.get(p3).get("interpl_feature").toString().replaceAll("\"", ""));
                                decisionKey = setParam.get("feature").toString();
                                Iterator<JsonNode> elements = preprocSetArray.get(p3).get("interpl_outputs").elements();
                                ArrayList<String> outputs = new ArrayList<>();
                                while (elements.hasNext()) {
                                    outputs.add(elements.next().asText());
                                }
                                setParam.put("outputs", outputs);
                                log.info("interpolate decision tree setParam -> {}", setParam);
                                interpolateSet = dtModelApiService.makeInterpolateDecisionSet(setParam);
                                log.info("interpolateSet -> {}", interpolateSet);
                                /**
                                 * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
                                 * */
                                Map<String, Object> resultMap = DTModelController.extractDecisionDataKeyValues(interpolateSet);
                                log.info("resultMap -> {}", resultMap);
                                decisionLabels = (ArrayList<String>) resultMap.get("labels");
                                log.info("decisionLabels -> {}", decisionLabels);
                                errorcheckBody = interpolateSet.getBody().toString();
                                setParam = new HashMap<String, Object>();
                                // Path 객체 생성
                                Path path = Paths.get((String) resultMap.get("target_file_name"));

                                // 파일명 추출
                                String fileName = path.getFileName().toString();

                                lastFileName = fileName;
                                setParam.put("file_name", fileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);
                                resultTargetFileName = fileName;
                                if (decisionTreeOption == null) {
                                    decisionTreeOption = new DecisionTreeOption(setParam.get("file_path").toString(), null, lastFileName, null, index_trgt_col, outputs, preprocSetArray.get(p3).get("decision_model_file_path").asText() + preprocSetArray.get(p3).get("decision_model_file_name").asText(), preprocSetArray.get(p3).get("interpl_feature").toString().replaceAll("\"", ""), String.valueOf((p3 + 1)), "Y");
                                }
                            } else if (Objects.equals(setParam.get("interpl_tp"), "random forest")) {
                                Iterator<JsonNode> elements = preprocSetArray.get(p3).get("interpl_outputs").elements();
                                ArrayList<String> outputs = new ArrayList<>();
                                while (elements.hasNext()) {
                                    outputs.add(elements.next().asText());
                                }
                                elements = preprocSetArray.get(p3).get("interpl_labels").elements();
                                ArrayList<String> features = new ArrayList<>();
                                while (elements.hasNext()) {
                                    features.add(elements.next().asText());
                                }
                                setParam.put("outputs", outputs);
                                setParam.put("features", features);
                                setParam.put("model_file_path", preprocSetArray.get(p3).get("interpl_etc_model_file_path").asText());
                                setParam.put("model_file_name", preprocSetArray.get(p3).get("interpl_etc_model_file_name").asText());
                                setParam.put("model_use_file_path", file_path);
                                setParam.put("model_use_file_name", setParam.get("file_name"));
                                setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                setParam.put("index_column", index_trgt_col);
                                setParam.put("trgt_col_list", "");

                                log.info("makeInterpolateRF setParam -> {}", setParam);
                                interpolateSet = dtModelApiService.makeInterpolateSetRF(setParam);
                                log.info("makeInterpolateRF Set -> {}", interpolateSet);
                                errorcheckBody = interpolateSet.getBody().toString();
                                lastFileName = setParam.get("target_file_name").toString();
                                setParam = new HashMap<String, Object>();
                                setParam.put("file_name", lastFileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);
                                resultTargetFileName = lastFileName;
                            } else if (Objects.equals(setParam.get("interpl_tp"), "brits")) {
                                Iterator<JsonNode> elements = preprocSetArray.get(p3).get("interpl_outputs").elements();
                                ArrayList<String> outputs = new ArrayList<>();
                                while (elements.hasNext()) {
                                    outputs.add(elements.next().asText());
                                }

                                setParam.put("outputs", outputs);
                                setParam.put("model_file_path", preprocSetArray.get(p3).get("interpl_etc_model_file_path").asText());
                                setParam.put("model_file_name", preprocSetArray.get(p3).get("interpl_etc_model_file_name").asText());
                                setParam.put("model_use_file_path", file_path);
                                setParam.put("model_use_file_name", setParam.get("file_name"));
                                setParam.put("output_file", file_path + File.separator + setParam.get("target_file_name").toString());
                                setParam.put("index_column", index_trgt_col);
                                setParam.put("trgt_col_list", outputs);

                                log.info("makeInterpolateBrits setParam -> {}", setParam);
                                interpolateSet = dtModelApiService.makeInterpolateSetBrits(setParam);
                                log.info("makeInterpolateBrits Set -> {}", interpolateSet);
                                errorcheckBody = interpolateSet.getBody().toString();
                                lastFileName = setParam.get("target_file_name").toString();
                                setParam = new HashMap<String, Object>();
                                setParam.put("file_name", lastFileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);
                                resultTargetFileName = lastFileName;
                            } else {
                                setParam.put("index_trgt_col", index_trgt_col);
                                interpolateSet = dtModelApiService.makeInterpolateSet(setParam);
                                log.info("interpolateSet -> {}", interpolateSet);
                                errorcheckBody = interpolateSet.getBody().toString();
                                setParam = new HashMap<String, Object>();
                                lastFileName = getResponseTargetFileName(interpolateSet.getBody().toString());
                                setParam.put("file_name", lastFileName);
                                setParam.put("file_path", file_path);
                                setParam.put("index_trgt_col", index_trgt_col);
                                resultTargetFileName = lastFileName;
                            }
                            prev_file_name = setParam.get("file_name").toString();
                        }
                    }
                    /**
                     * 결측 로직 끝난 즉시 원본 필터링 대체
                     * */
                    if (originTimeData != null && !originTimeData.isEmpty()) {
                        log.info("다시 쓰는 파일 -> {}", file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                        List<Map<String, String>> readData = JSONParser.readCsv(file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                        log.info("originTimeData -> {}", originTimeData);
                        List<Map<String, String>> originData = originDataFilter(originTimeData, readData, index_trgt_col);
                        log.info("필터링 종료 -> originData : {}", originData);
                        /**
                         * 원본 데이터와 보조 데이터가 서로 일치 하는것이 없다면 긁어온 데이터가 의미 없음 전처리 종료
                         * 사이즈 부족하다는 에러 남기고 로직 종료
                         * */
                        if (originData.isEmpty()) {
                            log.info("원본 데이터와 보조데이터가 서로 일치하는것이 없습니다.");
                            HashMap<String, Object> resultHashMap = new HashMap<>();
                            resultHashMap.put("status", false);
                            resultHashMap.put("isSizeAvailable", false);
                            return resultHashMap;
                        }
                        JSONParser.writeCsv(file_path + File.separator + (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName), originData);
                        log.info("파일 덮어 쓰기 종료 -> filePath : {}, fileName : {}", file_path, (Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName));
                    } else {
                        log.info("데이터가 최초 데이터에서 다 이루어졋습니다.");
                    }
                    log.info("결측/보간 로직 종료");
                }

                if (preproc_order == 4) {
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_interval" + ".csv";
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");
                        for (int p4 = 0; p4 < preprocSetArray.size(); p4++) {
                            /**
                             * 리샘플링 로직 수정
                             * [기능] 전처리
                             * [메뉴] Data Twin Model
                             * [동작] U
                             * [작업내용]
                             * 시간의 단위를 판별해서 해당 시간 단위의 최저 값으로 먼저 샘플링 작업을 실행하여 최저 시간으로 인해 늘어난 데이터 중 원본데이터를 최대한 유지하는 로직으로 수정합니다.
                             * EX) 시간 단위 데이터 1시간 단위로, 분 단위 데이터 1분 단위로, 초 단위 데이터 1초 단위로
                             *
                             * 프리컨디션
                             * resampling 함수화 및 데이터의 파일을 어떻게 할건지 JSON에서 파일에 관련된 수정사항이 필요.
                             *
                             * 프로세스
                             * 1. 파일을 읽어드린다.
                             * 2. 파일의 데이터에서 일부 데이터만을 얻고 시계열 컬럼만 뽑아온 데이터를 얻어온다. (index_trgt_col 참조)
                             * 3. 시계열 컬럼만 얻어온 데이터에서 시간이 초단위인지 분단위인지 시간단위인지 일단위인지 얻는다. (time_rule과 resmpl_tp 지정)
                             * 4. 얻은 time_rule, resmpl_tp 파라미터로 resampling 로직을 굴린다.
                             * 5. 원래 클라이언트에게 받은 파라미터로 resampling 로직을 굴린다.
                             * */

                            /**
                             * 시간 구분 로직
                             * */
                            String dateKey = index_trgt_col;
                            Map<String, Object> prevResultCsv = MetaRelateUtil.readCSV(file_path, file_name, 0);
                            List<String> timeIndicatorHeaders = (List<String>) prevResultCsv.get("header_list");
                            List<List<String>> prevResultDataList = (List<List<String>>) prevResultCsv.get("data_list");
                            TimeUnit unit = dtModelApiService.reSampleTimeDivider(dateKey, timeIndicatorHeaders, prevResultDataList);
                            /**
                             * 데이터 유효성 유지 하면서 리샘플 로직
                             * */
                            String prevTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_prev_interval" + ".csv";
                            {
                                JsonNode jsonNode = null;
                                ResponseEntity<?> resampleSet = null;
                                ResponseEntity<?> prevResampleSet = null;
                                log.info("Base Unit -> {}", unit);
                                //시간 구문 후 생성할 파일
                                Map<String, Object> setBaseParam = new HashMap<>();
                                setBaseParam.put("file_path", file_path);
                                setBaseParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                                setBaseParam.put("index_trgt_col", dateKey);
                                setBaseParam.put("target_file_name", prevTargetFileName);
                                setBaseParam.put("resmpl_tp", unit.getResampleType());
                                setBaseParam.put("time_rule", ("1" + unit.getResampleType()));

                                log.info("prevResampleSet setBaseParam -> {}", setBaseParam);
                                prevResampleSet = dtModelApiService.makeResampleSet(setBaseParam);
                                errorcheckBody = prevResampleSet.getBody().toString();
                                log.info("prevResampleSet errorcheckBody -> " + errorcheckBody);
                                lastFileName = getResponseTargetFileName(prevResampleSet.getBody().toString());
                                setParam.put("file_name", lastFileName);
                                setParam.put("target_file_name", targetFileName);
                            }
                            setParam.put("resmpl_tp", preprocSetArray.get(p4).get("resmpl_tp").toString().replaceAll("\"", ""));
                            setParam.put("time_rule", preprocSetArray.get(p4).get("resmpl_intvl_value").toString().replaceAll("\"", "").trim() + preprocSetArray.get(p4).get("resmpl_tp").toString().replaceAll("\"", ""));
                            setParam.put("index_trgt_col", index_trgt_col);
                            log.info("resampleSet setParam -> " + setParam.toString());
                            ResponseEntity<?> resampleSet = dtModelApiService.makeResampleSet(setParam);
                            errorcheckBody = resampleSet.getBody().toString();
                            log.info("resampleSet errorcheckBody -> " + errorcheckBody);
                            setParam = new HashMap<String, Object>();
                            lastFileName = getResponseTargetFileName(resampleSet.getBody().toString());
                            setParam.put("file_name", lastFileName);
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            metaSimulationModel.setResmplIntvlTp(preprocSetArray.get(p4).get("resmpl_tp").toString().replaceAll("\"", ""));
                            metaSimulationModel.setResmplIntvlValue(Integer.parseInt(preprocSetArray.get(p4).get("resmpl_intvl_value").toString().replaceAll("\"", "").trim()));
                            resultTargetFileName = lastFileName;
                            if (isDecisionTree) {
                                log.info("decisionTreeOption -> {}", decisionTreeOption);
                                Map<String, Object> decisionTreeSetParam = decisionTreeOption.decisionTreeSetParam();
                                decisionTreeSetParam.put("file_name", lastFileName);
                                String decisionTargetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_dt_resample_" + System.currentTimeMillis() + ".csv";
                                decisionTreeSetParam.put("target_file_name", decisionTargetFileName);
                                log.info("decisionTreeSetParam -> {}", decisionTreeSetParam);

                                /**
                                 * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
                                 * */
                                ResponseEntity<?> interpolateModelDecisionSet = dtModelApiService.makeInterpolateModelDecisionSet(decisionTreeSetParam);
                                log.info("interpolateModelDecisionSet -> {}", interpolateModelDecisionSet);
                                Map<String, Object> resultMap = DTModelController.extractDecisionDataKeyValues(interpolateModelDecisionSet);
                                log.info("resultMap -> {}", resultMap);
                                lastFileName = decisionTargetFileName;
                                log.info("DECISION TREE Interval Conversion lastFileName -> {}", lastFileName);
                                resultTargetFileName = lastFileName;
                            }
                        }
                    }
                    log.info("리샘플 로직 종료");
                }

                if (preproc_order == 5) {
                    if (preprocProperty.get(j).get("preproc_set").size() > 0) {
                        String targetFileName = augment_seq + "_" + model_seq + "_" + user_id + "_" + MetaRelateUtil.generateFileNameTime("H") + "_unit" + ".csv";
                        JsonNode preprocSetArray = preprocProperty.get(j).get("preproc_set");
                        for (int p5 = 0; p5 < preprocSetArray.size(); p5++) {
                            setParam.put("file_name", Objects.equals(resultTargetFileName, lastFileName) ? resultTargetFileName : lastFileName);
                            setParam.put("target_file_name", targetFileName);
                            Map<String, Object> params = new HashMap<String, Object>();
                            params.put("unit_tp", preprocSetArray.get(p5).get("unit_tp").toString().replaceAll("\"", ""));
                            params.put("unit_seq", Integer.parseInt(preprocSetArray.get(p5).get("unit_cd_1").toString().replaceAll("\"", "")));
                            String unitFormula = dtModelService.getUnitFormula(params);

                            //setParam.put("target_file_name", "unit_" + currentTimeMillis() + ".csv");

                            setParam.put("unit_trgt_col", preprocSetArray.get(p5).get("trgt_col").toString().replaceAll("\"", ""));
                            setParam.put("unit_formula", unitFormula);
                            setParam.put("index_trgt_col", index_trgt_col);
                            log.info("unitSet setParam -> " + setParam.toString());
                            ResponseEntity<?> unitSet = dtModelApiService.makeUnitSet(setParam);
                            log.info("unitSet -> {}", unitSet);
                            errorcheckBody = unitSet.getBody().toString();
                            log.info("unitSet errorcheckBody -> {}", errorcheckBody);
                            setParam = new HashMap<String, Object>();
                            setParam.put("file_name", getResponseTargetFileName(unitSet.getBody().toString()));
                            setParam.put("file_path", file_path);
                            setParam.put("index_trgt_col", index_trgt_col);
                            lastFileName = getResponseTargetFileName(unitSet.getBody().toString());
                            resultTargetFileName = lastFileName;
                        }
                    }
                    log.info("단위 변환 로직 종료");
                }
            }

            String fileName = lastFileName;
            resultData = new HashMap<>();
            resultData.put("file_path", file_path + "/" + lastFileName);

            resultDataList.add(resultData);

            String sourceDirectory = file_path;

            int fileSeq = filesService.saveAugmentFiles(sourceDirectory, base_dir, fileName, augment_seq);

            Map<String, Object> logParams = new HashMap<String, Object>();
            logParams.put("err_tp", null);
            logParams.put("err_cd", null);
            logParams.put("err_nm", null);
            logParams.put("err_cn", null);
            logParams.put("augment_seq", augment_seq);
            logParams.put("model_seq", model_seq);
            logParams.put("augment_status", "C");
            logParams.put("file_seq", fileSeq);
            logParams.put("data_crt_last_hr", data_crt_last_hr);

            makeMetaSimulationSchedulerService.saveAugmentLog(logParams);

            /**
             * 결과 데이터 관련
             * */
            JSONArray formattedIndividuallyDataArray = JSONParser.formatIndividuallyData(resultDataList);
            List<Map<String, String>> csvData = JSONParser.readCsv(file_path + File.separator + lastFileName);
            JSONArray recoveredDataFormatArray = JSONParser.recoveredDataFormat(formattedIndividuallyDataArray, csvData);
            recoveredDataFormatArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, recoveredDataFormatArray);

            List<Map<String, String>> preprocessData = JSONParser.convertJsonArrayToListOfMaps(recoveredDataFormatArray);
            //기존 증강 파일 또는 전처리 파일을 원본 데이터 형태로 다시 파일 쓰기
            JSONParser.writeCsv(resultData.get("file_path").toString(), preprocessData);

            //평균 시간 뽑기(기존 로직 유지하기 위해서 나중에는 지워도 된다.)
            HashMap<String, Object> unitParam = dtSimulationService.getTimeUnitStringMap(index_trgt_col, preprocessData);
            TimeUnit unit = (TimeUnit) unitParam.get("unit");
            int delta = ((Double) unitParam.get("delta")).intValue();

            log.info("unit -> {}, delta -> {}", unit, delta);

            //데이터 시간을 마지막 전처리 데이터의 시간으로 변경
            String lastRowDataTime = preprocessData.get(preprocessData.size() - 1).get(index_trgt_col);
            JsonNode intervalNode = preprocProperty.get(3).get("preproc_set");

            int resampleType = TimeUnit.getTimeType(unit.getResampleType());
            int resampleValue = delta;

            if (intervalNode.size() != 0 && intervalNode.get(0).get("resmpl_tp") != null) {
                resampleType = TimeUnit.getTimeType(String.valueOf(intervalNode.get(0).get("resmpl_tp").asText()));
                resampleValue = Integer.parseInt(String.valueOf(intervalNode.get(0).get("resmpl_intvl_value").asText()));
            }

            log.info("lastRowDataTime -> {}", lastRowDataTime);
            LocalDateTime targetStartDateTime = LocalDateTime.parse(lastRowDataTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")).plusSeconds(resampleValue * resampleType);
            String target_start_date = targetStartDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            data_crt_last_hr = target_start_date;

            //2024-07-15 유효성 검증이나 이상치에 대한 데이터 파일 및 데이터 확인
            if (twin_id != null || obj_id != null) {
                /*Validation 데이터 업로드*/
                /**
                 * 2024-09-27 Validation 및 Outlier 부분 Data Cutting 이루어져야함
                 * */
                JSONObject validationUploadJson = new JSONObject();
                validationUploadJson.put("status", "success");
                validationUploadJson.put("type", "preproc");
                validationUploadJson.put("twin_id", twinid);
                validationUploadJson.put("obj_id", objid);
                validationUploadJson.put("index_col", index_col);
                validationUploadJson.put("origin_from", origin_from);
                validationUploadJson.put("origin_to", origin_to);
                validationUploadJson.put("notification_time", notification_time);
                JSONArray validationDataJsonArray = JSONParser.formatValidationData(validationList, originTimeData);
                validationDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, validationDataJsonArray);
                validationUploadJson.put("validation", validationDataJsonArray);
                //log.info("validationUploadJson -> {}", validationUploadJson);
                JSONParser.sendValidationData(systemproperties, validationUploadJson);

                /*Outlier 데이터 업로드*/
                JSONObject outlierUploadJson = new JSONObject();
                outlierUploadJson.put("status", "success");
                outlierUploadJson.put("type", "preproc");
                outlierUploadJson.put("twin_id", twinid);
                outlierUploadJson.put("obj_id", objid);
                outlierUploadJson.put("index_col", index_col);
                outlierUploadJson.put("origin_from", origin_from);
                outlierUploadJson.put("origin_to", origin_to);
                outlierUploadJson.put("notification_time", notification_time);
                JSONArray outlierDataJsonArray = JSONParser.formatOutlierData(outlierList);
                outlierDataJsonArray = JSONParser.recoveredDecisionTreeLabel(decisionLabels, decisionKey, outlierDataJsonArray);
                outlierUploadJson.put("outlier", outlierDataJsonArray);
                //log.info("outlierUploadJson -> {}", outlierUploadJson);
                JSONParser.sendOutlierData(systemproperties, outlierUploadJson);

                //증강 결과 데이터 업로드
                JSONParser.sendIndividuallyData(systemproperties, augment_seq, twin_id, obj_id, recoveredDataFormatArray, 1);
                /**
                 * 데이터 여러건 업로드
                 * */
                //JSONParser.sendIndividuallyData(systemproperties, augment_seq, twin_id, obj_id, recoveredDataFormatArray, 5);
            }
            HashMap<String, Object> resultHashMap = new HashMap<>();
            resultHashMap.put("data_crt_last_hr", data_crt_last_hr);
            resultHashMap.put("status", true);
            return resultHashMap;
        } catch (Exception e) {
            e.printStackTrace();
            HashMap<String, Object> resultHashMap = new HashMap<>();
            Map<String, Object> errorParams = errorMessageSave(errorcheckBody, augment_seq);
            try {
                errorParams.put("err_tp", "P");
                errorParams.put("err_cd", errorParams.get("code").toString());
                errorParams.put("err_nm", errorParams.get("message").toString());
                errorParams.put("err_cn", errorParams.get("detail").toString());
                errorParams.put("augment_seq", augment_seq);
                errorParams.put("model_seq", model_seq);
                errorParams.put("augment_status", "E");
                errorParams.put("file_seq", null);
                errorParams.put("data_crt_last_hr", data_crt_last_hr);

                log.info("errorParams:::" + errorParams);
                makeMetaSimulationSchedulerService.saveAugmentLog(errorParams);
                if (twin_id != null || obj_id != null) {
                    Map<String, Object> errorInfo = new LinkedHashMap<>();
                    errorInfo.put("status", "fail");
                    errorInfo.put("twin_id", twinid);
                    errorInfo.put("obj_id", objid);
                    errorInfo.put("index_col", index_col);
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
                    JSONParser.sendErrorToJson(systemproperties, errorInfo);
                }
            } catch (Exception e1) {
                e1.printStackTrace();
            }
            resultHashMap.put("status", false);
            return resultHashMap;
        }
    }

    public String getResponseTargetFileName(String jsonBody) throws JsonParseException, JsonMappingException, IOException {
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
        log.info("extractTimeData dataNode -> {}", dataNode);
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

    public static List<Map<String, String>> originDataFilter(List<String> originTimeData, List<Map<String, String>> supplyAgainData, String index_trgt_col) {
        List<Map<String, String>> filterData = new ArrayList<>();
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

    public HashMap<String, Object> getTimeUnitStringMap(String dateKey, List<Map<String, String>> data) {
        List<String> keys = new ArrayList<>();
        List<List<String>> datas = new ArrayList<>();
        boolean check = false;
        for (Map<String, String> map : data) {
            List<String> oneData = new ArrayList<>();
            for (Map.Entry<String, String> entry : map.entrySet()) {
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

    public HashMap<String, Object> processorDatasetCorrelation(int modelSeq, Map<String, Object> correlationParam) throws ParseException {
        HashMap<String, Object> result = new HashMap<>();
        String correlationUrl = systemproperties.getDtApiUrl() + "/dt/newpreproc/processorDatasetCorrelation/";
        String processorDatasetCorrelationResult = djangoApiService.requestDjangoApi(correlationUrl, correlationParam, modelSeq);
        org.json.simple.JSONObject correlationObj = (org.json.simple.JSONObject) new org.json.simple.parser.JSONParser().parse(processorDatasetCorrelationResult);
        if (Integer.parseInt(correlationObj.get("code").toString()) == GlobalConstant.API_STATUS.SUCCESS) {
            result.put("data", correlationObj.get("data"));
            return result;
        } else {
            return null;
        }
    }

    public List<Map<String, Object>> getModelColumns(int modelSeq) {
        return dtSimulationMapper.getModelColumns(modelSeq);
    }

    public List<String> getTargetColumnInfo(int modelSeq) {
        return dtSimulationMapper.getTargetColumnInfo(modelSeq);
    }

    public SimulationModel getInsertSimulationViewResult(int augmentSeq) {
        return dtSimulationMapper.getInsertSimulationViewResult(augmentSeq);
    }

    public boolean checkUseDTModel(int modelSeq) {
        return dtSimulationMapper.checkUseDTModel(modelSeq);
    }

    public void deleteDTSimulation(Map<String, Object> parameters) {
        dtSimulationMapper.deleteDTSimulation(parameters);
    }

    public List<Map<String, Object>> getDTSimulationListBySimTp(Map<String, Object> params, Paging paging) {
        return dtSimulationMapper.getDTSimulationListBySimTp(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTSimulationListSetUserSeqBySimTp(Map<String, Object> params, Paging paging) {
        return dtSimulationMapper.getDTSimulationListSetUserSeqBySimTp(params, paging.getPaging());
    }

    public List<Map<String, Object>> getDTSimulationSharedListBySimTp(Map<String, Object> params, Paging paging) {
        return dtSimulationMapper.getDTSimulationSharedListBySimTp(params, paging.getPaging());
    }

    public boolean checkUseRemakeDTModel(int modelSeq) {
        return dtSimulationMapper.checkUseRemakeDTModel(modelSeq);
    }
}
