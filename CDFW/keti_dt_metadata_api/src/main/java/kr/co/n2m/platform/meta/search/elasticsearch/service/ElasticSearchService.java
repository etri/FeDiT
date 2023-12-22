package kr.co.n2m.platform.meta.search.elasticsearch.service;

import javax.net.ssl.SSLContext;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
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

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.GetResponse;
import co.elastic.clients.json.JsonData;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.TransportUtils;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.ElasticProperty;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataApiMapper;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.search.elasticsearch.domain.ElasticSearchVo;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ElasticSearchService {
	
	@Autowired
	private ElasticProperty property;
	
	@Autowired
	MetadataSetService metadataSetService;
	
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
        log.debug("셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 조회] 서비스 종료");
        
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
			ListOrderedMap<String, Object> medataSetMap = metadataApiMapper.selectMetadataToJsonStrBySetId(setDto);
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
        log.debug("셋 ID 로 ElasticSearch에 메타데이터 셋 정보 등록/수정] 서비스 종료");
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
        log.debug("셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 삭제] 서비스 종료");
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
        log.debug("ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (내용, 날짜만 검색)] 서비스 종료");
        
		return elasticRes;
	}
	
	/**
	 * ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)
	 * @Author      : tklee
	 * @Date        : 2023. 12. 06.
	 * @return
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
        log.debug("ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)] 서비스 종료");
        
		return elasticRes;
	}
	
}
