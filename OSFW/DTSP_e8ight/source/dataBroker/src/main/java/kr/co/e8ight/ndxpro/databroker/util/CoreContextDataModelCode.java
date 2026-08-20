package kr.co.e8ight.ndxpro.databroker.util;

import com.fasterxml.jackson.annotation.JsonValue;

public enum CoreContextDataModelCode {
    ID("id"),
    TYPE("type"),
    CONTEXT("@context"),

    PROPERTY("Property"),
    GEO_PROPERTY("GeoProperty"),
    RELATIONSHIP("Relationship"),

    OBJECT("object"),
    VALUE("value"),
    UNIT_CODE("unitCode"),
    OBSERVED_AT("observedAt");

    private String code;

    private CoreContextDataModelCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    @JsonValue
    public static boolean hasCoreContextDataModel(String code) {
        for (CoreContextDataModelCode coreContextDataModel : values()) {
            if (coreContextDataModel.getCode().equals(code))
                return true;
        }
        return false;
    }
}
