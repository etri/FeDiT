package kr.co.e8ight.ndxpro.agentManager.domain;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AttributeSourceAddRequestDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class AttributeSource {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  private DataModel dataModel;

  private String attributeName;
  private String sourceName;

  public static AttributeSource create(DataModel dataModel, AttributeSourceAddRequestDto requestDto) {
    return new AttributeSource(null, dataModel, requestDto.getAttributeName(), requestDto.getSourceName());
  }
}
