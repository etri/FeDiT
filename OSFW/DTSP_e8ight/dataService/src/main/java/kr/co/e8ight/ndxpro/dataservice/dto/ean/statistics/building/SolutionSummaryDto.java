package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "에너지 현황 - 건물_랜딩_에너지 탭 선택 시 화면 (우측 전체)")
public class SolutionSummaryDto {

    @Schema(description = "이번달 Best 층")
    private String thisMonthFloorName;

    @Schema(description = "이번달 Best 예상 사용량")
    private Float thisMonthPredictedUsage;

    @Schema(description = "이번달 Best 권장 사용량")
    private Float thisMonthRecommendedUsage;

    @Schema(description = "이번달 Best 실제 사용량")
    private Float thisMonthActualUsage;

    @Schema(description = "층별 현황 통계 목록")
    private List<AccumulativeUsageByFloorDto> accumulativeUsageByFloorDtoList;

}
