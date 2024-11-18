package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "에너지 용도별 (냉난방, 환기, 조명, 전열) 및 층별 누적 사용량, 누적 낭비량 - 건물_랜딩 화면 (우측 전체)")
public class SolutionDetailsDto {

    @Schema(description = "솔루션 타입")
    private String solutionType;

    @Schema(description = "이번달 Best / Worst 층")
    private String thisMonthFloorName;

    @Schema(description = "이번달 Best / Worst 누적 사용량(MWh)")
    private Float thisMonthAccumulativeUsage;

    @Schema(description = "이번달 Best / Worst 누적 낭비량(MWh)")
    private Float thisMonthAccumulativeWastedUsage;

    @Schema(description = "층별 현황 통계 목록")
    private List<AccumulativeUsageByFloorDto> accumulativeUsageByFloorDtoList;

}
