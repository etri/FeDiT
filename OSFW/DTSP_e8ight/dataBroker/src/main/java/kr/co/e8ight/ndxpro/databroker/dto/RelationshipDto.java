package kr.co.e8ight.ndxpro.databroker.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.TYPE;
import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.OBJECT;
import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.OBSERVED_AT;

@NoArgsConstructor
@JsonIgnoreProperties(value = { "md", "mdNames" })
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RelationshipDto extends LinkedHashMap<String, Object> {

    private String type;

    private Object object; // String or Array String

    private String observedAt;

    public String getType() {
        return (String) super.get(TYPE.getCode());
    }

    public void setType(String type) {
        super.put(TYPE.getCode(), type);
    }

    public Object getObject() {
        return (Object) super.get(OBJECT.getCode());
    }

    public void setObject(Object object) {
        super.put(OBJECT.getCode(), object);
    }

    public String getObservedAt() {
        return (String) super.get(OBSERVED_AT.getCode());
    }

    public void setObservedAt(String observedAt) {
        super.put(OBSERVED_AT.getCode(), observedAt);
    }
}
