package kr.co.e8ight.ndxpro.dataservice.domain.ean;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import java.util.List;

@Setter
@Getter
@Entity
@Document(collection = "room")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Schema(description = "실 이름 (창고, 기계실 등)")
    private String name;

    @Schema(description = "실 용도")
    private String nameUsage;

    @Schema(description = "실 용도 코드")
    private String nameUsageCode;

    @Schema(description = "실 면적")
    private String roomArea;

    @Schema(description = "실 층고")
    private String roomHeight;

    @ManyToOne
    @Schema(description = "여러 실은 층 1개로 구성되어 있음")
    private Floor floor;

    @ManyToOne
    @Schema(description = "여러 실이 존 1개로 정의될 수도 있음")
    private Zone zone;

    @ManyToMany
    @Schema(description = "동일한 기기가 다른 실에도 존재할 수 있음 (개념적으로)")
    private List<Equipment> equipmentList;

    @ManyToMany
    @Schema(description = "동일한 센서가 다른 실에도 존재할 수 있음 (개념적으로)")
    private List<Sensor> sensorList;

}
