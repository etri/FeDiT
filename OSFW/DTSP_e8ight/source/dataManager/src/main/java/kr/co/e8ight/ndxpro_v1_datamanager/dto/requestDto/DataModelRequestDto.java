package kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.ArraySchema;
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
@Schema(description = "데이터 모델 생성/버전업/수정 요청")
public class DataModelRequestDto {

    @Schema(description = "모델 id. `urn:{리소스}:{type}:` 형식이어야 하며 `{리소스}` 는 context 등록 시 접두어로 사용됩니다.",
            example = "urn:e8ight:Building:", required = true)
    private String id;

    @Schema(description = "모델 type (Entity 타입). 대문자로 시작해야 하며 모델을 식별하는 key 입니다.",
            example = "Building", required = true)
    private String type;

    @Schema(description = "모델 버전. 서버가 자동으로 관리하므로 생성 시 1.0, 버전업 시 minor 증가. 요청 값은 무시됩니다.",
            example = "1.0", accessMode = Schema.AccessMode.READ_ONLY)
    private String version;

    @Schema(description = "제목", example = "NDX-PRO - Building DataModel")
    private String title;

    @Schema(description = "설명", example = "Information on a given Building")
    private String description;

    @Schema(description = "속성명 → context 매핑. `attributes` 의 모든 key 가 여기에도 있어야 하며, "
            + "값은 `{접두어}:{속성 id}` 형태로 context 등록 시 그대로 사용됩니다.",
            example = "{\"address\": \"e8ight:address\",\n"
            + "    \"category\": \"e8ight:category\",\n"
            + "    \"location\": \"ngsi-ld:location\",\n"
            + "    \"owner\": \"e8ight:owner\",\n"
            + "    \"floorsAboveGround\": \"e8ight:floorsAboveGround\",\n"
            + "    \"floorsBelowGround\": \"e8ight:floorsBelowGround\"}", required = true)
    private Map<String, String> attributeNames;

    @Schema(description = "속성 정의. key 는 속성명, value 는 속성 정의 객체이며 1개 이상 필요합니다.<br><br>"
            + "**공통 필드**: `type`(`Property` | `GeoProperty` | `Relationship`, 필수), `description`, `valueType`<br>"
            + "**Property**: `valueType`(String, Integer, Double, Boolean, Date, Enum, Object, Array* …), "
            + "`enum`(허용 값 목록), `format`, `objectMember`(Object 타입의 하위 멤버), "
            + "`valid`(`minimum`/`maximum`/`minLength`/`maxLength`), "
            + "`childAttributes` + `childAttributeNames`(하위 속성 및 매핑), `observedAt` 포함 시 동적 속성으로 판단<br>"
            + "**GeoProperty**: `valueType` 은 GeoJSON 타입(`POINT`, `POLYGON`, `LINE_STRING` …)<br>"
            + "**Relationship**: `modelType`(참조 대상 모델 id 목록), `valid`",
            example = "{\"address\": {\n"
            + "      \"type\": \"Property\",\n"
            + "      \"description\": \"주소 정보\",\n"
            + "      \"valueType\": \"Object\",\n"
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
            + "      \"valueType\": \"Enum\",\n"
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
            + "        \"urn:e8ight:Person:\"\n"
            + "      ]\n"
            + "    },\n"
            + "    \"floorsAboveGround\": {\n"
            + "      \"type\": \"Property\",\n"
            + "      \"description\": \"지상층\",\n"
            + "      \"valueType\": \"Integer\",\n"
            + "      \"valid\": {\n"
            + "        \"minimum\": 0,\n"
            + "        \"maximum\": 200\n"
            + "      }\n"
            + "    },\n"
            + "    \"floorsBelowGround\": {\n"
            + "      \"type\": \"Property\",\n"
            + "      \"description\": \"지하층\",\n"
            + "      \"valueType\": \"Integer\"\n"
            + "    }}", required = true)
    private HashMap<String, Object> attributes;


    @ArraySchema(
            schema = @Schema(description = "속성명", example = "category"),
            arraySchema = @Schema(description = "필수 속성 목록. `attributes` 에 정의된 속성명만 넣을 수 있습니다.",
                    example = "[\"category\", \"address\"]"))
    private List<String> required;

    @ArraySchema(
            schema = @Schema(description = "참고 문서 URL", example = "https://geojson.org/schema/Geometry.json"),
            arraySchema = @Schema(description = "참고 문서 URL 목록",
                    example = "[\"https://geojson.org/schema/Geometry.json\"]"))
    private List<String> reference;


    @Schema(description = "동적 속성 여부. 서버가 `attributes` 에 `observedAt` 이 포함되어 있는지로 자동 판단하므로 요청 값은 무시됩니다.",
            example = "false", accessMode = Schema.AccessMode.READ_ONLY)
    private Boolean isDynamic;

    @Schema(description = "준비 완료 여부. 생성/버전업 시 항상 false 로 시작하며 *준비 완료 처리* API 로만 true 가 됩니다. 요청 값은 무시됩니다.",
            example = "false", accessMode = Schema.AccessMode.READ_ONLY)
    private Boolean isReady;

}
