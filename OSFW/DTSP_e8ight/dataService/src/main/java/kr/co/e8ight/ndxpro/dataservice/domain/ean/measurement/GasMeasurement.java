package kr.co.e8ight.ndxpro.dataservice.domain.ean.measurement;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "측정된 가스 에너지")
public class GasMeasurement {

    @Schema(description = "건물 ID")
    private String buildingId;

    @Schema(description = "층 ID")
    private String floorId;

    @Schema(description = "실 ID")
    private String roomId;

    @Schema(description = "존 ID")
    private String zoneId;

    @Schema(description = "수집 이름")
    private String collectionName;

    @Schema(description = "수집 유형 (energy, air, water 등)")
    private String collectionType;

    @Schema(description = "수집 상세 유형 (electricity, temperature 등)")
    private String collectionSubType;

    @Schema(description = "수집 단위")
    private String collectionUnit;

    @Schema(description = "수집 주기")
    private String collectionResolution;

    @Schema(description = "연동 여부")
    private String deviceConnectionState;

    @Schema(description = "계측 상태")
    private String measurementState;

    @Schema(description = "통신 상태")
    private String trafficState;

    @Schema(description = "기기/센서 ID 매핑")
    private Object collectedBy;

    @Schema(description = "측정값 (Object 타입)")
    private Object measurement;

    @Schema(description = "오늘 누적 사용량")
    private Float todayCumulativeUsage;

    @Schema(description = "오늘 예측 사용량")
    private Float todayPredictedUsage;

    @Schema(description = "어제 대비 사용 증감률")
    private Float dOdChangeUsageRate;

    @Schema(description = "오늘 누적 비용")
    private Float todayCumulativeCost;

    @Schema(description = "오늘 예측 비용")
    private Float todayPredictedCost;

    @Schema(description = "어제 대비 비용 증감률")
    private Float dOdChangeCostRate;

    @Schema(description = "이번달 누적 사용량")
    private Float thisMonthCumulativeUsage;

    @Schema(description = "이번달 예측 사용량")
    private Float thisMonthPredictedUsage;

    @Schema(description = "지난달 대비 사용 증감률")
    private Float mOmChangeUsageRate;

    @Schema(description = "이번달 누적 비용")
    private Float thisMonthCumulativeCost;

    @Schema(description = "이번달 예측 비용")
    private Float thisMonthPredictedCost;

    @Schema(description = "지난달 대비 비용 증감률")
    private Float mOmChangeCostRate;

    @Schema(description = "일별 사용량")
    private Float dailyUsage;

    @Schema(description = "월별 사용량")
    private Float monthlyUsage;

    @Schema(description = "연도별 사용량")
    private Float yearlyUsage;

}
