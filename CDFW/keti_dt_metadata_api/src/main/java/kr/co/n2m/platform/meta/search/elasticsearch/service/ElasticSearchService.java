package kr.co.n2m.platform.meta.search.elasticsearch.service;

import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.net.ssl.SSLContext;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.util.EntityUtils;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.Response;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.GetResponse;
import co.elastic.clients.json.JsonData;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.TransportUtils;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResForbiddenException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.ElasticProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataApiMapper;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.search.elasticsearch.domain.ElasticSearchQueryVo;
import kr.co.n2m.platform.meta.search.elasticsearch.domain.ElasticSearchVo;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ElasticSearchService {
	
	@Autowired
	private ElasticProperty property;
	
    @Autowired
	MetadataSetService metadataSetService;
    
	@PostConstruct
	public void init() {
		metadataSetService.setElasticSearchService(this); // 순환참조 오류 방지
	}
	
	@Autowired
	private MetadataApiMapper metadataApiMapper;
	
	
	public RestClient restClient() {
		SSLContext sslContext = TransportUtils.sslContextFromCaFingerprint(property.getFingerPrint());
		
		BasicCredentialsProvider credsProv = new BasicCredentialsProvider(); 
		credsProv.setCredentials(
		    AuthScope.ANY, new UsernamePasswordCredentials(property.getUsername(), property.getPassword())
		);
		
		RestClient restClient = RestClient
		    .builder(new HttpHost(property.getServerIp(), property.getServerPort(), property.getProtocol()))
		    .setHttpClientConfigCallback(hc -> hc
		        .setSSLContext(sslContext) 
		        .setDefaultCredentialsProvider(credsProv)
		    )
		    .build();
		
		return restClient;
	}
	
	/**
	 * Kibana URL
	 * @Author      : tklee
	 * @Date        : 2024. 04. 04.
	 * @return
	 */
	public String getKibanaUrl() {
		return property.getKibanaUrl();
	}
	
	/**
	 * 셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 조회
	 * @Author      : tklee
	 * @Date        : 2023. 11. 30.
	 * @return
	 */	
	public String getElasticData(String medataSetId) {
		log.debug("[셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 조회] 서비스 시작");
		
		String elasticRes = "";
		try (RestClient restClient = restClient()) {
			ElasticsearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
			
			ElasticsearchClient esClient = new ElasticsearchClient(transport);
			GetResponse<JsonData> getRes = esClient.get(g -> g.index(property.getIndexName()).id(medataSetId), JsonData.class);
			elasticRes = getRes.toString();
			
		} catch (ResBaseRuntimeException e) {
			log.info("[셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 조회] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 조회] 서비스 종료");
        
		return elasticRes;
	}
	
	/**
	 * 셋 ID 로 ElasticSearch에 메타데이터 셋 정보 등록/수정
	 * @Author      : tklee
	 * @Date        : 2023. 12. 01.
	 * @return
	 */	
	@SuppressWarnings("unchecked")
	public void saveElasticData(String medataSetId) {
		log.debug("[셋 ID 로 ElasticSearch에 메타데이터 셋 정보 등록/수정] 서비스 시작");
        
		try (RestClient restClient = restClient()) {
			MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
			if (setDto == null) throw new ResNotFoundException("메타데이터 셋 데이터가 존재하지 않습니다.");   
    		
			setDto.setArrayDataLimitYn("N");
			ListOrderedMap<String, Object> medataSetMap = metadataApiMapper.selectMetadataToJsonStrBySetIdAsText(setDto);
    		String json = JsonUtil.toJson(medataSetMap);

            StringEntity entity = new StringEntity(json, ContentType.APPLICATION_JSON);

            Request request = new Request("PUT", "/" + property.getIndexName() + "/_doc/" + medataSetId);
            request.setEntity(entity); 

            restClient.performRequest(request);
    		
		} catch (ResBaseRuntimeException e) {
			log.info("[셋 ID 로 ElasticSearch에 메타데이터 셋 정보 등록/수정] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[셋 ID 로 ElasticSearch에 메타데이터 셋 정보 등록/수정] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[셋 ID 로 ElasticSearch에 메타데이터 셋 정보 등록/수정] 서비스 종료");
	}
	
	/**
	 * 셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 삭제
	 * @Author      : tklee
	 * @Date        : 2023. 12. 01.
	 * @return
	 */	
	public void deleteElasticData(String medataSetId) {
		log.debug("[셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 삭제] 서비스 시작");
		
		try (RestClient restClient = restClient()) {
            Request request = new Request("DELETE", property.getIndexName() + "/_doc/" + medataSetId);

            restClient.performRequest(request);

		} catch (ResBaseRuntimeException e) {
			log.info("[셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 삭제] 서비스 종료");
	}
	
	/**
	 * ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (내용, 날짜만 검색)
	 * @Author      : tklee
	 * @Date        : 2023. 12. 04.
	 * @return
	 */	
	public String getElasticDataList(ElasticSearchVo searchVo) {
		log.debug("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (내용, 날짜만 검색)] 서비스 시작");
		
		String elasticRes = "";
		try (RestClient restClient = restClient()) {
			Request request = new Request("GET", "/" + property.getIndexName() + "/_search");
			String mustQuery = "{\"query\": {\"bool\": {\"must\": [{\"query_string\": {\"query\": \"*" + searchVo.getElasticContent() + "*\"}}";
			if(!StringUtils.isEmpty(searchVo.getElasticStartDd()) || !StringUtils.isEmpty(searchVo.getElasticEndDd())) {
				mustQuery = mustQuery.concat(",{\"range\": {\"createDateTime\": {");
				if(!StringUtils.isEmpty(searchVo.getElasticStartDd())) {					
					mustQuery = mustQuery.concat("\"gte\": \"" + searchVo.getElasticStartDd() + "\"");
				}
				if(!StringUtils.isEmpty(searchVo.getElasticStartDd()) && !StringUtils.isEmpty(searchVo.getElasticEndDd())) {
					mustQuery = mustQuery.concat(",");
				}
				if(!StringUtils.isEmpty(searchVo.getElasticEndDd())) {
					mustQuery = mustQuery.concat("\"lte\": \"" + searchVo.getElasticEndDd() + "\"");
				}
				mustQuery = mustQuery.concat("}}}");
			}
			mustQuery = mustQuery.concat("]}}}");
			request.setJsonEntity(mustQuery);
			
			Response response = restClient.performRequest(request);
			
			elasticRes = EntityUtils.toString(response.getEntity());
			
			
		} catch (ResBaseRuntimeException e) {
			log.info("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (내용, 날짜만 검색)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (내용, 날짜만 검색)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (내용, 날짜만 검색)] 서비스 종료");
        
		return elasticRes;
	}
	
	/**
	 * ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색) (String 반환)
	 * @Author      : tklee
	 * @Date        : 2023. 12. 06.
	 * @return String
	 */	
	public String getElasticDataListWithJson(String query) {
		log.debug("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 서비스 시작");
		
		String elasticRes = "";
		try (RestClient restClient = restClient()) {
			Request request = new Request("GET", "/" + property.getIndexName() + "/_search");
			request.setJsonEntity(query);
			
			Response response = restClient.performRequest(request);
			
			elasticRes = EntityUtils.toString(response.getEntity());
			
			
		} catch (ResBaseRuntimeException e) {
			log.info("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 서비스 종료");
        
		return elasticRes;
	}
	
	/**
	 * ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색) (List 반환)
	 * @Author      : tklee
	 * @Date        : 2024. 08. 07.
	 * @return List<Map<String, Object>>
	 */	
	public List<Map<String, Object>> getElasticDataListWithJsonEntity(String query, String endPoint) {
		log.debug("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 서비스 시작");
		
		List<Map<String, Object>> hits = null;
		try (RestClient restClient = restClient()) {
			Request request = new Request("GET", "/" + property.getIndexName() + "/" + endPoint);
			request.setJsonEntity(query);
			
			Response response = restClient.performRequest(request);
			
			ObjectMapper objectMapper = new ObjectMapper();
			Map<String, Object> resultMap = objectMapper.readValue(response.getEntity().getContent(), Map.class);
			hits = (List<Map<String, Object>>) ((Map<String, Object>) resultMap.get("hits")).get("hits");
			
		} catch (ResBaseRuntimeException e) {
			log.info("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 서비스 종료");
        
		return hits;
	}
	
	/**
	 * ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색) (화면 호출용)
	 * @Author      : tklee
	 * @Date        : 2024. 08. 07.
	 * @return List<Map<String, Object>>
	 */	
	public List<Map<String, Object>> getElasticDataListWithJsonEntityForView(ElasticSearchQueryVo searchVo) {
		log.debug("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (화면 호출용)] 서비스 시작");
		
		List<Map<String, Object>> hits = null;
		try (RestClient restClient = restClient()) {
			Request request = new Request(searchVo.getHttpMethod().toUpperCase(), searchVo.getIndexEndpoint());
			request.setJsonEntity(searchVo.getQueryJson());
			
			Response response = restClient.performRequest(request);
			
			ObjectMapper objectMapper = new ObjectMapper();
			Map<String, Object> resultMap = objectMapper.readValue(response.getEntity().getContent(), Map.class);
			hits = (List<Map<String, Object>>) ((Map<String, Object>) resultMap.get("hits")).get("hits");
			
		} catch (ResBaseRuntimeException e) {
			log.info("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (화면 호출용)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (화면 호출용)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (화면 호출용)] 서비스 종료");
        
		return hits;
	}
	
    /**
     * ElasticSearch 초기화 후 재등록 (설정한 인덱스 전체 삭제 후 재등록)
	 * @Author      : tklee
	 * @Date        : 2024. 04. 04.
     */
    public void initElasticAndAddDataAll(String onlyUseYn) {
        log.debug("[ElasticSearch 초기화 후 재등록 (설정한 인덱스 전체 삭제 후 재등록)] 서비스 시작");
        
		try {
			if (!AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("ElasticSearch 초기화 후 재등록에 대한 권한이 없습니다.");
			}        
        
	    	this.initElastic();
	    	
	    	this.saveMetadataSetListAll(onlyUseYn);
	    	
		} catch (ResBaseRuntimeException e) {
			log.info("[ElasticSearch 초기화 후 재등록 (설정한 인덱스 전체 삭제 후 재등록)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[ElasticSearch 초기화 후 재등록 (설정한 인덱스 전체 삭제 후 재등록)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[ElasticSearch 초기화 후 재등록 (설정한 인덱스 전체 삭제 후 재등록)] 서비스 종료");
    }
    
	/**
	 * Elastic 전체 내용 삭제 (인덱스 삭제)
	 * @Author      : tklee
	 * @Date        : 2024. 04. 04.
	 * @return
	 */	
	public void initElastic() {
		log.debug("[Elastic 전체 내용 삭제 (인덱스 삭제)] 서비스 시작");
		
		try (RestClient restClient = restClient()) {
            Request request = new Request("DELETE", property.getIndexName());

            restClient.performRequest(request);

		} catch (ResBaseRuntimeException e) {
			log.info("[Elastic 전체 내용 삭제 (인덱스 삭제)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[Elastic 전체 내용 삭제 (인덱스 삭제)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[Elastic 전체 내용 삭제 (인덱스 삭제)] 서비스 종료");
	}
	
    /**
     * Elastic 검색 메타데이터셋 전체 저장
	 * @Author      : tklee
	 * @Date        : 2024. 04. 04.
     * @param metadataSearchVo
     */
    @SuppressWarnings("unchecked")
	public void saveMetadataSetListAll(String onlyUseYn) {
        log.debug("[Elastic 검색 메타데이터셋 전체 저장] 서비스 시작");    	
    	
		if (!AuthUtil.isSystemAdmin()) {
			throw new ResForbiddenException("Elastic 전체 데이터 저장 권한이 없습니다.");
		}
		
    	MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
    	metadataSearchVo.setIsPaging(false); // TODO 모든 데이터를 조회시 LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
    	if (StringUtils.equals("Y", onlyUseYn)) {
    		metadataSearchVo.setMedataSetSttusMtcd("use");
    	}
    	
    	SearchResultListVo listVo = metadataSetService.getMetadataSetList(metadataSearchVo);
    	if (listVo != null && listVo.getList() != null && listVo.getList().size() > 0) {
    		List<CamelCaseMap> list = (List<CamelCaseMap>) listVo.getList();
    		for (CamelCaseMap tMap : list) {
	    		this.saveElasticData(String.valueOf(tMap.get("medataSetId")));
    		}
    	}
        log.debug("[Elastic 검색 메타데이터셋 전체 저장] 서비스 시작");    	
    }
    
	/**
	 * ElasticSearch에 카프카 전송된 메타데이터 셋 정보 등록/수정
	 * @Author      : tklee
	 * @Date        : 2024. 04. 29.
	 * @return
	 */	
	public void saveElasticKafkaData(String medataSetId, ListOrderedMap<String, Object> dataMap) {
		log.debug("[ElasticSearch에 카프카 전송된 메타데이터 셋 정보 등록/수정] 서비스 시작");
        
		try (RestClient restClient = restClient()) {
    		String json = JsonUtil.toJson(dataMap);

            StringEntity entity = new StringEntity(json, ContentType.APPLICATION_JSON);

            Request request = new Request("PUT", "/" + property.getIndexName() + "/_doc/" + medataSetId);
            request.setEntity(entity); 

            restClient.performRequest(request);
    		
		} catch (ResBaseRuntimeException e) {
			log.info("[ElasticSearch에 카프카 전송된 메타데이터 셋 정보 등록/수정] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[EElasticSearch에 카프카 전송된 메타데이터 셋 정보 등록/수정] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[ElasticSearch에 카프카 전송된 메타데이터 셋 정보 등록/수정] 서비스 종료");
	}
	
}
