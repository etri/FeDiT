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
@Schema(description = "실별 에너지 용도별 실내 온습도 현황 - 건물_플랜 모델 실 선택시 화면 (우측 전체)")
public class EnergyPurposeIndoorStateDto {

    @Schema(description = "실내온도")
    private Float indoorTemperature;

    @Schema(description = "상대습도")
    private Float relativeHumidity;

    @Schema(description = "실시간 실쾌적 여부")
    private String realtimeComfortableLevel;

    @Schema(description = "권장량 온도")
    private Float recommendTemperature;

    @Schema(description = "권장량 습도")
    private Float recommendHumidity;

    @Schema(description = "현재 온도 및 기간 목록")
    private List<HashMap<String, Float>> currentTemperatureList;

    @Schema(description = "현재 습도 및 기간 목록")
    private List<HashMap<String, Float>> currentHumidityList;

    @Schema(description = "쾌적 범위 최소값")
    private Float minComfortableValue;

    @Schema(description = "쾌적 범위 최대값")
    private Float maxComfortableValue;

}
