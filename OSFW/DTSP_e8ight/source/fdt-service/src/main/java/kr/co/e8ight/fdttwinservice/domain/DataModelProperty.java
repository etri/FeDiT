package kr.co.e8ight.fdttwinservice.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Builder
@Getter
@ToString
public class DataModelProperty {

  private String type;
  private String valueType;

}
