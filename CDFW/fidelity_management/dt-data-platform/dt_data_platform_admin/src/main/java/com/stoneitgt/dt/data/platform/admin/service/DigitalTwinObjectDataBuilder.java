package com.stoneitgt.dt.data.platform.admin.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.stoneitgt.dt.data.platform.domain.sync.DigitalTwinObjectData;
import com.stoneitgt.dt.data.platform.domain.sync.DynamicProperty;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Data
public class DigitalTwinObjectDataBuilder {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 제공된 스키마와 원본 데이터를 바탕으로 DigitalTwinObjectData 리스트 생성
     */
    public List<DigitalTwinObjectData> buildDigitalTwinDataWithType(Map<String, Object> schema, List<Map<String, Object>> rawDataList, String twinId, String objId, String timeKey) {

        if (rawDataList == null || rawDataList.isEmpty()) return Collections.emptyList();

        // 1. 스키마의 properties 추출
        Map<String, Object> properties = (Map<String, Object>) schema.get("properties");
        if (properties == null) {
            log.error("Schema properties not found");
            return Collections.emptyList();
        }

        // 2. 데이터 변환 및 빌드
        return rawDataList.stream().map(row -> {
            String rowTime = String.valueOf(row.getOrDefault(timeKey, null));

            // 스키마 정의에 따른 타입 캐스팅 진행
            Map<String, Object> castedData = new HashMap<>();

            for (String key : properties.keySet()) {
                if (row.containsKey(key)) {
                    Map<String, Object> fieldDef = (Map<String, Object>) properties.get(key);
                    String type = (String) fieldDef.get("type");
                    castedData.put(key, castValue(row.get(key), type));
                }
            }

            // DigitalTwinObjectData 객체 생성 (기존 필드 구조 유지)
            return DigitalTwinObjectData.builder().digital_twin_id(twinId).digital_object_id(objId).rowtime(rowTime).data(castedData) // 변환된 Map을 직접 주입
                    .location("POINT EMPTY") // 요구사항에 따라 좌표 로직 추가 가능
                    .build();
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> buildDigitalTwinData(Map<String, Object> schema, List<Map<String, Object>> rawDataList, String twinId, String objId, String timeKey) {
        log.info("Building digital twin data with schema type casting. TwinId: {}, ObjId: {}, TimeKey: {}", twinId, objId, timeKey);
        if (rawDataList == null || rawDataList.isEmpty()) return Collections.emptyList();
        // 1. 스키마의 properties 추출 및 타입 검증
        MetaAPIService metaAPIService = new MetaAPIService();
        Map<String, Object> properties = metaAPIService.findInnerProperties(schema);
        if (properties == null) {
            log.error("Schema properties not found");
            return Collections.emptyList();
        }

        // 2. 데이터 변환 및 빌드
        return rawDataList.stream().map(row -> {
            // 스키마 정의에 따른 타입 캐스팅 진행
            Map<String, Object> castedData = new HashMap<>();

            for (String key : properties.keySet()) {
                if (row.containsKey(key)) {
                    Map<String, Object> fieldDef = (Map<String, Object>) properties.get(key);
                    String type = (String) fieldDef.get("type");
                    castedData.put(key, castValue(row.get(key), type));
                }
            }

            // DigitalTwinObjectData 객체 생성 (기존 필드 구조 유지)
            return castedData;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> buildDigitalTwinNgsiLdData(Map<String, Object> schema, List<Map<String, Object>> rawDataList, String twinId, String objId, String timeKey) {
        if (rawDataList == null || rawDataList.isEmpty()) return Collections.emptyList();
        log.info("Building digital twin data with schema type casting. TwinId: {}, ObjId: {}, TimeKey: {}", twinId, objId, timeKey);

        // 1. 스키마의 properties 추출 및 타입 검증
        MetaAPIService metaAPIService = new MetaAPIService();
        Map<String, Object> properties = metaAPIService.findInnerProperties(schema);
        if (properties == null) {
            log.error("Schema properties not found");
            return Collections.emptyList();
        }

        // 2. Stream을 활용한 NGSI-LD 데이터 변환 및 빌드
        return rawDataList.stream().map(row -> {
            Map<String, Object> transformedRecord = new HashMap<>();
            // 시간 기준값(observedAt) 추출
            String observedAt = row.get(timeKey) != null ? row.get(timeKey).toString() : null;

            // 스키마 정의에 따른 타입 캐스팅 및 DTO 래핑 진행
            for (String key : properties.keySet()) {
                if (row.containsKey(key)) {
                    // a. 스키마 구조에 따라 예상되는 실제 값의 타입("number", "string" 등) 추출
                    Map<String, Object> fieldDef = (Map<String, Object>) properties.get(key);
                    String expectedType = extractExpectedType(fieldDef, "NGSI_LD");

                    // c. DTO를 이용한 NGSI-LD Property 객체 생성
                    DynamicProperty<Object> dynamicProp = DynamicProperty.builder()
                            .type("Property")
                            .value(castValue(row.get(key), expectedType))
                            .observedAt(observedAt)
                            .build();

                    transformedRecord.put(key, dynamicProp);
                }
            }
            return transformedRecord;
        }).collect(Collectors.toList());
    }

    /**
     * 스키마 타입에 따른 실제 형변환
     */
    private Object castValue(Object value, String type) {
        if (value == null) return null;
        String strVal = String.valueOf(value);

        try {
            switch (type.toLowerCase()) {
                case "number":
                    return Double.parseDouble(strVal);
                case "integer":
                    return (int) Math.round(Double.parseDouble(strVal));
                case "boolean":
                    return Boolean.parseBoolean(strVal);
                case "string":
                default:
                    return strVal;
            }
        } catch (Exception e) {
            log.warn("Casting failed for value: {} to type: {}", strVal, type);
            return strVal; // 실패 시 문자열 유지
        }
    }

    /**
     * 스키마 구조(NGSI-LD vs DATA)에 맞춰 실제 데이터의 type을 찾아내는 헬퍼 메서드
     */
    private String extractExpectedType(Map<String, Object> fieldDef, String schemaType) {
        if (fieldDef == null) return "string"; // 기본값

        if ("NGSI_LD".equals(schemaType)) {
            // NGSI-LD: {"type": "object", "properties": {"value": {"type": "number"}}} 구조
            if (fieldDef.containsKey("properties")) {
                Map<String, Object> innerProps = (Map<String, Object>) fieldDef.get("properties");
                if (innerProps.containsKey("value")) {
                    Map<String, Object> valProp = (Map<String, Object>) innerProps.get("value");
                    return (String) valProp.get("type"); // "number", "string" 등을 반환
                }
            }
            return "string";
        } else {
            // 일반 DATA: {"type": "number"} 구조
            return (String) fieldDef.get("type");
        }
    }
}