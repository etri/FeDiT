package kr.co.e8ight.ndxpro.dataservice.domain.ean.measurement;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "측정된 냉난방 에너지")
public class CoolingHeatingMeasurement {

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

    @Schema(description = "쾌적 범위")
    private String comfortableRange;

    @Schema(description = "실쾌적 여부")
    private String comfortableState;

    @Schema(description = "가동 여부")
    private String runningState;

    @Schema(description = "설정 온도")
    private Float settingTemperature;

    @Schema(description = "실내 온도")
    private Float indoorTemperature;

    @Schema(description = "상대 습도")
    private Float relativeHumidity;

    @Schema(description = "예측 사용량")
    private Float predictedUsage;

    @Schema(description = "권장 사용량")
    private Float recommendedUsage;

    @Schema(description = "낭비 사용량")
    private Float wastedUsage;

    @Schema(description = "오늘 누적 사용량")
    private Float todayCumulativeUsage;

    @Schema(description = "이번 달 누적 사용량")
    private Float thisMonthCumulativeUsage;

    @Schema(description = "어제 대비 사용 증감률")
    private Float dOdChangeUsageRate;

    @Schema(description = "지난달 대비 사용 증감률")
    private Float mOmChangeUsageRate;

    @Schema(description = "작년 동월 대비 사용 증감률")
    private Float lastYearSameMonthChangeUsageRate;

    @Schema(description = "오늘 누적 사용량")
    private Float todayWastedUsage;

    @Schema(description = "이번 달 누적 사용량")
    private Float thisMonthWastedUsage;

    @Schema(description = "일별 사용량")
    private Float dayUsage;

    @Schema(description = "월별 사용량")
    private Float monthUsage;

    @Schema(description = "연도별 사용량")
    private Float yearUsage;

}
