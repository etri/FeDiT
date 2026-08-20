package kr.co.e8ight.fdttwinservice.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import kr.co.e8ight.fdttwinservice.domain.Attribute;
import kr.co.e8ight.fdttwinservice.domain.DataModel;
import kr.co.e8ight.fdttwinservice.domain.DataModelProperty;
import kr.co.e8ight.fdttwinservice.domain.MetadataProperty;
import kr.co.e8ight.fdttwinservice.domain.RelationshipProperty;
import kr.co.e8ight.fdttwinservice.dto.FederatedTwinModelRequestDto;
import kr.co.e8ight.fdttwinservice.dto.UnionTwinModelRequestDto;
import kr.co.e8ight.fdttwinservice.util.exception.FdtTwinException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
@Slf4j
public class TwinConnectService {
  @Value("${manager.url}")
  private String managerUrl;

  @Value("${context.url}")
  private String context;

  @Value("${token}")
  private String token;
  private final RestTemplate restTemplate;

  public String createUnionTwinModel(UnionTwinModelRequestDto unionTwinModelRequestDto) {
    validateUnionTwinModelRequestDto(unionTwinModelRequestDto);

    DataModel dataModel = buildDataModel(unionTwinModelRequestDto, null);
    saveDataModel(dataModel, false);

    return "Union Twin Model created successfully.";
  }

  /**
   * 연합(메인) 트윈 모델과 단일 트윈 모델들을 함께 생성한다.
   * 단일 트윈 모델을 먼저 만들고, 그 URN 들을 메인 모델의 hasTwin 관계로 연결한다.
   */
  public String createFederatedTwinModel(FederatedTwinModelRequestDto request) {
    validateFederatedTwinModelRequestDto(request);

    // 1. 단일 트윈 모델 생성 후 URN 수집
    List<String> singleModelUrns = new ArrayList<>();
    for (UnionTwinModelRequestDto singleTwinModel : request.getSingleTwinModels()) {
      validateTwinModel(singleTwinModel);
      DataModel singleModel = buildDataModel(singleTwinModel, null);
      // 이미 존재하는 단일 트윈 모델은 재사용한다 (URN 은 type 으로 생성하므로 참조 가능)
      saveDataModel(singleModel, true);
      singleModelUrns.add(singleModel.getId());
    }

    // 2. hasTwin 관계로 단일 트윈들을 연결한 메인 모델 생성
    UnionTwinModelRequestDto mainModel = request.getUnionTwinModel();
    validateTwinModel(mainModel);
    RelationshipProperty hasTwin = RelationshipProperty.builder()
        .type("Relationship")
        .description("연합된 단일 트윈 모델")
        .valueType("String")
        .modelType(singleModelUrns)
        .build();
    DataModel dataModel = buildDataModel(mainModel, hasTwin);
    saveDataModel(dataModel, false);

    return "Federated Twin Model created successfully.";
  }

  /**
   * 트윈 모델 정의를 만든다. 각 속성은 없으면 manager 에 등록한다.
   * hasTwin 이 주어지면 모델 정의(attributes)에 Relationship 속성으로 포함한다.
   */
  private DataModel buildDataModel(UnionTwinModelRequestDto twinModel, RelationshipProperty hasTwin) {
    LinkedHashMap<String, String> attributeNames = new LinkedHashMap<>();
    LinkedHashMap<String, Object> attributes = new LinkedHashMap<>();

    for (MetadataProperty metadataProperty : twinModel.getProperties()) {
      Attribute attribute = Attribute.builder()
          .id(metadataProperty.getName())
          .title(metadataProperty.getTitle())
          .type("e8ight")
          .valueType(metadataProperty.getValueType())
          .build();
      saveAttribute(attribute);

      DataModelProperty dataModelProperty = DataModelProperty.builder()
          .type("Property")
          .valueType(metadataProperty.getValueType())
          .build();
      attributeNames.put(metadataProperty.getName(), "e8ight:" + metadataProperty.getName());
      attributes.put(metadataProperty.getName(), dataModelProperty);
    }

    attributeNames.put("createdBy", "e8ight:createdBy");
    attributes.put("createdBy", DataModelProperty.builder().type("Property")
        .valueType("string")
        .build());

    if (hasTwin != null) {
      attributeNames.put("hasTwin", "e8ight:hasTwin");
      attributes.put("hasTwin", hasTwin);
    }

    return DataModel.builder()
        .id("urn:ngsi-ld:" + twinModel.getType() + ":")
        .title(twinModel.getTitle())
        .type(twinModel.getType())
        .attributeNames(attributeNames)
        .attributes(attributes)
        .build();
  }

  private void saveDataModel(DataModel dataModel, boolean skipIfExists) {
    URI uri = UriComponentsBuilder
        .fromUriString(managerUrl)
        .path("/ndxpro/v1/manager/data-models")
        .build()
        .toUri();

    try {
      post(uri, createHeader(), dataModel);
    } catch (HttpClientErrorException.Conflict e) {
      if (skipIfExists) {
        // 이미 존재하는 모델은 재사용한다
        log.info("Data model already exists, skipped. " + dataModel.getType());
        return;
      }
      // 모델 type 은 고유해야 하므로 중복은 오류로 처리한다
      throw new FdtTwinException(ErrorCode.ALREADY_EXISTS,
          "이미 존재하는 연합트윈 모델입니다. " + dataModel.getType());
    }
  }

  private String saveAttribute(Attribute attribute) {

    URI uri = UriComponentsBuilder
        .fromUriString(managerUrl)
        .path("/ndxpro/v1/manager/attributes")
        .build()
        .toUri();

    try {
      return post(uri, createHeader(), attribute).getBody();
    } catch (HttpClientErrorException.Conflict e) {
      // 이미 등록된 속성은 재사용한다
      log.info("Attribute already exists, skipped. " + attribute.getId());
      return null;
    }
  }

  private HttpHeaders createHeader() {
    HttpHeaders header = new HttpHeaders();
    header.setContentType(MediaType.APPLICATION_JSON);
    header.set("Link", "<" + context + ">;");
    header.set("Authorization", "Bearer " + token);
    return header;
  }

  private void validateUnionTwinModelRequestDto(UnionTwinModelRequestDto unionTwinModelRequestDto) {
    validateTwinModel(unionTwinModelRequestDto);
    if(unionTwinModelRequestDto.getCreatedBy()==null || unionTwinModelRequestDto.getCreatedBy().isEmpty()) {
      throw new FdtTwinException(ErrorCode.BAD_REQUEST_DATA, "연합트윈 모델 생성자가 없습니다.");
    }
  }

  private void validateFederatedTwinModelRequestDto(FederatedTwinModelRequestDto request) {
    if (request.getUnionTwinModel() == null) {
      throw new FdtTwinException(ErrorCode.BAD_REQUEST_DATA, "연합(메인) 트윈 모델이 없습니다.");
    }
    if (request.getSingleTwinModels() == null || request.getSingleTwinModels().isEmpty()) {
      throw new FdtTwinException(ErrorCode.BAD_REQUEST_DATA, "단일 트윈 모델이 없습니다.");
    }
  }

  private void validateTwinModel(UnionTwinModelRequestDto twinModel) {
    if (twinModel.getType()==null || twinModel.getType().isEmpty()) {
     throw new FdtTwinException(ErrorCode.BAD_REQUEST_DATA, "트윈 모델 타입이 없습니다.");
    }
    if (twinModel.getTitle()==null || twinModel.getTitle().isEmpty()) {
      throw new FdtTwinException(ErrorCode.BAD_REQUEST_DATA, "트윈 모델 제목이 없습니다.");
    }
    if (twinModel.getProperties()==null || twinModel.getProperties().isEmpty()) {
      throw new FdtTwinException(ErrorCode.BAD_REQUEST_DATA, "트윈 모델 속성이 없습니다.");
    }
  }


  private ResponseEntity<String> post(URI uri, HttpHeaders header, Object body) {

    log.info("Requesting to " + uri.getHost() + ":" + uri.getPort() + uri.getPath());
    try {
      RequestEntity<Object> request = RequestEntity
          .post(uri)
          .headers(header)
          .body(body);
      ResponseEntity<String> exchange = restTemplate.exchange(request, String.class);
      return exchange;

    } catch (HttpClientErrorException.Conflict e) {
      // 409는 호출부에서 리소스별로 처리한다
      throw e;

    } catch (HttpClientErrorException e) {
      // 4xx 클라이언트 오류 처리
      throw new FdtTwinException(ErrorCode.OPERATION_NOT_SUPPORTED, "Client error: " + e.getStatusCode());
    } catch (HttpServerErrorException e) {
      // 5xx 서버 오류 처리
      throw new FdtTwinException(ErrorCode.INTERNAL_SERVER_ERROR, "Server error: " + e.getStatusCode());
    } catch (RestClientException e) {
      // 기타 RestTemplate 관련 예외 처리
      throw new FdtTwinException(ErrorCode.INTERNAL_SERVER_ERROR, "Rest client error: " + e.getMessage());
    }


  }

}
