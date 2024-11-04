package kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;


@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@ToString
public class AttributeSchemaRequestDto {

    @Schema(description = "스키마Id", example = "city-schema.json")
    private String id;

    @Schema(description = "속성Id", example = "[\"category\"]")
    private List<String> attributes;

    @Schema(description = "읽기 전용", example = "false")
    private Boolean isReadOnly;
}
