package kr.co.e8ight.ndxpro.dataservice.controller.ean.zone;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "ZoneController", description = "Zone 정보 관리")
@RestController
@RequestMapping("/ndxpro/v1/zone")
public class ZoneController {

    /*@Operation(summary = "층에 대한 Zone 상태 정보",
            description = "건물 현황 -> 중앙 메뉴에서 출력되는 층에 대한 Zone 상태 정보")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = ZoneStateDto.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/status/list")
    public ResponseEntity<FloorDetailsDto> getZoneStatusList(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId,
                                                             @Parameter(example = "1", description = "층 ID") @RequestParam Integer floorId,
                                                             @Parameter(description = "energy, air, ventilation, light, electricheat 중 1개를 전달해야 함")
                                                             @Schema(allowableValues = {"energy", "air", "ventilation", "light", "electricheat"}) @RequestParam String energyType) {
        List<ZoneStateDto> zoneStateDtoList = new ArrayList<>();
        ZoneStateDto zoneStateDto = ZoneStateDto.builder()
                .id(1)
                .name("A")
                .airConditioningState("냉방 중")
                .realtimeRefreshLevel("매우 좋음")
                .build();
        ZoneStateDto zoneStateDto2 = ZoneStateDto.builder()
                .id(2)
                .name("B")
                .airConditioningState("외기냉방")
                .realtimeRefreshLevel("매우 좋음")
                .build();
        ZoneStateDto zoneStateDto3 = ZoneStateDto.builder()
                .id(3)
                .name("C")
                .airConditioningState("CD")
                .realtimeRefreshLevel("매우 좋음")
                .build();
        ZoneStateDto zoneStateDto4 = ZoneStateDto.builder()
                .id(4)
                .name("D")
                .airConditioningState("WU")
                .realtimeRefreshLevel("매우 좋음")
                .build();
        ZoneStateDto zoneStateDto5 = ZoneStateDto.builder()
                .id(5)
                .name("E")
                .airConditioningState("NP")
                .realtimeRefreshLevel("매우 좋음")
                .build();
        ZoneStateDto zoneStateDto6 = ZoneStateDto.builder()
                .id(6)
                .name("F")
                .airConditioningState("NS")
                .realtimeRefreshLevel("매우 좋음")
                .build();
        zoneStateDtoList.add(zoneStateDto);
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
    }*/

}
