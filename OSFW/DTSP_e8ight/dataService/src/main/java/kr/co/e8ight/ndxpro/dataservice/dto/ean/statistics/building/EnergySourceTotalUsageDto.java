package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Builder
@Schema(description = "에너지원 총 사용 현황 (일별/월별) - 건물_랜딩 화면 (좌측 중단)")
public class EnergySourceTotalUsageDto {

    @Schema(description = "일별/월별 에너지 자립률")
    private Float dailySelfRate;

    @Schema(description = "전기 자립률")
    private Float electricSelfRate;

    @Schema(description = "가스 자립률")
    private Float gasSelfRate;

    @Schema(description = "지역난방 자립률")
    private Float districtHeatingSelfRate;

    @Schema(description = "신재생 에너지 자립률")
    private Float renewableEnergySelfRate;

    @Schema(description = "기타 자립률")
    private Float etcSelfRate;

}
