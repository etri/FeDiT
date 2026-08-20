package kr.co.e8ight.ndxpro.dataservice.dto.ean.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "에너지 용도 총 사용량 합계(일별/월별)")
public class EnergyTypeTotalUsageDto {

    @Schema(description = "에너지 사용량(MWh)", nullable = false, example = "1234.56")
    private float energyUsage;

    @Schema(description = "지난 동일 또는 동월 대비(%)", nullable = false, example = "63.12")
    private float prevDateRate;

    @Schema(description = "냉난방 사용량", nullable = false, example = "1400.09")
    private float districtHeatUsage;

    @Schema(description = "환기 사용량", nullable = false, example = "700.99")
    private float ventilationUsage;

    @Schema(description = "전열 사용량", nullable = false, example = "40.3")
    private float electricHeatUsage;

    @Schema(description = "조명 사용량", nullable = false, example = "504.41")
    private float lightingUsage;

    @Schema(description = "기타 사용량", nullable = false, example = "9328.11")
    private float etcUsage;

}
