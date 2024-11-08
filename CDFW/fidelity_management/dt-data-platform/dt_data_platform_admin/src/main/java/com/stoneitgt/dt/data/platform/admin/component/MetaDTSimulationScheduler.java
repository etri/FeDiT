package com.stoneitgt.dt.data.platform.admin.component;

import java.io.File;
import java.text.SimpleDateFormat;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.*;
import org.apache.commons.collections4.map.HashedMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.admin.controller.BaseController;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.service.DTModelApiService;
import com.stoneitgt.dt.data.platform.admin.service.DTModelService;
import com.stoneitgt.dt.data.platform.admin.service.DTSimulationService;
import com.stoneitgt.dt.data.platform.admin.service.MakeMetaSimulationSchedulerService;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;

import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 관리 클래스
 *
 * @author yh.kim
 */
@Slf4j
@Component
@Profile("local")
public class MetaDTSimulationScheduler extends BaseController {

    //"0 0 * * * *" = the top of every hour of every day.
    //"*/10 * * * * *" = 매 10초마다 실행한다.
    //"* 0/10 * * * *" = 매 10분마다 실행한다.
    //@Scheduled(cron = "0 0 0/1 * * *") 매 1시간마다 실행한다.

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
    private MakeMetaSimulationSchedulerService makeMetaSimulationSchedulerService;

    @Autowired
    private DTSimulationService dtSimulationService;

    @Autowired
    private DTModelApiService dtModelApiService;

    @Autowired
    private DTModelService dTModelService;

    //이전 시간을 가져와서 window 사이즈 만큼 추출
    //이상치 판단을 위한 데이터를 가져오는 것은 그대로
    //리샘플링(Interval Conversion)에서 변환되는 시간을 고려해서 더 or 적게 가져온다.
    @Scheduled(initialDelay = 1000 * 10, fixedDelay = 1000 * 10)
    public void metaSimulationFitWindowSize() throws Exception {
        log.info("MetaDTSimulationScheduler Executed");
        //AUGMENT_TP: 증강유형(실시간R/단일O)
        //DATA_TP: 자료유형(csv/excel)
        //DATA_PRCS_CNT: 자료 처리 수 (이전 데이터 수)
        //AUGMENT_STATUS: 증강상태(대기/진행/완료/일시중지/오류)
        //SIM_TP: 시뮬레이션 유형(전처리/증강)
        //CYCLE_TP: 주기 유형(시간/일)
        //CYCLE_END_DSGN_YMD: 주기 종료 지정 일자
        //CYCLE_END_TP: C:지속, D:종료일, S: 일시중지
        //AUGMENT_TP: 증강유형(실시간/단일)이   R 실시간 일때
        //CYCLE_TP: 주기 유형이 시간이나 일이고
        //선택한 model_seq로 json 프로퍼티 까지 조인한 쿼리

        Map<String, Object> selectJobListParams = new HashedMap<String, Object>();
        selectJobListParams.put("augment_tp", "R");
        selectJobListParams.put("augment_status", "T");
        selectJobListParams.put("cycle_tp", "H");
        selectJobListParams.put("limitCnt", systemProperties.getLimitMakeModelCnt());

        List<Map<String, Object>> selectJobList = makeMetaSimulationSchedulerService.getJobList(selectJobListParams);

        jobLoop:
        for (Map<String, Object> job : selectJobList) {
            //데이터 마지막 시간
            String data_crt_last_hr = job.get("data_crt_last_hr").toString();
            log.info("증강 번호 : {}", job.get("augment_seq").toString());
            log.info("모델 번호 : {}", job.get("model_seq").toString());
            log.info("증강 제목 : {}", job.get("title").toString());

            log.info("시작시 data_crt_last_hr -> {}", data_crt_last_hr);
            int augment_seq = Integer.parseInt(job.get("augment_seq").toString());
            int modelSeq = Integer.parseInt(job.get("model_seq").toString());
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
                ObjectMapper mapper = new ObjectMapper();
                JsonNode procjsonNode = mapper.readTree(proc_json);

                boolean isDecisionTreeModel = false;
                JsonNode jsonNode = procjsonNode.get("preproc_property_info").get(0).get("preproc_property").get(2).get("preproc_set");
                String feature = null;
                for (int i = 0; i < jsonNode.size(); i++) {
                    JsonNode preprocSet = jsonNode.get(i);
                    String type = preprocSet.get("interpl_tp").asText();
                    if (Objects.equals(type, "decisiontree")) {
                        isDecisionTreeModel = true;
                        feature = preprocSet.get("interpl_feature").asText();
                    }
                }

                if (isDecisionTreeModel && Objects.equals(feature, "LABEL")) {
                    log.info("DECISION TREE 테스트 증강이라서 로직 미수행 -> {}", feature);
                    continue jobLoop;
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
                deferenceParams.put("data_max_limit_cnt", 100); //데이터 100개로 구분
                List<Map<String, Object>> tempData = getFindMetaDataParsing(deferenceParams);
                String dateKey = targetModel.get("index_trgt_col").toString();
                HashMap<String, Object> unitParam = dtSimulationService.getTimeUnit(dateKey, tempData);
                TimeUnit unit = (TimeUnit) unitParam.get("unit");
                int delta = ((Double) unitParam.get("delta")).intValue();

                if (Objects.equals("A", simTp)) {
                    //증강 프로세스
                    //가장 과거의 데이터 중 빈값 이전의 데이터의 시간
                    String lastEmptyDataDatetime = null;
                    //데이터 시점에서 현재 시점까지 개수 파악 몇개가 비었는지 계산
                    //시간값 나중에 unit에서 나온 type으로 계산 (H,S,...)
                    int unitTime = 1;

                    //현재 시간과 Data 시간의 초 차이
                    LocalDateTime now = LocalDateTime.now();
                    LocalDateTime past = LocalDateTime.parse(data_crt_last_hr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                    long secondsDifference = Duration.between(past, now).getSeconds();
                    log.info("현재 시간과 Data 시간의 초 차이 -> {}초", secondsDifference);

                    log.info("평균 시간 unit -> {}, 평균 시간 delta -> {}", unit, delta);
                    int windowSize = Integer.parseInt(procjsonNode.get("preproc_property_info").get(0).get("model_property").get(0).get("hyperparam").get("window_size").asText().replaceAll("\"", ""));

                    //보조 개수 (범위 안정성, 데이터가 안나올 수 도 있음, 현재 시간보다 하나 더 예측 해야함, windowSize/3으로 변경, 보정치를 크게 잡을 필요가 있음)
                    int supportSize = windowSize / 3;

                    //채워야 하는 데이터의 개수
                    int originCount = (int) (secondsDifference / delta);
                    log.info("originCount -> {}", originCount);

                    unitTime = ((windowSize + supportSize) * delta) / TimeUnit.getTimeType(unit.getResampleType());
                    log.info("originUnitTime -> {}", unitTime);

                    //Interval Conversion Option을 설정여부 검사 후 있으면 고려해서 시간 계산
                    JsonNode intervalNode = procjsonNode.get("preproc_property_info").get(0).get("preproc_property").get(3);
                    boolean isIntervalUse = intervalNode.get("preproc_set").size() > 0;
                    log.info("isIntervalUse -> {}", isIntervalUse);
                    String resampleType = null;
                    String resampleValue = null;
                    int intervalCount = 1;
                    int differenceCount = 1;
                    int stepCount = 1;
                    if (isIntervalUse) {
                        //평균 시간보다 리샘플링 시간이 더 크면 데이터가 줄어듦으로 더 이전 데이터의 시간을 계산 해야한다.
                        //평균 시간보다 리샘플링 시간이 더 작으면 데이터가 많아짐으로 필요 X
                        resampleType = String.valueOf(intervalNode.get("preproc_set").get(0).get("resmpl_tp").asText());
                        resampleValue = String.valueOf(intervalNode.get("preproc_set").get(0).get("resmpl_intvl_value").asText());
                        log.info("resampleType -> {}, resampleValue -> {}", resampleType, resampleValue);
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
                    String from_date = negativeTimeCalculate(job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime);
                    String to_date = timeCalculate(job.get("data_crt_last_hr").toString(), "H", 0);
                    log.info("Time -> from_date {}, to_date {}", from_date, to_date);
                    // 데이터를 검색해서 가져오는 부분 KETI API
                    Map<String, Object> params = new HashMap<>();
                    params.put("digital_twins", twin_id);
                    params.put("digital_objects", obj_id);
                    params.put("from_date", from_date);
                    params.put("to_date", to_date);
                    try {
                        data = getFindMetaDataParsing(params);
                        data = JSONParser.isDuplicateDataByKey(data, targetModel.get("index_trgt_col").toString());

                        //이전 WindowSize 만큼 흩었는데 데이터가 없는 경우
                        int prevWindowSizeCount = 0;
                        while (data.isEmpty()) {
                            if (prevWindowSizeCount > 1) {
                                /**
                                 * 초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음
                                 * (임시) data_crt_last_hr를 한 windowSize 만큼 앞으로 이동
                                 * */
                                log.info("초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음");
                                String nextWindowSizeDataCrtHr = timeCalculate(data_crt_last_hr, "S", (windowSize * delta));
                                log.info("nextWindowSizeDataCrtHr -> {}", nextWindowSizeDataCrtHr);
                                handleProcessingNotEnoughData(augment_seq, modelSeq, data_crt_last_hr, false);
                                continue jobLoop;
                            }
                            from_date = negativeTimeCalculate(job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime * (++prevWindowSizeCount + 1));
                            params.put("from_date", from_date);
                            data = getFindMetaDataParsing(params);
                            data = JSONParser.isDuplicateDataByKey(data, targetModel.get("index_trgt_col").toString());
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
                            LocalDateTime compareDateTime = LocalDateTime.parse(compareTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                            LocalDateTime currentDateTime = LocalDateTime.parse(currentTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                            long def = Duration.between(currentDateTime, compareDateTime).getSeconds();
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
                            String empty_from_date = negativeTimeCalculate(lastEmptyDataDatetime, unit.getResampleType().toUpperCase(), unitTime);
                            String empty_to_date = timeCalculate(job.get("data_crt_last_hr").toString(), "H", 0);
                            log.info("empty_from_date -> {}, empty_to_date -> {}", empty_from_date, empty_to_date);
                            Map<String, Object> emptyParams = new HashMap<>();
                            emptyParams.put("digital_twins", twin_id);
                            emptyParams.put("digital_objects", obj_id);
                            emptyParams.put("from_date", empty_from_date);
                            emptyParams.put("to_date", empty_to_date);
                            data = getFindMetaDataParsing(params);
                            data = JSONParser.isDuplicateDataByKey(data, targetModel.get("index_trgt_col").toString());
                            log.info("Simulation Empty Data Check -> {}, {}", data.size());
                        }

                        /**
                         * Data를 Interval Conversion 까지 계산해서 WindowSize만큼 나오지 않았을 때, 처리 로직
                         * 데이터 첫값과 끝값의 차이로 IntervalConversion 고려
                         * */
                        List<String> notEnoughCheckTimes = dtSimulationService.extractTimeData(data);
                        LocalDateTime firstDateTime = LocalDateTime.parse(notEnoughCheckTimes.get(0), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                        LocalDateTime lastDateTime = LocalDateTime.parse(notEnoughCheckTimes.get(notEnoughCheckTimes.size() - 1), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                        long def = Math.abs(Duration.between(firstDateTime, lastDateTime).getSeconds());
                        int notEnoughCheckCount = (int) def / (Integer.parseInt(resampleValue) * TimeUnit.getTimeType(resampleType));
                        log.info("notEnoughCheckCount -> {}", notEnoughCheckCount);
                        if (notEnoughCheckCount < windowSize) {
                            handleProcessingNotEnoughData(augment_seq, modelSeq, data_crt_last_hr, false);
                            continue jobLoop;
                        }
                    } catch (Exception exception) {
                        exception.printStackTrace();
                        handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, exception);
                        continue;
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
                    param.put("index_trgt_col", targetModel.get("index_trgt_col").toString());

                    ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(param);

                    // 결과 처리
                    int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
                    if (statusCode != 200) {
                        Exception e = new Exception("The connection to the Python server was lost.");
                        handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, e);
                        continue;
                    }
                    ObjectMapper objectMapper = new ObjectMapper();
                    JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
                    int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                    log.info("dataCount -> {}", dataCount);
                    List<String> originTimeData = new ArrayList<>();
                    /**
                     * 이상치 판단을 위해 데이터를 넣을 때 데이터의 개수 (현재는 200개)
                     * */
                    if (dataCount >= 200) {
                        //데이터가 부족하지 않을 시 작업 진행
                        //생성된 파일의 시계열 컬럼 데이터 중복 체크
                        String created_data_file_path = rootNode.path("data").get("file_path").asText();
                        String created_data_file_name = rootNode.path("data").get("file_name").asText();
                        JSONParser.isDuplicateDataByKey(created_data_file_path + File.separator + created_data_file_name, rootNode.path("data").get("index_trgt_col").asText());
                        //마지막 데이터 시간 조정
                        data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                        String indexTargetCol = targetModel.get("index_trgt_col").toString();
                        String user_id = job.get("user_id").toString();
                        HashMap<String, Object> preProcessResult = dtSimulationService.makePreProcessContinuousInterpolationAugment(twin_id, obj_id, proc_json, base_dir, file_path, file_name, indexTargetCol, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData, stepCount);
                        log.info("preProcessResult -> {}", preProcessResult);
                        if (!Boolean.parseBoolean(preProcessResult.get("status").toString())) {
                            if (preProcessResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(preProcessResult.get("isSizeAvailable").toString())) {
                                handleProcessingNotEnoughData(augment_seq, modelSeq, job.get("data_crt_last_hr").toString(), false);
                            } else if (preProcessResult.get("code") != null && preProcessResult.get("message") != null && preProcessResult.get("detail") != null) {
                                Exception e = new Exception(preProcessResult.get("message").toString());
                                handleProcessingError(augment_seq, modelSeq, job.get("data_crt_last_hr").toString(), e);
                            } else {
                                //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                                Map<String, Object> logParams = new HashMap<String, Object>();
                                logParams.put("augment_seq", augment_seq);
                                logParams.put("data_crt_last_hr", job.get("data_crt_last_hr").toString());
                                makeMetaSimulationSchedulerService.updateAugmentMain(logParams);
                            }
                            continue;
                        }
                        Map<String, Object> updateParams = new HashMap<String, Object>();
                        updateParams.put("augment_seq", augment_seq);
                        updateParams.put("data_crt_last_hr", preProcessResult.get("data_crt_last_hr").toString());
                        makeMetaSimulationSchedulerService.updateAugmentMain(updateParams);
                    } else {
                        //이상치 판단을 위한 데이터 부족시 더 가져와야한다.
                        //데이터 제한을 두지 않음
                        if (dataCount == 0) {
                            /**
                             * 초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음
                             * (임시) data_crt_last_hr를 한 windowSize 만큼 앞으로 이동
                             * */
                            log.info("초기 데이터 부족, windowSize * 3 스캔 했는데 데이터 없음");
                            String nextWindowSizeDataCrtHr = timeCalculate(data_crt_last_hr, "S", (windowSize * delta));
                            log.info("nextWindowSizeDataCrtHr -> {}", nextWindowSizeDataCrtHr);
                            handleProcessingNotEnoughData(augment_seq, modelSeq, data_crt_last_hr, false);
                            continue jobLoop;
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
                                handleProcessingNotEnoughData(augment_seq, modelSeq, data_crt_last_hr, false);
                                continue jobLoop;
                            }
                            String more_from_date = negativeTimeCalculate(job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime * (windowSize * count));
                            String more_to_date = timeCalculate(job.get("data_crt_last_hr").toString(), "H", 0);
                            Map<String, Object> moreDataParams = new HashMap<>();
                            moreDataParams.put("digital_twins", twin_id);
                            moreDataParams.put("digital_objects", obj_id);
                            moreDataParams.put("from_date", more_from_date);
                            moreDataParams.put("to_date", more_to_date);
                            try {
                                data = getFindMetaDataParsing(moreDataParams);
                                data = JSONParser.isDuplicateDataByKey(data, targetModel.get("index_trgt_col").toString());
                                log.info("추가 데이터 확보(기존 데이터 포함) {}번째 -> {}개", count, data.size());
                            } catch (Exception exception) {
                                exception.printStackTrace();
                                handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, exception);
                                continue jobLoop;
                            }
                            //데이터의 개수가 채워지면 더 가져오는 로직 break;
                            if (data.size() >= 200) {
                                break;
                            }
                            count++;
                        }

                        // CSV 파일 생성
                        Map<String, Object> moreBasicFileParam = new HashMap<>();
                        moreBasicFileParam.put("data", data);
                        moreBasicFileParam.put("file_path", file_path);
                        moreBasicFileParam.put("file_name", file_name);
                        moreBasicFileParam.put("index_trgt_col", targetModel.get("index_trgt_col").toString());

                        ResponseEntity<?> moreResultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(moreBasicFileParam);

                        // 결과 처리
                        int moreStatusCode = moreResultSimulationOriginFileSet.getStatusCodeValue();
                        if (moreStatusCode != 200) {
                            Exception e = new Exception("The connection to the Python server was lost.");
                            handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, e);
                            continue;
                        }
                        objectMapper = new ObjectMapper();
                        rootNode = objectMapper.readTree(moreResultSimulationOriginFileSet.getBody().toString());
                        dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                        log.info("More Total dataCount -> {}", dataCount);

                        //데이터가 부족하지 않을 시 작업 진행
                        //생성된 파일의 시계열 컬럼 데이터 중복 체크
                        String created_data_file_path = rootNode.path("data").get("file_path").asText();
                        String created_data_file_name = rootNode.path("data").get("file_name").asText();
                        JSONParser.isDuplicateDataByKey(created_data_file_path + File.separator + created_data_file_name, rootNode.path("data").get("index_trgt_col").asText());
                        //마지막 데이터 시간 조정
                        data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                        String indexTargetCol = targetModel.get("index_trgt_col").toString();
                        String user_id = job.get("user_id").toString();

                        log.info("originTimeData -> {}", originTimeData);
                        HashMap<String, Object> processResult = dtSimulationService.makePreProcessContinuousInterpolationAugment(twin_id, obj_id, proc_json, base_dir, file_path, file_name, indexTargetCol, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData, stepCount);
                        log.info("preProcessResult -> {}", processResult);
                        if (!Boolean.parseBoolean(processResult.get("status").toString())) {
                            if (processResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(processResult.get("isSizeAvailable").toString())) {
                                handleProcessingNotEnoughData(augment_seq, modelSeq, job.get("data_crt_last_hr").toString(), false);
                            } else if (processResult.get("code") != null && processResult.get("message") != null && processResult.get("detail") != null) {
                                Exception e = new Exception(processResult.get("message").toString());
                                handleProcessingError(augment_seq, modelSeq, job.get("data_crt_last_hr").toString(), e);
                            } else {
                                //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                                Map<String, Object> logParams = new HashMap<String, Object>();
                                logParams.put("augment_seq", augment_seq);
                                logParams.put("data_crt_last_hr", job.get("data_crt_last_hr").toString());
                                makeMetaSimulationSchedulerService.updateAugmentMain(logParams);
                            }
                            continue;
                        }
                        Map<String, Object> updateParams = new HashMap<String, Object>();
                        updateParams.put("augment_seq", augment_seq);
                        updateParams.put("data_crt_last_hr", processResult.get("data_crt_last_hr").toString());
                        makeMetaSimulationSchedulerService.updateAugmentMain(updateParams);
                    }
                } else {
                    //전처리에서 사용될 데이터 제한
                    int data_max_limit_cnt = job.get("data_max_limit_cnt") != null ? Integer.parseInt(job.get("data_max_limit_cnt").toString()) : 200;

                    //전처리 프로세스
                    //데이터 가져오는 API 시간 설정
                    //데이터 마지막 시간부터 현재 시간까지를 데이터 가져오는 시간으로 지정
                    String from_date = job.get("data_crt_last_hr").toString();
                    String to_date = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss").format(calendar.getTime());
                    log.info("Time -> from_date {}, to_date {}", from_date, to_date);
                    // 데이터를 검색해서 가져오는 부분 KETI API
                    Map<String, Object> params = new HashMap<>();
                    params.put("digital_twins", twin_id);
                    params.put("digital_objects", obj_id);
                    params.put("from_date", from_date);
                    params.put("to_date", to_date);
                    //전처리 이므로 한번에 많이 가져오면 터질 수 있으므로 데이터 제한
                    params.put("data_max_limit_cnt", data_max_limit_cnt);
                    try {
                        data = getFindMetaDataParsing(params);
                        data = JSONParser.isDuplicateDataByKey(data, targetModel.get("index_trgt_col").toString());
                    } catch (Exception exception) {
                        exception.printStackTrace();
                        handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, exception);
                        continue;
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
                    param.put("index_trgt_col", targetModel.get("index_trgt_col").toString());

                    ResponseEntity<?> resultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(param);

                    // 결과 처리
                    int statusCode = resultSimulationOriginFileSet.getStatusCodeValue();
                    if (statusCode != 200) {
                        Exception e = new Exception("The connection to the Python server was lost.");
                        handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, e);
                        continue;
                    }
                    ObjectMapper objectMapper = new ObjectMapper();
                    JsonNode rootNode = objectMapper.readTree(resultSimulationOriginFileSet.getBody().toString());
                    int dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                    log.info("dataCount -> {}", dataCount);
                    List<String> originTimeData = new ArrayList<>();
                    /**
                     * 이상치 판단을 위해 데이터를 넣을 때 데이터의 개수 (현재는 200개)
                     * */
                    if (dataCount >= 200) {
                        //데이터가 부족하지 않을 시 작업 진행
                        //생성된 파일의 시계열 컬럼 데이터 중복 체크
                        String created_data_file_path = rootNode.path("data").get("file_path").asText();
                        String created_data_file_name = rootNode.path("data").get("file_name").asText();
                        JSONParser.isDuplicateDataByKey(created_data_file_path + File.separator + created_data_file_name, rootNode.path("data").get("index_trgt_col").asText());
                        //마지막 데이터 시간 조정
                        data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                        String indexTargetCol = targetModel.get("index_trgt_col").toString();
                        String user_id = job.get("user_id").toString();
                        HashMap<String, Object> processResult = dtSimulationService.makePreProcess(twin_id, obj_id, proc_json, base_dir, file_path, file_name, indexTargetCol, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData);
                        log.info("preProcessResult -> {}", processResult);
                        if (!Boolean.parseBoolean(processResult.get("status").toString())) {
                            if (processResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(processResult.get("isSizeAvailable").toString())) {
                                handleProcessingNotEnoughData(augment_seq, modelSeq, job.get("data_crt_last_hr").toString(), false);
                            } else {
                                //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                                Map<String, Object> logParams = new HashMap<String, Object>();
                                logParams.put("augment_seq", augment_seq);
                                logParams.put("data_crt_last_hr", job.get("data_crt_last_hr").toString());
                                makeMetaSimulationSchedulerService.updateAugmentMain(logParams);
                            }
                            continue;
                        }
                        Map<String, Object> updateParams = new HashMap<String, Object>();
                        updateParams.put("augment_seq", augment_seq);
                        updateParams.put("data_crt_last_hr", processResult.get("data_crt_last_hr").toString());
                        makeMetaSimulationSchedulerService.updateAugmentMain(updateParams);
                    } else {
                        //이상치 판단을 위한 데이터 부족시 더 가져와야한다.
                        //데이터 제한을 두지 않음
                        if (dataCount == 0) {
                            handleProcessingNotEnoughData(augment_seq, modelSeq, data_crt_last_hr, false);
                            continue;
                        }
                        int count = 1;
                        //기존 데이터의 시계열 컬럼만 데이터 저장
                        originTimeData = dtSimulationService.extractTimeData(rootNode.path("data").path("data"));
                        while (true) {
                            //2번 더 가져와도 안되면 메세지 출력 후 프로세스 종료
                            if (count > 10) {
                                handleProcessingNotEnoughData(augment_seq, modelSeq, data_crt_last_hr, false);
                                continue jobLoop;
                            }
                            //채워야 하는 데이터의 개수
                            int originCount = 200 - originTimeData.size();
                            log.info("originCount -> {}", originCount);
                            int unitTime = delta * TimeUnit.getTimeType(unit.getResampleType()) * originCount;
                            log.info("originUnitTime -> {}", unitTime);
                            String more_from_date = negativeTimeCalculate(job.get("data_crt_last_hr").toString(), unit.getResampleType().toUpperCase(), unitTime * count);
                            String more_to_date = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss").format(calendar.getTime());
                            log.info("Time -> from_date {}, to_date {}", from_date, to_date);
                            Map<String, Object> moreDataParams = new HashMap<>();
                            moreDataParams.put("digital_twins", twin_id);
                            moreDataParams.put("digital_objects", obj_id);
                            moreDataParams.put("from_date", more_from_date);
                            moreDataParams.put("to_date", more_to_date);
                            try {
                                data = getFindMetaDataParsing(moreDataParams);
                                data = JSONParser.isDuplicateDataByKey(data, targetModel.get("index_trgt_col").toString());
                                log.info("추가 데이터 확보(기존 데이터 포함) {}번째 -> {}개", count, data.size());
                            } catch (Exception exception) {
                                exception.printStackTrace();
                                handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, exception);
                                continue jobLoop;
                            }
                            //데이터의 개수가 채워지면 더 가져오는 로직 break;
                            if (data.size() >= 200) {
                                break;
                            }
                            count++;
                        }
                        // CSV 파일 생성
                        Map<String, Object> moreBasicFileParam = new HashMap<>();
                        moreBasicFileParam.put("data", data);
                        moreBasicFileParam.put("file_path", file_path);
                        moreBasicFileParam.put("file_name", file_name);
                        moreBasicFileParam.put("index_trgt_col", targetModel.get("index_trgt_col").toString());

                        ResponseEntity<?> moreResultSimulationOriginFileSet = dtModelApiService.makeBaseSimulationDataFile(moreBasicFileParam);

                        // 결과 처리
                        int moreStatusCode = moreResultSimulationOriginFileSet.getStatusCodeValue();
                        if (moreStatusCode != 200) {
                            Exception e = new Exception("The connection to the Python server was lost.");
                            handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, e);
                            continue;
                        }
                        objectMapper = new ObjectMapper();
                        rootNode = objectMapper.readTree(moreResultSimulationOriginFileSet.getBody().toString());
                        dataCount = dtSimulationService.simulationDataCount(rootNode.path("data").path("data"));
                        log.info("More Total dataCount -> {}", dataCount);

                        //데이터가 부족하지 않을 시 작업 진행
                        //생성된 파일의 시계열 컬럼 데이터 중복 체크
                        String created_data_file_path = rootNode.path("data").get("file_path").asText();
                        String created_data_file_name = rootNode.path("data").get("file_name").asText();
                        JSONParser.isDuplicateDataByKey(created_data_file_path + File.separator + created_data_file_name, rootNode.path("data").get("index_trgt_col").asText());
                        //마지막 데이터 시간 조정
                        data_crt_last_hr = rootNode.path("data").path("data_crt_last_hr").asText();
                        String indexTargetCol = targetModel.get("index_trgt_col").toString();
                        String user_id = job.get("user_id").toString();

                        HashMap<String, Object> processResult = dtSimulationService.makePreProcess(twin_id, obj_id, proc_json, base_dir, file_path, file_name, indexTargetCol, user_id, modelSeq, augment_seq, from_date, to_date, data_crt_last_hr, originTimeData);
                        log.info("preProcessResult -> {}", processResult);
                        if (!Boolean.parseBoolean(processResult.get("status").toString())) {
                            if (processResult.get("isSizeAvailable") != null && !Boolean.parseBoolean(processResult.get("isSizeAvailable").toString())) {
                                handleProcessingNotEnoughData(augment_seq, modelSeq, job.get("data_crt_last_hr").toString(), false);
                            } else {
                                //여기로 들어온건 에러 처리가 된 부분 전처리 에러시 들어온다. 데이터 시작점만 원상복구
                                Map<String, Object> logParams = new HashMap<String, Object>();
                                logParams.put("augment_seq", augment_seq);
                                logParams.put("data_crt_last_hr", job.get("data_crt_last_hr").toString());
                                makeMetaSimulationSchedulerService.updateAugmentMain(logParams);
                            }
                            continue;
                        }
                        Map<String, Object> updateParams = new HashMap<String, Object>();
                        updateParams.put("augment_seq", augment_seq);
                        updateParams.put("data_crt_last_hr", processResult.get("data_crt_last_hr").toString());
                        makeMetaSimulationSchedulerService.updateAugmentMain(updateParams);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                handleProcessingError(augment_seq, modelSeq, data_crt_last_hr, e);
            } finally {
                // 종료 조건 확인
                checkCycleEnd(job, data_crt_last_hr, augment_seq);
            }
        }
    }

    public static String negativeTimeCalculate(String inputTime, String type, int minusNum) {
        ZonedDateTime zonedDateTime = ZonedDateTime.parse(inputTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault()));

        switch (type) {
            case "MS":
                zonedDateTime = zonedDateTime.minusMinutes(minusNum);
                break;
            case "S":
                zonedDateTime = zonedDateTime.minusSeconds(minusNum);
                break;
            case "M":
            case "T":
                zonedDateTime = zonedDateTime.minusMinutes(minusNum);
                break;
            case "H":
                zonedDateTime = zonedDateTime.minusHours(minusNum);
                break;
            case "D":
                zonedDateTime = zonedDateTime.minusDays(minusNum);
                break;
            default:
                System.out.println("Unsupported type");
                break;
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return formatter.format(zonedDateTime);
    }

    public static String timeCalculate(String inputTime, String type, int plusNum) {
        ZonedDateTime zonedDateTime = ZonedDateTime.parse(inputTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault()));

        switch (type) {
            case "MS":
                zonedDateTime = zonedDateTime.plus(plusNum, ChronoUnit.MILLIS);
                break;
            case "S":
                zonedDateTime = zonedDateTime.plus(plusNum, ChronoUnit.SECONDS);
                break;
            case "M":
            case "T":
                zonedDateTime = zonedDateTime.plus(plusNum, ChronoUnit.MINUTES);
                break;
            case "H":
                zonedDateTime = zonedDateTime.plus(plusNum, ChronoUnit.HOURS);
                break;
            case "D":
                zonedDateTime = zonedDateTime.plus(plusNum, ChronoUnit.DAYS);
                break;
            default:
                System.out.println("Unsupported type");
                break;
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return formatter.format(zonedDateTime);
    }

    private List<Map<String, Object>> getFindMetaDataParsing(Map<String, Object> findParsingParam) throws Exception {
        Map<String, Object> getMetaDepth = dTModelService.getMetaDataJsonDepth(findParsingParam);
        String dataDepth = getMetaDepth.get("data_depth_1").toString();
        String dataTimeYn = getMetaDepth.get("data_time_yn").toString();
        findParsingParam.put("data_time_yn", dataTimeYn);
        log.info("getFindMetaDataParsing findParsingParam -> " + findParsingParam.toString());
        ResponseEntity<?> resultResourceObjectData = dtModelApiService.getResourceObjectDataSet(findParsingParam, true);

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode rootNodePath = objectMapper.readTree(resultResourceObjectData.getBody().toString());

        String col_depth = dataDepth;
        String[] depthKeys = col_depth.split("\\.");
        List<JsonNode> nodesToProcess = new ArrayList<>();

        if (rootNodePath.isArray()) {
            for (JsonNode arrayItem : rootNodePath) {
                nodesToProcess.add(arrayItem);
            }
        } else {
            nodesToProcess.add(rootNodePath);
        }

        for (String key : depthKeys) {
            List<JsonNode> nextNodesToProcess = new ArrayList<>();

            for (JsonNode node : nodesToProcess) {
                JsonNode nextNode = node.path(key);
                if (!nextNode.isMissingNode()) {
                    nextNodesToProcess.add(nextNode);
                }
            }

            nodesToProcess = nextNodesToProcess;
        }

        List<Map<String, Object>> resultList = new ArrayList<>();

        //for (JsonNode finalNode : nodesToProcess) {
        for (int i = 0; i < nodesToProcess.size(); i++) {
            JsonNode finalNode = nodesToProcess.get(i); // nodesToProcess의 i번째 노드 가져오기
            JsonNode rootNode = rootNodePath.get(i);

            if (finalNode.isArray()) {
                for (JsonNode arrayItem : finalNode) {
                    Map<String, Object> map = objectMapper.convertValue(arrayItem, new TypeReference<Map<String, Object>>() {
                    });

                    if ("N".equals(findParsingParam.get("data_time_yn"))) {
                        String rowtime = arrayItem.path("rowtime").asText();
                        if (rowtime.isEmpty()) {
                            rowtime = ketiTimeFormatSetDefault(rootNode.path("rowtime").asText());
                        }
                        map.put("rowtime", rowtime);
                    }

                    resultList.add(map);
                }
            } else {
                Map<String, Object> map = objectMapper.convertValue(finalNode, new TypeReference<Map<String, Object>>() {
                });

                if ("N".equals(findParsingParam.get("data_time_yn"))) {
                    String rowtime = finalNode.path("rowtime").asText();
                    if (rowtime.isEmpty()) {
                        rowtime = ketiTimeFormatSetDefault(rootNode.path("rowtime").asText());
                    }
                    map.put("rowtime", rowtime);
                }

                resultList.add(map);
            }
        }

        return resultList;
    }

    private String ketiTimeFormatSetDefault(String input) {
        //String input = "2024-06-26T03:25:28.578Z";

        // ZonedDateTime으로 파싱
        ZonedDateTime zonedDateTime = ZonedDateTime.parse(input);

        // 포맷 지정
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        // 포맷 적용하여 문자열로 변환
        String formattedDateTime = zonedDateTime.format(formatter);

        return formattedDateTime;
    }

    // 데이터 부족 처리 메소드
    private void handleProcessingNotEnoughData(int augment_seq, int modelSeq, String data_crt_last_hr, boolean isStop) {
        if (augment_seq != 0 && modelSeq != 0) {
            try {
                Map<String, Object> errorParams = new HashMap<>();
                errorParams.put("augment_seq", augment_seq);
                errorParams.put("model_seq", modelSeq);
                errorParams.put("file_seq", null);
                errorParams.put("augment_status", "E");
                errorParams.put("err_tp", "P");
                errorParams.put("err_cd", 200);
                errorParams.put("err_nm", "Not Enough Data");
                errorParams.put("err_cn", "데이터가 부족합니다.");
                errorParams.put("data_crt_last_hr", data_crt_last_hr);
                log.info("errorParams -> {}", errorParams);
                makeMetaSimulationSchedulerService.saveAugmentLog(errorParams);
                if (isStop) {
                    makeMetaSimulationSchedulerService.updateAugmentStatusStop(augment_seq, "S", data_crt_last_hr);
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    // 에러 처리 메소드
    private void handleProcessingError(int augment_seq, int modelSeq, String data_crt_last_hr, Exception e) {
        if (augment_seq != 0 && modelSeq != 0) {
            try {
                Map<String, Object> errorParams = new HashMap<>();
                errorParams.put("augment_seq", augment_seq);
                errorParams.put("model_seq", modelSeq);
                errorParams.put("file_seq", null);
                errorParams.put("augment_status", "E");
                errorParams.put("err_tp", "P");
                errorParams.put("err_cd", 500);
                errorParams.put("err_nm", "Internal Server Error");
                errorParams.put("err_cn", e.getMessage() != null ? e.getMessage() : e.getStackTrace().toString());
                errorParams.put("data_crt_last_hr", data_crt_last_hr);

                log.info("errorParams -> {}", errorParams);
                makeMetaSimulationSchedulerService.saveAugmentLog(errorParams);
                makeMetaSimulationSchedulerService.updateAugmentStatusStop(augment_seq, "S", data_crt_last_hr);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    // 종료 조건 확인 메소드
    private void checkCycleEnd(Map<String, Object> job, String data_crt_last_hr, int augment_seq) {
        String cycle_end_tp = job.get("cycle_end_tp").toString();
        if (!"C".equals(cycle_end_tp) && data_crt_last_hr != null && !job.get("cycle_end_dsgn_ymd").toString().isEmpty()) {
            String cycle_end_dsgn_ynd_str = job.get("cycle_end_dsgn_ymd").toString();
            boolean isBefore = TimeUtil.compareAfterDate(data_crt_last_hr, cycle_end_dsgn_ynd_str);
            if (!isBefore) {
                makeMetaSimulationSchedulerService.finishAugmentStatus(augment_seq, "C");
            }
        }
    }
}
