package kr.co.e8ight.ndxpro.dataservice.dto.ean.equipment;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.maintenance.MaintenanceHistoryDto;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "장비 정보")
public class EquipmentDto {

    @Schema(description = "장비 ID", nullable = false, example = "1")
    private Integer equipmentId;

    @Schema(description = "장비명", nullable = false, example = "FHD-107")
    private String equipmentName;

    @Schema(description = "장비 일련번호", nullable = false, example = "102202458")
    private String equipmentSn; // TODO: 장비명 밑에 일련번호가 맞는지 확인 필요

    @Schema(description = "장비 종류", nullable = false, example = "AbsorptionChillerHeater")
    private String equipmentType;

    @Schema(description = "장비 목적", nullable = false, example = "대형 건물 냉난방용")
    private String equipmentPurpose;

    // TODO: 장비에 따라 스펙을 분류할 수 있도록 장비-스펙 매핑 목록 확인 필요
    // 장비 운영 현황
    @Schema(description = "소비 전력", nullable = true, example = "170kWh")
    private Float powerConsumption;

    @Schema(description = "버너 팬 파워", nullable = true, example = "10kWh")
    private Float burnerFanPower;

    @Schema(description = "냉각 용량", nullable = true, example = "50L")
    private Float coolingCapacity;

    @Schema(description = "동작 압력", nullable = true, example = "100Pa")
    private Float operatingPressure;

    @Schema(description = "전원 공급", nullable = true, example = "200kWh")
    private Float powerSupply;

    @Schema(description = "유지보수 이력 목록", nullable = true)
    private List<MaintenanceHistoryDto> maintenanceHistoryDtoList;

}
