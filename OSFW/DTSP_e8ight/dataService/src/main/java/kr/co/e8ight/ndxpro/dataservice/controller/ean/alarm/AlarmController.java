package kr.co.e8ight.ndxpro.dataservice.controller.ean.alarm;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.alarm.AlarmStatsDto;
import kr.co.e8ight.ndxpro.dataservice.dto.error.ErrorCodeDto;
import kr.co.e8ight.ndxpro.dataservice.dto.ean.alarm.AlarmLogDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "AlarmController", description = "알람 정보 및 통계 관리")
@RestController
@RequestMapping("/ndxpro/v1/alarm")
public class AlarmController {

    @Operation(summary = "전체 알람 통계 (층별 표출)",
            description = "건물 현황 통계 상세보기 좌측 메뉴에서 출력되는 전체 알람 통계 (층별 표출)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "응답 성공", content = @Content(schema = @Schema(implementation = AlarmStatsDto.class))),
            @ApiResponse(responseCode = "400", description = "1. Bad Request\n2. Parameter Missing", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class))),
            @ApiResponse(responseCode = "500", description = "Internal Server Error", content = @Content(schema = @Schema(implementation = ErrorCodeDto.class)))
    })
    @GetMapping("/stats")
    public ResponseEntity<AlarmStatsDto> getAlarmStats(@Parameter(example = "1", description = "빌딩 ID") @RequestParam Integer buildingId) {
        List<AlarmLogDto> alarmLogDtoList = new ArrayList<>();
        AlarmLogDto alarmLogDto = AlarmLogDto.builder()
                .floorId(1)
                .floorName("cfg")
                .energyPurpose("Replica Stat")
                .systemType("System Type (TBD...)")
                .creDate(LocalDateTime.now().minusHours(9L))
                .checkYn("Host Memory (%)")
                .build();
        AlarmLogDto alarmLogDto2 = AlarmLogDto.builder()
                .floorId(2)
                .floorName("mongodb_shard_1")
                .energyPurpose("Cluster Stat")
                .systemType("System Type (TBD...)")
                .creDate(LocalDateTime.now())
                .checkYn("Replication Lag (ms)")
                .build();
        alarmLogDtoList.add(alarmLogDto);
        alarmLogDtoList.add(alarmLogDto2);
        AlarmStatsDto alarmStatsDto = AlarmStatsDto.builder()
                .dangerCnt(88)
                .warningCnt(88)
                .alarmLogDtoList(alarmLogDtoList)
                .build();
        return new ResponseEntity<>(alarmStatsDto, HttpStatus.OK);
    }

}
