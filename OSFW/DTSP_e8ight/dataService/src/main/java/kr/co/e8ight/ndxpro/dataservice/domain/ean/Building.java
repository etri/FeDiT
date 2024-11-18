package kr.co.e8ight.ndxpro.dataservice.domain.ean;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import java.util.List;

@Setter
@Getter
@Entity
@Document(collection = "building")
public class Building {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Schema(description = "건물 이름 (롯데타워, A동, B동 등)")
    private String name;

    @Schema(description = "건물 주소")
    private String address;

    @Schema(description = "연면적")
    private String grossFloorArea;

    @Schema(description = "건폐율")
    private String buildingCoverageRatio;

    @Schema(description = "용적률")
    private String floorAreaRatio;

    @Schema(description = "건물 높이")
    private String height;

    @Schema(description = "건축허가일")
    private String permitDate;

    @Schema(description = "준공일")
    private String approvalDate;

    @Schema(description = "지상 층수")
    private String groundFloorCount;

    @Schema(description = "지하 층수")
    private String undergroundFloorCount;

    @Schema(description = "에너지효율등급")
    private String energyEfficiencyGrade;

    @Schema(description = "에너지절감률")
    private String energyEfficiencyRate;

    @OneToMany
    @Schema(description = "건물을 구성하는 층 목록")
    private List<Floor> floorList;

    @ManyToOne
    @Schema(description = "여러 건물이 존 1개로 정의될 수도 있음")
    private Zone zone;

}
