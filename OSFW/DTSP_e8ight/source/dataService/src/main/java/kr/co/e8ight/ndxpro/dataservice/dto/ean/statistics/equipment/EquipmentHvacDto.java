package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.equipment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "공조 기기 상세 정보 - 메인 탭_설비 (화면 중앙)")
public class EquipmentHvacDto {

    // ZoneSimpleDto와 동일함
    @Schema(description = "존 이름")
    private String zoneName;

    @Schema(description = "기기명")
    private String equipmentName;

    @Schema(description = "존 모드")
    private String zoneMode;

    @Schema(description = "존 풍량")
    private Float zoneAirflow;

    @Schema(description = "존 설정온도")
    private Float zoneTemperature;

}
