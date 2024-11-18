package kr.co.e8ight.ndxpro.dataservice.controller.ean.statistics;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.dataservice.dto.CustomData;
import kr.co.e8ight.ndxpro.dataservice.dto.NgsiLdResponseDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.building.EnergySourceTotalUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergyPurposeTotalUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergySourceDailyUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergySourceMonthlyUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.error.ErrorCodeDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "StatsEnergySourceController", description = "에너지원 통계 관리 (에너지원 = 전기, 가스, 지역난방, 신재생 에너지, 수도)")
@RestController
@RequestMapping("/ndxpro/v1/enrg-src-stats")
public class StatsEnergySourceController {

    @Operation(summary = "에너지원 총 사용 현황 (일별/월별)",
            description = "건물 현황 -> 좌측 중단 메뉴에서 출력되는 에너지원 총 사용 현황 (일별/월별)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EnergyPurposeTotalUsageDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/usage/total")
    public ResponseEntity<NgsiLdResponseDto> getEnergySourceTotalUsageDto(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                                          @Parameter(description = "일별, 월별 중 1개를 전달해야 함")
                                                                                    @Schema(allowableValues = {"daily", "monthly"}) @RequestParam String dateType) {
        EnergySourceTotalUsageDto energySourceTotalUsageDto = EnergySourceTotalUsageDto.builder()
                .energySelfRate(40.05f)
                .electricUsage(683.14f)
                .gasUsage(744.47f)
                .districtHeatUsage(343.79f)
                .renewableUsage(14.0f)
                .build();
        CustomData customData = CustomData.builder()
                .type("Property")
                .value(energySourceTotalUsageDto)
                .build();
        NgsiLdResponseDto ngsiLdResponseDto = NgsiLdResponseDto.builder()
                .id("urn:ngsi-ld:EnergySourceTotalUsageDto:Usage1")
                .type("EnergySourceTotalUsageDto")
                .customData(customData)
                .context("http://172.16.28.222:53005/e8ight-context-v1.0.1.jsonld")
                .build();
        return new ResponseEntity<>(ngsiLdResponseDto, HttpStatus.OK);
    }

    @Operation(summary = "에너지원 사용 현황 (일별/월별)",
            description = "건물 현황 -> 좌측 중단 메뉴에서 출력되는 에너지원 사용 현황 (일별/월별)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EnergySourceDailyUsageDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/usage")
    public ResponseEntity<?> getEnergySourceDailyUsageDto(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                          @Parameter(description = "일별, 월별 중 1개를 전달해야 함")
                                                          @Schema(allowableValues = {"daily", "monthly"}) @RequestParam String dateType) {
        if ("daily".equals(dateType)) {
            EnergySourceDailyUsageDto energySourceDailyUsageDto = EnergySourceDailyUsageDto.builder()
                    .todayAccumulativeUsage(610.18f)
                    .todayAccumulativeCost(100.5f)
                    .predictedUsage(202.9f)
                    .dayOnDayUsageRate(30.18f)
                    .predictedCost(594.04f)
                    .dayOnDayCostRate(6.12f)
                    .build();
            return new ResponseEntity<>(energySourceDailyUsageDto, HttpStatus.OK);
        } else {
            EnergySourceMonthlyUsageDto energySourceMonthlyUsageDto = EnergySourceMonthlyUsageDto.builder()
                    .thisMonthAccumulativeUsage(6403.1f)
                    .thisMonthAccumulativeCost(5500.4f)
                    .predictedUsage(4506.9f)
                    .yearOnYearUsageRate(900.18f)
                    .predictedCost(6854.04f)
                    .yearOnYearCostRate(20.62f)
                    .build();
            return new ResponseEntity<>(energySourceMonthlyUsageDto, HttpStatus.OK);
        }
    }

    /*@Operation(summary = "실시간 시스템 부하율",
            description = "설비 현황 좌측 메뉴에서 출력되는 실시간 시스템 부하율")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = FacilityStatusDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/status/list")
    public ResponseEntity<List<FacilityStatusDto>> getFacilityStatusList(@Parameter(example = "1", description = "층 ID") @RequestParam Integer floorId) {
        List<FacilityStatusDto> facilityStatusDtoList = new ArrayList<>();
        FacilityStatusDto facilityStatusDto = FacilityStatusDto.builder()
                .facilityId(1)
                .facilityName("냉열원")
                .realtimeLoadRate(56F)
                .build();
        FacilityStatusDto facilityStatusDto2 = FacilityStatusDto.builder()
                .facilityId(2)
                .facilityName("온열원")
                .realtimeLoadRate(74F)
                .build();
        FacilityStatusDto facilityStatusDto3 = FacilityStatusDto.builder()
                .facilityId(3)
                .facilityName("펌프")
                .realtimeLoadRate(42F)
                .build();
        facilityStatusDtoList.add(facilityStatusDto);
        facilityStatusDtoList.add(facilityStatusDto2);
        facilityStatusDtoList.add(facilityStatusDto3);
        return new ResponseEntity<>(facilityStatusDtoList, HttpStatus.OK);
    }

    @Operation(summary = "설비 목록",
            description = "설비 현황 좌측 메뉴에서 출력되는 설비 목록")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = FacilityDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/list")
    public ResponseEntity<List<FacilityDto>> getFacilityList(@Parameter(example = "1", description = "층 ID") @RequestParam Integer floorId) {
        List<FacilityDto> facilityDtoList = new ArrayList<>();
        FacilityDto facilityDto = FacilityDto.builder()
                .facilityId(1)
                .facilityName("Mixer_1")
                .tagName("Tag")
                .build();
        FacilityDto facilityDto2 = FacilityDto.builder()
                .facilityId(2)
                .facilityName("Mixer_2")
                .tagName("Tag")
                .build();
        facilityDtoList.add(facilityDto);
        facilityDtoList.add(facilityDto2);
        return new ResponseEntity<>(facilityDtoList, HttpStatus.OK);
    }

    @Operation(summary = "설비 속성 정보",
            description = "설비 현황 중앙 메뉴에서 출력되는 설비 속성 정보")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = FacilityAttributeDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/")
    public ResponseEntity<FacilityAttributeDto> getFacilityAttribute(@Parameter(example = "1", description = "설비 ID") @RequestParam Integer facilityId) {
        FacilityAttributeDto facilityAttributeDto = FacilityAttributeDto.builder()
                .facilityId(1)
                .facilityMode("냉방 중")
                .facilityAirflow(75.2F)
                .facilitySettingTemperature(23.3F)
                .build();
        return new ResponseEntity<>(facilityAttributeDto, HttpStatus.OK);
    }*/

}
