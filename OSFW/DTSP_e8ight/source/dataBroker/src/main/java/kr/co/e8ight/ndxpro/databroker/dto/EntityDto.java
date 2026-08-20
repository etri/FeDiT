package kr.co.e8ight.ndxpro.databroker.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.*;

@NoArgsConstructor
@JsonIgnoreProperties(value = { "creDate", "modDate" })
public class EntityDto extends LinkedHashMap<String, Object> {

    private String id;

    private String type;

    public String getId() {
        return (String) super.get(ID.getCode());
    }

    public void setId(String id) {
        super.put(ID.getCode(), id);
    }

    public String getType() {
        return (String) super.get(TYPE.getCode());
    }

    public void setType(String type) {
        super.put(TYPE.getCode(), type);
    }

    public String getContext() {
        return (String) super.get(CONTEXT.getCode());
    }

    public void setContext(String context) {
        super.put(CONTEXT.getCode(), context);
    }

}
