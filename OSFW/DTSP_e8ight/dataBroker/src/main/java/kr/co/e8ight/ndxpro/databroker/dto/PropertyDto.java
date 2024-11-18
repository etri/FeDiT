package kr.co.e8ight.ndxpro.databroker.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.TYPE;
import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.VALUE;
import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.OBSERVED_AT;
import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.UNIT_CODE;

@NoArgsConstructor
@JsonIgnoreProperties(value = { "md", "mdNames" })
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PropertyDto extends LinkedHashMap<String, Object> {

    private String type;

    private Object value;

    private String observedAt;

    private String unitCode;

    public String getType() {
        return (String) super.get(TYPE.getCode());
    }

    public void setType(String type) {
        super.put(TYPE.getCode(), type);
    }

    public Object getValue() {
        return (Object) super.get(VALUE.getCode());
    }

    public void setValue(Object value) {
        super.put(VALUE.getCode(), value);
    }

    public String getObservedAt() {
        return (String) super.get(OBSERVED_AT.getCode());
    }

    public void setObservedAt(String observedAt) {
        super.put(OBSERVED_AT.getCode(), observedAt);
    }

    public String getUnitCode() {
        return (String) super.get(UNIT_CODE.getCode());
    }

    public void setUnitCode(String unitCode) {
        super.put(UNIT_CODE.getCode(), unitCode);
    }
}
