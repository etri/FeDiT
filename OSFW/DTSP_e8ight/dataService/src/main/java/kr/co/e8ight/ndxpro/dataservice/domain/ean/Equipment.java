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
import javax.persistence.OneToMany;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
@Entity
@Document(collection = "equipment")
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "'기기 코드'")
    private String equipmentCode;

    @Column(columnDefinition = "'기기명'")
    private String equipmentName;

    @OneToMany
    private List<Sensor> sensorList;

    @OneToMany
    private List<MaintenanceHistory> maintenanceHistoryList;

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
