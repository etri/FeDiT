package kr.co.e8ight.ndxpro.dataservice.dto.ean.alarm;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "전체 알람 통계 (층별 표출)")
public class AlarmStatsDto {

    @Schema(description = "위험 개수", nullable = false, example = "32")
    private int dangerCnt;

    @Schema(description = "주의 개수", nullable = false, example = "16")
    private int warningCnt;

    @Schema(description = "알람 로그 목록", nullable = false)
    private List<AlarmLogDto> alarmLogDtoList;

}
