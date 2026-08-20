package kr.co.e8ight.ndxpro.dataservice.dto.ean.zone;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "Zone 상태 정보")
public class ZoneStateDto {

    @Schema(description = "존 ID", nullable = false, example = "1")
    private Integer id;

    @Schema(description = "존 이름", nullable = false, example = "A")
    private String name;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "존 냉난방 상태", nullable = false, example = "냉방 중, 외기냉방, CD, WU, NP, NS")
    private String airConditioningState;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "존 조명 상태", nullable = false, example = "ON, OFF")
    private String lightState;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "존 전열 상태", nullable = false, example = "재실 중, 공실")
    private String electricHeatState;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "실시간 실쾌적도", nullable = false, example = "매우 좋음")
    private String realtimeRefreshLevel;

}
