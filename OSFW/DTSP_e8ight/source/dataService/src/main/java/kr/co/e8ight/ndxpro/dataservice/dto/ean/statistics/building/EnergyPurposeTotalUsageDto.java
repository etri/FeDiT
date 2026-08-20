package kr.co.e8ight.ndxpro.dataservice.dto.ean.statistics.building;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Builder
@Schema(description = "에너지 용도 총 사용량 합계 (일별/월별) - 건물_랜딩 화면 (좌측 상단)")
public class EnergyPurposeTotalUsageDto {

    // 일별 에너지 용도 총 사용량 합계 (시작)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "일별 에너지 사용량")
    private Float dailyUsage;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "일별 예상 사용량")
    private Float dailyPredictedUsage;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "어제 대비")
    private Float dayOnDayRate;
    // 일별 에너지 용도 총 사용량 합계 (끝)

    // 월별 에너지 용도 총 사용량 합계 (시작)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "월별 에너지 사용량")
    private Float monthlyUsage;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "월별 예상 사용량")
    private Float monthlyPredictedUsage;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "작년 동월 대비")
    private Float yearOnYearRate;
    // 월별 에너지 용도 총 사용량 합계 (끝)

    // 공통 필드
    @Schema(description = "냉난방 사용량")
    private Float airConditionerUsage;

    @Schema(description = "환기 사용량")
    private Float ventilationUsage;

    @Schema(description = "전열 사용량")
    private Float electricHeatUsage;

    @Schema(description = "조명 사용량")
    private Float lightUsage;

    @Schema(description = "기타 사용량")
    private Float etcUsage;

}
