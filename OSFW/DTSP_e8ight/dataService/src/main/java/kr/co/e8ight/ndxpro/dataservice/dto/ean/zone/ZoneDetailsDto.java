package kr.co.e8ight.ndxpro.dataservice.dto.ean.zone;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "존에 대한 상세 정보 - 건물_플랜 모델 화면 (화면 중앙)")
public class ZoneDetailsDto {

    @Schema(description = "층 이름")
    private String floorName;

    @Schema(description = "존 이름")
    private String zoneName;

    @Schema(description = "존 온도")
    private Float zoneTemperature;

    @Schema(description = "존 습도")
    private Float zoneHumidity;

    @Schema(description = "존 냉난방 상태")
    private String zoneAirConditionerState;

    @Schema(description = "존 실시간 실쾌적도")
    private String zoneRealtimeComfortableLevel;

}
