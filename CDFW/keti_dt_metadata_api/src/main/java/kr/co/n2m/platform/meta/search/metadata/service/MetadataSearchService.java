package kr.co.n2m.platform.meta.search.metadata.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.rdf.neo4j.service.Neo4jService;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;
import kr.co.n2m.platform.meta.search.elasticsearch.service.ElasticSearchService;
import kr.co.n2m.platform.meta.search.metadata.domain.DataSearchVo;
import kr.co.n2m.platform.meta.search.metadata.mapper.MetadataSearchMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class MetadataSearchService {
	
	@Autowired
	private MetadataSearchMapper metadataSearchMapper;
	
	@Autowired
	private ElasticSearchService elasticSearchService;
	
	

	/**
	 * 메타데이터 검색 목록
	 * @Author      : tklee
	 * @Date        : 2024. 08. 06.
	 * @param metadataSearchVo
	 * @return
	 */
	public SearchResultListVo getMetadataList(DataSearchVo metadataSearchVo) {
		log.debug("[메타데이터 검색 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			List<Map<String, Object>> hits = null;
			List<String> ids = new ArrayList<String>();
			
			int totalListSize = 0;
			List<CamelCaseMap> list = new ArrayList<CamelCaseMap>();
			
			if(StringUtils.isNotEmpty(metadataSearchVo.getDigitalTwinId())) {
				ids = metadataSearchMapper.selectDigitalTwinLowerList(metadataSearchVo);
			}
			
			if(StringUtils.isNotEmpty(metadataSearchVo.getKeyword())) {
				String query = "";
				if("match".equals(metadataSearchVo.getKeywordType())) {
					query = "{"
						  + "\"query\": {"
						  + "\"query_string\": {"
						  + "\"query\": \"" + metadataSearchVo.getKeyword() + "\","
						  + "\"default_operator\": \"AND\""
						  + "}"
						  + "}"
						  + "}";
				}
				if("include".equals(metadataSearchVo.getKeywordType())) {
					query = "{"
						  + "\"query\":{"
						  + "\"query_string\":{"
						  + "\"query\": \"" + metadataSearchVo.getKeyword() + "\""
						  + "}"
						  + "}"
						  + "}";
				}
				
				hits = elasticSearchService.getElasticDataListWithJsonEntity(query);
				
				if(ids.size() > 0) {
					List<String> newIds = new ArrayList<>();
					for (Map<String, Object> hit : hits) {
						String hitId = (String) hit.get("_id");
						if (ids.contains(hitId)) {
							newIds.add(hitId);
						}
					}
					ids.clear();
					ids.addAll(newIds);
				}
				else {					
					for (Map<String, Object> hit : hits) {
						ids.add((String) hit.get("_id"));
					}
				}
				
				metadataSearchVo.setMedataSetIds(ids);
				
				if(ids.size() > 0) {
					totalListSize = metadataSearchMapper.selectMetadataCount(metadataSearchVo);
					metadataSearchVo.setTotalListSize(totalListSize);
					list = metadataSearchMapper.selectMetadataList(metadataSearchVo);
				}
				else {
					metadataSearchVo.setTotalListSize(totalListSize);
				}
			}
			else {
				metadataSearchVo.setMedataSetIds(ids);
				totalListSize = metadataSearchMapper.selectMetadataCount(metadataSearchVo);
				metadataSearchVo.setTotalListSize(totalListSize);
				list = metadataSearchMapper.selectMetadataList(metadataSearchVo);
			}
			
			listVo.setList(list);
			listVo.setPage(new PageVo(metadataSearchVo));
			
		} catch (Exception e) {
			log.error("[메타데이터 검색 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 검색 목록 조회] 서비스 종료");
		return listVo;
	}	
}
