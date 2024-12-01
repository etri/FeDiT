package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.equipment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.List;

@Getter
@Setter
@Builder
@Schema(description = "실시간 시스템 부하율 - 설비_랜딩 화면 (좌측 상단)")
public class RealtimeSystemLoadRateDto {

    @Schema(description = "기기명")
    private String equipmentName;

    @Schema(description = "부하율")
    private Float loadRate;

}
