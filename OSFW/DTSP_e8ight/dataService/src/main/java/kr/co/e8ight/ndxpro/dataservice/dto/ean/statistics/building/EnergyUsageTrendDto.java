package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "층별 에너지 사용량 트렌드 (이번달 누적 사용량, 예상 사용량, 작년 동월 대비, 월별 에너지 사용량 트렌드) - 건물 탭_Perspective View (중앙 팝업)")
public class EnergyUsageTrendDto {

    @Schema(description = "층 이름", nullable = false, example = "5F")
    private String floorName;

    @Schema(description = "이번달 누적 사용량")
    private Float thisMonthAccumulativeUsage;

    @Schema(description = "예상 사용량")
    private Float predictedUsage;

    @Schema(description = "작년 동월 대비")
    private Float yearOnYearUsageRate;

    @Schema(description = "월별 에너지 사용량 트렌드")
    private List<HashMap<String, Float>> monthlyEnergyUsageTrend;

}
