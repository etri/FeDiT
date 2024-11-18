package kr.co.e8ight.ndxpro.databroker.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.TYPE;
import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.VALUE;
import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.OBSERVED_AT;

@NoArgsConstructor
@JsonIgnoreProperties(value = { "md", "mdNames" })
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeoPropertyDto extends LinkedHashMap<String, Object> {

    private String type;

    private GeoJsonImpl value;

    private String observedAt;

    public String getType() {
        return (String) super.get(TYPE.getCode());
    }

    public void setType(String type) {
        super.put(TYPE.getCode(), type);
    }

    public GeoJsonImpl getValue() {
        return (GeoJsonImpl) super.get(VALUE.getCode());
    }

    public void setValue(GeoJsonImpl value) {
        super.put(VALUE.getCode(), value);
    }

    public String getObservedAt() {
        return (String) super.get(OBSERVED_AT.getCode());
    }

    public void setObservedAt(String observedAt) {
        super.put(OBSERVED_AT.getCode(), observedAt);
    }

    public void mapGeoJson() {
        ObjectMapper objectMapper = new ObjectMapper();
        GeoJsonImpl geoJson = objectMapper.convertValue(super.get(VALUE.getCode()), GeoJsonImpl.class);
        if(geoJson == null)
            throw new DataBrokerException(ErrorCode.BAD_REQUEST_DATA, "Fail to map GeoProperty value to GeoJsonImpl.");
        setValue(geoJson);
    }
}
