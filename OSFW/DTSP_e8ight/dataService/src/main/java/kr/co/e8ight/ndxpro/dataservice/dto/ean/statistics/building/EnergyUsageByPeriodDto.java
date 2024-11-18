package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "층별 현황 통계 (기간별 이전달 사용량/낭비량, 기간별 이번달 사용량/낭비량) - 건물_랜딩 화면 (우측 중단)")
public class EnergyUsageByPeriodDto {

    @Schema(description = "기간명")
    private String periodName;

    @Schema(description = "이전달/이번달 사용량")
    private Float monthUsage;

    @Schema(description = "이전달/이번달 낭비량")
    private Float monthWastedUsage;

}
