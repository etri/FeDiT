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
@Document(collection = "floor")
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Schema(description = "층 이름 (1층, 지하3층 등)")
    private String name;

    @Schema(description = "층 수")
    private String floorCount;

    @Schema(description = "층 유형")
    private String floorType;

    @ManyToOne
    @Schema(description = "여러 층은 건물 1개로 구성되어 있음")
    private Building building;

    @OneToMany
    @Schema(description = "층을 구성하는 실 목록")
    private List<Room> roomList;

    @ManyToOne
    @Schema(description = "여러 층이 존 1개로 정의될 수도 있음")
    private Zone zone;

}
