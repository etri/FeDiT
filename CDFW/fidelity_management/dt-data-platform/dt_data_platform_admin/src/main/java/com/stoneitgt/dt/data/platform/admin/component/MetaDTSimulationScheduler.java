package com.stoneitgt.dt.data.platform.admin.component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.admin.controller.BaseController;
import com.stoneitgt.dt.data.platform.admin.service.*;
import com.stoneitgt.dt.data.platform.domain.DTAugmentLog;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonProperty;
import com.stoneitgt.dt.data.platform.domain.DTModelJsonPropertySubSet;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.MetaRelateUtil;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import com.stoneitgt.dt.data.platform.util.file.FileReader;
import com.stoneitgt.dt.data.platform.util.file.FileWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.io.File;
import java.text.SimpleDateFormat;
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
    private DTModelService dTModelService;

    @Autowired
    private JSONPropertyService jsonPropertyService;

    public void executeAugment(HashMap<String, Object> job) {
        log.info("job -> {}", job);
        DTAugmentLog.DTAugmentLogBuilder errorLogBuilder = DTAugmentLog.builder();
        //데이터 마지막 시간
        String data_crt_last_hr = job.get("data_crt_last_hr").toString();
        int augment_seq = Integer.parseInt(job.get("augment_seq").toString());
        int modelSeq = Integer.parseInt(job.get("model_seq").toString());
        errorLogBuilder.augmentSeq(augment_seq).modelSeq(modelSeq);
        List<Map<String, Object>> data = new ArrayList<>();
        try {
            /**
             * 공통 변수 구역
             * */
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
                errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                        .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                handleSimulationProcessError(errorLogBuilder, true);
                return;
            }

            // 날짜 범위 설정
            SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy/MM");
            Calendar calendar = Calendar.getInstance();

            //시간 간격 고려
            //시간 구분 로직
            // 데이터를 검색해서 가져오는 부분 KETI API
            Map<String, Object> deferenceParams = new HashMap<>();
            deferenceParams.put("digital_twins", twin_id);
            deferenceParams.put("digital_objects", obj_id);
            deferenceParams.put("limit", 100); //데이터 100개로 구분
            Map<String, Object> metaDepth = dTModelService.getMetaDataJsonDepth(deferenceParams);
            List<Map<String, Object>> tempData = dtModelApiService.getResourceObjectDataAndParse(deferenceParams, metaDepth);
            HashMap<String, Object> unitParam = dtSimulationService.getTimeUnit(dateKey, tempData);
            TimeUnit unit = (TimeUnit) unitParam.get("unit");
            int delta = ((Double) unitParam.get("delta")).intValue();

            boolean duplicateDataCheck = false;
            int limit = systemProperties.getLimitCsvRowCount();
            //전처리에서 사용될 데이터 제한
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
                Map<String, Object> params = new HashMap<>();
                params.put("digital_twins", twin_id);
                params.put("digital_objects", obj_id);
                params.put("target_start_date", from_date);
                params.put("target_end_date", to_date);
                try {
                    data = dtModelApiService.getResourceObjectDataAndParse(params, metaDepth);
                    duplicateDataCheck = JSONParser.isDuplicateDataByKey(data, dateKey);
                    if (duplicateDataCheck) {
                        data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                    }

                    //이전 WindowSize 만큼 흩었는데 데이터가 없는 경우
                    int prevWindowSizeCount = 0;
                    while (data.isEmpty()) {
                        if (prevWindowSizeCount > 1) {
                            /**
                             * 초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음
                             * (임시) data_crt_last_hr를 한 windowSize 만큼 앞으로 이동
                             * */
                            log.info("초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음");
                            String nextWindowSizeDataCrtHr = TimeUtil.plusTime(null, data_crt_last_hr, "S", (windowSize * delta));
                            log.info("nextWindowSizeDataCrtHr -> {}", nextWindowSizeDataCrtHr);
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                    .errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                            handleSimulationProcessError(errorLogBuilder, false);
                            return;
                        }
                        from_date = TimeUtil.minusTime(null, job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime * (++prevWindowSizeCount + 1));
                        params.put("target_start_date", from_date);
                        data = dtModelApiService.getResourceObjectDataAndParse(params, metaDepth);
                        duplicateDataCheck = JSONParser.isDuplicateDataByKey(data, dateKey);
                        if (duplicateDataCheck) {
                            data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                        }
                    }
                    stepCount += prevWindowSizeCount;

                    log.info("stepCount -> {}, prevWindowSizeCount -> {}", stepCount, prevWindowSizeCount);

                    /**
                     * Data Row 확인
                     * 역방향 로직 필요
                     * */
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
                        /**
                         * 데이터 한번 더 뽑기
                         * */
                        lastEmptyDataDatetime = isEmptyTimes.get(isEmptyTimes.size() - 1);
                        String empty_from_date = TimeUtil.minusTime(null, lastEmptyDataDatetime, unit.getResampleType().toUpperCase(), unitTime);
                        String empty_to_date = TimeUtil.plusTime(null, job.get("data_crt_last_hr").toString(), "H", 0);
                        log.info("empty_from_date -> {}, empty_to_date -> {}", empty_from_date, empty_to_date);
                        Map<String, Object> emptyParams = new HashMap<>();
                        emptyParams.put("digital_twins", twin_id);
                        emptyParams.put("digital_objects", obj_id);
                        emptyParams.put("target_start_date", empty_from_date);
                        emptyParams.put("target_end_date", empty_to_date);
                        data = dtModelApiService.getResourceObjectDataAndParse(params, metaDepth);

                        duplicateDataCheck = JSONParser.isDuplicateDataByKey(data, dateKey);
                        if (duplicateDataCheck) {
                            data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                        }
                        log.info("Simulation Empty Data Check -> {}, {}", data.size());
                    }

                    /**
                     * Data를 Interval Conversion 까지 계산해서 WindowSize만큼 나오지 않았을 때, 처리 로직
                     * 데이터 첫값과 끝값의 차이로 IntervalConversion 고려
                     * */
                    List<String> notEnoughCheckTimes = dtSimulationService.extractTimeData(data);
                    long def = TimeUtil.getDuration(notEnoughCheckTimes.get(0), notEnoughCheckTimes.get(notEnoughCheckTimes.size() - 1), null);
                    int notEnoughCheckCount = (int) def / (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType));
                    log.info("notEnoughCheckCount -> {}", notEnoughCheckCount);
                    if (notEnoughCheckCount < windowSize) {
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                .errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, false);
                        return;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                            .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
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
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                            .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                    handleSimulationProcessError(errorLogBuilder, true);
                    return;
                }
                JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
                int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                log.info("dataCount -> {}", dataCount);
                List<String> originTimeData = new ArrayList<>();
                /**
                 * 이상치 판단을 위해 데이터를 넣을 때 데이터의 개수 (현재는 200개)
                 * */
                if (dataCount >= data_max_limit_cnt) {
                    //데이터가 부족하지 않을 시 작업 진행
                    //생성된 파일의 시계열 컬럼 데이터 중복 체크
                    String created_data_file_path = rootNode.path("data").get("file_path").asText();
                    String created_data_file_name = rootNode.path("data").get("file_name").asText();
                    List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
                    duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, dateKey);
                    if (duplicateDataCheck) {
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
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                    .errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, false);
                        } else if (preProcessResult.get("code") != null && preProcessResult.get("message") != null && preProcessResult.get("detail") != null) {
                            Exception e = new Exception(preProcessResult.get("message").toString());
                            e.printStackTrace();
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                                    .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, true);
                        } else {
                            //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                            handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                        }
                        return;
                    }
                    handleUpdateDataLastTime(augment_seq, preProcessResult.get("data_crt_last_hr").toString());
                } else {
                    //이상치 판단을 위한 데이터 부족시 더 가져와야한다.
                    //데이터 제한을 두지 않음
                    if (dataCount == 0) {
                        /**
                         * 초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음
                         * (임시) data_crt_last_hr를 한 windowSize 만큼 앞으로 이동
                         * */
                        log.info("초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음");
                        String nextWindowSizeDataCrtHr = TimeUtil.plusTime(null, data_crt_last_hr, "S", (windowSize * delta));
                        log.info("nextWindowSizeDataCrtHr -> {}", nextWindowSizeDataCrtHr);
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                .errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, false);
                        return;
                    }
                    int count = 1;
                    //기존 데이터의 시계열 컬럼만 데이터 저장
                    originTimeData = dtSimulationService.extractTimeData(rootNode.path("data").path("data"));
                    while (true) {
                        //2번 더 가져와도 안되면 메세지 출력 후 프로세스 종료
                        if (count > 10) {
                            /**
                             * 초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음
                             * (임시) data_crt_last_hr를 한 windowSize 만큼 앞으로 이동
                             * */
                            log.info("초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음");
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                    .errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                            handleSimulationProcessError(errorLogBuilder, false);
                            return;
                        }
                        String more_from_date = TimeUtil.minusTime(null, job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime * (windowSize * count));
                        String more_to_date = TimeUtil.plusTime(null, job.get("data_crt_last_hr").toString(), "H", 0);
                        Map<String, Object> moreDataParams = new HashMap<>();
                        moreDataParams.put("digital_twins", twin_id);
                        moreDataParams.put("digital_objects", obj_id);
                        moreDataParams.put("target_start_date", more_from_date);
                        moreDataParams.put("target_end_date", more_to_date);
                        try {
                            data = dtModelApiService.getResourceObjectDataAndParse(moreDataParams, metaDepth);
                            duplicateDataCheck = JSONParser.isDuplicateDataByKey(data, dateKey);
                            if (duplicateDataCheck) {
                                data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                            }
                            log.info("추가 데이터 확보(기존 데이터 포함) {}번째 -> {}개", count, data.size());
                        } catch (Exception e) {
                            e.printStackTrace();
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                                    .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
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
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                                .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
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
                    duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
                    if (duplicateDataCheck) {
                        List<Map<String, Object>> removedDuplicatedData = JSONParser.removeDuplicateDataByKey(readTempData, findColumnKey);
                        FileWriter.getInstance().writeCSV(created_data_file_path + File.separator + created_data_file_name, removedDuplicatedData);
                    }

                    //마지막 데이터 시간 조정
                    data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                    String user_id = job.get("user_id").toString();

                    //log.info("originTimeData -> {}", originTimeData);
                    HashMap<String, Object> processResult = dtSimulationService.makePreProcessContinuousInterpolationAugment(twin_id, obj_id, dtModelJsonProperty, base_dir, file_path, file_name, dateKey, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData, stepCount);
                    log.info("preProcessResult -> {}", processResult);
                    if (!Boolean.parseBoolean(processResult.get("status").toString())) {
                        if (processResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(processResult.get("isSizeAvailable").toString())) {
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                    .errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, false);
                        } else if (processResult.get("code") != null && processResult.get("message") != null && processResult.get("detail") != null) {
                            Exception e = new Exception(processResult.get("message").toString());
                            e.printStackTrace();
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                                    .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, true);
                        } else {
                            //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                            handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                        }
                        return;
                    }
                    handleUpdateDataLastTime(augment_seq, processResult.get("data_crt_last_hr").toString());
                }
            } else {
                //전처리 프로세스

                //전처리 프로세스
                //데이터 가져오는 API 시간 설정
                //데이터 마지막 시간부터 현재 시간까지를 데이터 가져오는 시간으로 지정
                String from_date = job.get("data_crt_last_hr").toString();
                String to_date = TimeUtil.getCurrentDateTime();
                log.info("Time -> from_date {}, to_date {}", from_date, to_date);
                // 데이터를 검색해서 가져오는 부분 KETI API
                Map<String, Object> params = new HashMap<>();
                params.put("digital_twins", twin_id);
                params.put("digital_objects", obj_id);
                params.put("target_end_date", from_date);
                params.put("to_date", to_date);
                //전처리 이므로 한번에 많이 가져오면 터질 수 있으므로 데이터 제한
                params.put("limit", limit);
                try {
                    data = dtModelApiService.getResourceObjectDataAndParse(params, metaDepth);
                    duplicateDataCheck = JSONParser.isDuplicateDataByKey(data, dateKey);
                    if (duplicateDataCheck) {
                        data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                            .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
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
                    errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                            .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
                    handleSimulationProcessError(errorLogBuilder, true);
                    return;
                }
                JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
                int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                log.info("dataCount -> {}", dataCount);
                List<String> originTimeData = new ArrayList<>();
                /**
                 * 이상치 판단을 위해 데이터를 넣을 때 데이터의 개수 (현재는 {data_max_limit_cnt}개)
                 * */
                if (dataCount >= data_max_limit_cnt) {
                    //데이터가 부족하지 않을 시 작업 진행
                    //생성된 파일의 시계열 컬럼 데이터 중복 체크
                    String created_data_file_path = rootNode.path("data").get("file_path").asText();
                    String created_data_file_name = rootNode.path("data").get("file_name").asText();

                    /**
                     * 시간 중복값 제거
                     * */
                    List<Map<String, Object>> readTempData = FileReader.getInstance().readCSVToListObjectMap(created_data_file_path + File.separator + created_data_file_name);
                    String findColumnKey = rootNode.path("data").get("index_trgt_col").asText();
                    duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
                    if (duplicateDataCheck) {
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
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                    .errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, false);
                        } else {
                            //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                            handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                        }
                        return;
                    }
                    handleUpdateDataLastTime(augment_seq, processResult.get("data_crt_last_hr").toString());
                } else {
                    //이상치 판단을 위한 데이터 부족시 더 가져와야한다.
                    //데이터 제한을 두지 않음
                    if (dataCount == 0) {
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                .errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
                        handleSimulationProcessError(errorLogBuilder, false);
                        return;
                    }
                    int count = 1;
                    //기존 데이터의 시계열 컬럼만 데이터 저장
                    originTimeData = dtSimulationService.extractTimeData(rootNode.path("data").path("data"));
                    while (true) {
                        //2번 더 가져와도 안되면 메세지 출력 후 프로세스 종료
                        if (count > 10) {
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                    .errCn("데이터가 부족합니다.").dataCrtLastHr(data_crt_last_hr);
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
                        Map<String, Object> moreDataParams = new HashMap<>();
                        moreDataParams.put("digital_twins", twin_id);
                        moreDataParams.put("digital_objects", obj_id);
                        moreDataParams.put("target_start_date", more_from_date);
                        moreDataParams.put("target_end_date", more_to_date);
                        moreDataParams.put("limit", limit);
                        try {
                            data = dtModelApiService.getResourceObjectDataAndParse(moreDataParams, metaDepth);
                            duplicateDataCheck = JSONParser.isDuplicateDataByKey(data, dateKey);
                            if (duplicateDataCheck) {
                                data = JSONParser.removeDuplicateDataByKey(data, dateKey);
                            }
                            log.info("추가 데이터 확보(기존 데이터 포함) {}번째 -> {}개", count, data.size());
                        } catch (Exception e) {
                            e.printStackTrace();
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                                    .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
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
                        errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                                .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
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
                    duplicateDataCheck = JSONParser.isDuplicateDataByKey(readTempData, findColumnKey);
                    if (duplicateDataCheck) {
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
                            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.PRECONDITION_REQUIRED.value())).errNm(HttpStatus.PRECONDITION_REQUIRED.name())
                                    .errCn("데이터가 부족합니다.").dataCrtLastHr(job.get("data_crt_last_hr").toString());
                            handleSimulationProcessError(errorLogBuilder, false);
                        } else {
                            //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                            handleUpdateDataLastTime(augment_seq, job.get("data_crt_last_hr").toString());
                        }
                        return;
                    }
                    handleUpdateDataLastTime(augment_seq, processResult.get("data_crt_last_hr").toString());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            errorLogBuilder.augmentStatus("E").errTp("P").errCd(String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value())).errNm(HttpStatus.INTERNAL_SERVER_ERROR.name())
                    .errCn(e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString()).dataCrtLastHr(data_crt_last_hr);
            handleSimulationProcessError(errorLogBuilder, true);
        } finally {
            log.info("Finally Executed");
            // 종료 조건 확인
            handleCheckContinueProcess(job, data_crt_last_hr, augment_seq);
        }
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
