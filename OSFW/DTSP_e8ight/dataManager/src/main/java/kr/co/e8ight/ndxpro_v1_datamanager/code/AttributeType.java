package kr.co.e8ight.ndxpro_v1_datamanager.code;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum AttributeType {
    @JsonProperty("Property")
    PROPERTY("Property"),
    @JsonProperty("GeoProperty")
    GEO_PROPERTY("GeoProperty"),
    @JsonProperty("RelationShip")
    RELATIONSHIP("Relationship");
    private String code;

    AttributeType(String code) {
        this.code = code;
    }

    public String getCode() {
        return this.code;
    }
}
