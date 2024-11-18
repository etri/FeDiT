package kr.co.e8ight.ndxpro.dataservice.controller.ean.building;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.building.EnergySourceTotalUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.building.EnergyTypeTotalUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.error.ErrorCodeDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "BuildingController", description = "건물에서 발생하는 에너지 사용량 통계 관리")
@RestController
@RequestMapping("/ndxpro/v1/building")
public class BuildingController {

    /*@Operation(summary = "에너지 용도 총 사용량 합계 (일별/월별)",
            description = "건물 현황 통계 상세보기 좌측 메뉴에서 출력되는 에너지 용도 총 사용량 합계(일별/월별)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EnergyTypeTotalUsageDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/energy-type/stats")
    public ResponseEntity<EnergyTypeTotalUsageDto> getEnergyTypeStats(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                                      @Parameter(description = "daily, monthly 중 1개를 전달해야 함")
                                                                      @Schema(allowableValues = {"daily", "monthly"}) @RequestParam String dateType) {
        EnergyTypeTotalUsageDto energyTypeTotalUsageDto = EnergyTypeTotalUsageDto.builder()
                .energyUsage(4999.33f)
                .prevDateRate(88.88f)
                .districtHeatUsage(8388.88f)
                .ventilationUsage(8388.88f)
                .electricHeatUsage(8388.88f)
                .lightingUsage(8388.88f)
                .etcUsage(8388.88f)
                .build();
        return new ResponseEntity<>(energyTypeTotalUsageDto, HttpStatus.OK);
    }

    @Operation(summary = "에너지원 총 사용 현황 (일별/월별)",
            description = "건물 현황 통계 상세보기 좌측 메뉴에서 출력되는 에너지원 총 사용량 합계(일별/월별)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EnergySourceTotalUsageDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/energy-source/stats")
    public ResponseEntity<EnergySourceTotalUsageDto> getEnergySourceStats(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                                          @Parameter(description = "daily, monthly 중 1개를 전달해야 함")
                                                                          @Schema(allowableValues = {"daily", "monthly"}) @RequestParam String dateType) {
        EnergySourceTotalUsageDto energySourceTotalUsageDto = EnergySourceTotalUsageDto.builder()
                .energySelfRate(88.88f)
                .electricUsage(8388.88f)
                .gasUsage(8388.88f)
                .districtHeatUsage(8388.88f)
                .renewableUsage(8388.88f)
                .build();
        return new ResponseEntity<>(energySourceTotalUsageDto, HttpStatus.OK);
    }*/

}
