package kr.co.e8ight.ndxpro.dataservice.domain.ean;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
@Entity
@Document(collection = "sensor")
public class Sensor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Schema(description = "센서 시리얼 번호")
    private String serialNumber;

    @Schema(description = "센서 이름 (온도 센서, 복합 센서 등)")
    private String name;

    @Size(max = 1)
    @Schema(description = "사용 여부")
    private String useYn;

    @OneToMany
    @Schema(description = "복합 센서인 경우 센서 정보를 한번에 2개 이상 수집할 수 있음")
    private List<SensorCollectionInfo> sensorCollectionInfoList;

    @ManyToOne
    @Schema(description = "센서가 설치된 기기")
    private Equipment equipment;

    @ManyToMany
    @Schema(description = "센서가 설치된 실 목록")
    private List<Room> roomList;

    @ManyToMany
    @Schema(description = "센서가 설치된 존 목록")
    private List<Zone> zoneList;

    @OneToOne
    @Schema(description = "이전에 다른 용도 및 공간에서 사용되었던 가장 마지막 센서 이력")
    private SensorHistory sensorHistory;

    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Schema(description = "생성일시")
    private LocalDateTime creDate;

    @LastModifiedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    @Schema(description = "수정일시")
    private LocalDateTime uptDate;

}
