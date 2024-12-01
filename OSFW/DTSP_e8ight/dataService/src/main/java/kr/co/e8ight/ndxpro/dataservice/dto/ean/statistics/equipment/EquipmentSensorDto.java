package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.equipment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "센서 기기 상세 정보 - 메인 탭_설비 (화면 중앙)")
public class EquipmentSensorDto {

    @Schema(description = "기기명")
    private String equipmentName;

    @Schema(description = "설치 위치")
    private String installationLocation;

    @Schema(description = "통신 상태")
    private String networkState;

}
