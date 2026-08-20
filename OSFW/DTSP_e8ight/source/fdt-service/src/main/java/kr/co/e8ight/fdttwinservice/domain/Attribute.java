package kr.co.e8ight.fdttwinservice.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@Builder
public class Attribute {
  private String id;

  private String type;

  private String title;

  private String description;

  private String valueType;
}
