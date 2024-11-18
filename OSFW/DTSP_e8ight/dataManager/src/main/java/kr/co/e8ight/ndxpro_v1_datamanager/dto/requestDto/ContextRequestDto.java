package kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ContextRequestDto{

    @Schema(description = "컨텍스트 url", example = "http://172.16.28.220:3005/e8ight-context-v1.02.jsonld")
    private String url;

    @Schema(description = "컨텍스트 정보", example = "{\n"
            + "        \"e8ight\": \"https://e8ight-data-models/\",\n"
            + "        \"common\": \"https://e8ight-data-models/common/\",\n"
            + "        \"ngsi-ld\": \"https://uri.etsi.org/ngsi-ld/\"\n"
            + "  }")
    @JsonProperty(value = "@context")
    private Object value;

    @Schema(description = "버전", example = "v1.02")
    private String version;

    @Schema(description = "기본 url", example = "http://172.16.28.220:3005/e8ight-context.jsonld")
    private String defaultUrl;

}
