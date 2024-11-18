package kr.co.e8ight.ndxpro.dataservice.controller.ean.statistics;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.AccumulativeUsageByFloorDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergyPurposeRoomUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergyPurposeIndoorStateDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergyPurposeTotalUsageDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.EnergyUsageByPeriodDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.SolutionDetailsDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building.SolutionSummaryDto;
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

@Tag(name = "StatsEnergyPurposeController", description = "에너지 용도 통계 관리 (에너지 용도 = 에너지, 냉난방, 환기, 조명, 전열)")
@RestController
@RequestMapping("/ndxpro/v1/enrg-pur-stats")
public class StatsEnergyPurposeController {

    @Operation(summary = "에너지 용도 총 사용량 합계 (일별/월별)",
            description = "건물 현황 -> 좌측 상단 메뉴에서 출력되는 에너지 용도 총 사용량 합계 (일별/월별)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EnergyPurposeTotalUsageDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/usage")
    public ResponseEntity<EnergyPurposeTotalUsageDto> getEnergyPurposeTotalUsageDto(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                                       @Parameter(description = "일별, 월별 중 1개를 전달해야 함")
                                                                       @Schema(allowableValues = {"daily", "monthly"}) @RequestParam String dateType) {
        if ("daily".equals(dateType)) {
            EnergyPurposeTotalUsageDto energyPurposeTotalUsageDto = EnergyPurposeTotalUsageDto.builder()
                    .dailyUsage(999.33f)
                    .dailyPredictedUsage(999.88f)
                    .dayOnDayRate(88.88f)
                    .airConditionerUsage(10.88f)
                    .ventilationUsage(200.33f)
                    .electricHeatUsage(123.54f)
                    .lightUsage(586.06f)
                    .etcUsage(388.88f)
                    .build();
            return new ResponseEntity<>(energyPurposeTotalUsageDto, HttpStatus.OK);
        } else {
            EnergyPurposeTotalUsageDto energyPurposeTotalUsageDto = EnergyPurposeTotalUsageDto.builder()
                    .monthlyUsage(8190.12f)
                    .monthlyPredictedUsage(8990.68f)
                    .yearOnYearRate(15.11f)
                    .airConditionerUsage(100.8f)
                    .ventilationUsage(2000.3f)
                    .electricHeatUsage(1230.4f)
                    .lightUsage(5860.6f)
                    .etcUsage(3880.8f)
                    .build();
            return new ResponseEntity<>(energyPurposeTotalUsageDto, HttpStatus.OK);
        }
    }

    @Operation(summary = "에너지 용도 합계 및 층별 누적 사용량, 누적 낭비량",
            description = "건물 현황 -> 우측 상단 메뉴에서 출력되는 에너지 용도 합계 및 층별 누적 사용량, 누적 낭비량")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = SolutionSummaryDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/soln/summary")
    public ResponseEntity<SolutionSummaryDto> getSolutionSimpleDto(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId) {
        // 에너지 용도(합계) 예상/권장/실제 사용량 조회
        SolutionSummaryDto solutionSummaryDto = getSolutionSummaryService();
        return new ResponseEntity<>(solutionSummaryDto, HttpStatus.OK);
    }

    @Operation(summary = "에너지 용도별 및 층별 누적 사용량, 누적 낭비량 (BEST/WORST)",
            description = "건물 현황 -> 우측 상단 메뉴에서 출력되는 에너지 용도별 및 층별 누적 사용량, 누적 낭비량 (BEST/WORST)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = SolutionDetailsDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/soln/engy-type")
    public ResponseEntity<SolutionDetailsDto> getSolutionDetailsDto(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                                    @Parameter(description = "air, ventilation, light, electricheat 중 1개를 전달해야 함")
                                                                       @Schema(allowableValues = {"air", "ventilation", "light", "electricheat"}) @RequestParam String energyType,
                                                                       @Parameter(description = "BEST, WORST 중 1개를 전달해야 함")
                                                                       @Schema(allowableValues = {"best", "worst"}) @RequestParam String efficiencyType) {
        // 에너지 용도별 (냉난방, 환기, 조명, 전열) 누적 사용량/낭비량 조회
        SolutionDetailsDto solutionDetailsDto = getSolutionDetailsService();
        return new ResponseEntity<>(solutionDetailsDto, HttpStatus.OK);
    }

    @Operation(summary = "실별 에너지 용도별 소비량 순위",
            description = "건물 현황 -> 좌측 중단 메뉴에서 실별 에너지 용도별 소비량 순위")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EnergyPurposeRoomUsageDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/usage/room-rank")
    public ResponseEntity<List<EnergyPurposeRoomUsageDto>> getEnergyPurposeRoomUsageDto(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                                                  @Parameter(example = "5", description = "층 ID") @RequestParam Integer floorId) {
        EnergyPurposeRoomUsageDto energyPurposeRoomUsageDto = EnergyPurposeRoomUsageDto.builder()
                .roomName("Room A")
                .accumulativeUsage(4999.88f)
                .totalUsageRate(40.4f)
                .build();
        EnergyPurposeRoomUsageDto energyPurposeRoomUsageDto2 = EnergyPurposeRoomUsageDto.builder()
                .roomName("Room B")
                .accumulativeUsage(3392.2f)
                .totalUsageRate(35.1f)
                .build();
        EnergyPurposeRoomUsageDto energyPurposeRoomUsageDto3 = EnergyPurposeRoomUsageDto.builder()
                .roomName("Room C")
                .accumulativeUsage(3465.1f)
                .totalUsageRate(49.0f)
                .build();
        EnergyPurposeRoomUsageDto energyPurposeRoomUsageDto4 = EnergyPurposeRoomUsageDto.builder()
                .roomName("Room D")
                .accumulativeUsage(2001.34f)
                .totalUsageRate(10.1f)
                .build();
        EnergyPurposeRoomUsageDto energyPurposeRoomUsageDto5 = EnergyPurposeRoomUsageDto.builder()
                .roomName("Room E")
                .accumulativeUsage(1020.03f)
                .totalUsageRate(22.1f)
                .build();
        EnergyPurposeRoomUsageDto energyPurposeRoomUsageDto6 = EnergyPurposeRoomUsageDto.builder()
                .roomName("Room F")
                .accumulativeUsage(957.98f)
                .totalUsageRate(5.7f)
                .build();
        List<EnergyPurposeRoomUsageDto> energyPurposeRoomUsageDtoList = new ArrayList<>();
        energyPurposeRoomUsageDtoList.add(energyPurposeRoomUsageDto);
        energyPurposeRoomUsageDtoList.add(energyPurposeRoomUsageDto2);
        energyPurposeRoomUsageDtoList.add(energyPurposeRoomUsageDto3);
        energyPurposeRoomUsageDtoList.add(energyPurposeRoomUsageDto4);
        energyPurposeRoomUsageDtoList.add(energyPurposeRoomUsageDto5);
        energyPurposeRoomUsageDtoList.add(energyPurposeRoomUsageDto6);
        return new ResponseEntity<>(energyPurposeRoomUsageDtoList, HttpStatus.OK);
    }

    @Operation(summary = "실별 에너지 용도별 실내 온습도 현황",
            description = "건물 현황 -> 우측 메뉴에서 실별 에너지 용도별 실내 온습도 현황")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = EnergyPurposeIndoorStateDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/indoor/state")
    public ResponseEntity<EnergyPurposeIndoorStateDto> getEnergyPurposeStateDto(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                                                @Parameter(example = "5", description = "층 ID") @RequestParam Integer floorId,
                                                                                @Parameter(example = "1", description = "실 ID") @RequestParam Integer roomId) {
        List<HashMap<String, Float>> currentTemperatureList = new ArrayList<>();
        HashMap<String, Float> currentTemperature = new HashMap<>();
        currentTemperature.put("2023-09-11 09", 22.5f);
        currentTemperature.put("2023-09-11 10", 25.9f);
        currentTemperature.put("2023-09-11 11", 26.5f);
        currentTemperature.put("2023-09-11 12", 26.8f);
        currentTemperature.put("2023-09-11 13", 28.1f);
        currentTemperature.put("2023-09-11 14", 27.0f);
        currentTemperatureList.add(currentTemperature);
        List<HashMap<String, Float>> currentHumidityList = new ArrayList<>();
        HashMap<String, Float> currentHumidity = new HashMap<>();
        currentHumidity.put("2023-09-11 09", 40.0f);
        currentHumidity.put("2023-09-11 10", 55.0f);
        currentHumidity.put("2023-09-11 11", 59.0f);
        currentHumidity.put("2023-09-11 12", 60.0f);
        currentHumidity.put("2023-09-11 13", 62.0f);
        currentHumidity.put("2023-09-11 14", 65.0f);
        currentHumidityList.add(currentHumidity);
        EnergyPurposeIndoorStateDto energyPurposeIndoorStateDto = EnergyPurposeIndoorStateDto.builder()
                .indoorTemperature(25.5f)
                .relativeHumidity(70.0f)
                .realtimeComfortableLevel("좋음")
                .currentTemperatureList(currentTemperatureList)
                .currentHumidityList(currentHumidityList)
                .recommendTemperature(23.0f)
                .recommendHumidity(45.0f)
                .minComfortableValue(10.0f)
                .maxComfortableValue(30.0f)
                .build();
        return new ResponseEntity<>(energyPurposeIndoorStateDto, HttpStatus.OK);
    }

    private static SolutionDetailsDto getSolutionDetailsService() {
        List<AccumulativeUsageByFloorDto> accumulativeUsageByFloorDtoList = new ArrayList<>();
        List<EnergyUsageByPeriodDto> energyUsageByPeriodDtoList = new ArrayList<>();
        EnergyUsageByPeriodDto energyUsageByPeriodDto1 = EnergyUsageByPeriodDto.builder()
                .periodName("1월")
                .monthUsage(100.1f)
                .monthWastedUsage(10.1f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto2 = EnergyUsageByPeriodDto.builder()
                .periodName("2월")
                .monthUsage(200.22f)
                .monthWastedUsage(20.22f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto3 = EnergyUsageByPeriodDto.builder()
                .periodName("3월")
                .monthUsage(300.3f)
                .monthWastedUsage(30.3f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto4 = EnergyUsageByPeriodDto.builder()
                .periodName("4월")
                .monthUsage(400.04f)
                .monthWastedUsage(40.04f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto5 = EnergyUsageByPeriodDto.builder()
                .periodName("5월")
                .monthUsage(500.0f)
                .monthWastedUsage(50.0f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto6 = EnergyUsageByPeriodDto.builder()
                .periodName("6월")
                .monthUsage(600.61f)
                .monthWastedUsage(60.61f)
                .build();
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto1);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto2);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto3);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto4);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto5);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto6);
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto1 = AccumulativeUsageByFloorDto.builder()
                .floorName("1F")
                .accumulativeUsage(100.1f)
                .accumulativeWastedUsage(10.1f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto2 = AccumulativeUsageByFloorDto.builder()
                .floorName("4F")
                .accumulativeUsage(4000.4f)
                .accumulativeWastedUsage(400.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto3 = AccumulativeUsageByFloorDto.builder()
                .floorName("5F")
                .accumulativeUsage(5500.55f)
                .accumulativeWastedUsage(55.55f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto4 = AccumulativeUsageByFloorDto.builder()
                .floorName("6F")
                .accumulativeUsage(6000.6f)
                .accumulativeWastedUsage(600.6f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto5 = AccumulativeUsageByFloorDto.builder()
                .floorName("7F")
                .accumulativeUsage(4999.8f)
                .accumulativeWastedUsage(4408.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto6 = AccumulativeUsageByFloorDto.builder()
                .floorName("8F")
                .accumulativeUsage(4999.8f)
                .accumulativeWastedUsage(4208.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto7 = AccumulativeUsageByFloorDto.builder()
                .floorName("9F")
                .accumulativeUsage(4999.8f)
                .accumulativeWastedUsage(4100.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto8 = AccumulativeUsageByFloorDto.builder()
                .floorName("10F")
                .accumulativeUsage(4102.3f)
                .accumulativeWastedUsage(482.1f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto9 = AccumulativeUsageByFloorDto.builder()
                .floorName("11F")
                .accumulativeUsage(5423.0f)
                .accumulativeWastedUsage(1293.1f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto10 = AccumulativeUsageByFloorDto.builder()
                .floorName("12F")
                .accumulativeUsage(4765.5f)
                .accumulativeWastedUsage(2100.56f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto11 = AccumulativeUsageByFloorDto.builder()
                .floorName("13F")
                .accumulativeUsage(4400.1f)
                .accumulativeWastedUsage(394.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto12 = AccumulativeUsageByFloorDto.builder()
                .floorName("14F")
                .accumulativeUsage(482.47f)
                .accumulativeWastedUsage(58.1f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto1);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto2);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto3);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto4);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto5);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto6);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto7);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto8);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto9);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto10);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto11);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto12);
        return SolutionDetailsDto.builder()
                .thisMonthFloorName("14F")
                .solutionType("솔루션 타입")
                .thisMonthAccumulativeUsage(4500.44f)
                .thisMonthAccumulativeWastedUsage(1600.88f)
                .accumulativeUsageByFloorDtoList(accumulativeUsageByFloorDtoList)
                .build();
    }

    private static SolutionSummaryDto getSolutionSummaryService() {
        List<AccumulativeUsageByFloorDto> accumulativeUsageByFloorDtoList = new ArrayList<>();
        List<EnergyUsageByPeriodDto> energyUsageByPeriodDtoList = new ArrayList<>();
        EnergyUsageByPeriodDto energyUsageByPeriodDto1 = EnergyUsageByPeriodDto.builder()
                .periodName("1월")
                .monthUsage(100.1f)
                .monthWastedUsage(10.1f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto2 = EnergyUsageByPeriodDto.builder()
                .periodName("2월")
                .monthUsage(200.22f)
                .monthWastedUsage(20.22f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto3 = EnergyUsageByPeriodDto.builder()
                .periodName("3월")
                .monthUsage(300.3f)
                .monthWastedUsage(30.3f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto4 = EnergyUsageByPeriodDto.builder()
                .periodName("4월")
                .monthUsage(400.04f)
                .monthWastedUsage(40.04f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto5 = EnergyUsageByPeriodDto.builder()
                .periodName("5월")
                .monthUsage(500.0f)
                .monthWastedUsage(50.0f)
                .build();
        EnergyUsageByPeriodDto energyUsageByPeriodDto6 = EnergyUsageByPeriodDto.builder()
                .periodName("6월")
                .monthUsage(600.61f)
                .monthWastedUsage(60.61f)
                .build();
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto1);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto2);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto3);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto4);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto5);
        energyUsageByPeriodDtoList.add(energyUsageByPeriodDto6);
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto1 = AccumulativeUsageByFloorDto.builder()
                .floorName("1F")
                .accumulativeUsage(100.1f)
                .accumulativeWastedUsage(10.1f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto2 = AccumulativeUsageByFloorDto.builder()
                .floorName("4F")
                .accumulativeUsage(4000.4f)
                .accumulativeWastedUsage(400.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto3 = AccumulativeUsageByFloorDto.builder()
                .floorName("5F")
                .accumulativeUsage(5500.55f)
                .accumulativeWastedUsage(55.55f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto4 = AccumulativeUsageByFloorDto.builder()
                .floorName("6F")
                .accumulativeUsage(6000.6f)
                .accumulativeWastedUsage(600.6f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto5 = AccumulativeUsageByFloorDto.builder()
                .floorName("7F")
                .accumulativeUsage(4999.8f)
                .accumulativeWastedUsage(4408.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto6 = AccumulativeUsageByFloorDto.builder()
                .floorName("8F")
                .accumulativeUsage(4999.8f)
                .accumulativeWastedUsage(4208.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto7 = AccumulativeUsageByFloorDto.builder()
                .floorName("9F")
                .accumulativeUsage(4999.8f)
                .accumulativeWastedUsage(4100.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto8 = AccumulativeUsageByFloorDto.builder()
                .floorName("10F")
                .accumulativeUsage(4102.3f)
                .accumulativeWastedUsage(482.1f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto9 = AccumulativeUsageByFloorDto.builder()
                .floorName("11F")
                .accumulativeUsage(5423.0f)
                .accumulativeWastedUsage(1293.1f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto10 = AccumulativeUsageByFloorDto.builder()
                .floorName("12F")
                .accumulativeUsage(4765.5f)
                .accumulativeWastedUsage(2100.56f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto11 = AccumulativeUsageByFloorDto.builder()
                .floorName("13F")
                .accumulativeUsage(4400.1f)
                .accumulativeWastedUsage(394.4f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        AccumulativeUsageByFloorDto accumulativeUsageByFloorDto12 = AccumulativeUsageByFloorDto.builder()
                .floorName("14F")
                .accumulativeUsage(482.47f)
                .accumulativeWastedUsage(58.1f)
                .energyUsageByPeriodDtoList(energyUsageByPeriodDtoList)
                .build();
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto1);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto2);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto3);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto4);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto5);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto6);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto7);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto8);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto9);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto10);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto11);
        accumulativeUsageByFloorDtoList.add(accumulativeUsageByFloorDto12);
        return SolutionSummaryDto.builder()
                .thisMonthFloorName("14F")
                .thisMonthPredictedUsage(9999.88f)
                .thisMonthRecommendedUsage(4500.44f)
                .thisMonthActualUsage(3003.8f)
                .accumulativeUsageByFloorDtoList(accumulativeUsageByFloorDtoList)
                .build();
    }

}
