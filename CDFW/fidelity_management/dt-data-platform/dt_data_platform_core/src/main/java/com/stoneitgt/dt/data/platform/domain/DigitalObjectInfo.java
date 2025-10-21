package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

import java.util.ArrayList;

@Data
public class DigitalObjectInfo {
    private String metaTypeModel;
    private String metaModel;
    private String digitalObjectId;
    private String digitalObjectName;
    private String description;
    private String subjectConcept;
    private ArrayList<String> keywords;
    private ArrayList<String> subjects;
    private ArrayList<String> subject2;
    private String modificationTime;
    private String creationTime;
    private int memberSensorCount;
    private int memberControllerCount;
    private String memberSensorIds;
    private String memberControllerIds;
    private DigitalTwinObjectData digitalTwinObjectData;
    private ArrayList<String> referenceSensors;
    private ArrayList<String> referenceControllers;
    private ArrayList<String> referenceVisualModels;
    private ArrayList<String> nearBusStopList;
    private String measurePositionId;
    private String idSchmCountryCode;
    private String idSchmType;
    private String idSchmCode;
    private String contentsid;
    private String contentscd;
    private String address;
    private String roadaddress;
    private String introduction;
    private String postcode;
    private String phoneno;
    private String url;
    private String fee;
    private String parking;
    private String useTime;
    private int status;
    private String metaStatusCode;
    private String metaStatusName;
    private String timestamp;
    private String error;
    private String message;
    private String exception;
    private String path;
    private ArrayList<String> testArray;
    private String createDateTime;
    private String updateDateTime;
}
