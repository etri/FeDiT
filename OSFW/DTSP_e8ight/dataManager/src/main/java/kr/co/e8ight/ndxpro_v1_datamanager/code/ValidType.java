package kr.co.e8ight.ndxpro_v1_datamanager.code;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum ValidType {


    @JsonProperty("minimum")
    MINIMUM("minimum"),

    @JsonProperty("maximum")
    MAXIMUM("maximum"),

    @JsonProperty("minLength")
    MINLENGTH("minLength"),

    @JsonProperty("maxLength")
    MAXLENGTH("maxLength");


    private String code;

    private ValidType(String code) {
        this.code = code;
    }

    public String getCode() {
        return this.code;
    }
}
