package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "데이터 모델 조회 응답. 목록 조회에서는 id, type, version, isReady 만 포함됩니다.")
public class DataModelResponseDto {

    @Schema(description = "모델 id", example = "urn:e8ight:Building:")
    private String id;

    @Schema(description = "모델 type", example = "Building")
    private String type;

    @Schema(description = "모델 버전", example = "1.0")
    private String version;

    @Schema(description = "제목", example = "NDX-PRO - Building DataModel")
    private String title;

    @Schema(description = "설명", example = "Information on a given Building")
    private String description;

    @Schema(description = "속성명 → context 매핑", example = "{\"category\": \"e8ight:category\", \"location\": \"ngsi-ld:location\"}")
    private Map<String, String> attributeNames;

    @Schema(description = "속성 정의 (요청 시 넣은 구조와 동일)", example = "{\"category\": {\"type\": \"Property\", \"valueType\": \"Enum\", \"enum\": [\"apartments\", \"office\"]}}")
    private HashMap<String, Object> attributes;

    @Schema(description = "필수 속성 목록", example = "[\"category\"]")
    private List<String> required;

    @Schema(description = "참고 문서 URL 목록", example = "[\"https://geojson.org/schema/Geometry.json\"]")
    private List<String> reference;

    @Schema(description = "동적 속성(observedAt) 포함 여부", example = "false")
    private Boolean isDynamic;

    @Schema(description = "준비 완료 여부. true 면 수정 불가, context 등록 가능", example = "false")
    private Boolean isReady;

    @Schema(description = "observedAt 을 포함하는(관측형) 속성명 목록", example = "[\"temperature\"]")
    private List<String> observation;

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


    @Override
    public String toString() {
        return "DataModelResponseDto{" +
                "id='" + id + '\'' +
                ", type='" + type + '\'' +
                ", version='" + version + '\'' +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", attributeNames=" + attributeNames +
                ", attributes=" + attributes +
                ", required=" + required +
                ", reference=" + reference +
                ", isDynamic=" + isDynamic +
                ", isReady=" + isReady +
                ", observation=" + observation +
                ", createdAt=" + createdAt +
                ", modifiedAt=" + modifiedAt +
                '}';
    }
}
