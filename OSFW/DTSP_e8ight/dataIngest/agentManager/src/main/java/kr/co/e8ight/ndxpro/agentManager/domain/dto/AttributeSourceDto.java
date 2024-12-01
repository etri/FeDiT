package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import kr.co.e8ight.ndxpro.agentManager.domain.AttributeSource;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class AttributeSourceDto {

  private Long id;
  private String attributeName;
  private String sourceName;
  private String modelType;

  public static AttributeSourceDto from(AttributeSource attributeSource) {
    return new AttributeSourceDto(attributeSource.getId(), attributeSource.getAttributeName(), attributeSource.getSourceName(), attributeSource.getDataModel().getModelType());
  }
}
