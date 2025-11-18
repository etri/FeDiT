package com.stoneitgt.dt.data.platform.admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.config.DatabaseConfig;
import com.stoneitgt.dt.data.platform.admin.config.WebConfig;
import com.stoneitgt.dt.data.platform.admin.service.*;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import com.stoneitgt.dt.data.platform.util.file.FileWriter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.map.HashedMap;
import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Controller
public class MetaDTSimulationController extends BaseController {

    @Autowired
    private MakeMetaSimulationSchedulerService makeMetaSimulationSchedulerService;

    @Autowired
    private DTModelApiService dtModelApiService;

    @Autowired
    private DTSimulationService dtSimulationService;

    @Autowired
    private DTModelService dtModelService;

    @Autowired
    private JSONPropertyService jsonPropertyService;

    @Autowired
    private FilesService fileService;

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    @PostMapping(value = "/dt/sch/onetime/simulation")
    @ResponseBody
    public Map<String, Object> metaSimulationFitWindowSizeOnetime(@ModelAttribute DTAugment dtAugment) throws Exception {
        log.info("metaSimulationFitWindowSizeOnetime -> {}", dtAugment);
        Map<String, Object> result = new HashMap<>();
        DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder();

        List<Map<String, Object>> data = FileReader.getInstance().readCSVToListObjectMap(dtAugment.getAttachFiles().get(0));
        List<String> headers = FileReader.getInstance().readHeaders(dtAugment.getAttachFiles().get(0), 1);

        boolean headerCheck = true;
        String headerStrings = Arrays.toString(headers.toArray(new String[headers.size()]));
        for (int i = 0; i < dtAugment.getPreprocTrgtCol().size(); i++) {
            if (!headerStrings.contains(dtAugment.getPreprocTrgtCol().get(i))) {
                // 필수 열이 하나라도 누락된 경우 오류 처리
                log.error("CSV 파일에 필수 열이 누락되었습니다. -> 누락된 열 {}", dtAugment.getPreprocTrgtCol().get(i));
                headerCheck = false;
            } else {
                result.put("code", GlobalConstant.API_STATUS.SUCCESS);
            }
        }

        //json형태로 변환
        if (!headerCheck) {
            Exception e = new Exception("모델에 사용하는 헤더와 일치하지 않습니다.");
            e.printStackTrace();
            result.put("code", GlobalConstant.API_STATUS.FAIL_MAPPING);
            result.put("message", e.getMessage());
            return result;
        }

        //공동 변수 구역

        // 날짜 범위 설정
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy/MM");
        Calendar calendar = Calendar.getInstance();

        if (Objects.equals("A", dtAugment.getSimTp())) {
            //증강 일회성 로직
            Map<String, Object> targetModel = makeMetaSimulationSchedulerService.getTargetModel(dtAugment.getModelSeq());
            String from_date = dtAugment.getCycleBgngDsgnYmd();
            String to_date = dtAugment.getCycleEndDsgnYmd();
            String proc_json = targetModel.get("user_pprcs_full_stng_value").toString();
            String dateKey = targetModel.get("index_trgt_col").toString();
            ObjectMapper objectMapper = new ObjectMapper();

            DTModelJsonProperty dtModelJsonProperty = jsonPropertyService.propertyParsingToObject(proc_json);

            HashMap<String, Object> unitParam = dtSimulationService.getTimeUnit(dateKey, data);
            TimeUnit unit = (TimeUnit) unitParam.get("unit");
            int delta = ((Double) unitParam.get("delta")).intValue();
            int unitTime = 1;
            dtAugment.setRegUserSeq(authenticationFacade.getLoginUserSeq());
            dtAugment.setRegIp(authenticationFacade.getLoginUserIp());
            dtSimulationService.getSimulationSaveAugmentOnetime(dtAugment);
            errorLogBuilder.augmentSeq(dtAugment.getAugmentSeq()).modelSeq(dtAugment.getModelSeq());

            /**
             * 2025-03-14
             * 증강 생성시 데이터 증강 도구에 이력 남기기
             * */
            ModelReferenceLog modelReferenceLog = new ModelReferenceLog();
            modelReferenceLog.setRefSimulationSeq(dtAugment.getAugmentSeq());
            modelReferenceLog.setModelSeq(dtAugment.getModelSeq());
            modelReferenceLog.setRegUserSeq(authenticationFacade.getLoginUserSeq());
            modelReferenceLog.setRegIp(authenticationFacade.getLoginUserIp());
            logService.insertDtModelReferenceLog(modelReferenceLog);

            boolean isDecisionUses = checkDecisionTreeUses(dtModelJsonProperty);
            if (isDecisionUses) {
                // DECISION TREE 테스트 증강이라서 로직 미수행
                Exception e = new Exception("현재 모델은 DecisionTree 테스트이기 때문에 전처리와 증강을 사용할 수 없습니다.");
                e.printStackTrace();
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_FAILED.value())).errNm(HttpStatus.PRECONDITION_FAILED.name())
                        .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(from_date);
                handleSimulationProcessError(errorLogBuilder);
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                result.put("message", e.getMessage());
                return result;
            }

            // 파일 경로 및 이름 설정
            String currentYearMonthDir = simpleDateFormat.format(calendar.getTime());
            String base_dir = "/augment/" + currentYearMonthDir + "/" + dtAugment.getAugmentSeq();
            String file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + base_dir;

            log.info("평균 시간 unit -> {}, 평균 시간 delta -> {}", unit, delta);
            int windowSize = Integer.parseInt(dtModelJsonProperty.getPreproc_property_info().get(0).getModel_property().get(0).getHyperparam().getWindow_size());

            //시작 시간과 끝나는 시간의 초 차이
            long secondsDifference = TimeUtil.getDuration(dtAugment.getCycleBgngDsgnYmd(), dtAugment.getCycleEndDsgnYmd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            log.info("시작 시간과 Data 시간의 초 차이 -> {}초", secondsDifference);
            int originCount = (int) (secondsDifference / delta);
            unitTime = ((windowSize) * delta) / TimeUnit.getTimeType(unit.getResampleType());

            //Interval Conversion Option을 설정여부 검사 후 있으면 고려해서 시간 계산
            boolean isIntervalUse = checkIntervalUses(dtModelJsonProperty);
            log.info("isIntervalUse -> {}", isIntervalUse);

            String resampleType = null;
            String resampleValue = null;
            int intervalCount = 1;
            int differenceCount = 1;
            int stepCount = 1;

            if (isIntervalUse) {
                //평균 시간보다 리샘플링 시간이 더 크면 데이터가 줄어듦으로 더 이전 데이터의 시간을 계산 해야한다.
                //평균 시간보다 리샘플링 시간이 더 작으면 데이터가 많아짐으로 필요 X
                DTModelJsonPropertySubSet intervalPropertySubSet = jsonPropertyService.getIntervalProperty(dtModelJsonProperty);
                resampleType = intervalPropertySubSet.getResmpl_tp();
                resampleValue = intervalPropertySubSet.getResmpl_intvl_value();
                log.info("resampleType -> {}, resampleValue -> {}", resampleType, resampleValue);
                log.info("compare delta -> {}, {}", delta, (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType)));
                if (delta <= (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType))) {
                    //줄어드는 개수 파악 해야됨
                    //리샘플링을 돌린 부족한 개수 와 평균시간으로 돌리는 부족한 개수를 추출해서 비교해서 그 개수만큼 + 시켜야된다.
                    //IntervalConversion 사용으로 채워야 하는 개수

                    intervalCount = (int) (secondsDifference / (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType)));
                    log.info("originCount -> {}, intervalCount -> {}", originCount, intervalCount);

                    if (intervalCount == originCount) {
                        stepCount = originCount / windowSize;
                        int mod = originCount % windowSize;
                        if (mod != 0) {
                            //나머지 값이 있을 때, Step Count를 한번 더한다.
                            stepCount++;
                        }
                        log.info("몇번을 연속 증강 해야하는지에 대한 데이터 stepCount -> {}", stepCount);
                    } else {
                        //+1은 데이터 보정치
                        differenceCount = (int) Math.ceil((double) originCount / intervalCount) + 1;

                        log.info("differenceCount -> {}", differenceCount);

                        unitTime = ((differenceCount) * (windowSize * delta)) / TimeUnit.getTimeType(unit.getResampleType());
                        log.info("isIntervalUse unitTime -> {}", unitTime);

                        originCount = intervalCount;
                        stepCount = originCount / windowSize;
                        int mod = originCount % windowSize;
                        if (mod != 0) {
                            //나머지 값이 있을 때, Step Count를 한번 더한다.
                            stepCount++;
                        }
                        log.info("몇번을 연속 증강 해야하는지에 대한 데이터 stepCount -> {}", stepCount);
                    }
                } else {
                    intervalCount = (int) (secondsDifference / (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType)));
                    log.info("originCount -> {}, intervalCount -> {}", originCount, intervalCount);
                    if (intervalCount == originCount) {
                        stepCount = originCount / windowSize;
                        int mod = originCount % windowSize;
                        if (mod != 0) {
                            //나머지 값이 있을 때, Step Count를 한번 더한다.
                            stepCount++;
                        }
                        log.info("몇번을 연속 증강 해야하는지에 대한 데이터 stepCount -> {}", stepCount);
                    } else {
                        originCount = intervalCount;
                        stepCount = originCount / windowSize;
                        int mod = originCount % windowSize;
                        if (mod != 0) {
                            //나머지 값이 있을 때, Step Count를 한번 더한다.
                            stepCount++;
                        }
                        log.info("몇번을 연속 증강 해야하는지에 대한 데이터 stepCount -> {}", stepCount);
                    }
                }
            }

            //csv 파일 생성
            Map<String, Object> param = new HashedMap<>();
            String file_name = WebConfig.getSessionInfo().getUserId() + "_origin" + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";
            param.put("index_trgt_col", dtModelJsonProperty.getPreproc_property_info().get(0).getIndex_trgt_col());
            param.put("data", data);
            param.put("file_path", file_path);
            param.put("file_name", file_name);

            ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(param);

            // 결과 처리
            int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
            if (statusCode != 200) {
                Exception e = new Exception("The connection to the Python server was lost.");
                e.printStackTrace();
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                        .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(from_date);
                handleSimulationProcessError(errorLogBuilder);
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                result.put("message", e.getMessage());
                return result;
            }

            JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
            int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
            log.info("dataCount -> {}", dataCount);
            //데이터가 부족하지 않을 시 작업 진행
            //생성된 파일의 시계열 컬럼 데이터 중복 체크
            if (dataCount < 200) {
                //데이터 200개 미만일시 이상치에서 문제가 생길 수 도있음
                Exception e = new Exception("데이터가 부족합니다.");
                e.printStackTrace();
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                        .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(from_date);
                handleSimulationProcessError(errorLogBuilder);
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                result.put("message", e.getMessage());
                return result;
            }

            String created_data_file_path = rootNode.path("data").get("file_path").asText();
            String created_data_file_name = rootNode.path("data").get("file_name").asText();

            List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
            String findColumnKey = dtModelJsonProperty.getPreproc_property_info().get(0).getIndex_trgt_col();
            boolean duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
            if (duplicateDataCheck) {
                List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
                FileWriter.getInstance().writeCSV(created_data_file_path + File.separator + created_data_file_name, removedDuplicatedData);
            }

            HashMap<String, Object> preProcessResult = dtSimulationService.makePreProcessContinuousInterpolationAugment(null, null, dtModelJsonProperty, base_dir, file_path, file_name, dtAugment.getIndexTrgtCol(), WebConfig.getSessionInfo().getUserId(), dtAugment.getModelSeq(), dtAugment.getAugmentSeq(), from_date, to_date, from_date, null, stepCount);
            if (!Boolean.parseBoolean(preProcessResult.get("status").toString())) {
                if (preProcessResult.get("isSizeAvailable") != null && Boolean.parseBoolean(preProcessResult.get("isSizeAvailable").toString())) {
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                            .errCn("데이터가 부족합니다.").dataCrtLastHr(from_date);
                    handleSimulationProcessError(errorLogBuilder);
                } else if (preProcessResult.get("code") != null && preProcessResult.get("message") != null && preProcessResult.get("detail") != null) {
                    Exception e = new Exception(preProcessResult.get("message").toString());
                    e.printStackTrace();
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                            .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(from_date);
                    handleSimulationProcessError(errorLogBuilder);
                } else {
                    //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                    Map<String, Object> logParams = new HashMap<String, Object>();
                    logParams.put("augment_seq", dtAugment.getAugmentSeq());
                    logParams.put("data_crt_last_hr", from_date);
                    makeMetaSimulationSchedulerService.updateAugmentMain(logParams);
                }
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                return result;
            }

            int augmentFileSeq = (int) preProcessResult.get("augmentFileSeq");

            // 원본 JSON 데이터 파일 생성 및 DB 저장
            LocalDateTime now = LocalDateTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String notification_time = now.format(formatter);
            List<Map<String, Object>> originCsvData = FileReader.getInstance().readCSVToListObjectMap(file_path + File.separator + file_name);
            String jsonFileName = notification_time.replaceAll("[ :]", "") + "_origin.json";
            JSONArray originJsonArray = JSONParser.convertListMapToJson(originCsvData);
            String originFilePath = file_path + File.separator + jsonFileName;

            try (java.io.FileWriter fileWriter = new java.io.FileWriter(originFilePath)) {
                fileWriter.write(originJsonArray.toString());
                log.info("JSON 저장 완료 -> {}", originFilePath);
                Files originFiles = new Files();
                File originFile = new File(originFilePath);
                originFiles.setAugmentFileSeq(augmentFileSeq);
                originFiles.setFileNm(originFile.getName());
                originFiles.setStrgFileNm(originFile.getName());
                originFiles.setFilePath(base_dir);
                originFiles.setFileSz(originFile.length());
                originFiles.setFileExtn(FileUtil.getFileExtension(originFile.getName()));
                originFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.ORIGIN.toUpperCase());
                originFiles.setRefSeq(dtAugment.getAugmentSeq());
                Path saveLastFile = Paths.get(originFilePath);
                originFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                handleCreateMetaAugmentVisualFile(originFiles);
            } catch (IOException e) {
                e.printStackTrace();
            }

            // 증강된 JSON 데이터 파일 저장
            Files dataFiles = (Files) preProcessResult.get("dataFiles");
            handleCreateMetaAugmentVisualFile(dataFiles);

            // Validation된 JSON 데이터 파일 저장
            Files validationFiles = (Files) preProcessResult.get("validationFiles");
            handleCreateMetaAugmentVisualFile(validationFiles);

            // Outlier된 JSON 데이터 파일 저장
            Files outlierFiles = (Files) preProcessResult.get("outlierFiles");
            handleCreateMetaAugmentVisualFile(outlierFiles);

            ArrayList<Files> fileses = fileService.getAugmentVisualFilesByAugmentFileSeq(augmentFileSeq);
            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        } else {
            //전처리 일회성 로직
            String from_date = dtAugment.getCycleBgngDsgnYmd();
            String to_date = dtAugment.getCycleEndDsgnYmd();
            Map<String, Object> targetModel = makeMetaSimulationSchedulerService.getTargetModel(dtAugment.getModelSeq());
            String proc_json = targetModel.get("user_pprcs_full_stng_value").toString();
            DTModelJsonProperty dtModelJsonProperty = jsonPropertyService.propertyParsingToObject(proc_json);
            dtAugment.setRegUserSeq(authenticationFacade.getLoginUserSeq());
            dtAugment.setRegIp(authenticationFacade.getLoginUserIp());
            dtSimulationService.getSimulationSaveAugmentOnetime(dtAugment);
            errorLogBuilder.augmentSeq(dtAugment.getAugmentSeq()).modelSeq(dtAugment.getModelSeq());

            /**
             * 2025-03-14
             * 증강 생성시 데이터 증강 도구에 이력 남기기
             * */
            ModelReferenceLog modelReferenceLog = new ModelReferenceLog();
            modelReferenceLog.setRefSimulationSeq(dtAugment.getAugmentSeq());
            modelReferenceLog.setModelSeq(dtAugment.getModelSeq());
            modelReferenceLog.setRegUserSeq(authenticationFacade.getLoginUserSeq());
            modelReferenceLog.setRegIp(authenticationFacade.getLoginUserIp());
            logService.insertDtModelReferenceLog(modelReferenceLog);

            // 파일 경로 및 이름 설정
            String currentYearMonthDir = simpleDateFormat.format(calendar.getTime());
            String base_dir = "/augment/" + currentYearMonthDir + "/" + dtAugment.getAugmentSeq();
            String file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + base_dir;

            //csv 파일 생성
            Map<String, Object> param = new HashedMap<>();
            String file_name = WebConfig.getSessionInfo().getUserId() + "_origin" + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";
            param.put("index_trgt_col", dtModelJsonProperty.getPreproc_property_info().get(0).getIndex_trgt_col());
            param.put("data", data);
            param.put("file_path", file_path);
            param.put("file_name", file_name);

            ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(param);

            // 결과 처리
            int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
            if (statusCode != 200) {
                Exception e = new Exception("The connection to the Python server was lost.");
                e.printStackTrace();
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                        .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(from_date);
                handleSimulationProcessError(errorLogBuilder);
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                return result;
            }

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
            int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
            log.info("dataCount -> {}", dataCount);
            //데이터가 부족하지 않을 시 작업 진행
            //생성된 파일의 시계열 컬럼 데이터 중복 체크
            if (dataCount < 200) {
                //데이터 200개 미만일시 이상치에서 문제가 생길 수 도있음
                Exception e = new Exception("데이터가 부족합니다.");
                e.printStackTrace();
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                        .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(from_date);
                handleSimulationProcessError(errorLogBuilder);
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                result.put("message", e.getMessage());
                return result;
            }

            String created_data_file_path = rootNode.path("data").get("file_path").asText();
            String created_data_file_name = rootNode.path("data").get("file_name").asText();

            List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
            String findColumnKey = dtModelJsonProperty.getPreproc_property_info().get(0).getIndex_trgt_col();
            boolean duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
            if (duplicateDataCheck) {
                List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
                FileWriter.getInstance().writeCSV(created_data_file_path + File.separator + created_data_file_name, removedDuplicatedData);
            }

            HashMap<String, Object> preProcessResult = dtSimulationService.makePreprocess(null, null, dtModelJsonProperty, base_dir, file_path, file_name, dtAugment.getIndexTrgtCol(), WebConfig.getSessionInfo().getUserId(), dtAugment.getModelSeq(), dtAugment.getAugmentSeq(), from_date, to_date, from_date, null);
            if (!Boolean.parseBoolean(preProcessResult.get("status").toString())) {
                if (preProcessResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(preProcessResult.get("isSizeAvailable").toString())) {
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                            .errCn("데이터가 부족합니다.").dataCrtLastHr(from_date);
                    handleSimulationProcessError(errorLogBuilder);
                } else {
                    //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                    Map<String, Object> logParams = new HashMap<String, Object>();
                    logParams.put("augment_seq", dtAugment.getAugmentSeq());
                    logParams.put("data_crt_last_hr", from_date);
                    makeMetaSimulationSchedulerService.updateAugmentMain(logParams);
                }
                result.put("code", GlobalConstant.API_STATUS.FAIL);
                return result;
            }
            int preprocessFileSeq = (int) preProcessResult.get("preprocessFileSeq");

            LocalDateTime now = LocalDateTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String notification_time = now.format(formatter);
            List<Map<String, Object>> originCsvData = FileReader.getInstance().readCSVToListObjectMap(file_path + File.separator + file_name);
            String jsonFileName = notification_time.replaceAll("[ :]", "") + "_origin.json";
            JSONArray originJsonArray = JSONParser.convertListMapToJson(originCsvData);
            String originFilePath = file_path + File.separator + jsonFileName;

            try (java.io.FileWriter fileWriter = new java.io.FileWriter(originFilePath)) {
                fileWriter.write(originJsonArray.toString());
                log.info("JSON 저장 완료 -> {}", originFilePath);
                Files originFiles = new Files();
                File originFile = new File(originFilePath);
                originFiles.setAugmentFileSeq(preprocessFileSeq);
                originFiles.setFileNm(originFile.getName());
                originFiles.setStrgFileNm(originFile.getName());
                originFiles.setFilePath(base_dir);
                originFiles.setFileSz(originFile.length());
                originFiles.setFileExtn(FileUtil.getFileExtension(originFile.getName()));
                originFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.ORIGIN.toUpperCase());
                originFiles.setRefSeq(dtAugment.getAugmentSeq());
                Path saveLastFile = Paths.get(originFilePath);
                originFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                handleCreateMetaAugmentVisualFile(originFiles);
            } catch (IOException e) {
                e.printStackTrace();
            }

            // 증강된 JSON 데이터 파일 저장
            Files dataFiles = (Files) preProcessResult.get("dataFiles");
            handleCreateMetaAugmentVisualFile(dataFiles);

            // Validation된 JSON 데이터 파일 저장
            Files validationFiles = (Files) preProcessResult.get("validationFiles");
            handleCreateMetaAugmentVisualFile(validationFiles);

            // Outlier된 JSON 데이터 파일 저장
            Files outlierFiles = (Files) preProcessResult.get("outlierFiles");
            handleCreateMetaAugmentVisualFile(outlierFiles);

            ArrayList<Files> fileses = fileService.getAugmentVisualFilesByAugmentFileSeq(preprocessFileSeq);

            result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        }
        return result;
    }

    @Transactional(DatabaseConfig.PRIMARY_TRANSACTION_MANAGER)
    @PostMapping(value = "/dt/sch/predict/simulation")
    @ResponseBody
    public Map<String, Object> metaSimulationPredict(@RequestBody Map<String, Object> param) throws Exception {
        Map<String, Object> result = new HashMap<>();
        DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder();
        log.info("metaSimulationPredict Start param -> {}", param);
        param.put("user_seq", authenticationFacade.getLoginUserSeq());
        param.put("user_ip", authenticationFacade.getLoginUserIp());
        String cycle_bgng_dsgn_ymd = param.get("cycle_bgng_dsgn_ymd").toString();
        String cycle_end_dsgn_ymd;
        if (param.get("cycle_end_dsgn_ymd") != null && param.get("cycle_end_dsgn_ymd").toString().length() != 0) {
            cycle_end_dsgn_ymd = param.get("cycle_end_dsgn_ymd").toString();
        } else {
            cycle_end_dsgn_ymd = null;
        }
        //json 파싱
        //data 범위로 끌오오기 - 범위만큼 가져와서 전처리, 모델 있으면 모델 처리
        int modelSeq = Integer.parseInt(param.get("model_seq").toString());
        DTModel dtModel = dtModelService.selectMetaModel(modelSeq);

        log.info("dtModel -> {}", dtModel);
        param.put("cycle_bgng_dsgn_ymd", cycle_bgng_dsgn_ymd);
        param.put("cycle_end_dsgn_ymd", cycle_end_dsgn_ymd);
        String use_yn = param.get("use_yn").toString();
        param.put("use_yn", use_yn);
        String rls_yn = param.get("rls_yn").toString();
        param.put("rls_yn", rls_yn);

        // 날짜 범위 설정
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy/MM");
        Calendar calendar = Calendar.getInstance();

        ObjectMapper objectMapper = new ObjectMapper();

        /**
         * 2024-07-10
         * 증강 모델 생성시 디지털 트윈 객체 생성 관련 로직 수정 및 추가
         *
         * 증강 모델 생성 SEQ 가져와서 바로 Select 차후 로직 실행
         * @author kimwoosik
         * */
        log.info("metaSimulationPredict End param -> {}", param);
        int augmentSeq = dtSimulationService.getSimulationPredictSaveAugment(param);

        errorLogBuilder.augmentSeq(augmentSeq).modelSeq(modelSeq);

        log.info("augmentSeq -> {}", augmentSeq);
        log.info("Prediction 로직 시작");

        /**
         * 2025-03-14
         * 증강 생성시 데이터 증강 도구에 이력 남기기
         * */
        ModelReferenceLog modelReferenceLog = new ModelReferenceLog();
        modelReferenceLog.setRefSimulationSeq(augmentSeq);
        modelReferenceLog.setModelSeq(modelSeq);
        modelReferenceLog.setRegUserSeq(authenticationFacade.getLoginUserSeq());
        modelReferenceLog.setRegIp(authenticationFacade.getLoginUserIp());
        logService.insertDtModelReferenceLog(modelReferenceLog);

        String currentYearMonthDir = simpleDateFormat.format(calendar.getTime());
        String base_dir = "/augment/" + currentYearMonthDir + "/" + augmentSeq;
        String file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + base_dir;
        log.info("file_path + base_dir -> {}", file_path + base_dir);

        Map<String, Object> originParam = new HashedMap<>();
        String file_name = WebConfig.getSessionInfo().getUserId() + "_origin" + "_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";
        originParam.put("index_trgt_col", param.get("index_trgt_col").toString());

        Map<String, Object> targetModel = makeMetaSimulationSchedulerService.getTargetModel(modelSeq);
        String proc_json = targetModel.get("user_pprcs_full_stng_value").toString();
        DTModelJsonProperty dtModelJsonProperty = jsonPropertyService.propertyParsingToObject(proc_json);
        String dataFilePath = systemProperties.getDtMetaFilePath().replace("\\", "/") + targetModel.get("file_path").toString();
        String dataFileName = targetModel.get("file_nm").toString();
        List<Map<String, Object>> data = FileReader.getInstance().readCSVToListObjectMap(dataFilePath + dataFileName);

        String dateKey = dtModelJsonProperty.getPreproc_property_info().get(0).getIndex_trgt_col();
        HashMap<String, Object> unitParam = dtSimulationService.getTimeUnit(dateKey, data);
        TimeUnit unit = (TimeUnit) unitParam.get("unit");
        int delta = ((Double) unitParam.get("delta")).intValue();
        int unitTime = 1;
        log.info("평균 시간 unit -> {}, 평균 시간 delta -> {}", unit, delta);

        //시작 시간과 끝나는 시간의 초 차이
        long secondsDifference = TimeUtil.getDuration(cycle_bgng_dsgn_ymd, cycle_end_dsgn_ymd, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        log.info("시작 시간과 Data 시간의 초 차이 -> {}초", secondsDifference);
        int originCount = (int) (secondsDifference / delta);
        int windowSize = Integer.parseInt(dtModelJsonProperty.getPreproc_property_info().get(0).getModel_property().get(0).getHyperparam().getWindow_size());
        log.info("windowSize -> {}", windowSize);
        unitTime = ((windowSize) * delta) / TimeUnit.getTimeType(unit.getResampleType());

        //Interval Conversion Option을 설정여부 검사 후 있으면 고려해서 시간 계산
        boolean isIntervalUse = checkIntervalUses(dtModelJsonProperty);
        log.info("isIntervalUse -> {}", isIntervalUse);
        String resampleType = null;
        String resampleValue = null;
        int intervalCount = 1;
        int differenceCount = 1;
        int stepCount = 1;
        if (isIntervalUse) {
            //평균 시간보다 리샘플링 시간이 더 크면 데이터가 줄어듦으로 더 이전 데이터의 시간을 계산 해야한다.
            //평균 시간보다 리샘플링 시간이 더 작으면 데이터가 많아짐으로 필요 X
            DTModelJsonPropertySubSet intervalPropertySubSet = jsonPropertyService.getIntervalProperty(dtModelJsonProperty);
            resampleType = intervalPropertySubSet.getResmpl_tp();
            resampleValue = intervalPropertySubSet.getResmpl_intvl_value();
            log.info("resampleType -> {}, resampleValue -> {}", resampleType, resampleValue);
            log.info("Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType) -> {}", Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType));
            if (delta <= (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType))) {
                //줄어드는 개수 파악 해야됨
                //리샘플링을 돌린 부족한 개수 와 평균시간으로 돌리는 부족한 개수를 추출해서 비교해서 그 개수만큼 + 시켜야된다.

                //IntervalConversion 사용으로 채워야 하는 개수

                intervalCount = (int) (secondsDifference / (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType)));
                log.info("originCount -> {}, intervalCount -> {}", originCount, intervalCount);

                if (intervalCount == originCount) {
                    stepCount = originCount / windowSize;
                    int mod = originCount % windowSize;
                    if (mod != 0) {
                        //나머지 값이 있을 때, Step Count를 한번 더한다.
                        stepCount++;
                    }
                    log.info("몇번을 연속 증강 해야하는지에 대한 데이터 stepCount -> {}", stepCount);
                } else {
                    //+1은 데이터 보정치
                    differenceCount = (int) Math.ceil((double) originCount / intervalCount) + 1;

                    log.info("differenceCount -> {}", differenceCount);

                    unitTime = ((differenceCount) * (windowSize * delta)) / TimeUnit.getTimeType(unit.getResampleType());
                    log.info("isIntervalUse unitTime -> {}", unitTime);

                    originCount = intervalCount;
                    stepCount = originCount / windowSize;
                    int mod = originCount % windowSize;
                    if (mod != 0) {
                        //나머지 값이 있을 때, Step Count를 한번 더한다.
                        stepCount++;
                    }
                    log.info("몇번을 연속 증강 해야하는지에 대한 데이터 stepCount -> {}", stepCount);
                }
            } else {
                intervalCount = (int) (secondsDifference / (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType)));
                log.info("originCount -> {}, intervalCount -> {}", originCount, intervalCount);
                if (intervalCount == originCount) {
                    stepCount = originCount / windowSize;
                    int mod = originCount % windowSize;
                    if (mod != 0) {
                        //나머지 값이 있을 때, Step Count를 한번 더한다.
                        stepCount++;
                    }
                    log.info("몇번을 연속 증강 해야하는지에 대한 데이터 stepCount -> {}", stepCount);
                } else {
                    originCount = intervalCount;
                    stepCount = originCount / windowSize;
                    int mod = originCount % windowSize;
                    if (mod != 0) {
                        //나머지 값이 있을 때, Step Count를 한번 더한다.
                        stepCount++;
                    }
                    log.info("몇번을 연속 증강 해야하는지에 대한 데이터 stepCount -> {}", stepCount);
                }
            }
        }

        //채워야 하는 데이터의 개수
        originParam.put("data", data);
        originParam.put("file_path", file_path);
        originParam.put("file_name", file_name);

        //csv 파일 생성
        log.info("metaSimulationPredict CSV 파일 생성 -> file_path : {}, , file_name : {}, , index_trgt_col : {}", originParam.get("file_path"), originParam.get("file_name"), originParam.get("index_trgt_col"));
        ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(originParam);
        int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
        if (statusCode != 200) {
            Exception e = new Exception("The connection to the Python server was lost.");
            e.printStackTrace();
            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                    .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(cycle_bgng_dsgn_ymd);
            handleSimulationProcessError(errorLogBuilder);
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            return result;
        }
        JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
        int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
        log.info("dataCount -> {}", dataCount);
        //데이터가 부족하지 않을 시 작업 진행
        //생성된 파일의 시계열 컬럼 데이터 중복 체크
        if (dataCount < 200) {
            //데이터 200개 미만일시 이상치에서 문제가 생길 수 도있음
            Exception e = new Exception("데이터가 부족합니다.");
            e.printStackTrace();
            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                    .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(cycle_bgng_dsgn_ymd);
            handleSimulationProcessError(errorLogBuilder);
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            result.put("message", e.getMessage());
            return result;
        }
        String created_data_file_path = rootNode.path("data").get("file_path").asText();
        String created_data_file_name = rootNode.path("data").get("file_name").asText();

        List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
        String findColumnKey = dtModelJsonProperty.getPreproc_property_info().get(0).getIndex_trgt_col();
        boolean duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
        if (duplicateDataCheck) {
            List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
            FileWriter.getInstance().writeCSV(created_data_file_path + File.separator + created_data_file_name, removedDuplicatedData);
        }

        HashMap<String, Object> preProcessResult = dtSimulationService.makePreProcessContinuousInterpolationAugment(null, null, dtModelJsonProperty, base_dir, file_path, file_name, param.get("index_trgt_col").toString(), WebConfig.getSessionInfo().getUserId(), modelSeq, augmentSeq, cycle_bgng_dsgn_ymd, cycle_end_dsgn_ymd, cycle_bgng_dsgn_ymd, null, stepCount);
        if (!Boolean.parseBoolean(preProcessResult.get("status").toString())) {
            if (preProcessResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(preProcessResult.get("isSizeAvailable").toString())) {
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                        .errCn("데이터가 부족합니다.").dataCrtLastHr(cycle_bgng_dsgn_ymd);
                handleSimulationProcessError(errorLogBuilder);
            } else if (preProcessResult.get("code") != null && preProcessResult.get("message") != null && preProcessResult.get("detail") != null) {
                Exception e = new Exception(preProcessResult.get("message").toString());
                e.printStackTrace();
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                        .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(cycle_bgng_dsgn_ymd);
                handleSimulationProcessError(errorLogBuilder);
            } else {
                //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                Map<String, Object> logParams = new HashMap<String, Object>();
                logParams.put("augment_seq", augmentSeq);
                logParams.put("data_crt_last_hr", cycle_bgng_dsgn_ymd);
                makeMetaSimulationSchedulerService.updateAugmentMain(logParams);
            }
            result.put("code", GlobalConstant.API_STATUS.FAIL);
            return result;
        }
        result.put("code", GlobalConstant.API_STATUS.SUCCESS);
        return result;
    }

    // 에러 처리 메소드
    private void handleSimulationProcessError(DTAugmentLog.DTAugmentLogBuilder builder) {
        DTAugmentLog logEntry = builder.build();
        makeMetaSimulationSchedulerService.saveAugmentLog(logEntry);
    }

    // DecisionTree 를 사용했는지 그리고 LABEL 이란 속성이 있는지 확인 (테스트 코드 및 조건부 테스트)
    private boolean checkDecisionTreeUses(DTModelJsonProperty property) {
        List<DTModelJsonPropertySubSet> dtModelJsonPropertySubSets = property.getPreproc_property_info().get(0).getPreproc_property().get(2).getPreproc_set();
        boolean isDecisionTreeModel = false;
        String feature = null;
        for (DTModelJsonPropertySubSet dtModelJsonPropertySubSet : dtModelJsonPropertySubSets) {
            if (dtModelJsonPropertySubSet.getInterpl_tp() != null && Objects.equals(dtModelJsonPropertySubSet.getInterpl_tp(), "decisiontree")) {
                isDecisionTreeModel = true;
                feature = dtModelJsonPropertySubSet.getInterpl_feature();
            }
        }
        return isDecisionTreeModel && Objects.equals(feature, "LABEL");
    }

    // Interval Conversion Option 사용 여부 확인
    private boolean checkIntervalUses(DTModelJsonProperty property) {
        List<DTModelJsonPropertySubSet> dtModelJsonPropertySubSets = property.getPreproc_property_info().get(0).getPreproc_property().get(3).getPreproc_set();
        return !dtModelJsonPropertySubSets.isEmpty();
    }

    /*int fileSeq = filesService.saveAugmentFiles(sourceDirectory, base_dir, fileName, augment_seq);*/
    private void handleCreateMetaAugmentVisualFile(Files files) throws IOException {
        //TODO 증강 시각화 파일 생성 로직 구현
        log.info("증강 시각화 파일 생성: augmentSeq={}, refType={}, baseDir={}, fileName={}", files.getRefSeq(), files.getRefTp(), files.getFilePath(), files.getFileNm());
        // 실제 파일 생성 로직을 여기에 추가
        int filesSeq = fileService.saveAugmentVisualFiles(files);
        log.info("증강 시각화 파일 생성 완료: fileSeq={}", filesSeq);
    }
}
