package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.equipment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "조명 기기 상세 정보 - 메인 탭_설비 (화면 중앙)")
public class EquipmentLightDto {

    @Schema(description = "존 이름")
    private String zoneName;

    @Schema(description = "설치 위치")
    private String installationLocation;

    @Schema(description = "작동 현황")
    private String runningState;

    @Schema(description = "점등률")
    private Float turningOnRate;

}
