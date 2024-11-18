package kr.co.e8ight.ndxpro.dataservice.domain.ean;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Document(collection = "sensor_history")
public class SensorHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Schema(description = "센서 ID")
    private Long sensorId;

    @Schema(description = "센서 시리얼 번호")
    private String sensorSerialNumber;

    @Schema(description = "센서 이름")
    private String sensorName;

    @Schema(description = "수집 이름")
    private String collectionName;

    @Schema(description = "수집 방식")
    private String collectionMethod;

    @Schema(description = "수집 유형")
    private String collectionType;

    @Schema(description = "수집 상세 유형")
    private String collectionSubType;

    @Schema(description = "수집 단위")
    private String collectionUnit;

    @Schema(description = "수집 주기")
    private String collectionCycle;

    @Schema(description = "존 ID 목록 (문자열)")
    private String zoneIdStr;

    @Schema(description = "기기 ID 목록 (문자열)")
    private String equipmentIdStr;

    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Schema(description = "생성일시")
    private LocalDateTime creDate;

}
