package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.equipment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "열원 기기 상세 정보 - 메인 탭_설비 (화면 중앙)")
public class EquipmentHeatSourceDto {

    @Schema(description = "기기명")
    private String equipmentName;

    @Schema(description = "존 이름")
    private String zoneName;

    @Schema(description = "관제점 가동 현황 목록")
    private List<HashMap<String, String>> pointRunningStateList;

    @Schema(description = "시간별 실시간 에너지 생산량")
    private List<HashMap<String, Float>> realtimeEnergyProduction;

}
