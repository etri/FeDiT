package kr.co.e8ight.ndxpro.dataservice.dto.ean.zone;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "존에 대한 간단한 정보 - 설비_랜딩 화면 (화면 중앙)")
public class ZoneSimpleDto {

    // EquipmentHvacDto와 동일함
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
