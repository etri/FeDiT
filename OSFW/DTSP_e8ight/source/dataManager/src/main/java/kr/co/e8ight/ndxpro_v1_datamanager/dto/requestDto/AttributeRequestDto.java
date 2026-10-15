package kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@ToString
@Schema(description = "속성 생성/수정 요청")
public class AttributeRequestDto {

    @Schema(description = "속성 id (속성 이름). 데이터 모델의 attributes / attributeNames 의 key 로 사용됩니다.",
            example = "category", required = true)
    private String id;

    @Schema(description = "제목", example = "E8ight definitions for Harmonized Data Models")
    private String title;

    @Schema(description = "설명", example = "Property. Category of the building.")
    private String description;

    // 현재 서비스에서 사용하지 않는 필드 (AttributeService.createAttribute 참고)
    @Schema(hidden = true)
    private String attributeType;

    @Schema(description = "값 유형<br>"
            + "- 기본: `String`, `Enum`, `Integer`, `Double`, `Boolean`, `Date`, `Object`<br>"
            + "- 배열: `ArrayString`, `ArrayInteger`, `ArrayDouble`, `ArrayBoolean`, `ArrayObject`<br>"
            + "- GeoJSON: `POINT`, `MULTI_POINT`, `LINE_STRING`, `MULTI_LINE_STRING`, `POLYGON`, `MULTI_POLYGON`, `GEOMETRY_COLLECTION`",
            example = "String", required = true,
            allowableValues = {"String", "Enum", "Integer", "Double", "Boolean", "Date", "Object",
                    "ArrayString", "ArrayInteger", "ArrayDouble", "ArrayBoolean", "ArrayObject",
                    "POINT", "MULTI_POINT", "LINE_STRING", "MULTI_LINE_STRING", "POLYGON", "MULTI_POLYGON", "GEOMETRY_COLLECTION"})
    private String valueType;

    @Schema(description = "값 형식 (예: 날짜 포맷). 없으면 생략", example = "date-time")
    private String format;

    @Schema(description = "네임스페이스 접두어(prefix). context 에 `{type}:{id}` 로 매핑됩니다. "
            + "context 에 선언된 접두어(e8ight, common, ngsi-ld …)를 사용하세요.",
            example = "e8ight", required = true)
    private String type;

}
