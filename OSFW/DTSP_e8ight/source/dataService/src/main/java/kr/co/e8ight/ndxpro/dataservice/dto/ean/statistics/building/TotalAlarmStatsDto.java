package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Builder
@Schema(description = "전체 알람 통계 (층별 표출) - 건물_플랜 모델 화면 (좌측 하단), 설비_랜딩 화면 (좌측 중단)")
public class TotalAlarmStatsDto {

    @Schema(description = "위험 개수")
    private int dangerCount;

    @Schema(description = "주의 개수")
    private int warningCount;

    @Schema(description = "층 이름")
    private String floorName;

    @Schema(description = "에너지 용도")
    private String energyPurpose;

    @Schema(description = "시스템 종류")
    private String systemType;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Schema(description = "생성 날짜")
    private LocalDateTime creDate;

    @Schema(description = "확인여부")
    private String checkYn;

}
