package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class AttributeSourceAddRequestDto {
  private String modelType;
  private String attributeName;
  private String sourceName;
}
