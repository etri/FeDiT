package kr.co.e8ight.ndxpro.dataservice.dto.ean.alarm;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@Schema(description = "알람 로그에 대한 정보")
public class AlarmLogDto {

    @Schema(description = "층 ID", nullable = false, example = "1")
    private Integer floorId;

    @Schema(description = "층 이름", nullable = false, example = "mongodb_shard_1")
    private String floorName;

    @Schema(description = "에너지 용도", nullable = false, example = "Cluster Stat")
    private String energyPurpose; // 건물 현황에만 있는 필드

    @Schema(description = "시스템 종류", nullable = false, example = "System Type (TBD...)")
    private String systemType; // 설비 현황에만 있는 필드

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Schema(description = "생성 날짜", nullable = false, example = "2023-08-14 13:26:48", type = "string")
    private LocalDateTime creDate;

    @Schema(description = "확인 여부", nullable = false, example = "Replication Lag (ms)")
    private String checkYn;

}
