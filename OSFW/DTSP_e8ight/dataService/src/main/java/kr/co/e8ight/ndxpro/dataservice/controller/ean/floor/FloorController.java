package kr.co.e8ight.ndxpro.dataservice.controller.ean.floor;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "FloorController", description = "층에 대한 정보")
@RestController
@RequestMapping("/ndxpro/v1/floor")
public class FloorController {

    // TODO: 아래 API 3개를 "/ndxpro/v1/enrg-pur-stats/solution/engy-type" API 1개로 통합했음

    /*@Operation(summary = "층별 솔루션 통계(BEST/WORST)",
            description = "건물 현황 통계 상세보기 우측 메뉴에서 출력되는 층별 솔루션 통계")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = FloorSolutionStatsDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/solution/stats")
    public ResponseEntity<FloorSolutionStatsDto> getFloorSolutionStats(@Parameter(description = "energy, air, ventilation, light, electricheat 중 1개를 전달해야 함")
                                                                       @Schema(allowableValues = {"energy", "air", "ventilation", "light", "electricheat"}) @RequestParam String energyType,
                                                                       @Parameter(description = "best, worst 중 1개를 전달해야 함")
                                                                       @Schema(allowableValues = {"best", "worst"}) @RequestParam String energyCondition) {
        FloorSolutionStatsDto floorSolutionStatsDto = FloorSolutionStatsDto.builder()
                .floorId(1)
                .floorName("3F")
                .solutionType("솔루션 타입")
                .recommendUsage(992.21F)
                .currUsage(32.07F)
                .build();
        return new ResponseEntity<>(floorSolutionStatsDto, HttpStatus.OK);
    }

    @Operation(summary = "층별 현황 통계",
            description = "건물 현황 통계 상세보기 우측 메뉴에서 출력되는 층별 현황 통계")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = FloorStatsDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/stats")
    public ResponseEntity<FloorStatsDto> getFloorStats(@Parameter(description = "energy, air, ventilation, light, electricheat 중 1개를 전달해야 함")
                                                       @Schema(allowableValues = {"energy", "air", "ventilation", "light", "electricheat"}) @RequestParam String energyType) {
        FloorStatsDto floorStatsDto = FloorStatsDto.builder()
                .floorId(1)
                .floorName("7F")
                .currUsage(4999.88F)
                .prevDateRate(150F)
                .build();
        return new ResponseEntity<>(floorStatsDto, HttpStatus.OK);
    }

    // TODO: "/ndxpro/v1/floor/stats" API 조회할 때 미리 기간에 따른 현재 사용량 데이터도 같이 조회할지 고민할 것
    @Operation(summary = "층별 현황 통계 영역에서 기간에 따른 일별 사용량",
            description = "건물 현황 통계 상세보기 우측 메뉴에서 출력되는 층별 현황 통계 영역에서 기간에 따른 일별 사용량")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = FloorStatsPeriodDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/stats/period")
    public ResponseEntity<FloorStatsPeriodDto> getFloorStatsPeriod(@Parameter(description = "energy, air, ventilation, light, electricheat 중 1개를 전달해야 함")
                                                                   @Schema(allowableValues = {"energy", "air", "ventilation", "light", "electricheat"}) @RequestParam String energyType,
                                                                   @Parameter(example = "12", description = "층 ID") @RequestParam Integer floorId) {
        List<Float> dailyUsageList = new ArrayList<>();
        dailyUsageList.add(1854.54f);
        dailyUsageList.add(1198.4f);
        dailyUsageList.add(2607.65f);
        dailyUsageList.add(1443.79f);
        FloorStatsPeriodDto floorStatsPeriodDto = FloorStatsPeriodDto.builder()
                .floorId(1)
                .floorName("3F")
                .recommendUsage(992.21F)
                .dailyUsageList(dailyUsageList)
                .startDate(LocalDateTime.now().minusDays(15L))
                .endDate(LocalDateTime.now())
                .build();
        return new ResponseEntity<>(floorStatsPeriodDto, HttpStatus.OK);
    }*/

}
