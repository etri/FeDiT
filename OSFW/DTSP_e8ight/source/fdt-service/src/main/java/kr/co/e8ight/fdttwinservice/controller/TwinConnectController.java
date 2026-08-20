package kr.co.e8ight.fdttwinservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.fdttwinservice.dto.FederatedTwinModelRequestDto;
import kr.co.e8ight.fdttwinservice.dto.UnionTwinModelRequestDto;
import kr.co.e8ight.fdttwinservice.service.TwinConnectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "FdtTwin Management")
@Slf4j
@RestController
@RequestMapping("/api/fdt")
@RequiredArgsConstructor
public class TwinConnectController {

  private final TwinConnectService twinConnectService;

  // 연합트윈 프로젝트 생성


  // 연합트윈 모델 생성
  @PostMapping("/union-twin-model")
  @Operation(summary = "연합트윈 모델 생성", description = "연합트윈 모델을 생성합니다.")
  public String createUnionTwinModel(@RequestBody UnionTwinModelRequestDto uninTwinModelRequestDto) {
    return twinConnectService.createUnionTwinModel(uninTwinModelRequestDto);
  }

  // 연합 트윈 모델 + 단일 트윈 모델 일괄 생성
  @PostMapping("/federated-twin-model")
  @Operation(summary = "연합 트윈 모델 생성(단일 트윈 포함)",
      description = "단일 트윈 모델들을 생성한 뒤, hasTwin 관계로 연결한 연합(메인) 트윈 모델을 생성합니다.")
  public String createFederatedTwinModel(@RequestBody FederatedTwinModelRequestDto request) {
    return twinConnectService.createFederatedTwinModel(request);
  }

}
