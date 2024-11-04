package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttributeSchemaResponseDto {

    private String id;

    private Object value;

    private Boolean isReadOnly;
}
