package com.stoneitgt.dt.data.platform.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.domain.meta.DigitalTwinMetadata;
import com.stoneitgt.dt.data.platform.domain.meta.PaginatedDigitalTwinMetadata;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class MetaAPIService extends APIService {
    public PaginatedDigitalTwinMetadata getDigitalTwins(Integer curPage, Integer pageListSize, Integer arrayDataLimit, String objectRefFormat, String dTwObjsAttr, String dTwAttrName) {
        Map<String, String> params = new HashMap<>();
        params.put("curPage", curPage.toString());
        params.put("pageListSize", pageListSize.toString());
        params.put("arrayDataLimit", arrayDataLimit.toString());
        params.put("objectRefFormat", objectRefFormat);
        params.put("dTw_objs_attr", dTwObjsAttr);
        if (dTwAttrName != null && !dTwAttrName.isEmpty()) {
            params.put("dTw_attr_name", dTwAttrName);
        }
        /**
         * 페이지네이션 기본값 설정
         * */
        PaginatedDigitalTwinMetadata paginatedDigitalTwinMetadata = PaginatedDigitalTwinMetadata.builder()
                .curPage(Integer.parseInt(curPage.toString()))
                .pageListSize(Integer.parseInt(pageListSize.toString()))
                .arrayDataLimit(arrayDataLimit)
                .objectRefFormat(objectRefFormat)
                .dTw_objs_attr(dTwObjsAttr)
                .isPaging(true)
                .startIndex(0)
                .totalListSize(0)
                .totalPage(1)
                .limitListSize(20)
                .dTw_attr_name(dTwAttrName)
                .build();
        try {
            ResponseEntity<String> response = metaApiRequest("/meta/digitalTwins/search", params, HttpMethod.GET);
            if (response != null) {
                log.debug("response -> {}", response.getBody());
                JsonNode jsonObject = new ObjectMapper().readTree(Objects.requireNonNull(response.getBody()));
                //페이지 정보 설정
                JsonNode pageInfo = jsonObject.get("pageInfo");
                paginatedDigitalTwinMetadata.setCurPage(pageInfo.get("curPage").asInt());
                paginatedDigitalTwinMetadata.setPageListSize(pageInfo.get("pageListSize").asInt());
                paginatedDigitalTwinMetadata.setPaging(pageInfo.get("isPaging").asBoolean());
                paginatedDigitalTwinMetadata.setStartIndex(pageInfo.get("startIndex").asInt());
                paginatedDigitalTwinMetadata.setTotalListSize(pageInfo.get("totalListSize").asInt());
                paginatedDigitalTwinMetadata.setTotalPage(pageInfo.get("totalPage").asInt());
                paginatedDigitalTwinMetadata.setLimitListSize(pageInfo.get("limitListSize").asInt());

                //데이터 설정
                ObjectMapper objectMapper = new ObjectMapper();
                paginatedDigitalTwinMetadata.setData(
                        objectMapper.readValue(
                                jsonObject.get("responseData").toString(), new TypeReference<List<DigitalTwinMetadata>>() {
                                }
                        )
                );
            } else {
                paginatedDigitalTwinMetadata.setData(new ArrayList<>());
            }
            return paginatedDigitalTwinMetadata;
        } catch (Exception e) {
            log.error("Error fetching digital twins", e);
            paginatedDigitalTwinMetadata.setData(new ArrayList<>());
            return paginatedDigitalTwinMetadata;
        }
    }

    public List<String> createDigitalTwinObjects(String digitalTwinId, List<DigitalTwinMetadata.DigitalTwinObject> digitalTwinObjects) {
        List<String> createdObjectIds = new ArrayList<>();
        try {
            if (digitalTwinId == null || digitalTwinId.isEmpty()) {
                log.error("Digital Twin ID is null or empty");
                return createdObjectIds; // 빈 리스트 반환
            }

            // cURL 요청에 맞게 최상위 Key를 "digitalTwinObjects"로 하는 Map 생성
            Map<String, Object> payload = new HashMap<>();
            payload.put("digitalTwinObjects", digitalTwinObjects);

            // PUT 메서드로 Meta API 호출 (endpoint: /meta/digitalTwins/{dtid})
            String endpoint = "/meta/digitalTwins/" + digitalTwinId;
            ResponseEntity<String> response = metaApiRequestWithBody(endpoint, payload, HttpMethod.PUT);
            if (response != null && response.getBody() != null) {
                // JSON 파싱 (Jackson 사용 — get() 은 키가 없으면 null 을 반환하므로 기존 opt* 와 동일하게 동작한다)
                JsonNode jsonObject = new ObjectMapper().readTree(response.getBody());
                JsonNode responseData = jsonObject.get("responseData");

                if (responseData != null && responseData.size() > 0) {
                    JsonNode dataObj = responseData.get(0);
                    JsonNode etcInfo = dataObj.get("etcInfo");

                    if (etcInfo != null && etcInfo.size() > 0) {
                        JsonNode etcObj = etcInfo.get(0);
                        JsonNode outputData = etcObj.get("outputData");

                        if (outputData != null) {
                            JsonNode relatedIds = outputData.get("relatedIds");

                            if (relatedIds != null) {
                                JsonNode dtObjIds = relatedIds.get("digitalTwinObjects");

                                // 배열 데이터를 List<String>으로 변환
                                if (dtObjIds != null) {
                                    for (int i = 0; i < dtObjIds.size(); i++) {
                                        createdObjectIds.add(dtObjIds.get(i).asText());
                                    }
                                }
                            }
                        }
                    }
                }
                log.info("디지털 트윈 객체 생성 성공. DTID: {}, 생성된 객체 IDs: {}", digitalTwinId, createdObjectIds);
            } else {
                log.info("디지털 트윈 객체 생성 응답이 null 입니다. DTID: {}", digitalTwinId);
            }
            return createdObjectIds;
        } catch (Exception e) {
            log.error("Error creating digital twin objects for DTID: " + digitalTwinId, e);
            throw new RuntimeException("Digital Twin Object 생성 중 오류가 발생했습니다.", e);
        }
    }

    public List<DigitalTwinMetadata.DigitalTwinObject> getDigitalTwinObjects(Integer curPage, Integer pageListSize, Integer arrayDataLimit, String objectRefFormat, String dTwObjsAttr, String dTwAttrDtid) {
        Map<String, String> params = new HashMap<>();
        params.put("curPage", curPage.toString());
        params.put("pageListSize", pageListSize.toString());
        params.put("arrayDataLimit", arrayDataLimit.toString());
        params.put("objectRefFormat", objectRefFormat);
        params.put("dTw_objs_attr", dTwObjsAttr);
        if (dTwAttrDtid != null && !dTwAttrDtid.isEmpty()) {
            params.put("dTw_attr_dtid", dTwAttrDtid);
        }

        List<DigitalTwinMetadata.DigitalTwinObject> digitalTwinObjects = new ArrayList<>();

        try {
            ResponseEntity<String> response = metaApiRequest("/meta/digitalTwins/search", params, HttpMethod.GET);
            if (response != null) {
                log.debug("response -> {}", response.getBody());
                JsonNode jsonObject = new ObjectMapper().readTree(Objects.requireNonNull(response.getBody()));
                //데이터 설정
                ObjectMapper objectMapper = new ObjectMapper();
                List<DigitalTwinMetadata> digitalTwins = objectMapper.readValue(
                        jsonObject.get("responseData").toString(), new TypeReference<List<DigitalTwinMetadata>>() {
                        }
                );

                if (digitalTwins.size() != 0) {
                    digitalTwinObjects = digitalTwins.get(0).getDigitalTwinObjects();
                } else {
                    digitalTwinObjects = new ArrayList<>();
                }
            } else {
                digitalTwinObjects = new ArrayList<>();
            }
            return digitalTwinObjects;
        } catch (Exception e) {
            log.error("Error fetching digital twins", e);
            digitalTwinObjects = new ArrayList<>();
            return digitalTwinObjects;
        }
    }

    public DigitalTwinMetadata.DigitalTwinObject getDigitalTwinObject(Integer curPage, Integer pageListSize, Integer arrayDataLimit, String objectRefFormat, String dTwObjsAttr, String dTwAttrDtid, String objAttrDtoid) {
        Map<String, String> params = new HashMap<>();
        params.put("curPage", curPage.toString());
        params.put("pageListSize", pageListSize.toString());
        params.put("arrayDataLimit", arrayDataLimit.toString());
        params.put("objectRefFormat", objectRefFormat);
        params.put("dTw_objs_attr", dTwObjsAttr);
        if (dTwAttrDtid != null && !dTwAttrDtid.isEmpty()) {
            params.put("dTw_attr_dtid", dTwAttrDtid);
        }
        if (objAttrDtoid != null && !objAttrDtoid.isEmpty()) {
            params.put("obj_attr_dtoid", objAttrDtoid);
        }

        DigitalTwinMetadata.DigitalTwinObject digitalTwinObject = null;

        try {
            ResponseEntity<String> response = metaApiRequest("/meta/digitalTwins/search", params, HttpMethod.GET);
            if (response != null) {
                log.debug("response -> {}", response.getBody());
                JsonNode jsonObject = new ObjectMapper().readTree(Objects.requireNonNull(response.getBody()));
                //데이터 설정
                ObjectMapper objectMapper = new ObjectMapper();
                List<DigitalTwinMetadata> digitalTwins = objectMapper.readValue(
                        jsonObject.get("responseData").toString(), new TypeReference<List<DigitalTwinMetadata>>() {
                        }
                );

                if (!digitalTwins.isEmpty()) {
                    for (DigitalTwinMetadata.DigitalTwinObject object : digitalTwins.get(0).getDigitalTwinObjects()) {
                        if (object.getDtoid().equals(objAttrDtoid)) {
                            digitalTwinObject = object;
                            log.info("digitalTwinObject -> {}", digitalTwinObject);
                        }
                    }
                }
            }
            return digitalTwinObject;
        } catch (Exception e) {
            log.error("Error fetching digital twins", e);
            return digitalTwinObject;
        }
    }

    /**
     * 1. Target Properties 찾기
     */
    public Map<String, Object> findInnerProperties(Map<String, Object> schemaInfo) {
        if (schemaInfo == null || !schemaInfo.containsKey("properties")) return null;

        Map<String, Object> rootProperties = (Map<String, Object>) schemaInfo.get("properties");

        // Type 2: properties 안에 "data"가 있는 경우 -> data.items.properties 안으로 진입
        if (rootProperties.containsKey("data") && rootProperties.get("data") instanceof Map) {
            Map<String, Object> dataObj = (Map<String, Object>) rootProperties.get("data");
            if (dataObj.containsKey("items") && dataObj.get("items") instanceof Map) {
                Map<String, Object> itemsObj = (Map<String, Object>) dataObj.get("items");
                if (itemsObj.containsKey("properties") && itemsObj.get("properties") instanceof Map) {
                    return (Map<String, Object>) itemsObj.get("properties");
                }
            }
        }

        // Type 1: properties 안에 "data"가 없는 경우 -> 현재 properties 반환
        return rootProperties;
    }

    /**
     * 2. Target Required 찾기
     */
    public List<String> findInnerRequired(Map<String, Object> schemaInfo) {
        if (schemaInfo == null || !schemaInfo.containsKey("properties")) return null;

        Map<String, Object> rootProperties = (Map<String, Object>) schemaInfo.get("properties");

        // Type 2: properties 안에 "data"가 있는 경우 -> data.items.required 반환
        if (rootProperties.containsKey("data") && rootProperties.get("data") instanceof Map) {
            Map<String, Object> dataObj = (Map<String, Object>) rootProperties.get("data");
            if (dataObj.containsKey("items") && dataObj.get("items") instanceof Map) {
                Map<String, Object> itemsObj = (Map<String, Object>) dataObj.get("items");
                if (itemsObj.containsKey("required") && itemsObj.get("required") instanceof List) {
                    return (List<String>) itemsObj.get("required");
                }
            }
        }

        // Type 1: properties 안에 "data"가 없는 경우 -> 루트 레벨의 required 반환
        if (schemaInfo.containsKey("required") && schemaInfo.get("required") instanceof List) {
            return (List<String>) schemaInfo.get("required");
        }

        return null;
    }

    /**
     * JSON 스키마의 타입을 식별합니다.
     * 실제 데이터 필드(co, temp 등) 정의 내부에 "value" 속성이 있다면 NGSI-LD로 간주합니다.
     *
     * @param schemaInfo 최상위 스키마 맵 (schemaInformation 전체)
     * @return SchemaType 문자열 ("NGSI_LD" 또는 "DATA")
     */
    public String checkSchemaType(Map<String, Object> schemaInfo) {
        if (schemaInfo == null) return null;

        // 1. 실제 데이터 필드들이 모여있는 타겟 Properties 맵을 가져옵니다.
        Map<String, Object> targetProps = findInnerProperties(schemaInfo);

        if (targetProps == null || targetProps.isEmpty()) {
            return null; // 유효한 데이터 속성을 찾을 수 없음
        }

        // 2. 타겟 Properties 내부의 속성(co, temp 등)들을 순회하며 검사합니다.
        for (Object fieldDef : targetProps.values()) {
            if (fieldDef instanceof Map) {
                Map<String, Object> fieldMap = (Map<String, Object>) fieldDef;

                // NGSI-LD의 특징: 필드 정의 자체가 "object"이고, 내부에 "properties"를 가지며,
                // 그 하위에 "value", "type", "observedAt" 등을 가집니다.
                if (fieldMap.containsKey("properties")) {
                    Object innerProps = fieldMap.get("properties");

                    if (innerProps instanceof Map && ((Map<?, ?>) innerProps).containsKey("value")) {
                        return "NGSI_LD"; // "value" 속성이 발견되면 즉시 NGSI-LD로 확정
                    }
                }
            }
        }

        // 위 조건을 만족하는 필드가 하나도 없다면, 일반적인 DATA 형태로 간주합니다.
        return "DATA";
    }
}
