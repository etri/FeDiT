package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "층별 현황 통계 (층별 누적 사용량/낭비량) - 건물_랜딩 화면 (우측 중단)")
public class AccumulativeUsageByFloorDto {

    @Schema(description = "층 이름")
    private String floorName;

    @Schema(description = "누적 사용량")
    private Float accumulativeUsage;

    @Schema(description = "누적 낭비량")
    private Float accumulativeWastedUsage;

    @Schema(description = "층에 대한 상세한 사용량 (기간별 사용량/낭비량)")
    private List<EnergyUsageByPeriodDto> energyUsageByPeriodDtoList;

}
