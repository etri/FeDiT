package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "속성 스키마 조회 응답")
public class AttributeSchemaResponseDto {

    @Schema(description = "스키마 id", example = "city-schema.json")
    private String id;

    @Schema(description = "속성 매핑 (속성 id → `{type}:{id}`), id 순 정렬", example = "{\"address\": \"e8ight:address\", \"category\": \"e8ight:category\"}")
    private Object value;

    @Schema(description = "읽기 전용 여부. true 면 수정/삭제 불가", example = "false")
    private Boolean isReadOnly;
}
