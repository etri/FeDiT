package com.stoneitgt.dt.data.platform.admin.task;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.admin.component.MetaDTEtcModelScheduler;
import com.stoneitgt.dt.data.platform.admin.component.MetaDTModelScheduler;
import com.stoneitgt.dt.data.platform.admin.component.MetaDTSimulationScheduler;
import com.stoneitgt.dt.data.platform.admin.service.*;
import com.stoneitgt.dt.data.platform.domain.meta.DigitalTwinMetadata;
import com.stoneitgt.dt.data.platform.domain.meta.PaginatedDigitalTwinMetadata;
import com.stoneitgt.dt.data.platform.enums.TimeUnit;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.map.HashedMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskSchedulerService {

    private final TaskManager taskManager;
    private final MakeMetaModelSchedulerService makeMetaModelSchedulerService;
    private final MetaDTModelScheduler metaDTModelScheduler;
    private final MakeMetaEtcModelSchedulerService makeMetaEtcModelSchedulerService;
    private final MetaDTEtcModelScheduler metaDTEtcModelScheduler;
    private final MakeMetaSimulationSchedulerService makeMetaSimulationSchedulerService;
    private final MetaDTSimulationScheduler metaDTSimulationScheduler;

    /**
     * 디지털 트윈 수집기
     *
     */
    private final MetaAPIService metaAPIService;
    private final DTModelService dtModelService;

    @PostConstruct
    public void loadTwinCollectorTask() {
        log.info("LoadTwinCollector Executed");
        // Twin Collector 작업 로직 구현
        try {
            Integer curPage = 1;
            Integer pageListSize = 5;
            Integer arrayDataLimit = 200;
            String objectRefFormat = "object";
            String dTw_objs_attr = "digitalTwinObjects";
            String dTw_attr_name = null;

            boolean hasNext = true;

            while (hasNext) {
                log.info("Fetching page: {}", curPage);

                // 1. API 호출
                PaginatedDigitalTwinMetadata response = metaAPIService.getDigitalTwins(
                        curPage, pageListSize, arrayDataLimit, objectRefFormat, dTw_objs_attr, dTw_attr_name
                );

                if (curPage == 1) {
                    log.info("loadTwinCollectorTask response -> {}", response.getData());
                }

                // 2. 데이터 처리 (비즈니스 로직)
                if (response != null && response.getData() != null && !response.getData().isEmpty()) {
                    processDigitalTwins(response.getData()); // 아래 별도 메서드로 분리 권장
                }

                // 3. 종료 조건 체크
                // 현재 페이지가 전체 페이지 수(totalPage)보다 크거나 같으면 종료
                if (response == null || curPage >= response.getTotalPage()) {
                    hasNext = false;
                    log.info("Finished fetching all pages. Total pages: {}", curPage);
                } else {
                    curPage++; // 다음 페이지로 이동
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Error fetching digital twins", e);
        }
    }

    /**
     * 데이터 증강 모델 생성에 관한 초기화 로직
     * 비정상적인 종료 다시 시작 처리
     */
    @PostConstruct
    public void modelTasksInitialize() {
        log.info("modelTasksInitialize, 서버 시작 전 DOING 프로세스 초기화 작업 실행...");
        List<Map<String, Object>> selectJobList = makeMetaModelSchedulerService.getMakeModelDoingToWaitListAll();
        for (Map<String, Object> job : selectJobList) {
            /**
             * 초기화 로직
             * DOING -> WAIT로 변경
             * DOING이 있다는것은 실행되다 중지되었다는것
             * */
            int modelSeq = Integer.parseInt(job.get("model_seq").toString());
            makeMetaModelSchedulerService.finishMakeModel(modelSeq, "WAIT");

            /**
             * 로직 검증 중...
             * */
            Map<String, Object> checkParams = new HashedMap<String, Object>();
            checkParams.put("model_seq", modelSeq);
            checkParams.put("ref_tp", "DATA");
            makeMetaModelSchedulerService.deleteSetRemodel(checkParams);
        }
        log.info("modelTasksInitialize, 서버 시작 전 DOING -> WAIT 초기화 작업 완료.");
    }

    /**
     * 유효성 검증 모델 생성에 관한 초기화 로직
     * 비정상적인 종료 다시 시작 처리
     */
    @PostConstruct
    public void etcModelTasksInitialize() {
        log.info("etcModelTasksInitialize, 서버 시작 전 DOING 프로세스 초기화 작업 실행...");
        List<Map<String, Object>> selectJobList = makeMetaEtcModelSchedulerService.getMakeModelDoingToWaitListAll();
        for (Map<String, Object> job : selectJobList) {
            /**
             * 초기화 로직
             * DOING -> WAIT로 변경
             * DOING이 있다는것은 실행되다 중지되었다는것
             * */
            int modelSeq = Integer.parseInt(job.get("etc_model_seq").toString());
            makeMetaEtcModelSchedulerService.finishMakeModel(modelSeq, "WAIT");

            /**
             * 로직 검증 중...
             * */
            Map<String, Object> checkParams = new HashedMap<String, Object>();
            checkParams.put("etc_model_seq", modelSeq);
            checkParams.put("ref_tp", "DATA");
            makeMetaEtcModelSchedulerService.deleteSetRemodel(checkParams);
        }
        log.info("etcModelTasksInitialize, 서버 시작 전 DOING -> WAIT 초기화 작업 완료.");
    }

    /**
     * 데이터 증강에 관한 초기화 로직
     * 비정상적인 종료 다시 시작 처리
     * 해당 부분은 초기화 로직이 없음
     * 로직 중간에 {data_crt_last_hr} 부분이 업데이트 되지 않음
     */
    @PostConstruct
    public void augmentTasksInitialize() {
        log.info("augmentTasksInitialize, 서버 시작 전 DOING 프로세스 초기화 작업 실행...");
        /**
         * AUGMENT_CRT_BGNG 부분 NULL로 변경
         * */
        List<Map<String, Object>> selectJobList = makeMetaSimulationSchedulerService.getJobList();
        for (Map<String, Object> job : selectJobList) {
            if (job.get("augment_crt_bgng") == null) {
                continue;
            }
            int augmentSeq = Integer.parseInt(job.get("augment_seq").toString());
            String cycle_tp = job.get("cycle_tp").toString();

            //이전 타임 증강 중을 증강 대기 상태로 복구
            makeMetaSimulationSchedulerService.updateAugmentCrtBgng(augmentSeq, null);
            //이전 타임 증강 끝난 시간으로 복구
            //ETC면 따로 예외 처리
            if (Objects.equals(cycle_tp, "ETC")) {
                //초로 계산됨
                int interval = TimeUnit.getTimeType(job.get("data_crt_intvl_tp").toString());
                int time = Integer.parseInt(job.get("data_crt_intvl_value").toString());
                makeMetaSimulationSchedulerService.updateAugmentCrtEnd(augmentSeq, TimeUtil.minusTime(null, TimeUtil.getCurrentDateTime(), "S", interval * time));
            } else {
                // Month의 M이랑 Minute의 M이랑 겹침
                //예외처리
                if (Objects.equals(cycle_tp, "M")) {
                    //Month의 M
                    cycle_tp = "m";
                }
                makeMetaSimulationSchedulerService.updateAugmentCrtEnd(augmentSeq, TimeUtil.minusTime(null, TimeUtil.getCurrentDateTime(), cycle_tp, 1));
            }
        }
        log.info("augmentTasksInitialize, 서버 시작 전 DOING -> WAIT 초기화 작업 완료.");
    }

    @Scheduled(initialDelay = 1000 * 30, fixedDelay = 1000 * 30)
    public void loadModelTasks() {
        log.info("LoadModelTasks Executed");
        List<Map<String, Object>> selectJobList = makeMetaModelSchedulerService.getMakeModelDoingListAll();
        for (Map<String, Object> job : selectJobList) {
            int modelSeq = Integer.parseInt(job.get("model_seq").toString());

            //모델 상태 진행 중인것은 다시 TaskManager에 넣지 않는다.
            boolean check = makeMetaModelSchedulerService.checkStatus(modelSeq, "DOING");
            if (check) {
                continue;
            }

            //모델 상태 진행중으로 변경
            makeMetaModelSchedulerService.finishMakeModel(modelSeq, "DOING");

            // 현재 job의 정보를 final 변수에 복사
            final Map<String, Object> currentJob = new HashMap<>(job); // job 객체의 복사본 생성

            // 큐에 작업 등록
            taskManager.submitTask(TaskType.MODEL, () -> {
                // 실제 로직 처리
                try {
                    HashMap<String, Object> taskResult = new HashMap<>(); // 작업 결과
                    log.info("MODEL 작업 실행: {}", taskResult);
                    metaDTModelScheduler.executeMakeMetaModel((HashMap<String, Object>) currentJob);
                    taskResult.put("message", "MODEL 작업 성공 - Job ID: " + currentJob.get("model_seq") + ", Model Name: " + currentJob.get("model_nm")); // 예시: job에서 ID 가져오기
                    log.info("MODEL 작업 결과: {}", taskResult);
                    return new ObjectMapper().writeValueAsString(taskResult);
                } catch (JsonProcessingException e) {
                    throw new RuntimeException(e);
                }
            });
        }
    }

    @Scheduled(initialDelay = 1000 * 30, fixedDelay = 1000 * 30)
    public void loadEtcModelTasks() {
        log.info("LoadEtcModelTasks Executed");
        List<Map<String, Object>> selectJobList = makeMetaEtcModelSchedulerService.getMakeModelDoingListAll();
        for (Map<String, Object> job : selectJobList) {
            int modelSeq = Integer.parseInt(job.get("etc_model_seq").toString());
            boolean check = makeMetaEtcModelSchedulerService.checkStatus(modelSeq, "DOING");
            if (check) {
                continue;
            }

            // 모델 상태 진행 중으로 변경
            makeMetaEtcModelSchedulerService.finishMakeModel(modelSeq, "DOING");

            // 현재 job의 정보를 final 변수에 복사
            final Map<String, Object> currentJob = new HashMap<>(job); // job 객체의 복사본 생성

            // 큐에 작업 등록
            taskManager.submitTask(TaskType.ETC_MODEL, () -> {
                // 실제 로직 처리
                try {
                    HashMap<String, Object> taskResult = new HashMap<>(); // 작업 결과
                    log.info("ETC MODEL 작업 실행: {}", taskResult);
                    metaDTEtcModelScheduler.executeMakeMetaEtcModel((HashMap<String, Object>) currentJob);
                    taskResult.put("message", "ETC MODEL 작업 성공 - Job ID: " + currentJob.get("etc_model_seq") + ", ETC Model Name: " + currentJob.get("etc_model_nm")); // 예시: job에서 ID 가져오기
                    log.info("ETC MODEL 작업 결과: {}", taskResult);
                    return new ObjectMapper().writeValueAsString(taskResult);
                } catch (JsonProcessingException e) {
                    throw new RuntimeException(e);
                }
            });
        }
    }

    @Scheduled(initialDelay = 1000 * 30, fixedDelay = 1000 * 30)
    public void loadAugmentTasks() {
        log.info("LoadAugmentTasks Executed");
        /* 시뮬레이션 로직에서 주기 유형 선택에 따른 시간차 계산
         *  H 1시간 마다, D 하루 마다
         *  AUGMENT_CRT_BGNG와 AUGMENT_CRT_END를 이용해서 증강 중인것을 확인
         *  프로세스
         *  1. 해당 부분 30초마다 한번씩 작업 가져옴
         *  2. 가져온 부분 AUGMENT_CRT_END를 꺼내서 H와 D로 로직 분기해서, 1시간 차이 또는 하루 차이 나는지 확인, 1시간 또는 하루 이상 차이나는 경우 로직 실행
         *  3. 차이나는 경우 AUGMENT_CRT_BGNG가 NULL 인지 확인
         *  3-1. NULL 일경우, AUGMENT_CRT_BGNG에 현재 시간 넣고 큐 등록 O
         *  3-1-1. 증강 종료 시, AUGMENT_CRT_BGNG를 NULL로 바꾸고 AUGMENT_CRT_END를 현재시간으로 넣기, DATA_CRT_LAST_HR 변경
         *  3-2. 시간이 있을 경우 증강중이므로 작업 큐 등록 X
         * */
        List<Map<String, Object>> selectJobList = makeMetaSimulationSchedulerService.getJobList();
        for (Map<String, Object> job : selectJobList) {
            log.info("job -> {}", job);
            //증강 시작 시간
            String augment_crt_bgng = job.get("augment_crt_bgng") != null ? ((java.sql.Timestamp) job.get("augment_crt_bgng")).toLocalDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null;

            //증강 종료 시간
            String augment_crt_end = job.get("augment_crt_end") != null ? ((java.sql.Timestamp) job.get("augment_crt_end")).toLocalDateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null;

            //시작이 비어있지 않으면 증강 실행 중
            if (augment_crt_bgng != null) {
                log.info("해당 증강 번호 증강 실행 중");
                continue;
            }
            boolean isReady = augment_crt_end == null;
            if (!isReady) {
                //주기 종류(H, D, W, M)
                String cycle_tp = job.get("cycle_tp").toString();
                long durationSeconds = TimeUtil.getPastDuration(augment_crt_end, null);
                switch (cycle_tp) {
                    case "T": {
                        // 1분 초과로 차이 나는 경우 로직 실행
                        //if (durationSeconds > 60 * 60) {
                        if (durationSeconds > 60 * 1) {
                            isReady = true;
                        }
                        break;
                    }
                    case "H": {
                        // 1시간 초과로 차이 나는 경우 로직 실행
                        //if (durationSeconds > 60 * 60) {
                        if (durationSeconds > 60 * 10) {
                            isReady = true;
                        }
                        break;
                    }
                    case "D": {
                        // 하루 초과로 차이 나는 경우 로직 실행
                        if (durationSeconds > 24 * 60 * 60) {
                            isReady = true;
                        }
                        break;
                    }
                    case "W": {
                        // 일주일 초과로 차이 나는 경우 로직 실행
                        if (durationSeconds > 7 * 24 * 60 * 60) {
                            isReady = true;
                        }
                        break;
                    }
                    case "M": {
                        // 한달 초과로 차이나는 경우 로직 실행 (30일 기준)
                        if (durationSeconds > 30 * 24 * 60 * 60) {
                            isReady = true;
                        }
                        break;
                    }
                    case "ETC": {
                        // 시간 타입 * 시간 간격 차이나는 경우 로직 실행 (ETC 전용)
                        int interval = TimeUnit.getTimeType(job.get("data_crt_intvl_tp").toString());
                        int time = Integer.parseInt(job.get("data_crt_intvl_value").toString());

                        if (durationSeconds > interval * time) {
                            isReady = true;
                        }
                        break;
                    }
                    default:
                        throw new RuntimeException("Cycle type is mismatched");
                }
            }
            if (!isReady) {
                continue;
            }

            log.info("증강 번호 : {}", job.get("augment_seq").toString());
            log.info("모델 번호 : {}", job.get("model_seq").toString());
            log.info("증강 제목 : {}", job.get("title").toString());
            log.info("증강 시작 시간 -> {}, 증강 종료 시간 -> {}", augment_crt_bgng, augment_crt_end);

            int augmentSeq = Integer.parseInt(job.get("augment_seq").toString());
            makeMetaSimulationSchedulerService.updateAugmentCrtBgng(augmentSeq, TimeUtil.getCurrentDateTime());
            makeMetaSimulationSchedulerService.updateAugmentCrtEnd(augmentSeq, null);

            // 현재 job의 정보를 final 변수에 복사
            final Map<String, Object> currentJob = new HashMap<>(job); // job 객체의 복사본 생성

            // 큐에 작업 등록
            taskManager.submitTask(TaskType.DATA_AUGMENT, () -> {
                // 실제 로직 처리
                try {
                    HashMap<String, Object> taskResult = new HashMap<>(); // 작업 결과
                    log.info("DATA_AUGMENT 작업 실행: {}", taskResult);
                    log.info("증강 번호 : {}", job.get("augment_seq").toString());
                    log.info("모델 번호 : {}", job.get("model_seq").toString());
                    log.info("증강 제목 : {}", job.get("title").toString());
                    log.info("증강 시작 시간 -> {}, 증강 종료 시간 -> {}", currentJob.get("augment_crt_bgng"), currentJob.get("augment_crt_end"));
                    metaDTSimulationScheduler.executeTwinSimulate((HashMap<String, Object>) currentJob);
                    taskResult.put("message", "DATA_AUGMENT 작업 성공 - Job ID: " + currentJob.get("augment_seq") + ", DATA_AUGMENT Name: " + currentJob.get("title")); // 예시: job에서 ID 가져오기
                    log.info("DATA_AUGMENT 작업 결과: {}", taskResult);
                    return new ObjectMapper().writeValueAsString(taskResult);
                } catch (JsonProcessingException e) {
                    throw new RuntimeException(e);
                } finally {
                    log.info("Finally Executed");
                    makeMetaSimulationSchedulerService.updateAugmentCrtBgng(Integer.parseInt(currentJob.get("augment_seq").toString()), null);
                    makeMetaSimulationSchedulerService.updateAugmentCrtEnd(Integer.parseInt(currentJob.get("augment_seq").toString()), TimeUtil.getCurrentDateTime());
                }
            });
        }
    }

    private void processDigitalTwins(List<DigitalTwinMetadata> dtList) {
        for (DigitalTwinMetadata dt : dtList) {
            // DB 저장 혹은 분석 로직 수행
            if (dt.getDigitalTwinObjects() == null || dt.getDigitalTwinObjects().isEmpty()) {
                continue;
            }
            dt.getDigitalTwinObjects().parallelStream().forEach(dto -> {
                log.info("Processing Digital Twin Object - DT ID: {}, Name: {}, Object ID: {}, Name: {}",
                        dt.getDtid(), dt.getName(), dto.getDtoid(), dto.getName());
                // 경로 추출
                if (dto.getDigitalTwinObjectData() == null) {
                    return;
                }
                if (dto.getDigitalTwinObjectData().getSchemaInformation() == null) {
                    return;
                }

                Map<String, Object> schema = dto.getDigitalTwinObjectData().getSchemaInformation();

                if (schema.get("required") == null) {
                    log.info("Required field is empty in schema for Object ID: {}", dto.getDtoid());
                    return;
                }

                List<String> requiredList = (List<String>) schema.get("required");
                if (requiredList.isEmpty()) {
                    log.info("Required field is empty in schema for Object ID: {}", dto.getDtoid());
                    return;
                }

                Map<String, Object> properties = (Map<String, Object>) schema.get("properties");

                if (schema.get("properties") == null) {
                    log.info("Properties field is missing in schema for Object ID: {}", dto.getDtoid());
                    return;
                }

                String dataPath = null;
                String dataTimePath = null;

                // 기존 Data Schema 구조에서 Properties에 data가 포함 되어있다면 data 필드의 경로와 rowtime 필드의 경로를 추출
                String schemaType = metaAPIService.checkSchemaType(schema);
                if (dt.getDtid().equals("KR-01-O84213-20260001")
                        && (dto.getDtoid().equals("KR-104111-0021")
                        || dto.getDtoid().equals("KR-104111-0022")
                        || dto.getDtoid().equals("KR-104111-0023"))) {
                    log.info("Processing Digital Twin Object - DT ID: {}, Name: {}, Object ID: {}, Name: {}, schemaType: {}",
                            dt.getDtid(), dt.getName(), dto.getDtoid(), dto.getName(), metaAPIService.checkSchemaType(schema));
                }
                /*if (dt.getDtid().equals("KR-01-O84213-20260002")
                        && (dto.getDtoid().equals("KR-104111-0024")
                        || dto.getDtoid().equals("KR-104111-0025")
                        || dto.getDtoid().equals("KR-104111-0026"))) {
                    log.info("Processing Digital Twin Object - DT ID: {}, Name: {}, Object ID: {}, Name: {}, schemaType: {}",
                            dt.getDtid(), dt.getName(), dto.getDtoid(), dto.getName(), metaAPIService.checkSchemaType(schema));
                }*/
                if (Objects.equals(schemaType, "DATA")) {
                    dataPath = "data.{key}";
                    dataTimePath = "rowtime";
                } else if (Objects.equals(schemaType, "NGSI_LD")) {
                    dataPath = "data.{key}.value";
                    dataTimePath = "rowtime";
                } else {
                    log.info("Unknown schema type for Object ID: {}, schemaType: {}", dto.getDtoid(), schemaType);
                    dataPath = "data.{key}";
                    dataTimePath = "rowtime";
                }

                // TB_META_DATA_DEPTH DB 존재 여부 확인
                Map<String, Object> checkParams = new HashMap<>();
                checkParams.put("twin_id", dt.getDtid());
                checkParams.put("twin_obj_id", dto.getDtoid());
                int count = dtModelService.countMetaDataDepth(checkParams);
                if (count == 0) {
                    log.info("Inserting new metadata depth for Twin ID: {}, Object ID: {}", dt.getDtid(), dto.getDtoid());
                    // TB_META_DATA_DEPTH DB 저장 로직 호출
                    Map<String, Object> params = new HashMap<>();
                    params.put("twin_id", dt.getDtid());
                    params.put("twin_nm", dt.getName());
                    params.put("twin_obj_id", dto.getDtoid());
                    params.put("twin_obj_nm", dto.getName());

                    params.put("data_depth_1", dataPath);
                    params.put("data_depth_2", dataTimePath);

                    params.put("reg_user_seq", 1);
                    params.put("reg_ip", "0.0.0.0");
                    params.put("data_time_yn", "Y");
                    log.info("Metadata depth parameters: {}", params);
                    dtModelService.insertMetaDataDepth(params);
                }
            });
        }
    }
}