package kr.co.e8ight.ndxpro.dataservice.controller.ean.equipment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.equipment.EquipmentDto;
import kr.co.e8ight.ndxpro.dataservice.dto.error.ErrorCodeDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.maintenance.MaintenanceHistoryDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "EquipmentController", description = "장비 정보 관리")
@RestController
@RequestMapping("/ndxpro/v1/equipment")
public class EquipmentController {

    @Operation(summary = "장비 상세 정보 및 유지보수 이력 목록",
            description = "설비 현황 우측 메뉴에서 출력되는 장비 정보")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EquipmentDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("")
    public ResponseEntity<EquipmentDto> getEquipment(@Parameter(example = "1", description = "장비 ID") @RequestParam Integer equipmentId) {
        List<MaintenanceHistoryDto> maintenanceHistoryDtoList = new ArrayList<>();
        MaintenanceHistoryDto maintenanceHistoryDto = MaintenanceHistoryDto.builder()
                .maintenanceHistoryId(1)
                .personInCharge("홍길동")
                .creDate(LocalDateTime.of(2023, 6, 18, 10, 30))
                .cost(3000000)
                .attachmentFilename("file.pdf")
                .build();
        MaintenanceHistoryDto maintenanceHistoryDto2 = MaintenanceHistoryDto.builder()
                .maintenanceHistoryId(2)
                .personInCharge("장백산")
                .creDate(LocalDateTime.of(2023, 3, 1, 23, 45))
                .cost(13000000)
                .attachmentFilename("file2.pdf")
                .build();
        MaintenanceHistoryDto maintenanceHistoryDto3 = MaintenanceHistoryDto.builder()
                .maintenanceHistoryId(3)
                .personInCharge("김영희")
                .creDate(LocalDateTime.of(2021, 2, 20, 15, 0))
                .cost(30000)
                .attachmentFilename("file3.pdf")
                .build();
        maintenanceHistoryDtoList.add(maintenanceHistoryDto);
        maintenanceHistoryDtoList.add(maintenanceHistoryDto2);
        maintenanceHistoryDtoList.add(maintenanceHistoryDto3);
        EquipmentDto equipmentDto = EquipmentDto.builder()
                .equipmentId(1)
                .equipmentName("FHD-107")
                .equipmentSn("102202458")
                .equipmentType("AbsorptionChillerHeater")
                .equipmentPurpose("대형 건물 냉난방용")
                .powerConsumption(170f)
                .burnerFanPower(10f)
                .coolingCapacity(50f)
                .operatingPressure(100f)
                .powerSupply(200f)
                .maintenanceHistoryDtoList(maintenanceHistoryDtoList)
                .build();
        return new ResponseEntity<>(equipmentDto, HttpStatus.OK);
    }

}
