package kr.co.e8ight.ndxpro.databroker.util;

import com.fasterxml.jackson.annotation.JsonValue;

public enum EntityMongoDBDocumentKeyCode {
    ID("_id"),
    ATTRS("attrs"),
    ATTR_NAMES("attrNames"),
    CONTEXT("@context");

    private String code;

    private EntityMongoDBDocumentKeyCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    @JsonValue
    public static boolean hasEntityMongoDBDocumentKey(String code) {
        for (EntityMongoDBDocumentKeyCode coreContextDataModel : values()) {
            if (coreContextDataModel.getCode().equals(code))
                return true;
        }
        return false;
    }
}
