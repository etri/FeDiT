package kr.co.e8ight.ndxpro.dataservice.controller.ean.statistics;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.building.EnergySourceTotalUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergyPurposeTotalUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergyUsageTrendDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.FloorDetailsDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.zone.ZoneStateDto;
import kr.co.e8ight.ndxpro.dataservice.dto.error.ErrorCodeDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Tag(name = "StatsFloorController", description = "층별 통계 관리")
@RestController
@RequestMapping("/ndxpro/v1/floor-stats")
public class StatsFloorController {

    @Operation(summary = "에너지 용도별 (에너지, 냉난방, 환기, 조명, 전열) 층에 대한 상세 정보",
            description = "건물 현황 -> 중앙 메뉴에서 출력되는 에너지 용도별 (에너지, 냉난방, 환기, 조명, 전열) 층에 대한 상세 정보")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EnergyPurposeTotalUsageDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("")
    public ResponseEntity<?> getEnergySourceTotalUsageDto(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                                                  @Parameter(example = "1", description = "층 ID") @RequestParam Integer floorId,
                                                                                  @Parameter(description = "energy, air, ventilation, light, electricheat 중 1개를 전달해야 함")
                                                                                  @Schema(allowableValues = {"energy", "air", "ventilation", "light", "electricheat"}) @RequestParam String energyType) {
        // 에너지 (이번달 누적 사용량, 예상 사용량, 작년 동월 대비, 월별 에너지 사용량 트렌드)
        // 냉난방 (층 이름, 존 이름, 존 상태, 실시간 실쾌적도)
        // 환기 (층 이름, 존 이름, 존 상태, 실시간 실쾌적도)
        // 조명 (층 이름, 존 이름, 조명 ON/OFF 상태)
        // 전열 (층 이름, 존 이름, 공실/재실 상태)
        if ("energy".equals(energyType)) {
            // 에너지 (energy)
            List<HashMap<String, Float>> monthlyEnergyUsageTrend = new ArrayList<>();
            HashMap<String, Float> energyUsageByPeriod = new HashMap<>();
            energyUsageByPeriod.put("2023-01", 483.4f);
            energyUsageByPeriod.put("2023-02", 584.1f);
            energyUsageByPeriod.put("2023-03", 212.0f);
            energyUsageByPeriod.put("2023-04", 584.2f);
            energyUsageByPeriod.put("2023-05", 704.1f);
            energyUsageByPeriod.put("2023-06", 810.3f);
            energyUsageByPeriod.put("2023-07", 960.9f);
            energyUsageByPeriod.put("2023-08", 1430.5f);
            energyUsageByPeriod.put("2023-09", 300.7f);
            monthlyEnergyUsageTrend.add(energyUsageByPeriod);
            EnergyUsageTrendDto energyUsageTrendDto = EnergyUsageTrendDto.builder()
                    .floorName("5F")
                    .thisMonthAccumulativeUsage(999.88f)
                    .predictedUsage(900.39f)
                    .yearOnYearUsageRate(70.15f)
                    .monthlyEnergyUsageTrend(monthlyEnergyUsageTrend)
                    .build();
            return new ResponseEntity<>(energyUsageTrendDto, HttpStatus.OK);
        } else if ("air".equals(energyType) || "ventilation".equals(energyType)) {
            // air (냉난방), ventilation (환기)
            ZoneStateDto zoneStateDto1 = ZoneStateDto.builder()
                    .id(1)
                    .name("Zone A")
                    .airConditioningState("냉방 중")
                    .realtimeRefreshLevel("매우 좋음")
                    .build();
            ZoneStateDto zoneStateDto2 = ZoneStateDto.builder()
                    .id(2)
                    .name("Zone B")
                    .airConditioningState("외기냉방")
                    .realtimeRefreshLevel("매우 좋음")
                    .build();
            ZoneStateDto zoneStateDto3 = ZoneStateDto.builder()
                    .id(3)
                    .name("Zone C")
                    .airConditioningState("CD")
                    .realtimeRefreshLevel("매우 좋음")
                    .build();
            ZoneStateDto zoneStateDto4 = ZoneStateDto.builder()
                    .id(4)
                    .name("Zone D")
                    .airConditioningState("WU")
                    .realtimeRefreshLevel("매우 좋음")
                    .build();
            ZoneStateDto zoneStateDto5 = ZoneStateDto.builder()
                    .id(5)
                    .name("Zone E")
                    .airConditioningState("NP")
                    .realtimeRefreshLevel("매우 좋음")
                    .build();
            ZoneStateDto zoneStateDto6 = ZoneStateDto.builder()
                    .id(6)
                    .name("Zone F")
                    .airConditioningState("NS")
                    .realtimeRefreshLevel("매우 좋음")
                    .build();
            List<ZoneStateDto> zoneStateDtoList = new ArrayList<>();
            zoneStateDtoList.add(zoneStateDto1);
            zoneStateDtoList.add(zoneStateDto2);
            zoneStateDtoList.add(zoneStateDto3);
            zoneStateDtoList.add(zoneStateDto4);
            zoneStateDtoList.add(zoneStateDto5);
            zoneStateDtoList.add(zoneStateDto6);
            FloorDetailsDto floorDetailsDto = FloorDetailsDto.builder()
                    .floorName("5F")
                    .zoneInfoList(zoneStateDtoList)
                    .floorRealtimeComfortableLevel("매우 좋음")
                    .build();
            return new ResponseEntity<>(floorDetailsDto, HttpStatus.OK);
        } else if ("light".equals(energyType)) {
            // 조명 (light)
            ZoneStateDto zoneStateDto1 = ZoneStateDto.builder()
                    .id(1)
                    .name("Zone A")
                    .lightState("ON")
                    .build();
            ZoneStateDto zoneStateDto2 = ZoneStateDto.builder()
                    .id(2)
                    .name("Zone B")
                    .lightState("OFF")
                    .build();
            ZoneStateDto zoneStateDto3 = ZoneStateDto.builder()
                    .id(3)
                    .name("Zone C")
                    .lightState("OFF")
                    .build();
            ZoneStateDto zoneStateDto4 = ZoneStateDto.builder()
                    .id(4)
                    .name("Zone D")
                    .lightState("ON")
                    .build();
            ZoneStateDto zoneStateDto5 = ZoneStateDto.builder()
                    .id(5)
                    .name("Zone E")
                    .lightState("ON")
                    .build();
            ZoneStateDto zoneStateDto6 = ZoneStateDto.builder()
                    .id(6)
                    .name("Zone F")
                    .lightState("ON")
                    .build();
            List<ZoneStateDto> zoneStateDtoList = new ArrayList<>();
            zoneStateDtoList.add(zoneStateDto1);
            zoneStateDtoList.add(zoneStateDto2);
            zoneStateDtoList.add(zoneStateDto3);
            zoneStateDtoList.add(zoneStateDto4);
            zoneStateDtoList.add(zoneStateDto5);
            zoneStateDtoList.add(zoneStateDto6);
            FloorDetailsDto floorDetailsDto = FloorDetailsDto.builder()
                    .floorName("5F")
                    .zoneInfoList(zoneStateDtoList)
                    .build();
            return new ResponseEntity<>(floorDetailsDto, HttpStatus.OK);
        } else {
            // 전열 (electricheat)
            ZoneStateDto zoneStateDto1 = ZoneStateDto.builder()
                    .id(1)
                    .name("Zone A")
                    .electricHeatState("재실 중")
                    .build();
            ZoneStateDto zoneStateDto2 = ZoneStateDto.builder()
                    .id(2)
                    .name("Zone B")
                    .electricHeatState("공실")
                    .build();
            ZoneStateDto zoneStateDto3 = ZoneStateDto.builder()
                    .id(3)
                    .name("Zone C")
                    .electricHeatState("공실")
                    .build();
            ZoneStateDto zoneStateDto4 = ZoneStateDto.builder()
                    .id(4)
                    .name("Zone D")
                    .electricHeatState("재실 중")
                    .build();
            ZoneStateDto zoneStateDto5 = ZoneStateDto.builder()
                    .id(5)
                    .name("Zone E")
                    .electricHeatState("재실 중")
                    .build();
            ZoneStateDto zoneStateDto6 = ZoneStateDto.builder()
                    .id(6)
                    .name("Zone F")
                    .electricHeatState("재실 중")
                    .build();
            List<ZoneStateDto> zoneStateDtoList = new ArrayList<>();
            zoneStateDtoList.add(zoneStateDto1);
            zoneStateDtoList.add(zoneStateDto2);
            zoneStateDtoList.add(zoneStateDto3);
            zoneStateDtoList.add(zoneStateDto4);
            zoneStateDtoList.add(zoneStateDto5);
            zoneStateDtoList.add(zoneStateDto6);
            FloorDetailsDto floorDetailsDto = FloorDetailsDto.builder()
                    .floorName("5F")
                    .zoneInfoList(zoneStateDtoList)
                    .build();
            return new ResponseEntity<>(floorDetailsDto, HttpStatus.OK);
        }
    }

}
