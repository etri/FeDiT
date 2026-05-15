package com.stoneitgt.dt.data.platform.domain.meta;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DigitalTwinMetadata {

    private String dtid;
    private String type; // 단일, 연합 등
    private String name;
    private String description;
    private String owner;
    private String contactPoint;
    private String creator;
    private String creationTime;
    private String modificationTime;

    // JSON에서 subjects는 "[\"A\", \"B\"]" 형태의 문자열 리스트일 수 있음
    private List<String> subjects;
    private List<String> keywords;

    private GeoLocation location;
    private String pointOfAccess;

    private List<DigitalTwinObject> digitalTwinObjects;
    private List<String> sensors;
    private List<String> controllers;
    private List<String> simulations;

    // 기타 필드
    private List<Object> visualModels;
    private List<Object> services;
    private List<Object> subscriptions;
    private List<Object> behaviorModels;
    private List<Object> digitalTwins;
    private List<Object> federatedDigitalTwinObjects;
    private List<Object> relationships;
    private List<Object> validationModels;
    private List<Object> fidelityModels;

    private String countryCode;
    private String classificationTypeCode;
    private String classificationCode;

    /**
     * 위치 정보 (GeoJSON 기반)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeoLocation {
        private String address_kr;
        private String type; // Point, MultiPoint 등
        private List<List<Double>> coordinates; // 좌표 데이터 (List<Double> 또는 List<List<Double>>)
    }

    /**
     * 디지털 트윈 객체 (DTO)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DigitalTwinObject {
        private String name;
        private String dtoid;
        private List<String> keywords;
        private List<String> subjects;
        private String countryCode;
        private String description;
        private String creationTime;
        private String modificationTime;
        private List<String> relatedSensors;
        private Object relatedControllers;
        private Object relatedVisualModels;
        private DigitalTwinObjectData digitalTwinObjectData;
        private Object relatedDigitalTwinObjects;
        private String objectPrimaryClassificationCode;
        private String objectSecondaryClassificationCode;


        @JsonCreator
        public static DigitalTwinObject fromString(String value) {
            // JSON이 객체가 아닌 단순 문자열(ID)로 들어올 경우,
            // dtoid 필드만 채워진 객체를 반환하도록 설정합니다.
            return DigitalTwinObject.builder()
                    .dtoid(value)
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DigitalTwinObjectData {
        private String contextURL;
        private String dataAccessURL;
        private Integer updateInterval;
        private Map<String, Object> schemaInformation; // JSON Schema 구조는 Map으로 수용
    }

    /**
     * 센서 정보
     */
    /*@Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Sensor {
        private String sid;
        private String name;
        private String owner;
        private List<String> keywords;
        private List<String> subjects;
        private String sourceType;
        private String description;
        private String installTime;
        private String creationTime;
        private String dataInterval;
        private GeoLocation installLocation;
        private String modificationTime;
    }*/

    /**
     * 제어기 정보
     */
    /*@Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Controller {
        private String cid;
        private String name;
        private String owner;
        private List<String> keywords;
        private List<String> subjects;
        private String controlType;
        private String description;
        private String installTime;
        private String creationTime;
        private String controlAccessURL;
        private GeoLocation installLocation;
        private String modificationTime;
        private String deliveryTimeout;
        private String executionTimeout;
        private String timeoutNotification;
    }*/

    /**
     * 시뮬레이션 정보
     */
    /*@Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Simulation {
        private String name;
        private String dtsimid;
        private List<String> keywords;
        private List<String> subjects;
        private String description;
        private String creationTime;
        private String modificationTime;
        private String interfaceType;
        private String responseFormatType;
        private String simulationAccessURL;
        private String authorization;
        private Object errorInfo;
        private Object simulationRequestParam;
        private Map<String, Object> simulationResponseInfo; // 응답 규격
    }*/
}