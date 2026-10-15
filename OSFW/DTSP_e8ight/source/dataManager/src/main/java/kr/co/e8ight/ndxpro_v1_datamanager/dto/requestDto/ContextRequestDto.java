package kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Schema(description = "커스텀 context 생성 요청")
public class ContextRequestDto{

    @Schema(description = "context URL. `http(s)://` 로 시작하고 `.jsonld` 로 끝나야 하며, 이 경로에 파일이 배포됩니다.",
            example = "http://context-server:3005/e8ight-context-v1.02.jsonld", required = true)
    private String url;

    @Schema(description = "`@context` 내용. `\"접두어\": \"URI\"` 또는 `\"용어\": \"접두어:용어\"` 형태의 객체입니다. "
            + "값에는 key 이름이 포함되어야 합니다.",
            example = "{\n"
            + "        \"e8ight\": \"https://e8ight-data-models/\",\n"
            + "        \"common\": \"https://e8ight-data-models/common/\",\n"
            + "        \"ngsi-ld\": \"https://uri.etsi.org/ngsi-ld/\"\n"
            + "  }", required = true)
    @JsonProperty(value = "@context")
    private Object value;

    @Schema(description = "context 버전 표기 (참고용)", example = "v1.02")
    private String version;

    @Schema(description = "버전이 붙지 않은 기본 URL (참고용)", example = "http://context-server:3005/e8ight-context.jsonld")
    private String defaultUrl;

}
