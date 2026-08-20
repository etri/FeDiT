package kr.co.e8ight.fdttwinservice.dto;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import kr.co.e8ight.fdttwinservice.domain.MetadataProperty;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class UnionTwinModelRequestDto {

  @Schema(description = "모델명", example = "UnionTwinModel001")
  private String type;

  @Schema(description = "모델 제목", example = "연합 트윈 모델 001")
  private String title;

  @Schema(description = "모델 설명", example = "교통 단일 트윈과 날씨 단일 트윈을 결합한 모델 입니다.")
  private String description;

  @Schema(description = "디지털 트윈 객체 아이디", example = "KR-01-20203-0001")
  private String digitalTwinObjectId;
  @Schema(
      description = "모델 속성",
      example = "["
          + "{\"name\":\"latitude\", \"valueType\":\"Double\", \"title\":\"위도\"},"
          + "{\"name\":\"longitude\", \"valueType\":\"Double\", \"title\":\"경도\"},"
          + "{\"name\":\"temperature\", \"valueType\":\"Double\", \"title\":\"온도\"},"
          + "{\"name\":\"congestion\", \"valueType\":\"Double\", \"title\":\"혼잡도\"},"
          + "{\"name\":\"locationName\", \"valueType\":\"String\", \"title\":\"위치명\"}"
          + "]"
  )
  private List<MetadataProperty> properties;

  @Schema(description = "모델 생성자", example = "테스트")
  private String createdBy;

}
