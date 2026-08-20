package kr.co.e8ight.ndxpro_v1_datamanager.code;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum AttributeValueType {
    @JsonProperty("String")
    STRING("String"),

    @JsonProperty("Enum")
    ENUM("Enum"),
    @JsonProperty("Integer")
    INTEGER("Integer"),
    @JsonProperty("Double")
    DOUBLE("Double"),
    @JsonProperty("Boolean")
    BOOLEAN("Boolean"),
    @JsonProperty("Date")
    DATE("Date"),
    @JsonProperty("Object")
    OBJECT("Object"),
    @JsonProperty("ArrayString")
    ARRAY_STRING("ArrayString"),
    @JsonProperty("ArrayInteger")
    ARRAY_INTEGER("ArrayInteger"),
    @JsonProperty("ArrayDouble")
    ARRAY_DOUBLE("ArrayDouble"),
    @JsonProperty("ArrayBoolean")
    ARRAY_BOOLEAN("ArrayBoolean"),
    @JsonProperty("ArrayObject")
    ARRAY_OBJECT("ArrayObject");


    public String getCode() {
        return code;
    }

    private String code;


}