package kr.co.e8ight.fdttwinservice.domain;


import java.util.LinkedHashMap;
import java.util.Map;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@Builder
public class DataModel {

  private String id;  // 예: "urn:ngsi-ld:Test:"
  private String type;  // 예: "Test"
  private String title;  // 예: "test"

  // 속성명 매핑 (예: "manager" -> "e8ight:manager")
  private LinkedHashMap<String, String> attributeNames;

  // 속성 정의 (예: "manager" -> Attribute 객체)
  private LinkedHashMap<String, Object> attributes;
}
