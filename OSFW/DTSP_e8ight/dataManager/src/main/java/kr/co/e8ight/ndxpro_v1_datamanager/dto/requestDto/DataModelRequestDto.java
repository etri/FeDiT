package kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@ToString
public class DataModelRequestDto {

    @Schema(description = "모델Id", example = "urn:e8ight:Building:")
    private String id;

    @Schema(description = "모델타입", example = "Building")
    private String type;

    @Schema(description = "모델버전", example = "1.0")
    private String version;

    @Schema(description = "제목", example = "NDX-PRO - Building DataModel")
    private String title;

    @Schema(description = "설명", example = "Information on a given Building")
    private String description;

    @Schema(description = "속성", example = "{\"address\": \"e8ight:address\",\n"
            + "    \"category\": \"e8ight:category\",\n"
            + "    \"location\": \"ngsi-ld:location\",\n"
            + "    \"owner\": \"e8ight:owner\",\n"
            + "    \"floorsAboveGround\": \"e8ight:floorsAboveGround\",\n"
            + "    \"floorsBelowGround\": \"e8ight:floorsBelowGround\"}")
    private Map<String, String> attributeNames;

    @Schema(description = "속성", example = "{\"address\": {\n"
            + "      \"type\": \"Property\",\n"
            + "      \"description\": \"주소 정보\",\n"
            + "      \"valueType\": \"String\",\n"
            + "      \"objectMember\": {\n"
            + "        \"addressLocality\": {\n"
            + "          \"valueType\": \"String\"\n"
            + "        },\n"
            + "        \"postalCode\": {\n"
            + "          \"valueType\": \"String\"\n"
            + "        },\n"
            + "        \"streetAddress\": {\n"
            + "          \"valueType\": \"String\"\n"
            + "        },\n"
            + "        \"type\": {\n"
            + "          \"valueType\": \"String\"\n"
            + "        }\n"
            + "      }\n"
            + "    },\n"
            + "    \"category\": {\n"
            + "      \"type\": \"Property\",\n"
            + "      \"description\": \"건물 유형\",\n"
            + "      \"valueType\": \"string\",\n"
            + "      \"enum\": [\n"
            + "        \"apartments\",\n"
            + "        \"cabin\",\n"
            + "        \"office\"\n"
            + "      ]\n"
            + "    },\n"
            + "    \"location\": {\n"
            + "      \"type\": \"GeoProperty\",\n"
            + "      \"description\": \"건물 위치\",\n"
            + "      \"valueType\": \"POLYGON\"\n"
            + "    },\n"
            + "    \"owner\": {\n"
            + "      \"type\": \"Relationship\",\n"
            + "      \"description\": \"소유자\",\n"
            + "      \"valueType\": \"String\",\n"
            + "      \"modelType\": [\n"
            + "        \"urn:e8ight:cdfd9cb8-ae2b-47cb-a43a-b9767ffd5c84\"\n"
            + "      ]\n"
            + "    },\n"
            + "    \"floorsAboveGround\": {\n"
            + "      \"type\": \"Property\",\n"
            + "      \"description\": \"지상층\",\n"
            + "      \"valueType\": \"Integer\"\n"
            + "    },\n"
            + "    \"floorsBelowGround\": {\n"
            + "      \"type\": \"Property\",\n"
            + "      \"description\": \"지하층\",\n"
            + "      \"valueType\": \"Integer\"\n"
            + "    }}")
    private HashMap<String, Object> attributes;


    @Schema(description = "필수속성", example = "[\n"
            + "      \"category\",\n"
            + "      \"address\"\n"
            + "    ]")
    private List<String> required;

    @Schema(description = "참고문서", example = "[\n"
            + "      \"https://geojson.org/schema/Geometry.json\"\n"
            + "    ]")
    private List<String> reference;


    @Schema(description = "동적속성 여부", example = "  \"isDynamic\": false,",required = true)
    private Boolean isDynamic;

    @Schema(description = "모델 준비 유무", example = "\"isReady\": false",required = true)
    private Boolean isReady;

}
