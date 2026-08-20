package kr.co.e8ight.ndxpro.dataservice.dto.ean.floor;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "층별 현황 통계")
public class FloorStatsDto {

    @Schema(description = "층 ID", nullable = false, example = "1")
    private Integer floorId;

    @Schema(description = "층 이름", nullable = false, example = "B2F")
    private String floorName;

    @Schema(description = "현재 사용량(MWh), 데이터가 없는 경우도 있음", nullable = true, example = "2483.19")
    private Float currUsage;

    @Schema(description = "저번달 대비(%), 데이터가 없는 경우도 있음", nullable = true, example = "40%")
    private Float prevDateRate;

}
