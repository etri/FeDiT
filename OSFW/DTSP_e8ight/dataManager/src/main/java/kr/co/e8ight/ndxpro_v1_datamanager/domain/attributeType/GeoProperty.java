package kr.co.e8ight.ndxpro_v1_datamanager.domain.attributeType;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mongodb.client.model.geojson.GeoJsonObjectType;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeoProperty {

    private String type;

    private String description;

    private GeoJsonObjectType valueType;

    private String format;

    private Map<String, String> childAttributeNames;

    private Map<String, Object> childAttributes;

}