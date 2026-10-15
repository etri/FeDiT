package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;


@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "속성 조회 응답")
public class AttributeResponseDto {

    @Schema(description = "속성 id (속성 이름)", example = "category")
    private String id;

    @Schema(description = "제목", example = "E8ight definitions for Harmonized Data Models")
    private String title;

    @Schema(description = "설명", example = "Property. Category of the building.")
    private String description;

    @Schema(hidden = true)
    private String attributeType;

    @Schema(description = "값 유형", example = "String")
    private String valueType;

    @Schema(description = "값 형식", example = "date-time")
    private String format;

    @Schema(description = "네임스페이스 접두어(prefix)", example = "e8ight")
    private String type;


    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @CreatedDate
    @Schema(description = "생성 시각", example = "2024-05-20T09:12:33.123")
    private LocalDateTime createdAt;


    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @LastModifiedDate
    @Schema(description = "최종 수정 시각", example = "2024-05-21T14:02:10.456")
    private LocalDateTime modifiedAt;


}
