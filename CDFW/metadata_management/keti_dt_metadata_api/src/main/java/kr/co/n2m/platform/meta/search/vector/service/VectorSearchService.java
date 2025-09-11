package kr.co.n2m.platform.meta.search.vector.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
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

import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.property.ElasticProperty;
import kr.co.n2m.platform.meta.search.vector.domain.VectorStoreDto;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class VectorSearchService {

	@Autowired
	private ElasticProperty elasticProperty;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * 벡터 저장 (벡터 저장을 위해 벡터 서버로 전송)
     * @param dto
     * @param jwtToken
     */
    public void sendToVectorServer(VectorStoreDto dto, String jwtToken) {
        log.debug("[벡터 저장] 서비스 시작");
        
        try {
	        if (dto.getMedataSetId() == null || dto.getMedataSetNm() == null) {
	            throw new ResBadRequestException("벡터 저장시 필수 메타데이터가 누락되었습니다.");
	        }
        
	        HttpHeaders headers = new HttpHeaders();
	        headers.setContentType(MediaType.APPLICATION_JSON);
	        headers.setBearerAuth(jwtToken);
	
	        HttpEntity<VectorStoreDto> requestEntity = new HttpEntity<>(dto, headers);
	        String url = elasticProperty.getVectorUrl() + "/" + dto.getMedataSetId(); //  /vectors/<medataSetId>
	        
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
    public void deleteVector(String medataSetId, String jwtToken) {
        log.debug("[벡터 삭제] 서비스 시작: {}", medataSetId);

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
	
	
	/*
	// TODO 내 개인 계정 "dtmeta_dev_mykey" 키임. 프로젝트에 맞는 키로 변경 필요!!!
	private final static String OPENAI_API_KEY = "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";


	public Map<String, Object> getSearchWithGPTs(AiSearchVo aiSearchVo) {
		log.debug("[GPTs 검색] 서비스 시작");
		Map<String, Object> resMap = new HashMap<>();
		
		try {
			JsonObject jsonObj = new JsonObject();
			
			JsonObject jsonMsg = new JsonObject();
			jsonMsg.addProperty("role", "user");
			jsonMsg.addProperty("content", aiSearchVo.getPrompt());
			
			jsonObj.addProperty("model", "gpt-3.5"); // "gpt-4" 는 유료버전.
			jsonObj.add("messages", jsonMsg);
					
			OkHttpClient client = new OkHttpClient.Builder()
			        .connectTimeout(300, TimeUnit.SECONDS)
			        .writeTimeout(300, TimeUnit.SECONDS)
			        .readTimeout(300, TimeUnit.SECONDS)
			        .build();
			
			Request request = new Request.Builder()
					.addHeader("Authorization", OPENAI_API_KEY)
					//.addHeader("Accept", " * / * ") // TODO 고쳐
					.url("https://api.openai.com/v1/chat/completions")
					.post(RequestBody.create(jsonObj.toString(), MediaType.get("application/json")))
					.build();
			
			String responseBody = "요청 처리 중 오류가 발생했습니다.";
	        try (Response response = client.newCall(request).execute()) {
	            responseBody = response.body().string();
			}

	        // JSON 파싱해서 content만 추출 (단순 처리 예시)
//	        String content = extractGptContent(responseBody);
	        try {
	            ObjectMapper mapper = new ObjectMapper();
	            JsonNode root = mapper.readTree(responseBody);
	            String content = root.at("/choices/0/message/content").asText();
	            resMap.put("response", content);
	            resMap.put("root", root);
	        } catch (Exception e) {
	            throw new ResBizInfoException("응답 처리 중 오류가 발생했습니다.");
	        }
        
		} catch (ResBaseRuntimeException e) {
			log.info("[GPTs 검색] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[GPTs 검색] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}        

        return resMap;        
	}
	*/
	
//    private String extractGptContent(String responseBody) {
//        try {
//            ObjectMapper mapper = new ObjectMapper();
//            JsonNode root = mapper.readTree(responseBody);
//            return root.at("/choices/0/message/content").asText();
//        } catch (Exception e) {
//            return "응답 처리 중 오류가 발생했습니다.";
//        }
//    }	
}
