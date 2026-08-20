package kr.co.e8ight.ndxpro.dataservice.domain.ean.measurement;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@Schema(description = "측정된 신재생 에너지 (태양열, 태양광)")
public class RenewableMeasurement {

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

    @Schema(description = "오늘 누적 발전량")
    private Float todayCumulativeCapacity;

    @Schema(description = "오늘 예측 발전량")
    private Float todayPredictedCapacity;

    @Schema(description = "어제 대비 발전 증감률")
    private Float dOdChangeCapacityRate;

    @Schema(description = "이번 달 누적 발전량")
    private Float thisMonthCumulativeCapacity;

    @Schema(description = "이번 달 예상 발전량")
    private Float thisMonthPredictedCapacity;

    @Schema(description = "지난 달 발전 증감률")
    private Float mOmChangeCapacityRate;

}
