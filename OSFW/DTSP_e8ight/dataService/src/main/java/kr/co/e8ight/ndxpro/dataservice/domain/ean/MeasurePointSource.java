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
@Document(collection = "measure_point_source")
public class MeasurePointSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "'에너지원 코드'")
    private String energySourceCode;

    @Column(columnDefinition = "'에너지원명'")
    private String energySourceName;

    @Column(columnDefinition = "'에너지 수집 주기에 따라 수집된 값'")
    private Float energySourceValue;

    @ManyToOne
    private Sensor sensor;

    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Column(columnDefinition = "'생성일시'")
    private LocalDateTime creDate;

}
