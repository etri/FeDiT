package kr.co.e8ight.ndxpro.dataservice.domain.ean;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Document(collection = "measure_point_purpose")
public class MeasurePointPurpose {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "'에너지 용도 코드'")
    private String energyPurposeCode;

    @Column(columnDefinition = "'에너지 용도명'")
    private String energyPurposeName;

    @Column(columnDefinition = "'에너지 수집 주기에 따라 수집된 값'")
    private Float energyPurposeValue;

    @ManyToOne
    private Sensor sensor;

    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Column(columnDefinition = "'생성일시'")
    private LocalDateTime creDate;

}
