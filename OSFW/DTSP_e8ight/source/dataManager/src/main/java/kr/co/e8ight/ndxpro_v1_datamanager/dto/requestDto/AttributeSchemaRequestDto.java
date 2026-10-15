package kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;


@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@ToString
@Schema(description = "속성 스키마 생성/수정 요청")
public class AttributeSchemaRequestDto {

    @Schema(description = "스키마 id. `.json` 을 포함해야 합니다.", example = "city-schema.json", required = true)
    private String id;

    @ArraySchema(
            schema = @Schema(description = "등록된 속성 id", example = "category"),
            arraySchema = @Schema(description = "스키마에 포함할 속성 id 목록. 모두 미리 등록된 속성이어야 합니다. "
                    + "수정 시에는 이 목록으로 전체 교체됩니다."))
    private List<String> attributes;

    @Schema(description = "읽기 전용 여부. true 면 이후 수정/삭제가 불가능합니다. (생성 시에만 적용, 기본값 false)",
            example = "false", defaultValue = "false")
    private Boolean isReadOnly;
}
