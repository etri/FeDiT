package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Builder
@Schema(description = "실별 에너지 용도별 소비량 순위 - 건물_플랜 모델 화면 (좌측 중단)")
public class EnergyPurposeRoomUsageDto {

    @Schema(description = "실 이름")
    private String roomName;

    @Schema(description = "누적 사용량(MWh)")
    private Float accumulativeUsage;

    @Schema(description = "총 사용량 대비")
    private Float totalUsageRate;

}
