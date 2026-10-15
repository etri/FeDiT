package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;


import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "context 조회 응답. API 에 따라 `@context` 또는 `url` 만 채워집니다.")
public class ContextResponseDto {

    @JsonProperty("@context")
    @Schema(description = "`@context` 내용 (단건 조회 / 임포트 응답에서 사용)", example = "{\"e8ight\": \"https://e8ight-data-models/\", \"Building\": \"https://e8ight-data-models/Building\"}")
    private Object context;

    @Schema(description = "context URL (목록 계열 응답에서 사용)", example = "http://context-server:3005/e8ight-context-v1.01.jsonld")
    private String url;

//    private String version;

}
