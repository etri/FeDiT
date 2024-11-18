package kr.co.e8ight.ndxpro.dataservice.dto.ean.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "에너지원 총 사용 현황(일별/월별)")
public class EnergySourceTotalUsageDto {

    @Schema(description = "에너지 자립률", nullable = false, example = "26.31")
    private float energySelfRate;

    @Schema(description = "전기 사용량", nullable = false, example = "563.12")
    private float electricUsage;

    @Schema(description = "가스 사용량", nullable = false, example = "630.09")
    private float gasUsage;

    @Schema(description = "지역난방 사용량", nullable = false, example = "954.99")
    private float districtHeatUsage;

    @Schema(description = "신재생 에너지 사용량", nullable = false, example = "440.33")
    private float renewableUsage;

}
