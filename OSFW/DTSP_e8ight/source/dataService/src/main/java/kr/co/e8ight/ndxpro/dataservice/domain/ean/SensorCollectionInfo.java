package kr.co.e8ight.ndxpro.dataservice.domain.ean;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Document(collection = "energy_collection_info")
public class SensorCollectionInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "'에너지 수집 방식 (가공 후 수집, 직접 수집)'")
    private String collectionMethod;

    @Column(columnDefinition = "'에너지 수집 타입 (입구 온도, 전력 사용량, 연료 소비량, 실내환경 등)'")
    private String collectionType;

    @Column(columnDefinition = "'에너지 수집 단위 (W, kWh, mg/m3 등)'")
    private String collectionUnit;

    @Column(columnDefinition = "'에너지 수집 주기 (Millisecond 단위)'")
    private Integer collectionPeriod;

    @Size(max = 1)
    @Column(columnDefinition = "'사용 여부'")
    private String useYn;

    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Column(columnDefinition = "'생성일시'")
    private LocalDateTime creDate;

    @LastModifiedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Column(columnDefinition = "'수정일시'")
    private LocalDateTime uptDate;

}
