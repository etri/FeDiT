package com.stoneitgt.dt.data.platform.admin.service;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.domain.meta.DigitalTwinMetadata;
import com.stoneitgt.dt.data.platform.domain.sync.DigitalTwinObject;
import com.stoneitgt.dt.data.platform.util.JSONParser;
import com.stoneitgt.dt.data.platform.util.TimeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncEngineAPIService extends APIService {
    private final RestTemplate bulkRestTemplate;
    private final MetaAPIService metaAPIService;

    public List<Map<String, Object>> getDigitalTwinObjectData(String dtid, String dtoid, Integer count, String from, String to) {
        String endpoint = "/fedit/v1/digital-twins/" + dtid + "/digital-objects/" + dtoid + "/data";
        Map<String, Object> params = new HashMap<>();
        if (count != null) {
            params.put("count", count.toString());
        }
        if (from != null && !from.isEmpty()) {
            params.put("from", from);
        }
        if (to != null && !to.isEmpty()) {
            params.put("to", to);
        }

        List<Map<String, Object>> datas = new ArrayList<>();

        try {
            ResponseEntity<String> response = syncEngineApiRequest(endpoint, params, HttpMethod.GET);
            if (response != null) {
                ObjectMapper objectMapper = new ObjectMapper();
                datas = objectMapper.readValue(response.getBody(), new TypeReference<List<Map<String, Object>>>() {
                });
            }
            return datas;
        } catch (Exception e) {
            log.error("Error fetching digital twins", e);
            return datas;
        }
    }

    public DigitalTwinObject getDigitalTwinObject(String dtid, String dtoid) {
        String endpoint = "/fedit/v1/digital-twins/" + dtid + "/digital-objects/" + dtoid;
        Map<String, Object> params = new HashMap<>();
        DigitalTwinObject digitalTwinObject = null;
        try {
            ResponseEntity<String> response = syncEngineApiRequest(endpoint, params, HttpMethod.GET);
            if (response != null && (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED)) {
                ObjectMapper objectMapper = new ObjectMapper();
                digitalTwinObject = objectMapper.readValue(response.getBody(), DigitalTwinObject.class);
            }
            return digitalTwinObject;
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            return digitalTwinObject;
        }
    }

    public boolean createDigitalTwinObject(String dtid, String dtoid, DigitalTwinMetadata.DigitalTwinObject metaCreatedDigitalTwinObject) {
        String endpoint = "/fedit/v1/digital-twins/" + dtid + "/digital-objects";
        Map<String, Object> params = new HashMap<>();

        if (metaCreatedDigitalTwinObject == null) {
            log.error("metaCreatedDigitalTwinObject is null");
            return false;
        }

        DigitalTwinObject originDigitalTwinObject = getDigitalTwinObject(dtid, dtoid);

        log.info("metaCreatedDigitalTwinObject -> {}", metaCreatedDigitalTwinObject);
        log.info("originDigitalTwinObject -> {}", originDigitalTwinObject);

        try {
            DigitalTwinObject createDigitalTwinObject = DigitalTwinObject.builder()
                    // [Required] 기본값 및 가공
                    .digital_object_identifier(metaCreatedDigitalTwinObject.getDtoid()).digital_object_name(metaCreatedDigitalTwinObject.getName()).description(metaCreatedDigitalTwinObject.getDescription())

                    // [Required - Array] null 방지
                    .keywords(metaCreatedDigitalTwinObject.getKeywords()).subjects(metaCreatedDigitalTwinObject.getSubjects())

                    // [Required - Time]
                    .creation_time(metaCreatedDigitalTwinObject.getCreationTime()).modification_time(metaCreatedDigitalTwinObject.getModificationTime() != null ? metaCreatedDigitalTwinObject.getModificationTime() : (metaCreatedDigitalTwinObject.getCreationTime() != null ? metaCreatedDigitalTwinObject.getCreationTime() : ""))
                    // [Required - Data Access]
                    .digital_object_data_access_type(metaCreatedDigitalTwinObject.getDigitalTwinObjectData().getDataAccessURL() != null && metaCreatedDigitalTwinObject.getDigitalTwinObjectData().getDataAccessURL().startsWith("https") ? "HTTPS" : "HTTP").digital_object_data_access_url(metaCreatedDigitalTwinObject.getDigitalTwinObjectData().getDataAccessURL())

                    // [Required - Control]
                    .digital_object_control_url("https://[HOST]/dt/history/dashboard?menuCd=M0501")

                    // [Required - Objects]
                    .digital_object_data_model(metaCreatedDigitalTwinObject.getDigitalTwinObjectData().getSchemaInformation() != null ?
                            metaCreatedDigitalTwinObject.getDigitalTwinObjectData().getSchemaInformation() :
                            Collections.emptyMap())
                    .digital_object_control_request_model(originDigitalTwinObject.getDigital_object_control_request_model() != null ?
                            originDigitalTwinObject.getDigital_object_control_request_model() :
                            Collections.emptyMap())
                    .do_metadata(originDigitalTwinObject.getDo_metadata() != null ?
                            originDigitalTwinObject.getDo_metadata() :
                            Collections.emptyMap())

                    // [Required - Interval]
                    .digital_object_data_interval(metaCreatedDigitalTwinObject.getDigitalTwinObjectData().getUpdateInterval())

                    // [Optional] 필드들
                    .preliminary_field(originDigitalTwinObject.getPreliminary_field() != null ? originDigitalTwinObject.getPreliminary_field() : Collections.emptyMap()).digital_object_data_source_type(originDigitalTwinObject.getDigital_object_data_source_type()).digital_object_data_source_url(originDigitalTwinObject.getDigital_object_data_source_url()).digital_object_data_source_base_url(originDigitalTwinObject.getDigital_object_data_source_base_url()).digital_object_control_delivery_timeout(metaCreatedDigitalTwinObject.getDigitalTwinObjectData().getUpdateInterval() != null ? metaCreatedDigitalTwinObject.getDigitalTwinObjectData().getUpdateInterval() : 0).build();

            params = new ObjectMapper().convertValue(createDigitalTwinObject, Map.class);

            ResponseEntity<String> response = syncEngineApiRequest(endpoint, params, HttpMethod.POST);
            if (response != null && (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED)) {
                Map<String, Object> responseMap = new ObjectMapper().readValue(response.getBody(), Map.class);
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            log.error("Error fetching digital twin object", e);
            return false;
        }
    }

    /*TODO Deprecated*/
    public String createDigitalTwinObject(String dtid, String dtoid, int augmentSeq, String augmentTitle) {
        // 1. 디지털 트윈 아이디와 디지털 트윈 오브젝트 아이디로 디지털 트윈 오브젝트 정보 가져오기
        // 2. 가져온 정보를 통하여 필요한 데이터를 채우고 디지털 트윈 오브젝트 생성 API 호출
        String endpoint = "/fedit/v1/digital-twins/" + dtid + "/digital-objects";
        Map<String, Object> params = new HashMap<>();
        String digitalTwinObjectId = null;
        try {
            DigitalTwinObject originDigitalTwinObject = getDigitalTwinObject(dtid, dtoid);

            if (originDigitalTwinObject == null) {
                log.error("Original Digital Twin Object not found for dtid: {}, dtoid: {}", dtid, dtoid);
                return digitalTwinObjectId;
            }

            String creationTime = TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            // 1. 공통으로 사용할 빈 객체들 정의
            Map<String, Object> emptyMap = Collections.emptyMap();
            List<String> emptyList = Collections.emptyList();

            DigitalTwinObject createDigitalTwinObject = DigitalTwinObject.builder()
                    // [Required] 기본값 및 가공
                    .digital_object_identifier(originDigitalTwinObject.getDigital_object_id() + "_" + augmentSeq).digital_object_name(augmentTitle != null ? augmentTitle : "Default Name").description(originDigitalTwinObject.getDescription() != null ? originDigitalTwinObject.getDescription() : "")

                    // [Required - Array] null 방지
                    .keywords(originDigitalTwinObject.getKeywords() != null ? originDigitalTwinObject.getKeywords() : emptyList).subjects(originDigitalTwinObject.getSubjects() != null ? originDigitalTwinObject.getSubjects() : emptyList)

                    // [Required - Time]
                    .creation_time(creationTime).modification_time(creationTime)

                    // [Required - Data Access]
                    .digital_object_data_access_type(originDigitalTwinObject.getDigital_object_data_access_type() != null ? originDigitalTwinObject.getDigital_object_data_access_type() : "REST_API").digital_object_data_access_url(originDigitalTwinObject.getDigital_object_data_access_url() != null ? originDigitalTwinObject.getDigital_object_data_access_url() : "")

                    // [Required - Control]
                    .digital_object_control_url(originDigitalTwinObject.getDigital_object_control_url() != null ? originDigitalTwinObject.getDigital_object_control_url() : "") // null이면 빈 문자열이라도 전송

                    // [Required - Objects]
                    .digital_object_data_model(originDigitalTwinObject.getDigital_object_data_model() != null ? originDigitalTwinObject.getDigital_object_data_model() : emptyMap).digital_object_control_request_model(originDigitalTwinObject.getDigital_object_control_request_model() != null ? originDigitalTwinObject.getDigital_object_control_request_model() : emptyMap).do_metadata(originDigitalTwinObject.getDo_metadata() != null ? originDigitalTwinObject.getDo_metadata() : emptyMap)

                    // [Required - Interval]
                    .digital_object_data_interval(originDigitalTwinObject.getDigital_object_data_interval() != null ? originDigitalTwinObject.getDigital_object_data_interval() : 0)

                    // [Optional] 필드들
                    .preliminary_field(originDigitalTwinObject.getPreliminary_field()).digital_object_data_source_type(originDigitalTwinObject.getDigital_object_data_source_type()).digital_object_data_source_url(originDigitalTwinObject.getDigital_object_data_source_url()).digital_object_data_source_base_url(originDigitalTwinObject.getDigital_object_data_source_base_url()).build();

            params = new ObjectMapper().convertValue(createDigitalTwinObject, Map.class);

            ResponseEntity<String> response = syncEngineApiRequest(endpoint, params, HttpMethod.POST);
            if (response != null && (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED)) {
                Map<String, Object> responseMap = new ObjectMapper().readValue(response.getBody(), Map.class);
                digitalTwinObjectId = responseMap.get("digital_object_id") != null ? responseMap.get("digital_object_id").toString() : null;
            }
            return digitalTwinObjectId;
        } catch (Exception e) {
            log.error("Error sending digital twin object created", e);
            return digitalTwinObjectId;
        }
    }

    public boolean createDigitalTwinObjectData(String dtid, String dtoid, String timeKey, List<Map<String, Object>> datas) {
        String endpoint = "/fedit/v1/digital-twins/" + dtid + "/digital-objects/" + dtoid + "/data";
        try {
            // 스키마 정보 조회
            DigitalTwinObject digitalTwinObject = getDigitalTwinObject(dtid, dtoid);
            if (digitalTwinObject == null) {
                log.error("Digital Twin Object not found for dtid: {}, dtoid: {}", dtid, dtoid);
                return false;
            }
            Map<String, Object> schema = digitalTwinObject.getDigital_object_data_model();
            DigitalTwinObjectDataBuilder builder = new DigitalTwinObjectDataBuilder();

            String schemaType = metaAPIService.checkSchemaType(schema);
            if (schemaType == null) {
                log.error("Unsupported schema type for dtid: {}, dtoid: {}", dtid, dtoid);
                return false;
            }
            List<Map<String, Object>> digitalTwinObjectDatas = new ArrayList<>();
            ObjectMapper objectMapper = new ObjectMapper();
            if (Objects.equals(schemaType, "DATA")) {
                digitalTwinObjectDatas = builder.buildDigitalTwinData(
                        schema,  // 스키마 (데이터 모델)
                        datas,   // 원본 데이터 리스트
                        dtid,    // Twin ID
                        dtoid,    // Object ID
                        timeKey // 시계열 기준 인덱스
                );

                boolean created = digitalTwinObjectDatas.parallelStream().map(data -> {
                    Map<String, Object> requestParams = new HashMap<>();
                    requestParams.put("rowtime", TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(objectMapper.convertValue(data, Map.class).get(timeKey).toString()));

                    // data 복사
                    Map<String, Object> updateData = new HashMap<>(data);
                    // timeKey만 제거
                    updateData.remove(timeKey);

                    requestParams.put("data", new ObjectMapper().convertValue(updateData, Map.class));
                    log.info("Send to Sync Engine data -> {}", requestParams);
                    ResponseEntity<String> response = bulkSyncEngineApiRequest(bulkRestTemplate, endpoint, requestParams, HttpMethod.POST);
                    return response != null && (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED);
                }).allMatch(success -> success); // 모든 전송이 성공했는지 확인
                return created;
            } else if (Objects.equals(schemaType, "NGSI_LD")) {
                digitalTwinObjectDatas = builder.buildDigitalTwinNgsiLdData(
                        schema,  // 스키마 (데이터 모델)
                        datas,   // 원본 데이터 리스트
                        dtid,    // Twin ID
                        dtoid,    // Object ID
                        timeKey // 시계열 기준 인덱스
                );
                boolean created = digitalTwinObjectDatas.parallelStream().map(data -> {
                    Map<String, Object> requestParams = new HashMap<>();
                    requestParams.put("rowtime", TimeUtil.parseToYYYYMMDDHHMMSSFromZoneDateTime(objectMapper.convertValue(objectMapper.convertValue(data, Map.class).get(timeKey), Map.class).get("value").toString()));

                    // data 복사
                    Map<String, Object> updateData = new HashMap<>(data);
                    // timeKey만 제거
                    updateData.remove(timeKey);

                    requestParams.put("data", new ObjectMapper().convertValue(updateData, Map.class));
                    log.info("Send to Sync Engine data -> {}", requestParams);
                    ResponseEntity<String> response = bulkSyncEngineApiRequest(bulkRestTemplate, endpoint, requestParams, HttpMethod.POST);
                    return response != null && (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED);
                }).allMatch(success -> success); // 모든 전송이 성공했는지 확인
                return created;
            } else {
                log.error("Unsupported schema type: {} for dtid: {}, dtoid: {}", schemaType, dtid, dtoid);
                return false;
            }
        } catch (Exception e) {
            log.error("Error sending digital twin object data created", e);
            return false;
        }
    }

    public boolean sendValidationData(ObjectNode jsonObject) {
        String endpoint = "/fedit/v1/validations";
        log.info("endpoint -> {}", endpoint);

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            List<ObjectNode> chunkedJsons = JSONParser.splitValidationData(jsonObject, 20);

            for (int i = 0; i < chunkedJsons.size(); i++) {
                ObjectNode chunkJson = chunkedJsons.get(i);
                log.info("sendValidationData -> {}", chunkJson.toString());
                Map<String, Object> requestMap = objectMapper.readValue(String.valueOf(chunkJson), new TypeReference<Map<String, Object>>() {
                });
                ResponseEntity<String> response = syncEngineApiRequest(endpoint, requestMap, HttpMethod.POST);
            }

            return true;
        } catch (Exception e) {
            log.error("Error sending validation data", e);
            return false;
        }
    }

    public boolean sendOutlierData(ObjectNode jsonObject) {
        String endpoint = "/fedit/v1/outliers";
        log.info("endpoint -> {}", endpoint);

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            List<ObjectNode> chunkedJsons = JSONParser.splitOutlierData(jsonObject, 20);

            for (int i = 0; i < chunkedJsons.size(); i++) {
                ObjectNode chunkJson = chunkedJsons.get(i);
                log.info("sendOutlierData -> {}", chunkJson.toString());
                Map<String, Object> requestMap = objectMapper.readValue(String.valueOf(chunkJson), new TypeReference<Map<String, Object>>() {
                });
                ResponseEntity<String> response = syncEngineApiRequest(endpoint, requestMap, HttpMethod.POST);
            }

            return true;
        } catch (Exception e) {
            log.error("Error sending outlier data", e);
            return false;
        }
    }

    public boolean sendErrorData(Map<String, Object> errorInfo) throws Exception {
        String endpoint = "/fedit/v1/errors";
        log.info("endpoint -> {}", endpoint);
        try {
            //ResponseEntity<String> response = syncEngineApiRequest(endpoint, errorInfo, HttpMethod.POST);
            return true;
        } catch (Exception e) {
            log.error("Error sending error data", e);
            return false;
        }
    }
}
