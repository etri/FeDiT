package com.stoneitgt.dt.data.platform.admin.component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.common.GlobalConstant;
import com.stoneitgt.dt.data.platform.admin.controller.BaseController;
import com.stoneitgt.dt.data.platform.admin.service.*;
import com.stoneitgt.dt.data.platform.domain.*;
import com.stoneitgt.dt.data.platform.domain.model.ModelSettingInfo;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
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
public class MetaDTSimulationScheduler extends BaseController {
    @Autowired
    private MakeMetaSimulationSchedulerService makeMetaSimulationSchedulerService;

    @Autowired
    private DTSimulationService dtSimulationService;

    @Autowired
    private DTModelApiService dtModelApiService;

    @Autowired
    private DTModelService dtModelService;

    @Autowired
    private JSONPropertyService jsonPropertyService;

    @Autowired
    private FilesService fileService;

    @Autowired
    private SyncEngineAPIService syncEngineAPIService;

    //TODO Deprecated
    /*public void executeAugment(HashMap<String, Object> job) {
        log.info("job -> {}", job);
        DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder();
        //데이터 마지막 시간
        String data_crt_last_hr = job.get("data_crt_last_hr").toString();
        int augment_seq = Integer.parseInt(job.get("augment_seq").toString());
        int modelSeq = Integer.parseInt(job.get("model_seq").toString());
        errorLogBuilder.augmentSeq(augment_seq).modelSeq(modelSeq);
        List<Map<String, Object>> data = new ArrayList<>();
        try {
            *//**
             * 공통 변수 구역
             * *//*
            String simTp = job.get("sim_tp").toString();
            // 타겟 모델 정보 가져오기
            Map<String, Object> targetModel = makeMetaSimulationSchedulerService.getTargetModel(modelSeq);
            String twin_id = targetModel.get("sdt_id").toString();
            String obj_id = targetModel.get("sdt_obj_id").toString();
            String proc_json = targetModel.get("user_pprcs_full_stng_value").toString();
            String dateKey = targetModel.get("index_trgt_col").toString();
            ObjectMapper objectMapper = new ObjectMapper();

            DTModelJsonProperty dtModelJsonProperty = jsonPropertyService.propertyParsingToObject(proc_json);
            boolean isDecisionUses = checkDecisionTreeUses(dtModelJsonProperty);
            if (isDecisionUses) {
                // DECISION TREE 테스트 증강이라서 로직 미수행
                Exception e = new Exception("현재 모델은 DecisionTree 테스트이기 때문에 전처리와 증강을 사용할 수 없습니다.");
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                handleSimulationProcessError(errorLogBuilder, true);
                return;
            }

            // 날짜 범위 설정
            SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy/MM");
            Calendar calendar = Calendar.getInstance();

            //시간 간격 고려
            //시간 구분 로직
            // 데이터를 검색해서 가져오는 부분 KETI API
            // 1. 메타데이터의 Depth 정보 가져오기
            Map<String, Object> depthSearchParams = new HashMap<>();
            depthSearchParams.put("digital_twins", twin_id);
            depthSearchParams.put("digital_objects", obj_id);
            Map<String, Object> dataPathInfo = dtModelService.getMetaDataJsonDepth(depthSearchParams);

            String dataPath = null;
            String timePath = null;

            if (dataPathInfo.get("data_depth_1") != null && dataPathInfo.get("data_depth_2") != null) {
                dataPath = dataPathInfo.get("data_depth_1").toString();
                timePath = dataPathInfo.get("data_depth_2").toString();
                log.info("dataPath -> {}, timePath -> {}", dataPath, timePath);
            } else {
                Exception e = new Exception("메타데이터의 Depth 정보를 가져올 수 없습니다.");
                e.printStackTrace();
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                handleSimulationProcessError(errorLogBuilder, true);
                return;
            }

            // 2. 디지털 트윈 오브젝트 데이터 조회 (데이터 시간 간격 파악 샘플용 최근 데이터 100개)
            List<Map<String, Object>> digitalTwinObjectSampleData = syncEngineAPIService.getDigitalTwinObjectData(twin_id, obj_id, 100, null, null);

            if (digitalTwinObjectSampleData.isEmpty()) {
                Exception e = new Exception("디지털 트윈 오브젝트 데이터를 가져올 수 없습니다.");
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                handleSimulationProcessError(errorLogBuilder, true);
                return;
            }

            // 3. 데이터 파싱 및 전처리
            log.info("digitalTwinObjectSampleData Size -> {}", digitalTwinObjectSampleData.size());
            List<Map<String, Object>> parsedSampleData = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectSampleData, dataPath, timePath);
            log.info("parsedSampleData Size -> {}", parsedSampleData.size());

            // 4. 데이터 시간 단위 및 간격 파악
            HashMap<String, Object> unitParam = dtSimulationService.getTimeUnit(dateKey, parsedSampleData);
            TimeUnit unit = (TimeUnit) unitParam.get("unit");
            int delta = ((Double) unitParam.get("delta")).intValue();

            boolean duplicateDataCheck = false;
            int limit = systemProperties.getLimitCsvRowCount();

            //전처리에서 사용될 최소 데이터 개수 제한
            int data_max_limit_cnt = Integer.parseInt(job.get("data_max_limit_cnt").toString());

            if (Objects.equals("A", simTp)) {
                //증강 프로세스
                //가장 과거의 데이터 중 빈값 이전의 데이터의 시간
                String lastEmptyDataDatetime = null;
                //데이터 시점에서 현재 시점까지 개수 파악 몇개가 비었는지 계산
                //시간값 나중에 unit에서 나온 type으로 계산 (H,S,...)
                int unitTime = 1;

                //현재 시간과 Data 시간의 초 차이
                long secondsDifference = TimeUtil.getPastDuration(data_crt_last_hr, null);

                log.info("현재 시간과 Data 시간의 초 차이 -> {}초", secondsDifference);
                log.info("평균 시간 unit -> {}, 평균 시간 delta -> {}", unit, delta);
                int windowSize = Integer.parseInt(dtModelJsonProperty.getPreproc_property_info().get(0).getModel_property().get(0).getHyperparam().getWindow_size());
                log.info("windowSize -> {}", windowSize);

                //보조 개수 (범위 안정성, 데이터가 안나올 수 도 있음, 현재 시간보다 하나 더 예측 해야함, windowSize/3으로 변경, 보정치를 크게 잡을 필요가 있음)
                int supportSize = windowSize / 3;

                //채워야 하는 데이터의 개수
                int originCount = (int) (secondsDifference / delta);
                log.info("원래 채워야 하는 데이터의 개수 originCount -> {}", originCount);

                unitTime = ((windowSize + supportSize) * delta) / TimeUnit.getTimeType(unit.getResampleType());
                log.info("originUnitTime -> {}", unitTime);

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
                    log.info("resample type -> {}, resample value -> {}", resampleType, resampleValue);
                    log.info("compare delta -> {}, {}", delta, (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType)));
                    if (delta <= (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType))) {
                        //줄어드는 개수 파악 해야됨
                        //리샘플링을 돌린 부족한 개수 와 평균시간으로 돌리는 부족한 개수를 추출해서 비교해서 그 개수만큼 + 시켜야된다.
                        //IntervalConversion 사용으로 채워야 하는 개수
                        intervalCount = (int) (secondsDifference / (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType)));
                        log.info("originCount -> {}, intervalCount -> {}", originCount, intervalCount);

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

                //데이터 가져오는 API 시간 설정
                String from_date = TimeUtil.minusTime(null, job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime);
                String to_date = TimeUtil.plusTime(null, job.get("data_crt_last_hr").toString(), "H", 0);
                log.info("Time -> from_date {}, to_date {}", from_date, to_date);
                // 데이터를 검색해서 가져오는 부분 KETI API
                try {
                    List<Map<String, Object>> digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(twin_id, obj_id, null, from_date, to_date);

                    // 3. 데이터 파싱 및 전처리
                    log.info("digitalTwinObjectData Size -> {}", digitalTwinObjectData.size());
                    data = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, dataPath, timePath);
                    log.info("data Size -> {}, dateKey -> {}", data.size(), dateKey);

                    if (JSONParser.isDuplicateDataByKey(data, dateKey)) {
                        data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                    }

                    //이전 WindowSize 만큼 흩었는데 데이터가 없는 경우
                    int prevWindowSizeCount = 0;
                    while (data.isEmpty()) {
                        if (prevWindowSizeCount > 1) {
                            *//**
                             * 초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음
                             * (임시) data_crt_last_hr를 한 windowSize 만큼 앞으로 이동
                             * *//*
                            log.info("초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음");
                            String nextWindowSizeDataCrtHr = TimeUtil.plusTime(null, data_crt_last_hr, "S", (windowSize * delta));
                            log.info("nextWindowSizeDataCrtHr -> {}", nextWindowSizeDataCrtHr);
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                            handleSimulationProcessError(errorLogBuilder, false);
                            return;
                        }
                        from_date = TimeUtil.minusTime(null, job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime * (++prevWindowSizeCount + 1));
                        digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(twin_id, obj_id, null, from_date, to_date);

                        // 3. 데이터 파싱 및 전처리
                        log.info("digitalTwinObjectData Size -> {}", digitalTwinObjectData.size());
                        data = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, dataPath, timePath);
                        log.info("data Size -> {}", data.size());

                        if (JSONParser.isDuplicateDataByKey(data, dateKey)) {
                            data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                        }
                    }
                    stepCount += prevWindowSizeCount;

                    log.info("stepCount -> {}, prevWindowSizeCount -> {}", stepCount, prevWindowSizeCount);

                    *//**
                     * Data Row 확인
                     * 역방향 로직 필요
                     * *//*
                    boolean isEmptyRow = false;
                    List<String> isEmptyTimes = new ArrayList<>();
                    List<String> timeList = dtSimulationService.extractTimeData(data);
                    Collections.reverse(timeList);

                    String compareTime = null;
                    for (int i = 0; i < timeList.size(); i++) {
                        String currentTime = timeList.get(i);
                        if (i == 0) {
                            compareTime = currentTime;
                            continue;
                        }
                        long def = TimeUtil.getDuration(currentTime, compareTime, null);
                        //둘 사이의 간격이 평균 시간(초) * 2 보다 작으면 존재하는것으로 간주
                        if ((delta * 2) < def) {
                            if (!isEmptyRow) {
                                log.info("delta * 2 -> {}, def -> {}", delta * 2, def);
                                isEmptyRow = true;
                            }
                            isEmptyTimes.add(currentTime);
                        }
                        compareTime = currentTime;
                    }
                    if (isEmptyRow) {
                        log.info("빈 데이터 Row가 있습니다.");
                        log.info("isEmptyRow -> {}, isEmptyTimes -> {}", isEmptyRow, isEmptyTimes);
                        *//**
                         * 데이터 한번 더 뽑기
                         * *//*
                        lastEmptyDataDatetime = isEmptyTimes.get(isEmptyTimes.size() - 1);
                        String empty_from_date = TimeUtil.minusTime(null, lastEmptyDataDatetime, unit.getResampleType().toUpperCase(), unitTime);
                        String empty_to_date = TimeUtil.plusTime(null, job.get("data_crt_last_hr").toString(), "H", 0);
                        log.info("empty_from_date -> {}, empty_to_date -> {}", empty_from_date, empty_to_date);

                        digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(twin_id, obj_id, null, empty_from_date, empty_to_date);

                        // 3. 데이터 파싱 및 전처리
                        log.info("digitalTwinObjectData Size -> {}", digitalTwinObjectData.size());
                        data = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, dataPath, timePath);
                        log.info("data Size -> {}", data.size());

                        if (JSONParser.isDuplicateDataByKey(data, dateKey)) {
                            data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                        }
                        log.info("Simulation Empty Data Check -> {}, {}", data.size());
                    }

                    *//**
                     * Data를 Interval Conversion 까지 계산해서 WindowSize만큼 나오지 않았을 때, 처리 로직
                     * 데이터 첫값과 끝값의 차이로 IntervalConversion 고려
                     * *//*
                    List<String> notEnoughCheckTimes = dtSimulationService.extractTimeData(data);
                    long def = TimeUtil.getDuration(notEnoughCheckTimes.get(0), notEnoughCheckTimes.get(notEnoughCheckTimes.size() - 1), null);
                    int notEnoughCheckCount = (int) def / (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType));
                    log.info("notEnoughCheckCount -> {}", notEnoughCheckCount);
                    if (notEnoughCheckCount < windowSize) {
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, false);
                        return;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                    handleSimulationProcessError(errorLogBuilder, true);
                    return;
                }
                // 파일 경로 및 이름 설정
                String currentYearMonthDir = simpleDateFormat.format(calendar.getTime());
                String base_dir = "/augment/" + currentYearMonthDir + "/" + augment_seq;
                String file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + base_dir;
                String file_name = job.get("user_id").toString() + "_origin_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";

                // CSV 파일 생성
                Map<String, Object> param = new HashMap<>();
                param.put("data", data);
                param.put("file_path", file_path);
                param.put("file_name", file_name);
                param.put("index_trgt_col", dateKey);

                ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(param);

                // 결과 처리
                int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
                if (statusCode != 200) {
                    Exception e = new Exception("The connection to the Python server was lost.");
                    e.printStackTrace();
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                    handleSimulationProcessError(errorLogBuilder, true);
                    return;
                }
                JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
                int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                List<String> originTimeData = new ArrayList<>();
                *//**
                 * 이상치 판단을 위해 데이터를 넣을 때 데이터의 개수 (현재는 200개)
                 * *//*
                if (dataCount >= data_max_limit_cnt) {
                    //데이터가 부족하지 않을 시 작업 진행
                    //생성된 파일의 시계열 컬럼 데이터 중복 체크
                    String created_data_file_path = rootNode.path("data").get("file_path").asText();
                    String created_data_file_name = rootNode.path("data").get("file_name").asText();
                    List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
                    if (JSONParser.isDuplicateDataByKey(readTempData, dateKey)) {
                        List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, dateKey);
                        FileWriter.getInstance().writeCSV(created_data_file_path + File.separator + created_data_file_name, removedDuplicatedData);
                    }

                    //마지막 데이터 시간 조정
                    data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                    String user_id = job.get("user_id").toString();
                    HashMap<String, Object> preProcessResult = dtSimulationService.makePreProcessContinuousInterpolationAugment(twin_id, obj_id, dtModelJsonProperty, base_dir, file_path, file_name, dateKey, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData, stepCount);
                    log.info("preProcessResult -> {}", preProcessResult);
                    if (!Boolean.parseBoolean(preProcessResult.get("status").toString())) {
                        if (preProcessResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(preProcessResult.get("isSizeAvailable").toString())) {
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, false);
                        } else if (preProcessResult.get("code") != null && preProcessResult.get("message") != null && preProcessResult.get("detail") != null) {
                            Exception e = new Exception(preProcessResult.get("message").toString());
                            e.printStackTrace();
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, true);
                        } else {
                            //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                            handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                        }
                        return;
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
                        Files originFiles = new Files();
                        File originFile = new File(originFilePath);
                        originFiles.setAugmentFileSeq(augmentFileSeq);
                        originFiles.setFileNm(originFile.getName());
                        originFiles.setStrgFileNm(originFile.getName());
                        originFiles.setFilePath(base_dir);
                        originFiles.setFileSz(originFile.length());
                        originFiles.setFileExtn(FileUtil.getFileExtension(originFile.getName()));
                        originFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.ORIGIN.toUpperCase());
                        originFiles.setRefSeq(augment_seq);
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

                    handleUpdateDataLastTime(augment_seq, preProcessResult.get("data_crt_last_hr").toString());
                } else {
                    //이상치 판단을 위한 데이터 부족시 더 가져와야한다.
                    //데이터 제한을 두지 않음
                    if (dataCount == 0) {
                        *//**
                         * 초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음
                         * (임시) data_crt_last_hr를 한 windowSize 만큼 앞으로 이동
                         * *//*
                        log.info("초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음");
                        String nextWindowSizeDataCrtHr = TimeUtil.plusTime(null, data_crt_last_hr, "S", (windowSize * delta));
                        log.info("nextWindowSizeDataCrtHr -> {}", nextWindowSizeDataCrtHr);
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, false);
                        return;
                    }
                    int count = 1;
                    //기존 데이터의 시계열 컬럼만 데이터 저장
                    originTimeData = dtSimulationService.extractTimeData(rootNode.path("data").path("data"));
                    while (true) {
                        //2번 더 가져와도 안되면 메세지 출력 후 프로세스 종료
                        if (count > 10) {
                            *//**
                             * 초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음
                             * (임시) data_crt_last_hr를 한 windowSize 만큼 앞으로 이동
                             * *//*
                            log.info("초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음");
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                            handleSimulationProcessError(errorLogBuilder, false);
                            return;
                        }
                        String more_from_date = TimeUtil.minusTime(null, job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime * (windowSize * count));
                        String more_to_date = TimeUtil.plusTime(null, job.get("data_crt_last_hr").toString(), "H", 0);
                        try {
                            List<Map<String, Object>> digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(twin_id, obj_id, null, more_from_date, more_to_date);

                            // 3. 데이터 파싱 및 전처리
                            log.info("digitalTwinObjectData Size -> {}", digitalTwinObjectData.size());
                            data = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, dataPath, timePath);
                            log.info("data Size -> {}", data.size());

                            if (JSONParser.isDuplicateDataByKey(data, dateKey)) {
                                data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                            }
                            log.info("추가 데이터 확보(기존 데이터 포함) {}번째 -> {}개", count, data.size());
                        } catch (Exception e) {
                            e.printStackTrace();
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                            handleSimulationProcessError(errorLogBuilder, true);
                            return;
                        }
                        //데이터의 개수가 채워지면 더 가져오는 로직 break;
                        if (data.size() >= data_max_limit_cnt) {
                            break;
                        }
                        count++;
                    }

                    // CSV 파일 생성
                    Map<String, Object> moreBasicFileParam = new HashMap<>();
                    moreBasicFileParam.put("data", data);
                    moreBasicFileParam.put("file_path", file_path);
                    moreBasicFileParam.put("file_name", file_name);
                    moreBasicFileParam.put("index_trgt_col", dateKey);

                    ResponseEntity<?> moreResultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(moreBasicFileParam);

                    // 결과 처리
                    int moreStatusCode = moreResultSimulationOriginFileSet.getStatusCodeValue();
                    if (moreStatusCode != 200) {
                        Exception e = new Exception("The connection to the Python server was lost.");
                        e.printStackTrace();
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, true);
                        return;
                    }
                    rootNode = objectMapper.readTree(moreResultSimulationOriginFileSet.getBody().toString());
                    dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                    log.info("More Total dataCount -> {}", dataCount);

                    //데이터가 부족하지 않을 시 작업 진행
                    //생성된 파일의 시계열 컬럼 데이터 중복 체크
                    String created_data_file_path = rootNode.path("data").get("file_path").asText();
                    String created_data_file_name = rootNode.path("data").get("file_name").asText();

                    List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
                    String findColumnKey = rootNode.path("data").get("index_trgt_col").asText();
                    if (JSONParser.isDuplicateDataByKey(readTempData, findColumnKey)) {
                        List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
                        FileWriter.getInstance().writeCSV(created_data_file_path + File.separator + created_data_file_name, removedDuplicatedData);
                    }

                    //마지막 데이터 시간 조정
                    data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                    String user_id = job.get("user_id").toString();

                    HashMap<String, Object> processResult = dtSimulationService.makePreProcessContinuousInterpolationAugment(twin_id, obj_id, dtModelJsonProperty, base_dir, file_path, file_name, dateKey, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData, stepCount);
                    log.info("preProcessResult -> {}", processResult);
                    if (!Boolean.parseBoolean(processResult.get("status").toString())) {
                        if (processResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(processResult.get("isSizeAvailable").toString())) {
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, false);
                        } else if (processResult.get("code") != null && processResult.get("message") != null && processResult.get("detail") != null) {
                            Exception e = new Exception(processResult.get("message").toString());
                            e.printStackTrace();
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, true);
                        } else {
                            //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                            handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                        }
                        return;
                    }
                    int augmentFileSeq = (int) processResult.get("augmentFileSeq");

                    // 원본 JSON 데이터 파일 생성 및 DB 저장
                    String notification_time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                    List<Map<String, Object>> originCsvData = FileReader.getInstance().readCSVToListObjectMap(file_path + File.separator + file_name);
                    String jsonFileName = notification_time.replaceAll("[ :]", "") + "_origin.json";
                    JSONArray originJsonArray = JSONParser.convertListMapToJson(originCsvData);
                    String originFilePath = file_path + File.separator + jsonFileName;

                    try (java.io.FileWriter fileWriter = new java.io.FileWriter(originFilePath)) {
                        fileWriter.write(originJsonArray.toString());
                        Files originFiles = new Files();
                        File originFile = new File(originFilePath);
                        originFiles.setAugmentFileSeq(augmentFileSeq);
                        originFiles.setFileNm(originFile.getName());
                        originFiles.setStrgFileNm(originFile.getName());
                        originFiles.setFilePath(base_dir);
                        originFiles.setFileSz(originFile.length());
                        originFiles.setFileExtn(FileUtil.getFileExtension(originFile.getName()));
                        originFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.ORIGIN.toUpperCase());
                        originFiles.setRefSeq(augment_seq);
                        Path saveLastFile = Paths.get(originFilePath);
                        originFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                        handleCreateMetaAugmentVisualFile(originFiles);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                    // 증강된 JSON 데이터 파일 저장
                    Files dataFiles = (Files) processResult.get("dataFiles");
                    handleCreateMetaAugmentVisualFile(dataFiles);

                    // Validation된 JSON 데이터 파일 저장
                    Files validationFiles = (Files) processResult.get("validationFiles");
                    handleCreateMetaAugmentVisualFile(validationFiles);

                    // Outlier된 JSON 데이터 파일 저장
                    Files outlierFiles = (Files) processResult.get("outlierFiles");
                    handleCreateMetaAugmentVisualFile(outlierFiles);

                    ArrayList<Files> fileses = fileService.getAugmentVisualFilesByAugmentFileSeq(augmentFileSeq);
                    handleUpdateDataLastTime(augment_seq, processResult.get("data_crt_last_hr").toString());
                }
            } else {
                //전처리 프로세스

                //데이터 가져오는 API 시간 설정
                //데이터 마지막 시간부터 현재 시간까지를 데이터 가져오는 시간으로 지정
                String from_date = job.get("data_crt_last_hr").toString();
                String to_date = TimeUtil.getCurrentDateTime();
                log.info("Time -> from_date {}, to_date {}", from_date, to_date);
                // 데이터를 검색해서 가져오는 부분 KETI API
                try {
                    List<Map<String, Object>> digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(twin_id, obj_id, limit, from_date, to_date);

                    // 3. 데이터 파싱 및 전처리
                    log.info("digitalTwinObjectData Size -> {}", digitalTwinObjectData.size());
                    data = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, dataPath, timePath);
                    log.info("data Size -> {}", data.size());

                    if (JSONParser.isDuplicateDataByKey(data, dateKey)) {
                        data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                    handleSimulationProcessError(errorLogBuilder, true);
                    return;
                }
                // 파일 경로 및 이름 설정
                String currentYearMonthDir = simpleDateFormat.format(calendar.getTime());
                String base_dir = "/augment/" + currentYearMonthDir + "/" + augment_seq;
                String file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + base_dir;
                String file_name = job.get("user_id").toString() + "_origin_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";

                // CSV 파일 생성
                Map<String, Object> param = new HashMap<>();
                param.put("data", data);
                param.put("file_path", file_path);
                param.put("file_name", file_name);
                param.put("index_trgt_col", dateKey);

                ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(param);

                // 결과 처리
                int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
                if (statusCode != 200) {
                    Exception e = new Exception("The connection to the Python server was lost.");
                    e.printStackTrace();
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                    handleSimulationProcessError(errorLogBuilder, true);
                    return;
                }
                JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
                int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                log.info("dataCount -> {}", dataCount);
                List<String> originTimeData = new ArrayList<>();
                *//**
                 * 이상치 판단을 위해 데이터를 넣을 때 데이터의 개수 (현재는 {data_max_limit_cnt}개)
                 * *//*
                if (dataCount >= data_max_limit_cnt) {
                    //데이터가 부족하지 않을 시 작업 진행
                    //생성된 파일의 시계열 컬럼 데이터 중복 체크
                    String created_data_file_path = rootNode.path("data").get("file_path").asText();
                    String created_data_file_name = rootNode.path("data").get("file_name").asText();

                    *//**
                     * 시간 중복값 제거
                     * *//*
                    List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
                    String findColumnKey = rootNode.path("data").get("index_trgt_col").asText();
                    if (JSONParser.isDuplicateDataByKey(readTempData, findColumnKey)) {
                        List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
                        FileWriter.getInstance().writeCSV(created_data_file_path + File.separator + created_data_file_name, removedDuplicatedData);
                    }

                    //마지막 데이터 시간 조정
                    data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                    String indexTargetCol = dateKey;
                    String user_id = job.get("user_id").toString();
                    HashMap<String, Object> processResult = dtSimulationService.makePreprocess(twin_id, obj_id, dtModelJsonProperty, base_dir, file_path, file_name, indexTargetCol, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData);
                    log.info("preProcessResult -> {}", processResult);
                    if (!Boolean.parseBoolean(processResult.get("status").toString())) {
                        if (processResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(processResult.get("isSizeAvailable").toString())) {
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, false);
                        } else {
                            //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                            handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                        }
                        return;
                    }
                    int preprocessFileSeq = (int) processResult.get("preprocessFileSeq");

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
                        Files originFiles = new Files();
                        File originFile = new File(originFilePath);
                        originFiles.setAugmentFileSeq(preprocessFileSeq);
                        originFiles.setFileNm(originFile.getName());
                        originFiles.setStrgFileNm(originFile.getName());
                        originFiles.setFilePath(base_dir);
                        originFiles.setFileSz(originFile.length());
                        originFiles.setFileExtn(FileUtil.getFileExtension(originFile.getName()));
                        originFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.ORIGIN.toUpperCase());
                        originFiles.setRefSeq(augment_seq);
                        Path saveLastFile = Paths.get(originFilePath);
                        originFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                        handleCreateMetaAugmentVisualFile(originFiles);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                    // 증강된 JSON 데이터 파일 저장
                    Files dataFiles = (Files) processResult.get("dataFiles");
                    handleCreateMetaAugmentVisualFile(dataFiles);

                    // Validation된 JSON 데이터 파일 저장
                    Files validationFiles = (Files) processResult.get("validationFiles");
                    handleCreateMetaAugmentVisualFile(validationFiles);

                    // Outlier된 JSON 데이터 파일 저장
                    Files outlierFiles = (Files) processResult.get("outlierFiles");
                    handleCreateMetaAugmentVisualFile(outlierFiles);

                    ArrayList<Files> fileses = fileService.getAugmentVisualFilesByAugmentFileSeq(preprocessFileSeq);

                    handleUpdateDataLastTime(augment_seq, processResult.get("data_crt_last_hr").toString());
                } else {
                    //이상치 판단을 위한 데이터 부족시 더 가져와야한다.
                    //데이터 제한을 두지 않음
                    if (dataCount == 0) {
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, false);
                        return;
                    }
                    int count = 1;
                    //기존 데이터의 시계열 컬럼만 데이터 저장
                    log.info("rootNode -> {}", rootNode);
                    originTimeData = dtSimulationService.extractTimeData(rootNode.path("data").path("data"));
                    while (true) {
                        //2번 더 가져와도 안되면 메세지 출력 후 프로세스 종료
                        if (count > 10) {
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                            handleSimulationProcessError(errorLogBuilder, false);
                            return;
                        }
                        //채워야 하는 데이터의 개수
                        int originCount = data_max_limit_cnt - originTimeData.size();
                        int unitTime = delta * TimeUnit.getTimeType(unit.getResampleType()) * originCount;
                        log.info("originCount -> {}, originUnitTime -> {}", originCount, unitTime);
                        String more_from_date = TimeUtil.minusTime(null, job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime * count);
                        String more_to_date = TimeUtil.getCurrentDateTime();
                        log.info("Time -> from_date {}, to_date {}", from_date, to_date);
                        try {
                            List<Map<String, Object>> digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(twin_id, obj_id, limit, more_from_date, more_to_date);

                            // 3. 데이터 파싱 및 전처리
                            log.info("digitalTwinObjectData Size -> {}", digitalTwinObjectData.size());
                            data = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, dataPath, timePath);
                            log.info("data Size -> {}", data.size());

                            if (JSONParser.isDuplicateDataByKey(data, dateKey)) {
                                data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                            }
                            log.info("추가 데이터 확보(기존 데이터 포함) {}번째 -> {}개", count, data.size());
                        } catch (Exception e) {
                            e.printStackTrace();
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                            handleSimulationProcessError(errorLogBuilder, true);
                            return;
                        }
                        //데이터의 개수가 채워지면 더 가져오는 로직 break;
                        if (data.size() >= data_max_limit_cnt) {
                            break;
                        }
                        count++;
                    }
                    // CSV 파일 생성
                    Map<String, Object> moreBasicFileParam = new HashMap<>();
                    moreBasicFileParam.put("data", data);
                    moreBasicFileParam.put("file_path", file_path);
                    moreBasicFileParam.put("file_name", file_name);
                    moreBasicFileParam.put("index_trgt_col", dateKey);

                    ResponseEntity<?> moreResultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(moreBasicFileParam);

                    // 결과 처리
                    int moreStatusCode = moreResultSimulationOriginFileSet.getStatusCodeValue();
                    if (moreStatusCode != 200) {
                        Exception e = new Exception("The connection to the Python server was lost.");
                        e.printStackTrace();
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, true);
                        return;
                    }
                    rootNode = objectMapper.readTree(moreResultSimulationOriginFileSet.getBody().toString());
                    dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                    log.info("More Total dataCount -> {}", dataCount);

                    //데이터가 부족하지 않을 시 작업 진행
                    //생성된 파일의 시계열 컬럼 데이터 중복 체크
                    String created_data_file_path = rootNode.path("data").get("file_path").asText();
                    String created_data_file_name = rootNode.path("data").get("file_name").asText();

                    List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
                    String findColumnKey = rootNode.path("data").get("index_trgt_col").asText();
                    if (JSONParser.isDuplicateDataByKey(readTempData, findColumnKey)) {
                        List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
                        FileWriter.getInstance().writeCSV(created_data_file_path + File.separator + created_data_file_name, removedDuplicatedData);
                    }

                    //마지막 데이터 시간 조정
                    data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                    String user_id = job.get("user_id").toString();

                    HashMap<String, Object> processResult = dtSimulationService.makePreprocess(twin_id, obj_id, dtModelJsonProperty, base_dir, file_path, file_name, dateKey, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData);
                    log.info("preProcessResult -> {}", processResult);
                    if (!Boolean.parseBoolean(processResult.get("status").toString())) {
                        if (processResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(processResult.get("isSizeAvailable").toString())) {
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, false);
                        } else {
                            //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                            handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                        }
                        return;
                    }
                    int preprocessFileSeq = (int) processResult.get("preprocessFileSeq");

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
                        Files originFiles = new Files();
                        File originFile = new File(originFilePath);
                        originFiles.setAugmentFileSeq(preprocessFileSeq);
                        originFiles.setFileNm(originFile.getName());
                        originFiles.setStrgFileNm(originFile.getName());
                        originFiles.setFilePath(base_dir);
                        originFiles.setFileSz(originFile.length());
                        originFiles.setFileExtn(FileUtil.getFileExtension(originFile.getName()));
                        originFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.ORIGIN.toUpperCase());
                        originFiles.setRefSeq(augment_seq);
                        Path saveLastFile = Paths.get(originFilePath);
                        originFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                        handleCreateMetaAugmentVisualFile(originFiles);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                    // 증강된 JSON 데이터 파일 저장
                    Files dataFiles = (Files) processResult.get("dataFiles");
                    handleCreateMetaAugmentVisualFile(dataFiles);

                    // Validation된 JSON 데이터 파일 저장
                    Files validationFiles = (Files) processResult.get("validationFiles");
                    handleCreateMetaAugmentVisualFile(validationFiles);

                    // Outlier된 JSON 데이터 파일 저장
                    Files outlierFiles = (Files) processResult.get("outlierFiles");
                    handleCreateMetaAugmentVisualFile(outlierFiles);

                    ArrayList<Files> fileses = fileService.getAugmentVisualFilesByAugmentFileSeq(preprocessFileSeq);
                    handleUpdateDataLastTime(augment_seq, processResult.get("data_crt_last_hr").toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
            handleSimulationProcessError(errorLogBuilder, true);
        } finally {
            log.info("Finally Executed");
            // 종료 조건 확인
            handleCheckContinueProcess(job, data_crt_last_hr, augment_seq);
        }
    }*/

    public void executeTwinSimulate(HashMap<String, Object> job) {
        // 데이터 마지막 시간 변수
        String data_crt_last_hr = job.get("data_crt_last_hr").toString();
        // 증강 번호 변수
        int augment_seq = Integer.parseInt(job.get("augment_seq").toString());
        // 모델 번호 변수
        int modelSeq = Integer.parseInt(job.get("model_seq").toString());
        // 시뮬레이션 형태 변수
        String simTp = job.get("sim_tp").toString();

        // 증강 클래스
        DTAugment augment = dtSimulationService.getDTSimulation(augment_seq);

        // 시간 관련 설정 변수
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy/MM");
        Calendar calendar = Calendar.getInstance();

        // 포맷 관련 설정 변수
        ObjectMapper objectMapper = new ObjectMapper();

        // 에러 로그 설정
        DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder().augmentSeq(augment_seq).modelSeq(modelSeq);

        List<Map<String, Object>> data = new ArrayList<>();
        try {
            // 모델 및 전처리 설정 정보 가져오기
            ModelSettingInfo modelSettingInfo = new ModelSettingInfo(makeMetaSimulationSchedulerService.getTargetModel(modelSeq));
            modelSettingInfo.setModelJsonProperty(objectMapper.readValue(modelSettingInfo.getUserPprcsFullStngValue(), DTModelJsonProperty.class));
            Map<String, Object> depthSearchParams = new HashMap<>();
            depthSearchParams.put("digital_twins", modelSettingInfo.getSdtId());
            depthSearchParams.put("digital_objects", modelSettingInfo.getSdtObjId());
            Map<String, Object> params = dtModelService.getMetaDataJsonDepth(depthSearchParams);
            if (params == null) {
                Exception e = new Exception("메타데이터의 Depth 정보를 가져올 수 없습니다.");
                log.error("메타데이터의 Depth 정보를 가져올 수 없습니다. Depth 정보: {}", params);
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                handleSimulationProcessError(errorLogBuilder, true);
                return;
            }
            modelSettingInfo.setMetaDataDepth(params);

            if (modelSettingInfo.getMetaDataDepth().getDataDepth1() != null && modelSettingInfo.getMetaDataDepth().getDataDepth2() != null) {
                log.info("메타데이터의 Depth 정보를 성공적으로 가져왔습니다. Data Depth: {}, Datetime Depth2: {}", modelSettingInfo.getMetaDataDepth().getDataDepth1(), modelSettingInfo.getMetaDataDepth().getDataDepth2());
            } else {
                Exception e = new Exception("메타데이터의 Depth 정보를 가져올 수 없습니다.");
                log.error("메타데이터의 Depth 정보를 가져올 수 없습니다. Depth 정보: {}", modelSettingInfo.getMetaDataDepth());
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                handleSimulationProcessError(errorLogBuilder, true);
                return;
            }

            // 디지털 트윈 오브젝트 데이터 조회 (데이터 시간 간격 파악 샘플용 최근 데이터 100개)
            List<Map<String, Object>> digitalTwinObjectSampleData = syncEngineAPIService.getDigitalTwinObjectData(modelSettingInfo.getSdtId(), modelSettingInfo.getSdtObjId(), 100, null, null);
            List<Map<String, Object>> parsedSampleData = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectSampleData, modelSettingInfo.getMetaDataDepth().getDataDepth1(), modelSettingInfo.getMetaDataDepth().getDataDepth2());
            log.info("데이터 시간 간격 파악을 위한 최근 데이터 Size -> {}", parsedSampleData.size());

            // 데이터 시간 단위 및 간격 파악
            HashMap<String, Object> unitParam = dtSimulationService.getTimeUnit(modelSettingInfo.getIndexTrgtCol(), parsedSampleData);
            TimeUnit unit = (TimeUnit) unitParam.get("unit");
            int delta = ((Double) unitParam.get("delta")).intValue();
            log.info("데이터 시간 간격 파악 결과 -> Unit: {}, Delta: {}", unit, delta);

            // 전처리에서 사용될 최소 데이터 개수
            int preprocessLimitCount = Integer.parseInt(job.get("data_max_limit_cnt").toString());

            long unitTime = 0;
            // 증강 프로세스
            if (Objects.equals(simTp, "A")) {
                // 증강 모델 생성 시 설정했던 Window Size
                int windowSize = Integer.parseInt(jsonPropertyService.getModelProperty(modelSettingInfo.getModelJsonProperty()).getHyperparam().getWindow_size());
                log.info("모델 Window Size -> {}", windowSize);

                // IntervalConversion 진행 여부 파악
                boolean isIntervalUse = checkIntervalUses(modelSettingInfo.getModelJsonProperty());

                if (isIntervalUse) {
                    //평균 시간보다 리샘플링 시간이 더 크면 데이터가 줄어듦으로 더 이전 데이터를 가져와야 된다.
                    //평균 시간보다 리샘플링 시간이 더 작으면 데이터가 많아짐으로 필요 없음

                    // 1. 리샘플링 설정 정보 가져오기
                    DTModelJsonPropertySubSet intervalPropertySubSet = jsonPropertyService.getIntervalProperty(modelSettingInfo.getModelJsonProperty());
                    String resampleType = intervalPropertySubSet.getResmpl_tp();
                    String resampleValue = intervalPropertySubSet.getResmpl_intvl_value();

                    // 2. 리샘플링될 시간 간격 계산 (초 단위)
                    long resampleDeltaSeconds = Long.parseLong(resampleValue) * TimeUnit.getTimeType(resampleType);

                    // 3. 최소 개수를 충족하기 위해 필요한 총 시간(초) 계산
                    // (데이터 개수 * 간격)을 통해 리샘플링 후에도 preprocessLimitCount만큼 남도록 함
                    long effectiveDelta = Math.max(resampleDeltaSeconds, delta); // 둘 중 더 긴 간격 선택
                    long totalRequiredSeconds = (long) preprocessLimitCount * effectiveDelta;

                    // 만약 리샘플링으로 데이터가 늘어나는 경우(Upsampling)를 대비해 1.2배 정도 마진을 둠
                    if (resampleDeltaSeconds < delta) {
                        totalRequiredSeconds = (long) (totalRequiredSeconds * 1.2);
                    }

                    // 4. TimeUtil.minusTime에 들어갈 unitTime 계산
                    // unit.getResampleType()의 단위에 맞춰서 totalRequiredSeconds를 변환
                    int targetUnitDivider = TimeUnit.getTimeType(unit.getResampleType().toUpperCase());
                    unitTime = totalRequiredSeconds / targetUnitDivider;
                    log.info("리샘플링 적용 - 간격: {}s, 필요개수: {}, 계산된 unitTime: {}", resampleDeltaSeconds, preprocessLimitCount, unitTime);
                } else {
                    // 리샘플링 미사용 시 기본 delta(평균 간격) 기준으로 계산
                    long totalRequiredSeconds = (long) preprocessLimitCount * delta;
                    int targetUnitDivider = TimeUnit.getTimeType(unit.getResampleType().toUpperCase());
                    unitTime = totalRequiredSeconds / targetUnitDivider;

                    log.info("리샘플링 미사용 - 평균간격: {}s, 계산된 unitTime: {}", delta, unitTime);
                }
                // 5. API 호출 시간 설정
                // data_crt_last_hr(마지막 데이터 시간)로부터 unitTime만큼 이전으로 설정
                String to_date = TimeUtil.plusTime(null, job.get("data_crt_last_hr").toString(), "H", 0);
                String from_date = TimeUtil.minusTime(null, job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), (int) unitTime);

                log.info("조회 범위 설정: {} ~ {}", from_date, to_date);

                // 범위 데이터 조회
                List<Map<String, Object>> digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(modelSettingInfo.getSdtId(), modelSettingInfo.getSdtObjId(), null, from_date, to_date);
                List<Map<String, Object>> parsedData = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, modelSettingInfo.getMetaDataDepth().getDataDepth1(), modelSettingInfo.getMetaDataDepth().getDataDepth2());
                log.info("조회 범위 시간에 들어있는 데이터 개수 -> {}", parsedData.size());

                // 데이터 중복 제거 (시간 중복 제거 Millis 단위까지)
                data = JSONParser.isDuplicateDataByKey(parsedData, modelSettingInfo.getIndexTrgtCol()) == true ? JSONParser.removeDuplicateDataByKey(parsedData, modelSettingInfo.getIndexTrgtCol()) : parsedData;

                // 중복 제거된 데이터가 전처리 개수 제한을 넘지 못하면 더 많은 데이터 가져오기
                if (data.size() < preprocessLimitCount) {
                    log.info("초기 조회 데이터 부족 (확보: {}개, 필요: {}개). 재시도 로직 진입.", data.size(), preprocessLimitCount);
                    // windowSize 기준의 추가 확장 단위(windowUnitTime) 계산
                    long windowUnitTime = 0;

                    if (checkIntervalUses(modelSettingInfo.getModelJsonProperty())) {
                        DTModelJsonPropertySubSet intervalPropertySubSet = jsonPropertyService.getIntervalProperty(modelSettingInfo.getModelJsonProperty());
                        long resampleDeltaSeconds = Long.parseLong(intervalPropertySubSet.getResmpl_intvl_value()) * TimeUnit.getTimeType(intervalPropertySubSet.getResmpl_tp());
                        windowUnitTime = (windowSize * resampleDeltaSeconds) / TimeUnit.getTimeType(unit.getResampleType().toUpperCase());
                    } else {
                        windowUnitTime = ((long) windowSize * delta) / TimeUnit.getTimeType(unit.getResampleType().toUpperCase());
                    }

                    boolean isDataReady = false;
                    // 초기 시도가 실패했으므로, 2회차(i=1)와 3회차(i=2)를 수행
                    for (int i = 1; i <= 2; i++) {
                        // 기존 unitTime에 windowUnitTime을 i배만큼 더해서 범위를 확장
                        long expandedUnitTime = unitTime + (windowUnitTime * i);
                        String retryFromDate = TimeUtil.minusTime(null, data_crt_last_hr, unit.getResampleType().toUpperCase(), (int) expandedUnitTime);

                        log.info("[재시도 {}회차] 확장된 범위 조회: {} ~ {} (unitTime: {})", i, retryFromDate, to_date, expandedUnitTime);

                        List<Map<String, Object>> retryRawData = syncEngineAPIService.getDigitalTwinObjectData(modelSettingInfo.getSdtId(), modelSettingInfo.getSdtObjId(), null, retryFromDate, to_date);

                        List<Map<String, Object>> retryParsedData = JSONParser.parseDigitalTwinObjectData(retryRawData, modelSettingInfo.getMetaDataDepth().getDataDepth1(), modelSettingInfo.getMetaDataDepth().getDataDepth2());

                        // 중복 제거 후 데이터 갱신
                        data = JSONParser.isDuplicateDataByKey(retryParsedData, modelSettingInfo.getIndexTrgtCol()) ? JSONParser.removeDuplicateDataByKey(retryParsedData, modelSettingInfo.getIndexTrgtCol()) : retryParsedData;

                        log.info("[재시도 {}회차] 확보 데이터 개수: {}", i, data.size());

                        if (data.size() >= preprocessLimitCount) {
                            isDataReady = true;
                            log.info("데이터 확보 성공.");
                            break;
                        }
                    }

                    // 최종적으로 데이터가 부족할 경우 에러 처리 및 종료
                    if (!isDataReady) {
                        log.error("최대 재시도 후에도 데이터가 부족합니다. (최종 개수: {})", data.size());
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다. (전처리 필요 개수: " + preprocessLimitCount + "개)").dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, false);
                        return;
                    }
                }

                String base_dir = null;
                String file_path = null;
                String file_name = null;
                {
                    // 파일 경로 및 이름 설정
                    String currentYearMonthDir = simpleDateFormat.format(calendar.getTime());
                    base_dir = "/augment/" + currentYearMonthDir + "/" + augment_seq;
                    file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + base_dir;
                    file_name = job.get("user_id").toString() + "_origin_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";

                    // CSV 파일 생성
                    Map<String, Object> param = new HashMap<>();
                    param.put("data", data);
                    param.put("file_path", file_path);
                    param.put("file_name", file_name);
                    param.put("index_trgt_col", modelSettingInfo.getIndexTrgtCol());
                    ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(param);
                    int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
                    if (statusCode != 200) {
                        Exception e = new Exception("The connection to the Python server was lost.");
                        e.printStackTrace();
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, true);
                        return;
                    }
                }

                String user_id = job.get("user_id").toString();
                HashMap<String, Object> preProcessResult = dtSimulationService.twinSimulate(augment.getTwinId(), augment.getTwinObjId(), modelSettingInfo.getModelJsonProperty(), base_dir, file_path, file_name, modelSettingInfo.getIndexTrgtCol(), user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr);
                log.info("TwinSimulate Result -> {}", preProcessResult);
                if (!Boolean.parseBoolean(preProcessResult.get("status").toString())) {
                    if (preProcessResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(preProcessResult.get("isSizeAvailable").toString())) {
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                        handleSimulationProcessError(errorLogBuilder, false);
                    } else if (preProcessResult.get("code") != null && preProcessResult.get("message") != null && preProcessResult.get("detail") != null) {
                        Exception e = new Exception(preProcessResult.get("message").toString());
                        e.printStackTrace();
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(job.get("data_crt_last_hr").toString());
                        handleSimulationProcessError(errorLogBuilder, true);
                    } else {
                        //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                        handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                    }
                    return;
                }
                int augmentFileSeq = (int) preProcessResult.get("augmentFileSeq");

                // 원본 JSON 데이터 파일 생성 및 DB 저장
                LocalDateTime now = LocalDateTime.now();
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                String notification_time = now.format(formatter);
                log.info("");
                List<Map<String, Object>> originCsvData = FileReader.getInstance().readCSVToListObjectMap(file_path + File.separator + file_name);
                String jsonFileName = notification_time.replaceAll("[ :]", "") + "_origin.json";
                JSONArray originJsonArray = JSONParser.convertListMapToJson(originCsvData);
                String originFilePath = file_path + File.separator + jsonFileName;

                try (java.io.FileWriter fileWriter = new java.io.FileWriter(originFilePath)) {
                    fileWriter.write(originJsonArray.toString());
                    Files originFiles = new Files();
                    File originFile = new File(originFilePath);
                    originFiles.setAugmentFileSeq(augmentFileSeq);
                    originFiles.setFileNm(originFile.getName());
                    originFiles.setStrgFileNm(originFile.getName());
                    originFiles.setFilePath(base_dir);
                    originFiles.setFileSz(originFile.length());
                    originFiles.setFileExtn(FileUtil.getFileExtension(originFile.getName()));
                    originFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.ORIGIN.toUpperCase());
                    originFiles.setRefSeq(augment_seq);
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

                handleUpdateDataLastTime(augment_seq, preProcessResult.get("data_crt_last_hr").toString());
            }
            //전처리 프로세스
            else {
                /*String from_date = job.get("data_crt_last_hr").toString();
                String to_date = TimeUtil.getCurrentDateTime();*/
                // IntervalConversion 진행 여부 파악
                boolean isIntervalUse = checkIntervalUses(modelSettingInfo.getModelJsonProperty());

                if (isIntervalUse) {
                    //평균 시간보다 리샘플링 시간이 더 크면 데이터가 줄어듦으로 더 이전 데이터를 가져와야 된다.
                    //평균 시간보다 리샘플링 시간이 더 작으면 데이터가 많아짐으로 필요 없음

                    // 1. 리샘플링 설정 정보 가져오기
                    DTModelJsonPropertySubSet intervalPropertySubSet = jsonPropertyService.getIntervalProperty(modelSettingInfo.getModelJsonProperty());
                    String resampleType = intervalPropertySubSet.getResmpl_tp();
                    String resampleValue = intervalPropertySubSet.getResmpl_intvl_value();

                    // 2. 리샘플링될 시간 간격 계산 (초 단위)
                    long resampleDeltaSeconds = Long.parseLong(resampleValue) * TimeUnit.getTimeType(resampleType);

                    // 3. 최소 개수를 충족하기 위해 필요한 총 시간(초) 계산
                    // (데이터 개수 * 간격)을 통해 리샘플링 후에도 preprocessLimitCount만큼 남도록 함
                    long effectiveDelta = Math.max(resampleDeltaSeconds, delta); // 둘 중 더 긴 간격 선택
                    long totalRequiredSeconds = (long) preprocessLimitCount * effectiveDelta;

                    // 만약 리샘플링으로 데이터가 늘어나는 경우(Upsampling)를 대비해 1.2배 정도 마진을 둠
                    if (resampleDeltaSeconds < delta) {
                        totalRequiredSeconds = (long) (totalRequiredSeconds * 1.2);
                    }

                    // 4. TimeUtil.minusTime에 들어갈 unitTime 계산
                    // unit.getResampleType()의 단위에 맞춰서 totalRequiredSeconds를 변환
                    int targetUnitDivider = TimeUnit.getTimeType(unit.getResampleType().toUpperCase());
                    unitTime = totalRequiredSeconds / targetUnitDivider;
                    log.info("리샘플링 적용 - 간격: {}s, 필요개수: {}, 계산된 unitTime: {}", resampleDeltaSeconds, preprocessLimitCount, unitTime);
                } else {
                    // 리샘플링 미사용 시 기본 delta(평균 간격) 기준으로 계산
                    long totalRequiredSeconds = (long) preprocessLimitCount * delta;
                    int targetUnitDivider = TimeUnit.getTimeType(unit.getResampleType().toUpperCase());
                    unitTime = totalRequiredSeconds / targetUnitDivider;

                    log.info("리샘플링 미사용 - 평균간격: {}s, 계산된 unitTime: {}", delta, unitTime);
                }

                // 5. API 호출 시간 설정
                // data_crt_last_hr(마지막 전처리 시간)로부터 unitTime만큼 앞으로 설정
                String from_date = TimeUtil.plusTime(null, job.get("data_crt_last_hr").toString(), "H", 0);
                String to_date = TimeUtil.plusTime(null, job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), (int) unitTime);
                log.info("조회 범위 설정: {} ~ {}", from_date, to_date);

                // 범위 데이터 조회
                List<Map<String, Object>> digitalTwinObjectData = syncEngineAPIService.getDigitalTwinObjectData(modelSettingInfo.getSdtId(), modelSettingInfo.getSdtObjId(), null, from_date, to_date);
                List<Map<String, Object>> parsedData = JSONParser.parseDigitalTwinObjectData(digitalTwinObjectData, modelSettingInfo.getMetaDataDepth().getDataDepth1(), modelSettingInfo.getMetaDataDepth().getDataDepth2());
                log.info("조회 범위 시간에 들어있는 데이터 개수 -> {}", parsedData.size());

                // 데이터 중복 제거 (시간 중복 제거 Millis 단위까지)
                data = JSONParser.isDuplicateDataByKey(parsedData, modelSettingInfo.getIndexTrgtCol()) == true ? JSONParser.removeDuplicateDataByKey(parsedData, modelSettingInfo.getIndexTrgtCol()) : parsedData;

                // 중복 제거된 데이터가 전처리 개수 제한을 넘지 못하면 더 많은 데이터 가져오기
                if (data.size() < preprocessLimitCount) {
                    log.info("초기 조회 데이터 부족 (확보: {}개, 필요: {}개). 재시도 로직 진입.", data.size(), preprocessLimitCount);
                    boolean isDataReady = false;
                    // 초기 시도가 실패했으므로, 2회차(i=1)와 3회차(i=2)를 수행
                    for (int i = 1; i <= 2; i++) {
                        long expandedUnitTime = unitTime * i;
                        String retryFromDate = TimeUtil.minusTime(null, data_crt_last_hr, unit.getResampleType().toUpperCase(), (int) expandedUnitTime);
                        log.info("[재시도 {}회차] 확장된 범위 조회: {} ~ {} (unitTime: {})", i, retryFromDate, to_date, expandedUnitTime);

                        List<Map<String, Object>> retryRawData = syncEngineAPIService.getDigitalTwinObjectData(modelSettingInfo.getSdtId(), modelSettingInfo.getSdtObjId(), null, retryFromDate, to_date);

                        List<Map<String, Object>> retryParsedData = JSONParser.parseDigitalTwinObjectData(retryRawData, modelSettingInfo.getMetaDataDepth().getDataDepth1(), modelSettingInfo.getMetaDataDepth().getDataDepth2());

                        // 중복 제거 후 데이터 갱신
                        data = JSONParser.isDuplicateDataByKey(retryParsedData, modelSettingInfo.getIndexTrgtCol()) ? JSONParser.removeDuplicateDataByKey(retryParsedData, modelSettingInfo.getIndexTrgtCol()) : retryParsedData;

                        log.info("[재시도 {}회차] 확보 데이터 개수: {}", i, data.size());

                        if (data.size() >= preprocessLimitCount) {
                            isDataReady = true;
                            log.info("데이터 확보 성공.");
                            break;
                        }
                    }

                    // 최종적으로 데이터가 부족할 경우 에러 처리 및 종료
                    if (!isDataReady) {
                        log.error("최대 재시도 후에도 데이터가 부족합니다. (최종 개수: {})", data.size());
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다. (전처리 필요 개수: " + preprocessLimitCount + "개)").dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, false);
                        return;
                    }
                }

                String base_dir = null;
                String file_path = null;
                String file_name = null;

                {
                    // 파일 경로 및 이름 설정
                    String currentYearMonthDir = simpleDateFormat.format(calendar.getTime());
                    base_dir = "/augment/" + currentYearMonthDir + "/" + augment_seq;
                    file_path = systemProperties.getDtMetaFilePath().replace("\\", "/") + base_dir;
                    file_name = job.get("user_id").toString() + "_origin_" + MetaRelateUtil.generateFileNameTime("H") + ".csv";

                    // CSV 파일 생성
                    Map<String, Object> param = new HashMap<>();
                    param.put("data", data);
                    param.put("file_path", file_path);
                    param.put("file_name", file_name);
                    param.put("index_trgt_col", modelSettingInfo.getIndexTrgtCol());
                    ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(param);
                    int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
                    if (statusCode != 200) {
                        Exception e = new Exception("The connection to the Python server was lost.");
                        e.printStackTrace();
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, true);
                        return;
                    }
                }
                String user_id = job.get("user_id").toString();
                HashMap<String, Object> preProcessResult = dtSimulationService.twinPreprocess(augment.getTwinId(), augment.getTwinObjId(),
                        modelSettingInfo.getModelJsonProperty(),
                        base_dir, file_path, file_name,
                        modelSettingInfo.getIndexTrgtCol(), user_id, modelSeq, augment_seq,
                        from_date, to_date, data_crt_last_hr);

                log.info("TwinPreprocess Result -> {}", preProcessResult);

                if (!Boolean.parseBoolean(preProcessResult.get("status").toString())) {
                    if (preProcessResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(preProcessResult.get("isSizeAvailable").toString())) {
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name()).errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                        handleSimulationProcessError(errorLogBuilder, false);
                    } else {
                        //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                        handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                    }
                    return;
                }

                int preprocessFileSeq = (int) preProcessResult.get("preprocessFileSeq");

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
                    Files originFiles = new Files();
                    File originFile = new File(originFilePath);
                    originFiles.setAugmentFileSeq(preprocessFileSeq);
                    originFiles.setFileNm(originFile.getName());
                    originFiles.setStrgFileNm(originFile.getName());
                    originFiles.setFilePath(base_dir);
                    originFiles.setFileSz(originFile.length());
                    originFiles.setFileExtn(FileUtil.getFileExtension(originFile.getName()));
                    originFiles.setRefTp(GlobalConstant.FILE_REF_TYPE.ORIGIN.toUpperCase());
                    originFiles.setRefSeq(augment_seq);
                    Path saveLastFile = Paths.get(originFilePath);
                    originFiles.setFileContsTp(java.nio.file.Files.probeContentType(saveLastFile));
                    handleCreateMetaAugmentVisualFile(originFiles);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                // 전처리된 JSON 데이터 파일 저장
                Files dataFiles = (Files) preProcessResult.get("dataFiles");
                handleCreateMetaAugmentVisualFile(dataFiles);

                // Validation된 JSON 데이터 파일 저장
                Files validationFiles = (Files) preProcessResult.get("validationFiles");
                handleCreateMetaAugmentVisualFile(validationFiles);

                // Outlier된 JSON 데이터 파일 저장
                Files outlierFiles = (Files) preProcessResult.get("outlierFiles");
                handleCreateMetaAugmentVisualFile(outlierFiles);

                ArrayList<Files> fileses = fileService.getAugmentVisualFilesByAugmentFileSeq(preprocessFileSeq);

                handleUpdateDataLastTime(augment_seq, preProcessResult.get("data_crt_last_hr").toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name()).errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
            handleSimulationProcessError(errorLogBuilder, true);
        } finally {
            log.info("Finally Executed");
            // 종료 조건 확인
            handleCheckContinueProcess(job, data_crt_last_hr, augment_seq);
        }
    }

    /*int fileSeq = filesService.saveAugmentFiles(sourceDirectory, base_dir, fileName, augment_seq);*/
    private void handleCreateMetaAugmentVisualFile(Files files) throws IOException {
        log.info("증강 시각화 파일 생성: augmentSeq={}, refType={}, baseDir={}, fileName={}", files.getRefSeq(), files.getRefTp(), files.getFilePath(), files.getFileNm());
        // 실제 파일 생성 로직을 여기에 추가
        int filesSeq = fileService.saveAugmentVisualFiles(files);
        log.info("증강 시각화 파일 생성 완료: fileSeq={}", filesSeq);
    }

    //마지막 시간 업데이트 메소드
    private void handleUpdateDataLastTime(int augmentSeq, String dataLastTime) {
        Map<String, Object> updateParams = new HashMap<String, Object>();
        updateParams.put("augment_seq", augmentSeq);
        updateParams.put("data_crt_last_hr", dataLastTime);
        makeMetaSimulationSchedulerService.updateAugmentMain(updateParams);
    }

    // 종료 조건 확인 메소드
    private void handleCheckContinueProcess(Map<String, Object> job, String data_crt_last_hr, int augment_seq) {
        String cycle_end_tp = job.get("cycle_end_tp").toString();
        if (!"C".equals(cycle_end_tp) && data_crt_last_hr != null && !job.get("cycle_end_dsgn_ymd").toString().isEmpty()) {
            String cycle_end_dsgn_ynd_str = job.get("cycle_end_dsgn_ymd").toString();
            boolean isBefore = TimeUtil.compareAfterDate(data_crt_last_hr, cycle_end_dsgn_ynd_str);
            if (!isBefore) {
                makeMetaSimulationSchedulerService.finishAugmentStatus(augment_seq, "C");
            }
        }
    }

    // 에러 처리 메소드
    private void handleSimulationProcessError(DTAugmentLog.DTAugmentLogBuilder builder, boolean isStop) {
        DTAugmentLog logEntry = builder.build();
        makeMetaSimulationSchedulerService.saveAugmentLog(logEntry);
        if (isStop) {
            makeMetaSimulationSchedulerService.updateAugmentStatusStop(logEntry.getAugmentSeq(), "S", logEntry.getDataCrtLastHr());
        }
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
}
