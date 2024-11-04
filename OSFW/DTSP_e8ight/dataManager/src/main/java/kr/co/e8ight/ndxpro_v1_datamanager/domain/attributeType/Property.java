package kr.co.e8ight.ndxpro_v1_datamanager.domain.attributeType;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import kr.co.e8ight.ndxpro_v1_datamanager.domain.ValidInfo;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Field;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Property {

    private String type;

    private String description;

    private String valueType;

    private Map<String, Object> objectMember;

    private Object value;

    private ValidInfo valid;

    private String format;

    @Field("enum")
    @JsonProperty("enum")
    private List<String> enumList;

    private Map<String, String> childAttributeNames;

    private Map<String, Object> childAttributes;

    private HashMap<String, Object> md;

    private List<String> mdNames = null;
}