package kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
@ToString
@Schema(description = "단위 코드 조회 응답")
public class UnitCodeResponseDto {

    @Schema(hidden = true) // 응답에 채워지지 않는 필드
    private String group;

    @Schema(description = "UN/CEFACT 단위 코드", example = "KMH")
    private String code;

    @Schema(description = "단위 기호", example = "km/h")
    private String symbol;

    @Schema(description = "단위 그룹 표시 이름", example = "속도")
    private String groupName;
}
