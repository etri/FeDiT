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
    private ArrayList<String> keywords;
    private ArrayList<String> subjects;
    private String modificationTime;
    private String creationTime;
    private int memberSensorCount;
    private int memberControllerCount;
    private String memberSensorIds;
    private String memberControllerIds;
    private DigitalTwinObjectData digitalTwinObjectData;
    private ArrayList<String> referenceSensors;
    private String referenceControllers;
    private String referenceVisualModels;
    private String idSchmCountryCode;
    private String idSchmType;
    private String idSchmCode;
    private int status;
    private String timestamp;
    private String error;
    private String message;
    private String exception;
    private String path;
}
