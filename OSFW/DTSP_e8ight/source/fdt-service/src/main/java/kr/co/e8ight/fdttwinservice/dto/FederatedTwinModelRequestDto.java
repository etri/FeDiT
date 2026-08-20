package kr.co.e8ight.fdttwinservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class FederatedTwinModelRequestDto {

  @Schema(description = "연합(메인) 트윈 모델")
  private UnionTwinModelRequestDto unionTwinModel;

  @Schema(description = "연합 대상 단일 트윈 모델 목록")
  private List<UnionTwinModelRequestDto> singleTwinModels;

}
