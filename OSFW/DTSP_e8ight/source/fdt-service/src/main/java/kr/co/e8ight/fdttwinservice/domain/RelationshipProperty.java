package kr.co.e8ight.fdttwinservice.domain;

import java.util.List;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Builder
@Getter
@ToString
public class RelationshipProperty {

  private String type;          // 예: "Relationship"
  private String description;   // 예: "소유자"
  private String valueType;     // 예: "String"

  // 연합된 단일 트윈 모델 URN 목록 (예: ["urn:ngsi-ld:SingleTwin001:"])
  private List<String> modelType;

}
