package kr.co.n2m.platform.meta.search.vector.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.ElasticProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataVo;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataApiMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataSetMapper;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;
import kr.co.n2m.platform.meta.search.vector.domain.VectorStoreDto;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class VectorSearchService {
	
    @Autowired
    private MetadataSetService metadataSetService;
    
	@PostConstruct
	public void init() {
		metadataSetService.setVectorSearchService(this); // 순환참조 오류 방지
	}

	@Autowired
	private ElasticProperty elasticProperty;

    @Autowired
    private RestTemplate restTemplate;
    
	@Autowired
	private MetadataSetMapper metadataSetMapper;
    
	@Autowired
	private MetadataMapper metadataMapper;
    
	@Autowired
	private MetadataApiMapper metadataApiMapper;
	
	@Autowired
	private ModelService modelService;

	/** 벡터 서버 사용 여부. false 면 벡터 서버를 호출하지 않는다. */
	@Value("${vector.enabled:false}")
	private boolean vectorEnabled;

	/**
	 * 셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 등록/수정
	 * TODO 임시적
	 * @param medataSetId
	 */
	@SuppressWarnings("unchecked")
	public void saveVentorDataBySetId(String medataSetId) {
		log.debug("[셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 등록/수정] 서비스 시작 - {}", medataSetId);
		if (!vectorEnabled) {
			log.debug("[셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 등록/수정] 벡터 서버 미사용 - {}", medataSetId);
			return;
		}
		try {
			MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
			if (setDto == null) throw new ResNotFoundException("메타데이터 셋 데이터가 존재하지 않습니다.");
			
			String typeModelId = setDto.getTypeModelId();
			String modelId     = setDto.getModelId();		
			String jwtToken = AuthUtil.getCurrentJwtToken();
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(modelId);
			
			setDto.setArrayDataLimitYn("N");
			ListOrderedMap<String, Object> medataSetMap =  metadataApiMapper.selectMetadataToJsonStrBySetId(setDto);
			
			MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
			metadataSearchVo.setIsPaging(false);
			metadataSearchVo.setMedataSetId(medataSetId);
			metadataSearchVo.setSqlDateFormat(typeModelId);
			List<CamelCaseMap> upSetList = metadataSetMapper.selectMetadataSetDtwListBySubSetId(metadataSearchVo);
			
			this.saveVentorData(medataSetId, medataSetMap, modelInfoDto, upSetList, jwtToken);
			
	    } catch (ResBaseRuntimeException e) {            
	    	throw e;            
	    } catch (Exception e) {
	        log.error("[셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 등록/수정] 알 수 없는 오류: {}", e.getMessage(), e);
	        throw new ResBaseRuntimeException(e);
	    }		
		log.debug("[셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 등록/수정] 서비스 종료 - {}", medataSetId);
	}
	
	/**
	 * 셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 삭제
	 * @param medataSetId
	 */
	public void deleteVectorDataBySetId(String medataSetId) {
		log.debug("[셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 삭제] 서비스 시작 - {}", medataSetId);
		if (!vectorEnabled) {
			log.debug("[셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 삭제] 벡터 서버 미사용 - {}", medataSetId);
			return;
		}
		try {
			String jwtToken = AuthUtil.getCurrentJwtToken();
			
			this.deleteVectorData(medataSetId, jwtToken);
			
	    } catch (ResBaseRuntimeException e) {            
	    	throw e;            
	    } catch (Exception e) {
	        log.error("[셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 삭제] 알 수 없는 오류: {}", e.getMessage(), e);
	        throw new ResBaseRuntimeException(e);
	    }		
		log.debug("[셋 ID 로 ElasticSearch에 메타데이터 벡터 정보 삭제] 서비스 종료 - {}", medataSetId);
	}
    
	/**
	 * 메타데이터 셋별 벡터 데이터 저장 (메타데이터 셋 서비스에서도 호출됨)
	 * @param medataSetId
	 * @param medataSetMap
	 * @param modelInfoDto
	 * @param upSetList
	 * @param jwtToken
	 */
	public void saveVentorData(String medataSetId, ListOrderedMap<String, Object> medataSetMap, ModelInfoDto modelInfoDto, List<CamelCaseMap> upSetList, String jwtToken) {
        log.debug("[메타데이터 셋별 벡터 데이터 저장] 서비스 시작 - {}", medataSetId);
        if (!vectorEnabled) {
            log.debug("[메타데이터 셋별 벡터 데이터 저장] 벡터 서버 미사용 - {}", medataSetId);
            return;
        }
        try {
	    	// 하위 데이터 목록.
	    	MetadataSearchVo paramVo = new MetadataSearchVo();
	    	paramVo.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
	    	paramVo.setMedataSetId(medataSetId);
	    	paramVo.setOnlyObjectTypeYn("Y");
	    	List<MetadataVo> downList = metadataMapper.selectMetadataSimpleListBySetId(paramVo);			
	    	// geometry 정보. 여러건 존재할 경우 (거의 없지만) 첫번째 건이 선택됨
	    	CamelCaseMap geoInfo = metadataApiMapper.selectGeometryInfoBySetId(paramVo);			
	    	VectorStoreDto vectorStoreDto = new VectorStoreDto(medataSetId, medataSetMap, modelInfoDto, downList, upSetList, geoInfo); // 기본 엔티티, down 관계
	    	
	    	// 벡터 서버에 전송
	    	this.sendToVectorServer(vectorStoreDto, jwtToken);
    	
        } catch (ResBaseRuntimeException e) {            
        	throw e;            
        } catch (Exception e) {
            log.error("[메타데이터 셋별 벡터 데이터 저장] 알 수 없는 오류: {}", e.getMessage(), e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[메타데이터 셋별 벡터 데이터 저장] 서비스 종료 - {}", medataSetId);
    }
    
    private void sendToVectorServer(VectorStoreDto dto, String jwtToken) {
        log.debug("[벡터 저장] 서비스 시작");
        
        try {
	        if (dto.getId() == null || dto.getName() == null) {
	            throw new ResBadRequestException("벡터 저장시 필수 메타데이터가 누락되었습니다.");
	        }
        
	        HttpHeaders headers = new HttpHeaders();
	        headers.setContentType(MediaType.APPLICATION_JSON);
	        headers.setBearerAuth(jwtToken);
	
	        HttpEntity<VectorStoreDto> requestEntity = new HttpEntity<>(dto, headers);
	        String url = elasticProperty.getVectorUrl() + "/" + dto.getId(); //  /vectors/<medataSetId>
	        
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("[벡터 저장] 전송 성공: {}", response.getBody());
            } else {
                log.error("[벡터 저장] 응답 오류: {} - {}", response.getStatusCode(), response.getBody());
            }

        } catch (ResBadRequestException e) {            
        	throw e;            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("[벡터 저장] HTTP 오류: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResBaseRuntimeException(e);
        } catch (ResourceAccessException e) {
            log.error("[벡터 저장] 벡터 서버 접근 실패: {}", e.getMessage());
            throw new ResBaseRuntimeException(e);
        } catch (Exception e) {
            log.error("[벡터 저장] 알 수 없는 오류: {}", e.getMessage(), e);
            throw new ResBaseRuntimeException(e);
        }
    }
    
    /**
     * 벡터 삭제 (벡터 서버로 삭제 요청)
     * @param medataSetId
     * @param jwtToken
     */
    public void deleteVectorData(String medataSetId, String jwtToken) {
        log.debug("[벡터 삭제] 서비스 시작: {}", medataSetId);
        if (!vectorEnabled) {
            log.debug("[벡터 삭제] 벡터 서버 미사용 - {}", medataSetId);
            return;
        }

        try {
	        if (medataSetId == null || medataSetId.isBlank()) {
	            throw new ResBadRequestException("벡터 삭제시 필수 ID가 누락되었습니다.");
	        }
	        
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtToken);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            String url = elasticProperty.getVectorUrl() + "/" + medataSetId; //  /vectors/<medataSetId>
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.DELETE,
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("[벡터 삭제] 전송 성공: {}", response.getBody());
            } else {
                log.error("[벡터 삭제] 응답 오류: {} - {}", response.getStatusCode(), response.getBody());
            }

        } catch (ResBadRequestException e) {            
        	throw e;            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("[벡터 삭제] HTTP 오류: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResBaseRuntimeException(e);
        } catch (ResourceAccessException e) {
            log.error("[벡터 삭제] 벡터 서버 접근 실패: {}", e.getMessage());
            throw new ResBaseRuntimeException(e);
        } catch (Exception e) {
            log.error("[벡터 삭제] 알 수 없는 오류: {}", e.getMessage(), e);
            throw new ResBaseRuntimeException(e);
        }
    }    

    /**
     * 벡터 검색 (LangChain 벡터 검색을 위해 벡터 서버로 전송)
     * @param question
     * @param jwtToken
     * @return
     */
    public String askToVector(String question, String jwtToken) {
        log.debug("[벡터 검색] 서비스 시작: {}", question);
        if (!vectorEnabled) {
            log.debug("[벡터 검색] 벡터 서버 미사용");
            throw new ResBizInfoException("벡터 검색을 사용할 수 없습니다.");
        }

        try {
	        HttpHeaders headers = new HttpHeaders();
	        headers.setContentType(MediaType.APPLICATION_JSON);
	        headers.setBearerAuth(jwtToken);
	
	        Map<String, String> requestBody = new HashMap<>();
	        requestBody.put("question", question);
	
	        HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

	        String url = elasticProperty.getVectorUrl() + "/search"; //  /vectors/search
            ResponseEntity<String> response = restTemplate.postForEntity(
            	url,
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("[벡터 검색] 응답 성공: {}", response.getBody());
                return response.getBody();
            } else {
                log.error("[벡터 검색] 응답 오류: {} - {}", response.getStatusCode(), response.getBody());
                throw new ResBizInfoException("벡터 서버 오류: 응답에 오류가 발생했습니다.(" + response.getStatusCode() + ")");
            }
            
        } catch (ResBizInfoException e) {            
        	throw e;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("[벡터 검색] HTTP 오류: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ResBizInfoException("벡터 서버 오류: 오류가 발생했습니다.(" + e.getStatusCode() + ")");
        } catch (ResourceAccessException e) {
            log.error("[벡터 검색] 벡터 서버 접근 실패: {}", e.getMessage());
            throw new ResBizInfoException("벡터 서버 오류: 접근에 실패했습니다.");
        } catch (Exception e) {
            log.error("[벡터 검색] 알 수 없는 오류: {}", e.getMessage(), e);
            throw new ResBizInfoException("벡터 서버 오류: 오류가 발생했습니다.");
        }
    }

}
