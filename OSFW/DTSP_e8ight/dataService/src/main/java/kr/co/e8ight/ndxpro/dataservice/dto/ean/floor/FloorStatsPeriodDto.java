package kr.co.e8ight.ndxpro.dataservice.dto.ean.floor;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "층별 현황 통계 영역에서 기간에 따른 일별 사용량")
public class FloorStatsPeriodDto {

    @Schema(description = "층 ID", nullable = false, example = "1")
    private Integer floorId;

    @Schema(description = "층 이름", nullable = false, example = "B2F")
    private String floorName;

    @Schema(description = "권장 사용량(MWh)", nullable = false, example = "1132.61")
    private float recommendUsage;

    @Schema(description = "일별 사용량(MWh)", nullable = false, example = "952.72")
    private List<Float> dailyUsageList;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
    @Schema(description = "조회 시작일", nullable = false, example = "2023-08-15", type = "string")
    private LocalDateTime startDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "Asia/Seoul")
    @Schema(description = "조회 종료일", nullable = false, example = "2023-08-31", type = "string")
    private LocalDateTime endDate;

}
