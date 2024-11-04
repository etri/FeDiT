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
public class AttributeRequestDto {

    @Schema(description = "속성Id", example = "category")
    private String id;

    @Schema(description = "제목", example = "E8ight definitions for Harmonized Data Models")
    private String title;

    @Schema(description = "설명", example = "Property. Category of the building.")
    private String description;

    @Schema(description = "속성 유형", example = "String")
    private String attributeType;

    @Schema(description = "값 유형", example = "String")
    private String valueType;

    @Schema(description = "형태", example = "")
    private String format;

    @Schema(description = "유형", example = "e8ight")
    private String type;

}
