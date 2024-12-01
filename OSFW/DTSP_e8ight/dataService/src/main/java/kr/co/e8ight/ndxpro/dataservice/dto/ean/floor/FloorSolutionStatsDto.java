package kr.co.e8ight.ndxpro.dataservice.dto.ean.floor;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "에너지 용도별 누적 낭비량, 누적 사용량(BEST/WORST)")
public class FloorSolutionStatsDto {

    @Schema(description = "층 ID", nullable = false, example = "1")
    private Integer floorId;

    @Schema(description = "층 이름", nullable = false, example = "5F")
    private String floorName;

    @Schema(description = "솔루션 타입", nullable = true, example = "솔루션 타입")
    private String solutionType;

    @Schema(description = "권장 사용량(MWh), 데이터가 없는 경우도 있음", nullable = true, example = "1132.61")
    private Float recommendUsage;

    @Schema(description = "실제 사용량(MWh), 데이터가 없는 경우도 있음", nullable = true, example = "1932.23")
    private Float currUsage;

}
