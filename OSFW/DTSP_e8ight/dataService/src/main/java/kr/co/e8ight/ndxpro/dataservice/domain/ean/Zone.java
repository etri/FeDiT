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
import javax.persistence.OneToMany;
import java.util.List;

@Setter
@Getter
@Entity
@Document(collection = "zone")
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Schema(description = "존 이름 (A, B 등)")
    private String name;

    @Schema(description = "냉방 공급방식")
    private String coolingSupplyType;

    @Schema(description = "난방 공급방식")
    private String heatingSupplyType;

    @Schema(description = "급탕 공급방식")
    private String hotwaterSupplyType;

    @Schema(description = "냉방기기")
    private String coolingUnits;

    @Schema(description = "냉수공급라인")
    private String coolingSupplyLine;

    @Schema(description = "난방기기")
    private String heatingUnits;

    @Schema(description = "난방온수공급라인")
    private String heatingSupplyLine;

    @Schema(description = "급탕기기")
    private String hotwaterUnits;

    @Schema(description = "급탕온수공급라인")
    private String hotwaterSupplyLine;

    @Schema(description = "실내기")
    private String indoorUnits;

    @Schema(description = "환기기기")
    private String ventilationUnits;

    @Schema(description = "조명기기")
    private String lightings;

    @Schema(description = "전열기기")
    private String plugs;

    @OneToMany
    @Schema(description = "존 하나가 여러 건물을 구성할 수 있음")
    private List<Building> buildingList;

    @OneToMany
    @Schema(description = "존 하나가 여러 층을 구성할 수 있음")
    private List<Floor> floorList;

    @OneToMany
    @Schema(description = "존 하나가 여러 실을 구성할 수 있음")
    private List<Room> roomList;

    @ManyToMany
    @Schema(description = "여러 존에 동일한 기기가 존재할 수도 있음")
    private List<Equipment> equipmentList;

    @ManyToMany
    @Schema(description = "여러 존에 동일한 센서가 존재할 수도 있음")
    private List<Sensor> sensorList;

}
