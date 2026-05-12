package kr.co.n2m.platform.meta.rdf.neo4j.service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Values;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RangeDataTypeMtcd;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RdfWriteLangMtcd;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResForbiddenException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.Neo4jProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.KeywordUtil;
import kr.co.n2m.platform.meta.architecture.util.MapperUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceSearchVo;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import kr.co.n2m.platform.meta.rdf.namespace.mapper.RdfNamespaceMapper;
import kr.co.n2m.platform.meta.rdf.neo4j.domain.Neo4jGraphResultDto;
import kr.co.n2m.platform.meta.rdf.neo4j.domain.Neo4jSearchVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModel.RdfModelMakeMode;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModelReqVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;
import kr.co.n2m.platform.meta.resource.keyword.domain.KeywordSearchVo;
import kr.co.n2m.platform.meta.resource.keyword.domain.KeywordVo;
import kr.co.n2m.platform.meta.resource.keyword.mapper.KeywordMapper;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataChgHstVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataVo;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataApiMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataChgHstMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataMapper;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataApiService;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import kr.co.n2m.platform.meta.schema.modelproperty.mapper.ModelPropertyMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class Neo4jService {
	
	@Autowired
	private Neo4jProperty property;
	
	@Autowired
	private Driver neo4jDriver;
	
	private VirtuosoService virtuosoService;  // 순환참조 오류 방지

    public Neo4jService(VirtuosoService virtuosoService) { // 순환참조 오류 방지
        this.virtuosoService = virtuosoService;
    }
    
    @Autowired
	MetadataSetService metadataSetService;
    
	@PostConstruct
	public void init() {
		metadataSetService.setNeo4jService(this); // 순환참조 오류 방지
	}

	/**
	 * 자원 1-depth 양방향 이웃 (디스커버리 페이지 우측 관계 그래프용).
	 *  - parents:  medataResource → me  (incoming)
	 *  - children: me → medataResource  (outgoing, medata)
	 *  - keywords: me → ConceptKeyword  (outgoing, 키워드)
	 *
	 * medata 노드의 이름/유형은 호출 측에서 PG로 보강.
	 * 키워드 노드는 Neo4j에 이미 name(=kywrdDisp) 있으니 그대로 반환.
	 */
	public java.util.Map<String, Object> getDiscoveryNeighbors(String medataSetId) {
		java.util.List<java.util.Map<String, Object>> parents = new java.util.ArrayList<>();
		java.util.List<java.util.Map<String, Object>> children = new java.util.ArrayList<>();
		java.util.List<java.util.Map<String, Object>> keywords = new java.util.ArrayList<>();
		try (org.neo4j.driver.Session session = neo4jDriver.session()) {
			// 부모 (medataResource → me) — name/metaModel 도 가져와 PG 보강 실패 시 fallback
			String parentQuery =
				"MATCH (n:medataResource {medataSetId: $id})<-[r]-(p:medataResource) " +
				"RETURN p.medataSetId AS id, p.name AS name, p.metaModel AS metaModel, type(r) AS via";
			org.neo4j.driver.Result rs = session.run(parentQuery,
					org.neo4j.driver.Values.parameters("id", medataSetId));
			while (rs.hasNext()) {
				org.neo4j.driver.Record rec = rs.next();
				java.util.Map<String, Object> n = new java.util.HashMap<>();
				n.put("id",        rec.get("id").asString(""));
				n.put("name",      rec.get("name").asString(""));
				n.put("metaModel", rec.get("metaModel").asString(""));
				n.put("via",       rec.get("via").asString(""));
				parents.add(n);
			}
			// 자식 medata (me → medataResource)
			String childQuery =
				"MATCH (n:medataResource {medataSetId: $id})-[r]->(c:medataResource) " +
				"RETURN c.medataSetId AS id, c.name AS name, c.metaModel AS metaModel, type(r) AS via";
			rs = session.run(childQuery,
					org.neo4j.driver.Values.parameters("id", medataSetId));
			while (rs.hasNext()) {
				org.neo4j.driver.Record rec = rs.next();
				java.util.Map<String, Object> n = new java.util.HashMap<>();
				n.put("id",        rec.get("id").asString(""));
				n.put("name",      rec.get("name").asString(""));
				n.put("metaModel", rec.get("metaModel").asString(""));
				n.put("via",       rec.get("via").asString(""));
				children.add(n);
			}
			// 자식 keyword (me → ConceptKeyword)
			String keywordQuery =
				"MATCH (n:medataResource {medataSetId: $id})-[r]->(k:ConceptKeyword) " +
				"RETURN k.value AS value, k.name AS name, k.lang AS lang, type(r) AS via";
			rs = session.run(keywordQuery,
					org.neo4j.driver.Values.parameters("id", medataSetId));
			while (rs.hasNext()) {
				org.neo4j.driver.Record rec = rs.next();
				java.util.Map<String, Object> n = new java.util.HashMap<>();
				n.put("value", rec.get("value").asString(""));
				n.put("name",  rec.get("name").asString(""));
				n.put("lang",  rec.get("lang").asString(""));
				n.put("via",   rec.get("via").asString(""));
				keywords.add(n);
			}
		} catch (Exception e) {
			log.error("[디스커버리 neighbors 조회 실패] id={} : {}", medataSetId, e.getMessage(), e);
		}
		java.util.Map<String, Object> resp = new java.util.HashMap<>();
		resp.put("parents", parents);
		resp.put("children", children);
		resp.put("keywords", keywords);
		return resp;
	}
	
	@Autowired
	private MetadataApiService metadataApiService;
	
	@Autowired
	private RdfNamespaceMapper rdfNamespaceMapper;
	
	@Autowired
	private MetadataApiMapper metadataApiMapper;
	
	@Autowired
	private ModelPropertyMapper modelPropertyMapper;
	
	@Autowired
	private MetadataChgHstMapper metadataChgHstMapper;
	
	@Autowired
	private KeywordMapper keywordMapper;
	
	@Autowired
	private MetadataMapper metadataMapper;
	
	private static final String NEO4J_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX"; // XXX 가 맞음. DateTimeFormatter.ofPattern("...") 쓸 경우 출력 포맷 XXXXX 로 쓰면 Z 도 표시됨.
	
	
	/**
	 * NEO4J Browser URL
	 * @Author      : heenim
	 * @Date        : 2023. 08. 30.
	 * @return
	 */
	public String getNeo4jBrowserUrl() {
		return property.getBrowserUrl();
	}
	
	/**
	 * NEO4J 조회 (RDF)
	 * @Author      : tklee
	 * @Date        : 2023. 08. 09.
	 * @return
	 */	
	public String getNeo4jData(Neo4jSearchVo searchVo) {
		log.debug("[NEO4J 조회 (RDF)] 서비스 시작");
		
		// 검색 유형이 없으면 all
		if (StringUtils.isBlank(searchVo.getSearchType())) searchVo.setSearchType("all"); 
		// 조회 LIMIT가 없으면 100
		if (StringUtils.isBlank(searchVo.getMatchLimit())) searchVo.setMatchLimit("100");

		// 필수 체크
		StringBuffer sb = new StringBuffer();		

		// 검색 유형이 medataSet일 때 medataSetId 체크
		if("medataSet".equals(searchVo.getSearchType())) {
			if (StringUtils.isBlank(searchVo.getMedataSetId())) {
				sb.append("medataSetId").append(ValueUtil.required()).append("\n");
			}
		}
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
		
		SimpleDateFormat dateFormat = new SimpleDateFormat(NEO4J_DATE_TIME_FORMAT); 
		
		String jsonOutput = "";
		int nLimit = Integer.parseInt(searchVo.getMatchLimit());
	    
	    // front-end neo4jd3.js에서 사용할 수 있도록 데이터를 가공
	    // 참고 : https://github.com/eisman/neo4jd3#d3js-data-format
        try (Session session = neo4jDriver.session()) {

        	if("all".equals(searchVo.getSearchType())) {        		
        		// node(Resource) 정보 조회
        		String nodeQuery = "MATCH (n:Resource) RETURN n LIMIT " + nLimit;
        		Result nodeResult = session.run(nodeQuery);
        		
        		List<Map<String, Object>> outputNodeList = new ArrayList<>();
        		
        		while (nodeResult.hasNext()) {
        			org.neo4j.driver.Record record = nodeResult.next();
        			
        			Node node = record.get("n").asNode();
        			
        			Map<String, Object> outputItem = new HashMap<>();
        			Iterable<String> labelTokens = node.labels();
        			List<String> labels = new ArrayList<>();
        			List<String> orgLabels = new ArrayList<>();
        			
        			if(StringUtils.isBlank(searchVo.getLabelType())) {
        				for (String labelToken : labelTokens) {
        					labels.add(labelToken);
        				}
        			}
        			else {
        				String propertyType = (String) node.asMap().get(searchVo.getLabelType());
        				if(StringUtils.isNotBlank(propertyType)) {
        					labels.add(propertyType);
        				}
        				for (String labelToken : labelTokens) {
        					orgLabels.add(labelToken);
        				}
        			}
        			outputItem.put("id", node.id());
        			outputItem.put("labels", labels);
        			outputItem.put("orgLabels", orgLabels);
        			outputItem.put("properties", node.asMap());       			
        			
        			outputNodeList.add(outputItem);
        		}
        		
	    		Set<Long> nodeIds = outputNodeList.stream()
	    		        .map(node -> (Long) node.get("id"))
	    		        .collect(Collectors.toSet());
	    		String nodeIdsStr = nodeIds.toString();
        		
        		// relationship(관계) 정보 조회
	    		/*
	    		 * 2024-10-11 tklee
	    		 * 기존에는 모든 relation을 조회 후 조회된 node에 관련된 relation만 추출해냈었지만, 
	    		 * 성능적인 이슈를 고려하여 조회된 node에 해당되는 relation만 직접 조회해서 가져오도록 수정하였음.
	    		 */
//        		String relationshipQuery = "MATCH p=(n:Resource)-->() RETURN p";
	    		String relationshipQuery = "MATCH (n)-[p]-(m) "
						 				 + "WHERE id(n) < id(m) AND id(n) IN "+ nodeIdsStr +" AND id(m) IN " + nodeIdsStr
						 				 + " RETURN p";
        		Result relationshipResult = session.run(relationshipQuery);
        		
        		List<Map<String, Object>> outputRelationshipList = new ArrayList<>();
        		
        		while (relationshipResult.hasNext()) {
        			org.neo4j.driver.Record record = relationshipResult.next();

        			Relationship relationship = record.get("p").asRelationship();
        			
        			Map<String, Object> outputItem = new HashMap<>();
        			outputItem.put("id", relationship.id());
        			outputItem.put("type", relationship.type());
        			outputItem.put("startNode", relationship.startNodeId());
        			outputItem.put("endNode", relationship.endNodeId());
        			outputItem.put("properties", relationship.asMap());
        			
        			outputRelationshipList.add(outputItem);
        		}
        		
        		// node count 조회
	    		String nodeCount = "0";        		
	    		String nodeCountQuery = "MATCH (n:Resource) WITH n LIMIT " + nLimit + " RETURN COUNT(n) AS CNT";
	    		Result nodeCountResult = session.run(nodeCountQuery);
	    		
	    		while (nodeCountResult.hasNext()) {
	    			org.neo4j.driver.Record record = nodeCountResult.next();
	    			nodeCount = record.get("CNT").toString();
	    		}
        		
        		Map<String, Object> outputItem = new HashMap<>();
        		outputItem.put("nodecount", nodeCount);
        		outputItem.put("nodes", outputNodeList);
        		outputItem.put("relationships", outputRelationshipList);
        		
	    		String totalCount = "0";        		
        		String totalCountQuery = "MATCH (n:Resource) WITH n RETURN COUNT(n) AS CNT";
	    		Result totalCountResult = session.run(totalCountQuery);
	    		
	    		while (totalCountResult.hasNext()) {
	    			org.neo4j.driver.Record record = totalCountResult.next();
	    			totalCount = record.get("CNT").toString();
	    		}
        		
        		Map<String, Object> result = new HashMap<>();
        		result.put("graph", outputItem);
        		result.put("totalcount", totalCount);
        		
        		ObjectMapper objectMapper = new ObjectMapper();
        		objectMapper.setDateFormat(dateFormat);
        		objectMapper.registerModule(new JavaTimeModule());
        		jsonOutput = objectMapper.writeValueAsString(result);
        	}
        	
        	if("medataSet".equals(searchVo.getSearchType())) {
        		// URI(baseUrl + / + medataSetId)
    			String searchUri = metadataApiService.getMetadataSetIri(searchVo.getMedataSetId());
    			
    			// URI에 해당하는 node 조회 (기준 node)
    			String startNodeQuery = "MATCH (n:Resource) "
    								  + "WHERE n.uri = $uri "
    								  + "RETURN n";
    			
    			Result startNodeResult = session.run(startNodeQuery, Values.parameters("uri", searchUri));
    			
        		List<Map<String, Object>> outputNodeList = new ArrayList<>();
//        		int startNodeCnt = 0;
        		
        		while (startNodeResult.hasNext()) {
        			org.neo4j.driver.Record record = startNodeResult.next();
        			
        			Node node = record.get("n").asNode();
        			
        			Map<String, Object> outputItem = new HashMap<>();
        			Iterable<String> labelTokens = node.labels();
        			List<String> labels = new ArrayList<>();
        			List<String> orgLabels = new ArrayList<>();
        			
        			if(StringUtils.isBlank(searchVo.getLabelType())) {
        				for (String labelToken : labelTokens) {
        					labels.add(labelToken);
        				}
        			}
        			else {
        				String propertyType = (String) node.asMap().get(searchVo.getLabelType());
        				if(StringUtils.isNotBlank(propertyType)) {
        					labels.add(propertyType);
        				}
        				for (String labelToken : labelTokens) {
        					orgLabels.add(labelToken);
        				}
        			}
        			outputItem.put("id", node.id());
        			outputItem.put("labels", labels);
        			outputItem.put("orgLabels", orgLabels);
        			outputItem.put("properties", node.asMap());
        			
        			outputNodeList.add(outputItem);
//        			startNodeCnt++;
        		}
    			
        		// 기준 node와 관계된 node 조회 (3단계까지 관계 조회)
        		String endNodeQuery = "MATCH (startNode:Resource {uri: \"" + searchUri + "\"}) "
			        				+ "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
			        				+ "RETURN relatedNode "
		        				    + "LIMIT " + (nLimit - 1);
        		Result endNodeResult = session.run(endNodeQuery);
        		
        		while (endNodeResult.hasNext()) {
        			org.neo4j.driver.Record record = endNodeResult.next();
        			
        			Node node = record.get("relatedNode").asNode();
        			
        			Map<String, Object> outputItem = new HashMap<>();
        			Iterable<String> labelTokens = node.labels();
        			List<String> labels = new ArrayList<>();    
        			List<String> orgLabels = new ArrayList<>();
        			
        			if(StringUtils.isBlank(searchVo.getLabelType())) {
        				for (String labelToken : labelTokens) {
        					labels.add(labelToken);
        				}
        			}
        			else {
        				String propertyType = (String) node.asMap().get(searchVo.getLabelType());
        				if(StringUtils.isNotBlank(propertyType)) {
        					labels.add(propertyType);
        				}
        				for (String labelToken : labelTokens) {
        					orgLabels.add(labelToken);
        				}
        			}
        			outputItem.put("id", node.id());
        			outputItem.put("labels", labels);
        			outputItem.put("orgLabels", orgLabels);
        			outputItem.put("properties", node.asMap());
        			
        			outputNodeList.add(outputItem);
        		}
        		
        		Set<Long> nodeIds = outputNodeList.stream()
	    		        .map(node -> (Long) node.get("id"))
	    		        .collect(Collectors.toSet());
        		String nodeIdsStr = nodeIds.toString();
        		
        		// node relationship(관계) 정보 조회
	    		/*
	    		 * 2024-10-11 tklee
	    		 * 기존에는 모든 relation을 조회 후 조회된 node에 관련된 relation만 추출해냈었지만, 
	    		 * 성능적인 이슈를 고려하여 조회된 node에 해당되는 relation만 직접 조회해서 가져오도록 수정하였음.
	    		 */
//        		String nodeRelationshipQuery = "MATCH (startNode:Resource {uri: \"" + searchUri + "\"}) "
//        									 + "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
//        									 + "RETURN path";
	    		String nodeRelationshipQuery = "MATCH (n)-[p]-(m) "
		 				 					 + "WHERE id(n) < id(m) AND id(n) IN "+ nodeIdsStr +" AND id(m) IN " + nodeIdsStr
		 				 					 + " RETURN p";
        		Result nodeRelationshipResult = session.run(nodeRelationshipQuery);
        		
        		List<Map<String, Object>> outputRelationshipList = new ArrayList<>();
        		
        		while (nodeRelationshipResult.hasNext()) {
        			org.neo4j.driver.Record record = nodeRelationshipResult.next();

        			Relationship relationship = record.get("p").asRelationship();
        			
        			Map<String, Object> outputItem = new HashMap<>();
        			outputItem.put("id", relationship.id());
        			outputItem.put("type", relationship.type());
        			outputItem.put("startNode", relationship.startNodeId());
        			outputItem.put("endNode", relationship.endNodeId());
        			outputItem.put("properties", relationship.asMap());
        			
        			outputRelationshipList.add(outputItem);
        		}
        		
        		// node count 조회
        		String nodeCount = "0";
        		String nodeCountQuery = "MATCH (startNode:Resource {uri: \"" + searchUri + "\"}) "
			        				  + "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
			        				  + "WITH DISTINCT relatedNode "
			        				  + "WHERE relatedNode IS NOT NULL "
			        				  + "WITH relatedNode LIMIT " + nLimit
			        				  + " RETURN COUNT(relatedNode) AS CNT ";
        		Result nodeCountResult = session.run(nodeCountQuery);
        		
	    		while (nodeCountResult.hasNext()) {
	    			org.neo4j.driver.Record record = nodeCountResult.next();
	    			int cnt = record.get("CNT").asInt();
	    			nodeCount = Integer.toString(cnt);
	    		}
        		
        		Map<String, Object> outputItem = new HashMap<>();
        		outputItem.put("nodecount", nodeCount);
        		outputItem.put("nodes", outputNodeList);
        		outputItem.put("relationships", outputRelationshipList);
        		
        		String totalCount = "0";
        		String totalCountQuery = "MATCH (n:Resource) WITH n RETURN COUNT(n) AS CNT";
	    		Result totalCountResult = session.run(totalCountQuery);
	    		
	    		while (totalCountResult.hasNext()) {
	    			org.neo4j.driver.Record record = totalCountResult.next();
	    			totalCount = record.get("CNT").toString();
	    		}
        		
        		Map<String, Object> result = new HashMap<>();
        		result.put("graph", outputItem);
        		result.put("totalcount", totalCount);
        		
        		ObjectMapper objectMapper = new ObjectMapper();
        		objectMapper.setDateFormat(dateFormat);
        		objectMapper.registerModule(new JavaTimeModule());
        		jsonOutput = objectMapper.writeValueAsString(result);
        	}

        } catch (Exception e) {
			log.error("[NEO4J 조회 (RDF)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);				
		}
		
		log.debug("[NEO4J 조회 (RDF)] 서비스 종료");
		return jsonOutput;		
	}
    
    /**
     * NEO4J 그래프 초기화 후 재등록 (RDF)
	 * @Author      : heenim
	 * @Date        : 2023. 08. 30.
	 * @modified 2025-11-05 initDataStatType (onlyUse/all) 추가.
     */
    public void initNeo4jGraphAndAddDataAll(String initDataStatType) {
        log.debug("[NEO4J 그래프 초기화 후 재등록 (RDF)] 서비스 시작");
        
		try {
			if (!AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("그래프 초기화 후 재등록에 대한 권한이 없습니다.");
			}        
        
	    	this.initNeo4jGraph();
	    	
	    	this.saveMetadataSetListAll(initDataStatType);
	    	
		} catch (ResBaseRuntimeException e) {
			log.info("[NEO4J 그래프 초기화 후 재등록 (RDF)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[NEO4J 그래프 초기화 후 재등록 (RDF)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("[NEO4J 그래프 초기화 후 재등록 (RDF)] 서비스 종료");
    }
    
    /**
     * 그래프의 전체 내용 삭제 후 Config 초기화 (RDF)
	 * @Author      : heenim
	 * @Date        : 2023. 08. 30.
     */
    private void initNeo4jGraph() {
        log.debug("[NEO4J 그래프 초기화 (RDF)] 서비스 시작");
        
		if (!AuthUtil.isSystemAdmin()) {
			throw new ResForbiddenException("NEO4J 그래프 초기화 권한이 없습니다.");
		}     
        
    	/* 필요한 경우. neo4j 브라우저에서 실행
    	 * --제약 사항 설정 (Neo4j에 저장할 때 uri가 중복되지 않도록 제약)
    	 * CREATE CONSTRAINT n10s_unique_uri FOR (n:Resource) REQUIRE n.uri IS UNIQUE;
    	 * 
    	 * --graph config 초기 설정
    	 * CALL n10s.graphconfig.init();
    	 */
    	
    	// 1. 전체 삭제 쿼리 (모든 리소스 삭제)
		String deleteDataQuery = "MATCH (n:Resource) DETACH DELETE n";
		// 2. 네임스페이스 프리픽스 전체 삭제 쿼리 (prefix 초기화)
		String deleteNsprefixesQuery = "CALL n10s.nsprefixes.removeAll";
		// 3. graph config 초기 설정 쿼리
//		String setGraphConfigQuery = "CALL n10s.graphconfig.init()";
		
        try (Session session = neo4jDriver.session()) {
            session.writeTransaction(tx -> { // neo4j 트랜잭션
            	// 1. 전체 삭제
                tx.run(deleteDataQuery);
                // 2. 네임스페이스 프리픽스 전체 삭제
                tx.run(deleteNsprefixesQuery);
                // 3. graph config 초기 설정
//              tx.run(setGraphConfigQuery);
                return null;
            });
        } catch (Exception e) {
        	log.error("[NEO4J 그래프 초기화 (RDF)] 실패/오류", e);
        }
        
        log.debug("[NEO4J 그래프 초기화 (RDF)] 서비스 종료");
    }
    
    /**
     * Neo4j n10s에 RDF 네임스페이스 프리픽스를 저장한다.
     * - 이미 존재하는 prefix는 건너뛴다
     * - 없는 prefix만 신규 추가한다
     * - 같은 prefix지만 URI가 다른 경우는 삭제/갱신하지 않고 경고만 남긴다
     */
    private void saveRdfNamespacesIfNeeded(Session session) {

        // 1. RDB 에 저장된 네임스페이스 목록
        RdfNamespaceSearchVo searchVo = new RdfNamespaceSearchVo();
        searchVo.setIsPaging(false);
        List<RdfNamespaceVo> desiredList = rdfNamespaceMapper.selectRdfNamespaceList(searchVo);

        // 2. 현재 Neo4j(n10s)에 등록된 프리픽스 목록
        Map<String, String> prefixToUriMap = new java.util.HashMap<>();
        Map<String, String> uriToPrefixMap = new java.util.HashMap<>();
        
        session.readTransaction(tx -> {
            var res = tx.run("CALL n10s.nsprefixes.list()");
            while (res.hasNext()) {
                var rec = res.next();
                String prefix = rec.get("prefix").asString();
                String nsUri  = rec.get("namespace").asString();
                prefixToUriMap.put(prefix, nsUri);
                uriToPrefixMap.put(nsUri, prefix);
            }
            return null; // readTransaction은 뭔가를 반환해야 하므로 그냥 null 리턴
        });

        // 3. 비교 후 필요한 것만 추가
        for (RdfNamespaceVo ns : desiredList) {
            String desiredPrefix = ns.getRdfNmspPfix();
            String desiredUri    = ns.getRdfNmspUri();

            String existingUriForPrefix = prefixToUriMap.get(desiredPrefix);
            String existingPrefixForUri = uriToPrefixMap.get(desiredUri);

            if (existingUriForPrefix == null) {
                // prefix는 아직 안 쓰였음
                if (existingPrefixForUri != null) {
                    // BUT 이 URI는 이미 다른 prefix로 등록돼 있다
                    // => n10s가 표준 prefix로 잡은 케이스일 수 있음
                    // => 새 prefix로 추가하면 폭발하니까 그냥 스킵하고 경고만 찍자
                    log.warn("[NEO4J prefix SKIP: URI already mapped] desiredPrefix={} desiredUri={} existingPrefixForUri={}",
                             desiredPrefix, desiredUri, existingPrefixForUri);
                    continue;
                }

                // 여기까지 왔다는 건: prefix도 미사용, uri도 미사용
                // => 안전하게 추가 가능
                try {
                    session.writeTransaction(tx -> {
                        tx.run(
                            "CALL n10s.nsprefixes.add($prefix, $uri)",
                            Values.parameters("prefix", desiredPrefix, "uri", desiredUri)
                        );
                        return null;
                    });
                    log.debug("[NEO4J prefix SAVE] {} -> {}", desiredPrefix, desiredUri);
                } catch (Exception e) {
                    // 마지막 안전망: 혹시라도 n10s가 또 다른 정책으로 막으면 여기서만 잡아먹고
                    // 전체 트랜잭션은 터지지 않게 한다.
                    log.warn("[NEO4J prefix SAVE FAIL - skipped safely] prefix={} uri={} err={}",
                              desiredPrefix, desiredUri, e.toString());
                }

            } else if (!existingUriForPrefix.equals(desiredUri)) {
                // 같은 prefix인데 uri가 다름 -> 충돌
                // 이건 기존 로직대로 경고만
                log.warn("[NEO4J prefix CONFLICT] prefix={} neo4jUri={} desiredUri={}",
                         desiredPrefix, existingUriForPrefix, desiredUri);

            } else {
                // 완전히 동일 -> 아무 것도 안 함
                // log.trace(...) 정도로만 놔도 됨
            }
        }
    }
    
    /**
     * 내부 코드(rdfWriteLangMtcd) 값을 n10s.rdf.import.inline 에서 요구하는 포맷 문자열로 변환한다.
     * 예: "xml" -> "RDF/XML", "turtle" -> "Turtle"
     */
    private String getRdfFormat(String rdfWriteLangMtcd) {
    	// TODO : 리팩토링 필요
		String rdfFormat = "";
		if("xml".equals(rdfWriteLangMtcd) || "xml_abbrev".equals(rdfWriteLangMtcd)) {
			rdfFormat = "RDF/XML";
		} else if("turtle".equals(rdfWriteLangMtcd) || "turtle_flat".equals(rdfWriteLangMtcd)) {
			rdfFormat = "Turtle";
		} else if("n_triple".equals(rdfWriteLangMtcd)) {
			rdfFormat = "N-Triples";
		} else if("json_ld".equals(rdfWriteLangMtcd)) {
			rdfFormat = "JSON-LD";
		} else if("json".equals(rdfWriteLangMtcd)) {
			rdfFormat = "RDF/JSON";
		} else {
			rdfFormat = "RDF/XML"; // 안전하게 RDF/XML로 돌려줌
		}
    	return rdfFormat;
    }
	
    /**
     * NEO4J 검색 메타데이터셋 전체 저장 (RDF)
	 * @Author      : heenim
	 * @Date        : 2023. 08. 30.
	 * @modified 2025-11-05 initDataStatType (onlyUse/all) 추가.
     */
    @SuppressWarnings("unchecked")
	public void saveMetadataSetListAll(String initDataStatType) {
        log.debug("[NEO4J 검색 메타데이터셋 전체 저장 (RDF)] 서비스 시작");    	
    	
		if (!AuthUtil.isSystemAdmin()) {
			throw new ResForbiddenException("NEO4J 전체 데이터 저장 권한이 없습니다.");
		}
		
    	MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
    	metadataSearchVo.setIsPaging(false); // TODO 모든 데이터를 조회시 LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
    	
		if (!"all".equals(initDataStatType)) {
			metadataSearchVo.setMedataSetSttusMtcd("use"); // 기본적으로 사용인 것만. onlyUse
		}
//    	metadataSearchVo.setTypeModelId("DigitalTwin"); // TODO 추후 삭제 혹은 수정 필요
    	
    	SearchResultListVo listVo = metadataSetService.getMetadataSetList(metadataSearchVo);
    	
    	if (listVo != null && listVo.getList() != null && listVo.getList().size() > 0) {
    		List<CamelCaseMap> list = (List<CamelCaseMap>) listVo.getList();
    		
    		for (CamelCaseMap tMap : list) {
	    		RdfModelReqVo rdfModelReqVo = new RdfModelReqVo();
	    		rdfModelReqVo.setModelId(String.valueOf(tMap.get("modelId")));
	    		rdfModelReqVo.setRdfFormMtcd(Constant.RDF_FORM_MTCD_DEFAULT); // TODO 임시로 dcat 고정, 수정 필요
	    		rdfModelReqVo.setRdfWriteLangMtcd(RdfWriteLangMtcd.RDF_XML.code()); // TODO 임시로 xml 고정, 수정 필요
	    		rdfModelReqVo.setMedataSetId(String.valueOf(tMap.get("medataSetId")));
	    		rdfModelReqVo.setEmptyNodeUriSettingYn("Y");
		        rdfModelReqVo.setRdfModelMakeMode(RdfModelMakeMode.CURR_RESOURCE.name());
		        
	    		this.saveToNeo4jByRdfInfo(rdfModelReqVo);
    		}
    	}
        log.debug("[NEO4J 검색 메타데이터셋 전체 저장 (RDF)] 서비스 시작");    	
    }
    
    /**
     * 셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDF)
	 * @Author      : tklee
	 * @Date        : 2023. 08. 04.
     * @param medataSetId
     */
    public void saveNeo4jMetadataSet(String medataSetId) {
        log.debug("[셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDF)] 서비스 시작");
        
		try {
			MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
			if (setDto == null) throw new ResNotFoundException("메타데이터 셋 데이터가 존재하지 않습니다.");    
			
			// =================================================================================================================================
			// 개별 저장인 경우(=전체 저장이 아닌 경우) 셋에서 삭제된 이력이 있는 메타데이터의 관계를 재정의하기 위한 동작
			// =================================================================================================================================
			
    		// 셋에서 삭제된 이력이 있는 메타데이터의 셋 ID 조회
    		List<String> metadataDelHstList = metadataChgHstMapper.selectMetadataDelHstListBySetId(medataSetId);
    		boolean isReg = false;
    		
    		for (String deletedSetId : metadataDelHstList) {
    			MetadataChgHstVo metadataChgHstVo = new MetadataChgHstVo();
    			metadataChgHstVo.setMedataSetId(medataSetId);
    			metadataChgHstVo.setChgAftrVal(deletedSetId);
    			// 삭제된 이력이 있는 메타데이터의 최근 상태 조회
    			String metadataRecentStatus = metadataChgHstMapper.selectMetadataRecentStatusBySetId(metadataChgHstVo);
    			
    			if("del".equals(metadataRecentStatus)) { // 최근 상태가 del(삭제)인 경우
    				// 해당되는 node를 삭제 후 재생성해야 상위 node와의 관계가 끊어지므로, 삭제 - 재생성 동작을 진행
    				this.deleteNeo4jMetadataSet(deletedSetId);
    				try {
    					this.saveNeo4jMetadataSet(deletedSetId);
					} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
						log.error("[RDF 정보를 NEO4J에 저장 (RDF)] 실패/오류 (정보성) (SKIP) : {} - {}", deletedSetId, e.getReason());
					} catch (Exception e) {
						log.error("[RDF 정보를 NEO4J에 저장 (RDF)] 실패/오류 (SKIP) - {}", deletedSetId, e);
					}
    			}
    			if("reg".equals(metadataRecentStatus)) { // 최근 상태가 reg(등록)인 경우
    				isReg = true;
    			}
    		}
    		if(isReg) {
    			// 삭제 이력이 있는 메타데이터의 최근 상태가 reg(등록)인 경우 상위 node를 삭제 후 재생성해야 관계가 다시 생성되므로 삭제 - 재생성 동작을 진행
    			this.deleteNeo4jMetadataSet(medataSetId);
    		}
    		// =================================================================================================================================
    		
			
			RdfModelReqVo rdfModelReqVo = new RdfModelReqVo();
			rdfModelReqVo.setModelId(setDto.getModelId());
			rdfModelReqVo.setRdfFormMtcd(Constant.RDF_FORM_MTCD_DEFAULT); // TODO 임시로 dcat 고정, 수정 필요
			rdfModelReqVo.setRdfWriteLangMtcd(RdfWriteLangMtcd.RDF_XML.code()); // TODO 임시로 xml 고정, 수정 필요
			rdfModelReqVo.setMedataSetId(medataSetId);
			rdfModelReqVo.setEmptyNodeUriSettingYn("Y");
	        rdfModelReqVo.setRdfModelMakeMode(RdfModelMakeMode.CURR_RESOURCE.name());
			
			this.saveToNeo4jByRdfInfo(rdfModelReqVo);
			
		} catch (ResBaseRuntimeException e) {
			log.info("[셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDF)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDF)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDF)] 서비스 종료");		
    }
	
	/**
	 * 셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDF)
	 * @Author      : tklee
	 * @Date        : 2023. 08. 22.
	 * @param 		medataSetId
	 */
    public void deleteNeo4jMetadataSet(String medataSetId) {
        log.debug("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDF)] 서비스 시작");
        try {
        	// URI(baseUrl + / + medataSetId)
			String deleteUri = metadataApiService.getMetadataSetIri(medataSetId);
			
			// URI에 해당하는 NEO4J 데이터 삭제 쿼리
			String deleteDataQuery = "MATCH (n:Resource) "
								   + "WHERE n.uri CONTAINS $delUri "
								   + "DETACH DELETE n";
			
            try (Session session = neo4jDriver.session()) {
                session.writeTransaction(tx -> { // neo4j 트랜잭션
                	// URI에 해당하는 NEO4J 데이터 삭제
                    tx.run(deleteDataQuery, Values.parameters("delUri", deleteUri));
                    return null;
                });
            }
            
        } catch (Exception e) {
            log.error("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDF)] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDF)] 서비스 종료");
    }    
	
	/**
	 * RDF 정보를 NEO4J에 저장 (RDF)
	 * @Author      : tklee
	 * @Date        : 2023. 08. 04.
	 * @param 		rdfModelReqVo
	 */
	private void saveToNeo4jByRdfInfo(RdfModelReqVo rdfModelReqVo) {
	    log.debug("[RDF 정보를 NEO4J에 저장 (RDF)] 서비스 시작");
	    try {
			// RDF 조회
			String rdfData = virtuosoService.getRdfModelStr(rdfModelReqVo);	    	
			String rdfFormat = this.getRdfFormat(rdfModelReqVo.getRdfWriteLangMtcd());
			
			// 조회한 RDF 정보로 NEO4J에 데이터를 넣는 쿼리
			String importQuery = "WITH $payload AS payload "
							   + "CALL n10s.rdf.import.inline(payload, $rdfFormat) "
					           + "YIELD terminationStatus, triplesLoaded, triplesParsed, namespaces "
							   + "RETURN terminationStatus, triplesLoaded, triplesParsed, namespaces";
			
			// 여기서는 Driver를 새로 생성하지 않는다. 그냥 주입받은 걸로 세션만 연다.
			try (Session session = neo4jDriver.session()) {

				// NEO4J 네임스페이스 프리픽스 저장 (없는 것만 추가)
		    	this.saveRdfNamespacesIfNeeded(session);
		    	
				session.writeTransaction(tx -> { // neo4j 트랜잭션
					// 조회한 RDF 정보로 NEO4J에 데이터 추가
					tx.run(importQuery, Values.parameters("payload", rdfData, "rdfFormat", rdfFormat));
					return null;
				});
			}
	        
	    } catch (Exception e) {
	        log.error("[RDF 정보를 NEO4J에 저장 (RDF)] 실패/오류", e);
	        throw new ResBaseRuntimeException(e);
	    }
	    
	    log.debug("[RDF 정보를 NEO4J에 저장 (RDF)] 서비스 종료");
	}    
	
	// ---------------------------------------------------------
	
	/**
	 * NEO4J 조회 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 15.
	 * @return
	 */	
	public String getNeo4jRdbMedata(Neo4jSearchVo searchVo) {
		log.debug("[NEO4J 조회 (RDB)] 서비스 시작");
		
	    // 1. 공통: 기본값 설정 + 유효성 체크
		this.checkAndSetNeo4jSearchVo(searchVo);

	    try (Session session = neo4jDriver.session()) {

	        if ("keyword".equals(searchVo.getSearchType())) {
	            // 키워드 검색 모드
	            return this.fetchGraphByKeyword(session, searchVo);

	        } else if ("medataSet".equals(searchVo.getSearchType())) {
	            // 특정 셋 기준
	            return this.fetchGraphByMedataSet(session, searchVo);

	        } else { // "all" 또는 그 외 -> 전체 조회
	            return this.fetchGraphAll(session, searchVo);
	        }

	    } catch (Exception e) {
	        log.error("[NEO4J 조회 (RDB)] 실패/오류", e);
	        throw new ResBaseRuntimeException(e);
	    }		
	}

	private void checkAndSetNeo4jSearchVo(Neo4jSearchVo searchVo) {
		// 검색 유형이 없으면 all
		if (StringUtils.isBlank(searchVo.getSearchType())) searchVo.setSearchType("all"); 
		// 조회 LIMIT가 없으면 100
		if (StringUtils.isBlank(searchVo.getMatchLimit())) searchVo.setMatchLimit("100");
        if (StringUtils.isBlank(searchVo.getGraphView())) {
            if ("keyword".equals(searchVo.getSearchType())) { searchVo.setGraphView("keywordMain"); }
            else if ("medataSet".equals(searchVo.getSearchType())) { searchVo.setGraphView("all"); }
            else { searchVo.setGraphView("metaOnly"); }
        }
        
        // matchLimit 숫자화
        try {
            Integer.parseInt(searchVo.getMatchLimit());
        } catch (NumberFormatException e) {
            log.warn("matchLimit 숫자 아님! - {}", searchVo.getMatchLimit());
            searchVo.setMatchLimit("100");
        }
        
		// 필수 체크
		StringBuffer sb = new StringBuffer();		
		
		// 검색 유형이 medataSet일 때 medataSetId 체크
		if("medataSet".equals(searchVo.getSearchType())) {
			if (StringUtils.isBlank(searchVo.getMedataSetId())) {
				sb.append("medataSetId").append(ValueUtil.required()).append("\n");
			}
		}
		
        // 키워드 검색 시 사전 전처리
        if ("keyword".equals(searchVo.getSearchType())) {
            if (StringUtils.isBlank(searchVo.getKeywordText())) {
            	sb.append("keywordText").append(ValueUtil.required()).append("\n");
            }

            // keywordMatchType 기본값
            if (StringUtils.isBlank(searchVo.getKeywordMatchType())) {
            	searchVo.setKeywordMatchType("contains"); // UX상 '포함'을 기본
            }

            // 정규화된 키워드 캐논값 준비 (일치 검색용)
            // ex) "온도 센서" -> "온도 센서" -> toNormKeyword -> "온도_센서"(대문자화 등 규칙)
            searchVo.setNormKeyword(KeywordUtil.toNormKeyword(searchVo.getKeywordText()));
            if (StringUtils.isBlank(searchVo.getNormKeyword())) {
            	sb.append("keywordText").append(ValueUtil.invalid()).append("\n");
            }
        }
    		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
	}
	
	/**
     * graphView에 따라 노드/관계를 걸러낸다.
     *
     * graphView:
     *  - "metaOnly"    : medataResource 노드만 + 그들 사이 관계만
     *  - "keywordMain" : ConceptKeyword ↔ medataResource 관계만
     *  - "all"         : 아무 제한 없이 전부
     */
    private Neo4jGraphResultDto filterByGraphView(Set<Node> allNodes, Set<Relationship> allRels, String graphView) {
        Map<Long, Node> metaMap = new HashMap<>();
        Map<Long, Node> kwMap   = new HashMap<>();

        for (Node n : allNodes) {
            if (n.hasLabel("medataResource")) {
                metaMap.put(n.id(), n);
            } else if (n.hasLabel("ConceptKeyword")) {
                kwMap.put(n.id(), n);
            }
        }

        Set<Node> filteredNodes = new HashSet<>();
        Set<Relationship> filteredRels = new HashSet<>();

        if ("metaOnly".equalsIgnoreCase(graphView)) {
            // medataResource만
            filteredNodes.addAll(metaMap.values());

            for (Relationship r : allRels) {
                long a = r.startNodeId();
                long b = r.endNodeId();
                if (metaMap.containsKey(a) && metaMap.containsKey(b)) {
                    filteredRels.add(r);
                }
            }
        }
        else if ("keywordMain".equalsIgnoreCase(graphView)) {
            // ConceptKeyword와 해당 키워드에 직접 연결된 medataResource만
            filteredNodes.addAll(kwMap.values());

            for (Relationship r : allRels) {
                long a = r.startNodeId();
                long b = r.endNodeId();

                boolean aIsKw   = kwMap.containsKey(a);
                boolean bIsKw   = kwMap.containsKey(b);
                boolean aIsMeta = metaMap.containsKey(a);
                boolean bIsMeta = metaMap.containsKey(b);

                // kw <-> meta 인 관계만
                if ((aIsKw && bIsMeta) || (aIsMeta && bIsKw)) {
                    filteredRels.add(r);
                    if (aIsMeta) filteredNodes.add(metaMap.get(a));
                    if (bIsMeta) filteredNodes.add(metaMap.get(b));
                }
            }
        }
        else {
            // "all": 모두 살아남음
            filteredNodes.addAll(allNodes);
            filteredRels.addAll(allRels);
        }

        Neo4jGraphResultDto dto = new Neo4jGraphResultDto();
        dto.setNodes(filteredNodes);
        dto.setRelationships(filteredRels);
        return dto;
    }   	
	
	/**
	 * Neo4j Node(Set<Node>) -> 프론트에서 neo4jd3.js가 쓰는 형태의 List<Map>으로 변환
	 *
	 * 결과 예:
	 * {
	 *   "id": 123,
	 *   "labels": ["Sensor"],
	 *   "orgLabels": ["medataResource","Sensor"],
	 *   "properties": {... neo4j node props ...}
	 * }
	 *
	 * labelType 이라는 조건(예: node.asMap().get(searchVo.getLabelType()))을
	 * buildNodeOutput 안에서 바로 접근하기는 어려우니까,
	 * 여기서는 가장 단순한 형태(모든 라벨을 labels 배열에 넣는 방식)로 통일해줄 거야.
	 *
	 * 만약 기존처럼 labelType 기반 커스텀 라벨 집합을 써야 하면
	 * - buildNodeOutput(...) 시그니처를 바꿔서 labelType을 인자로 넘기면 돼.
	 */
	private List<Map<String,Object>> buildNodeOutput(Set<Node> nodes, Neo4jSearchVo vo, Set<Long> seedKeywordNodeIds) {
	    List<Map<String,Object>> out = new ArrayList<>();
	    if (nodes == null || nodes.isEmpty()) return out;

	    for (Node node : nodes) {
	        Map<String,Object> item = new HashMap<>();

	        // orgLabels: 원본 라벨(neo4j label들)
	        List<String> orgLabels = new ArrayList<>();
	        node.labels().forEach(orgLabels::add);

	        // labels: 기본은 orgLabels 복사
	        List<String> labels = new ArrayList<>(orgLabels);

	        // 만약 labelType이 있으면, node.properties[labelType] 값을 라벨로 쓰는 모드
	        if (StringUtils.isNotBlank(vo.getLabelType())) {
	            Object v = node.asMap().get(vo.getLabelType());
	            if (v != null && StringUtils.isNotBlank(String.valueOf(v))) {
	                labels = new ArrayList<>();
	                labels.add(String.valueOf(v));
	            }
	        }
	        
	        // 원본 프로퍼티 복사
	        Map<String,Object> props = new HashMap<>(node.asMap());

	        // ★ ConceptKeyword 노드이고, 시드 키워드 목록에 포함되면 플래그 추가
	        if (seedKeywordNodeIds != null
	                && !seedKeywordNodeIds.isEmpty()
	                && orgLabels.contains("ConceptKeyword")
	                && seedKeywordNodeIds.contains(node.id())) {
	            props.put("isSeedKeyword", Boolean.TRUE);
	        }	        

	        // 기본 구현: labels=모든 라벨
	        // (만약 labelType 기반 커스터마이징이 필요하면 여기서 가공)
	        item.put("id", node.id());
	        item.put("labels", labels);
	        item.put("orgLabels", orgLabels);
	        item.put("properties", props);

	        out.add(item);
	    }
	    return out;
	}

	/**
	 * Neo4j Relationship(Set<Relationship>) -> 프론트에서 쓰는 형태의 List<Map> 변환
	 *
	 * 결과 예:
	 * {
	 *   "id": 999,
	 *   "type": "keywords",
	 *   "startNode": 123,
	 *   "endNode": 456,
	 *   "properties": {... rel props ...}
	 * }
	 */
	private List<Map<String,Object>> buildRelOutput(Set<Relationship> rels) {
	    List<Map<String,Object>> out = new ArrayList<>();
	    if (rels == null || rels.isEmpty()) return out;

	    for (Relationship rel : rels) {
	        Map<String,Object> item = new HashMap<>();
	        item.put("id", rel.id());
	        item.put("type", rel.type());
	        item.put("startNode", rel.startNodeId());
	        item.put("endNode", rel.endNodeId());
	        item.put("properties", rel.asMap());
	        out.add(item);
	    }
	    return out;
	}
	
    /**
     * 공통: 노드/관계 리스트를 받아서 최종 JSON 문자열 만들어주는 역할
     * - nodecount (현재 그래프 노드 수)
     * - totalcount (전체 medataResource 총 개수 등)
     * - nodes[]
     * - relationships[]
     */
    private String buildResponseJson(Session session, Neo4jGraphResultDto graph, int limit, Neo4jSearchVo vo, Set<Long> seedKeywordNodeIds) throws Exception {

        // node/rel → 프론트 포맷으로 변환
        List<Map<String,Object>> outputNodeList = this.buildNodeOutput(graph.getNodes(), vo, seedKeywordNodeIds);
        List<Map<String,Object>> outputRelList  = this.buildRelOutput(graph.getRelationships());

        // nodecount = 이번에 돌려주는 그래프 노드 수
        long metaNodeCountInGraph = graph.getNodes().stream()
        	    .filter(n -> n.hasLabel("medataResource"))
        	    .count();        
        String nodeCount = Long.toString(metaNodeCountInGraph);

        // totalcount = 전체 medataResource 개수 (이건 기존처럼 COUNT 쿼리 한 번 더)
        String totalCount = "0";
        Result totalCountResult = session.run(
            "MATCH (n:medataResource) WITH n RETURN COUNT(n) AS CNT"
        );
        while (totalCountResult.hasNext()) {
            totalCount = totalCountResult.next().get("CNT").toString();
        }

        Map<String,Object> graphPart = new HashMap<>();
        graphPart.put("nodecount", nodeCount);
        graphPart.put("nodes", outputNodeList);
        graphPart.put("relationships", outputRelList);

        Map<String,Object> finalResult = new HashMap<>();
        finalResult.put("graph", graphPart);
        finalResult.put("totalcount", totalCount);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setDateFormat(new SimpleDateFormat(NEO4J_DATE_TIME_FORMAT));
        objectMapper.registerModule(new JavaTimeModule());
        return objectMapper.writeValueAsString(finalResult);
    }
    
    /**
     * searchType = "all"
     *   - 전체 그래프 중 일부 샘플
     *   - graphView:
     *       - "metaOnly": medataResource 노드들 + medataResource↔medataResource 관계만
     *       - "keywordMain": ConceptKeyword + 연결된 medataResource만
     *       - "all": 둘 다
     */
    private String fetchGraphAll(Session session, Neo4jSearchVo vo) throws Exception {
        int limit = Integer.parseInt(vo.getMatchLimit());
        String graphView = vo.getGraphView(); // all / keywordMain / metaOnly

        // 노드 조회
        Result nodeRes = session.run(
        	"MATCH (n:medataResource) RETURN n LIMIT $lim",
            Values.parameters("lim", limit)
        );

        Set<Node> nodeSet = new HashSet<>();
        while (nodeRes.hasNext()) {
            nodeSet.add(nodeRes.next().get("n").asNode());
        }

        List<Long> nodeIds = nodeSet.stream()
            .map(Node::id)
            .collect(Collectors.toList());
        
        // relationship(관계) 정보 조회
        Result relRes = session.run(
            "MATCH (n)-[p]-(m) " +
            "WHERE id(n) < id(m) AND id(n) IN $ids AND id(m) IN $ids " +
            "RETURN p",
            Values.parameters("ids", nodeIds)
        );

        Set<Relationship> relSet = new HashSet<>();
        while (relRes.hasNext()) {
            relSet.add(relRes.next().get("p").asRelationship());
        }
        
        // 키워드도 가져올지 여부
        boolean includeKeywords = !"metaOnly".equalsIgnoreCase(graphView);

        if (includeKeywords) {
            Result kwRes = session.run(
                "MATCH (src:medataResource)-[r]->(k:ConceptKeyword) " +
                "WHERE id(src) IN $ids " +
                "RETURN src, r, k " +
                "LIMIT $lim",
                Values.parameters("ids", nodeIds, "lim", limit)
            );

            while (kwRes.hasNext()) {
                var rec = kwRes.next();
                Node src = rec.get("src").asNode();
                Relationship r = rec.get("r").asRelationship();
                Node k = rec.get("k").asNode();

                nodeSet.add(src);
                nodeSet.add(k);
                relSet.add(r);
            }
        }
        
        Neo4jGraphResultDto graph = this.filterByGraphView(nodeSet, relSet, graphView);            

        return this.buildResponseJson(session, graph, limit, vo, null);
    }
	
    /**
     * searchType = "keyword"
     *
     * graphView별 규칙
     *
     * 1) keywordMain
     *    - 시드 키워드 ✔
     *    - 시드 메타 ✔
     *    - 시드 메타 ↔ 시드 메타 관계 ✔
     *    - 시드 메타 ↔ 시드 키워드 관계 ✔
     *    - 확장 메타 ❌
     *    - 확장 메타에 붙은 키워드 ❌
     *
     * 2) metaOnly (UI: "키워드 제외")
     *    - 시드 키워드 ✔ (검색 기준은 남긴다)
     *    - 시드 메타 ✔
     *    - 확장 메타 ✔ (시드 메타에서 메타↔메타 hop 1..3)
     *    - 메타 ↔ 메타 관계 ✔ (시드 메타와 확장 메타들 사이 포함)
     *    - 시드 키워드 ↔ 시드 메타 관계 ✔
     *    - 확장 메타에 붙은 다른 키워드 ❌ (즉 추가 키워드 억제)
     *
     * 3) all
     *    - 시드 키워드 ✔
     *    - 시드 메타 ✔
     *    - 확장 메타 ✔
     *    - 메타 ↔ 메타 관계 ✔
     *    - 시드 키워드 ↔ 시드 메타 ✔
     *    - 확장 메타에 붙은 추가 키워드 ✔
     *      + 그 키워드 ↔ 해당 메타 관계 ✔
     *    - 단, 그 추가 키워드에서 다시 다른 메타로 또 확장 ❌ (우주방출 방지)
     */
    private String fetchGraphByKeyword(Session session, Neo4jSearchVo vo) throws Exception {

        int limit = Integer.parseInt(vo.getMatchLimit());
        String matchType    = vo.getKeywordMatchType();  // "exact" / "contains"
        String canonKeyword = vo.getNormKeyword();       // 정규화 키 (시드 키)
        String rawKeyword   = vo.getKeywordText();       // 사용자가 입력한 원문
        String graphView    = vo.getGraphView();         // keywordMain / metaOnly / all

        // contains일 때 canonKeyword가 비어 있으면 rawKeyword로 fallback
        String containsText = StringUtils.defaultString(canonKeyword, rawKeyword);
        if (containsText == null) containsText = "";

        // 0. 공통 결과 컨테이너
        Set<Node>          nodeSet = new HashSet<>();
        Set<Relationship>  relSet  = new HashSet<>();
        
        Set<Long> seedKeywordNodeIds = new HashSet<>();

        // === [1] 시드 키워드 / 시드 메타 수집 =====================================
        // kwMatchWhere 동적 구성
        String kwMatchWhere;
        if ("exact".equalsIgnoreCase(matchType)) {
            kwMatchWhere = "WHERE k.value = $canon";
        } else {
            kwMatchWhere = "WHERE k.value CONTAINS $containsText";
        }

        // 시드 키워드들과 직접 연결된 시드 메타, 그리고 그 관계(r)
        // (src:medataResource)-[r]->(k:ConceptKeyword)
        String cypherSeed =
            "MATCH (src:medataResource)-[r]->(k:ConceptKeyword) " +
            kwMatchWhere + " " +
            "RETURN src, r, k " +
            "LIMIT $lim";

        Result seedRes = session.run(
            cypherSeed,
            Values.parameters(
                "canon",         canonKeyword,
                "containsText",  containsText,
                "lim",           limit
            )
        );

        // 시드 메타들의 neo4j id 모음
        Set<Long> seedMetaIds = new HashSet<>();
        // 시드 키워드들의 neo4j id 모음
        Set<Long> seedKwIds   = new HashSet<>();

        while (seedRes.hasNext()) {
            org.neo4j.driver.Record rec = seedRes.next();

            Node src = rec.get("src").asNode();              // 시드 메타
            Relationship r = rec.get("r").asRelationship();  // src -> k
            Node k   = rec.get("k").asNode();                // 시드 키워드

            // 노드/관계 수집
            nodeSet.add(src);
            nodeSet.add(k);
            relSet.add(r);

            seedMetaIds.add(src.id());
            seedKwIds.add(k.id());
            
            // 시드 키워드 (하이라이트 위함)
            seedKeywordNodeIds.add(k.id());
        }

        // 시드 메타가 아무 것도 없으면 그냥 현재까지 결과만 돌려주면 됨
        if (seedMetaIds.isEmpty()) {
            Neo4jGraphResultDto graph0 = new Neo4jGraphResultDto();
            graph0.setNodes(nodeSet);
            graph0.setRelationships(relSet);
            return this.buildResponseJson(session, graph0, limit, vo, null);
        }

        // === [2] 시드 메타 사이의 직접 메타↔메타 관계 (same-level link) ============
        // keywordMain, metaOnly, all 전부 공통으로 필요함 (최소 seed 메타 간 관계는 보여주고 싶으니까)
        String metaLinksForSeeds =
            "MATCH (a:medataResource)-[rel]-(b:medataResource) " +
            "WHERE id(a) < id(b) AND id(a) IN $ids AND id(b) IN $ids " +
            "RETURN a, rel, b " +
            "LIMIT $lim";

        Result seedMetaRelRes = session.run(
            metaLinksForSeeds,
            Values.parameters(
                "ids", new ArrayList<>(seedMetaIds),
                "lim", limit * 2
            )
        );

        while (seedMetaRelRes.hasNext()) {
            org.neo4j.driver.Record rec = seedMetaRelRes.next();
            Node a   = rec.get("a").asNode();
            Node b   = rec.get("b").asNode();
            Relationship rel = rec.get("rel").asRelationship();
            nodeSet.add(a);
            nodeSet.add(b);
            relSet.add(rel);
        }

        // === [3] graphView별 확장 처리 ============================================
        //
        // hop 확장: 시드 메타 -> 메타↔메타 hop 1..3 범위에서 만나는 추가 메타들을 끌고온다.
        //           (ConceptKeyword 경유는 절대 금지)
        //
        // metaOnly  : 확장 메타까지 포함하되, 새로 발견된 키워드들은 금지
        // all       : 확장 메타까지 포함하고, 확장 메타에 붙어있는 키워드도 허용
        // keywordMain : 확장 안 함

        Set<Long> expandedMetaIds = new HashSet<>(seedMetaIds); // 초기값 = 시드 메타
        if (!"keywordMain".equalsIgnoreCase(graphView)) {
            // metaOnly / all 에서는 hop 확장
            Set<Long> hopExpanded = expandMetasByHop(session, seedMetaIds, 1, 3, limit * 3);
            // 합집합
            expandedMetaIds.addAll(hopExpanded);

            // hop으로 새로 얻은 메타 노드들/관계도 nodeSet, relSet에 추가
            // (expandMetasByHop은 메타↔메타 관계도 같이 줘도 되지만
            //  우리는 함수에서 노드 id만 받았으니 여기서 다시 관계를 긁자)

            // 3-1. 확장으로 얻은 모든 메타 노드 조회해서 nodeSet에 넣기
            Result loadExpandedNodes = session.run(
                "MATCH (m:medataResource) WHERE id(m) IN $allMetaIds RETURN m",
                Values.parameters("allMetaIds", new ArrayList<>(expandedMetaIds))
            );
            while (loadExpandedNodes.hasNext()) {
                Node m = loadExpandedNodes.next().get("m").asNode();
                nodeSet.add(m);
            }

            // 3-2. 확장된 전체 메타 집합 안의 메타↔메타 관계 전부 수집
            Result relExpandedRes = session.run(
                "MATCH (x:medataResource)-[rel]-(y:medataResource) " +
                "WHERE id(x) < id(y) AND id(x) IN $allMetaIds AND id(y) IN $allMetaIds " +
                "RETURN x, rel, y " +
                "LIMIT $lim",
                Values.parameters(
                    "allMetaIds", new ArrayList<>(expandedMetaIds),
                    "lim",        limit * 5
                )
            );

            while (relExpandedRes.hasNext()) {
                org.neo4j.driver.Record rec = relExpandedRes.next();
                Node x   = rec.get("x").asNode();
                Node y   = rec.get("y").asNode();
                Relationship rel = rec.get("rel").asRelationship();
                nodeSet.add(x);
                nodeSet.add(y);
                relSet.add(rel);
            }
        }

        // === [4] graphView별 키워드 처리 ==========================================
        //
        // keywordMain :
        //   - 이미 시드 키워드 + 시드 메타 + 시드메타↔시드메타 관계까지 끝. hop 안 했음.
        //
        // metaOnly :
        //   - 시드 키워드 ↔ 시드 메타 관계만 유지
        //   - 확장 메타에 붙어있는 "다른 키워드"는 절대 추가하지 않음
        //   - 즉 지금 nodeSet/relSet 안에 혹시 다른 키워드가 들어갔다면 빼야 함. (우리는 아직 안 넣었으므로 그냥 패스)
        //
        // all :
        //   - 확장된 전체 메타(expandedMetaIds)에 붙은 모든 (ConceptKeyword)도 보여준다
        //   - 단, 그 추가 키워드에서 다시 메타 확장하지는 않는다 (1-step만)
        //
        if ("all".equalsIgnoreCase(graphView)) {
            // 확장된 전체 메타 집합에 달려있는 키워드 관계들을 끌어와서 추가
            KeywordLinkBundle kwBundle = collectKeywordLinksForMetaIds(
                session,
                expandedMetaIds,
                limit * 5
            );

            // kwBundle 에서 받은 키워드 노드/관계 추가
            nodeSet.addAll(kwBundle.keywordNodes);
            nodeSet.addAll(kwBundle.metaNodes); // (안겹치면 들어감)
            relSet.addAll(kwBundle.keywordRels);

            // 주의:
            //  - 이때 들어온 키워드들 중 "시드 키워드"가 아닌 것도 포함 가능
            //    (=희님이 말한 all 모드 요구사항)
        }
        else if ("metaOnly".equalsIgnoreCase(graphView)) {
            // metaOnly면 시드 키워드만 허용. 이미 시드 키워드는 nodeSet에 들어가 있음.
            // 하지만 혹시라도 metaOnly에서 다른 키워드 노드를 집어넣은 적은 없음.
            // 그러므로 별도 정리는 (현재 로직에선) 불필요.
        }
        // keywordMain 은 이미 끝.

        // === [5] 마지막으로 buildResponseJson 으로 직렬화 ========================
        Neo4jGraphResultDto finalGraph = new Neo4jGraphResultDto();
        finalGraph.setNodes(nodeSet);
        finalGraph.setRelationships(relSet);

        return this.buildResponseJson(session, finalGraph, limit, vo, seedKeywordNodeIds);
    }

    /**
     * 시드 메타들에서 출발해서 medataResource ↔ medataResource 관계만 타고
     * hopMin..hopMax 홉 이내에 도달 가능한 medataResource들의 id를 전부 수집.
     *
     * - ConceptKeyword를 경유하지 않는다.
     * - self 포함 여부는 호출부에서 합집합 처리하므로 여기선 "추가로 도달한 애들" 위주로 봐도 되고,
     *   구현 단순화를 위해 전체를 그냥 return해도 상관없다.
     *
     * hopMin=1, hopMax=3 같은 식으로 쓸 예정.
     */
    private Set<Long> expandMetasByHop(
            Session session,
            Set<Long> seedMetaIds,
            int hopMin,
            int hopMax,
            int limit
    ) {
        Set<Long> resultIds = new HashSet<>();

        if (seedMetaIds == null || seedMetaIds.isEmpty()) return resultIds;

        // Cypher 아이디어:
        // MATCH (m0:medataResource)
        // WHERE id(m0) IN $seedIds
        // MATCH path=(m0)-[:`*` 메타↔메타]*hopMin..hopMax-(mX:medataResource)
        // RETURN DISTINCT mX LIMIT $lim
        //
        // 그런데 [:*]에서 "메타↔메타만"이라는 조건을 강제하려면
        // 중간에 ConceptKeyword 못 건드리게 해야 해.
        // 가장 간단한 방법은 관계 자체엔 제약 못 걸어도 노드 타입으로 필터:
        //
        // path=(m0)-[r*hopMin..hopMax]-(mX)
        // WHERE ALL(n IN nodes(path) WHERE n:medataResource)
        //
        String cypher =
            "MATCH (m0:medataResource) " +
            "WHERE id(m0) IN $seedIds " +
            "MATCH path=(m0)-[r*" + hopMin + ".." + hopMax + "]-(mX:medataResource) " +
            "WHERE ALL(n IN nodes(path) WHERE n:medataResource) " + // 경로 중간에 키워드 같은 다른 라벨 금지
            "RETURN DISTINCT mX " +
            "LIMIT $lim";

        Result res = session.run(
            cypher,
            Values.parameters(
                "seedIds", new ArrayList<>(seedMetaIds),
                "lim",     limit
            )
        );

        while (res.hasNext()) {
            Node mX = res.next().get("mX").asNode();
            resultIds.add(mX.id());
        }

        return resultIds;
    }

    /**
     * 확장된 메타 노드들(metaIds)에 연결된 모든 (meta)-[r]->(k:ConceptKeyword)를 수집.
     * - metaIds: 표시 대상이 될 메타들의 id 집합
     * - 결과로 keyword 노드 / 관계 / 메타 노드(중복 포함 가능)를 묶어서 리턴
     *
     * 이건 graphView = "all" 에서만 호출해.
     */
    private static class KeywordLinkBundle {
        Set<Node> keywordNodes   = new HashSet<>();
        Set<Node> metaNodes      = new HashSet<>();
        Set<Relationship> keywordRels = new HashSet<>();
    }
    private KeywordLinkBundle collectKeywordLinksForMetaIds(
            Session session,
            Set<Long> metaIds,
            int limit
    ) {
        KeywordLinkBundle bundle = new KeywordLinkBundle();
        if (metaIds == null || metaIds.isEmpty()) return bundle;

        // MATCH (m:medataResource)-[r]->(k:ConceptKeyword)
        // WHERE id(m) IN $metaIds
        // RETURN m,r,k LIMIT $lim
        Result kwRes = session.run(
            "MATCH (m:medataResource)-[r]->(k:ConceptKeyword) " +
            "WHERE id(m) IN $metaIds " +
            "RETURN m, r, k " +
            "LIMIT $lim",
            Values.parameters(
                "metaIds", new ArrayList<>(metaIds),
                "lim",     limit
            )
        );

        while (kwRes.hasNext()) {
            org.neo4j.driver.Record rec = kwRes.next();
            Node m = rec.get("m").asNode();
            Relationship r = rec.get("r").asRelationship();
            Node k = rec.get("k").asNode();

            bundle.metaNodes.add(m);
            bundle.keywordNodes.add(k);
            bundle.keywordRels.add(r);
        }

        return bundle;
    }
    
    /**
     * searchType = "medataSet"
     *
     * graphView 동작은 keyword 검색과 거의 동일하게 정리:
     *
     * keywordMain :
     *   - 시드 메타 ✔
     *   - 시드 메타에 directly 붙어있는 키워드 ✔
     *   - 시드 메타들 사이의 메타↔메타 관계 ✔
     *   - hop 확장된 메타 ❌
     *   - 확장 메타의 키워드 ❌
     *
     * metaOnly ("키워드 제외") :
     *   - 시드 메타 ✔
     *   - 시드 메타에서 hop 1..3으로 간 추가 메타 ✔
     *   - 전체(시드+확장) 메타들 사이의 메타↔메타 관계 ✔
     *   - 어떤 키워드 노드도 ❌ (시드 키워드도 안 보이게)
     *
     * all :
     *   - 시드 메타 ✔
     *   - hop 1..3 확장 메타 ✔
     *   - 전체(시드+확장) 메타들 사이의 메타↔메타 관계 ✔
     *   - 전체(시드+확장) 메타에 붙은 모든 키워드 ✔
     *   - 그 키워드와 메타의 관계 ✔
     *   - (키워드 통해 또 다른 메타까지는 확장 ❌)
     */
    private String fetchGraphByMedataSet(Session session, Neo4jSearchVo vo) throws Exception {

        int    limit     = Integer.parseInt(vo.getMatchLimit());
        String graphView = vo.getGraphView(); // "keywordMain" / "metaOnly" / "all"
        String setId     = vo.getMedataSetId();

        // 안전장치
        if (StringUtils.isBlank(setId)) {
            throw new ResBadRequestException("medataSetId" + ValueUtil.required());
        }

        // 결과 컨테이너
        Set<Node>         nodeSet = new HashSet<>();
        Set<Relationship> relSet  = new HashSet<>();

        // --- [1] 시드 메타 찾기 -------------------------------------------------
        // 보통 1건 나와야 정상. 혹시 동일 medataSetId 가진 노드가 여러 개라도 그냥 다 시드로 본다.
        Result startNodeResult = session.run(
            "MATCH (n:medataResource) " +
            "WHERE n.medataSetId = $setId " +
            "RETURN n",
            Values.parameters("setId", setId)
        );

        Set<Long> seedMetaIds = new HashSet<>();
        while (startNodeResult.hasNext()) {
            Node n = startNodeResult.next().get("n").asNode();
            nodeSet.add(n);
            seedMetaIds.add(n.id());
        }

        if (seedMetaIds.isEmpty()) {
            // 해당 셋 ID로 아무 것도 없으면 그냥 빈 그래프 응답
            Neo4jGraphResultDto emptyGraph = new Neo4jGraphResultDto();
            emptyGraph.setNodes(nodeSet);
            emptyGraph.setRelationships(relSet);
            return this.buildResponseJson(session, emptyGraph, limit, vo, null);
        }

        // --- [2] 시드 메타 사이의 직접 메타↔메타 관계 (seed-level link) ---------
        // (보통은 seedMetaIds 안에 1개뿐이라 관계 없을 수도 있음, 그래도 시도)
        Result seedRelRes = session.run(
            "MATCH (a:medataResource)-[rel]-(b:medataResource) " +
            "WHERE id(a) < id(b) AND id(a) IN $ids AND id(b) IN $ids " +
            "RETURN a, rel, b " +
            "LIMIT $lim",
            Values.parameters(
                "ids", new ArrayList<>(seedMetaIds),
                "lim", limit * 2
            )
        );
        while (seedRelRes.hasNext()) {
            org.neo4j.driver.Record rec = seedRelRes.next();
            Node a = rec.get("a").asNode();
            Node b = rec.get("b").asNode();
            Relationship rel = rec.get("rel").asRelationship();
            nodeSet.add(a);
            nodeSet.add(b);
            relSet.add(rel);
        }

        // --- [3] 시드 메타에 달린 키워드 (이건 시드 키워드 역할) -----------------
        // keywordMain / all 에서는 보여줄 수 있음
        // metaOnly 에서는 최종적으로 제거할 거라 어차피 추가 안 할 수도 있고, 일단 담아두고 나중에 필터링해도 됨
        //
        // (m:medataResource {seed})-[r]->(k:ConceptKeyword)
        Result seedKwRes = session.run(
            "MATCH (m:medataResource)-[r]->(k:ConceptKeyword) " +
            "WHERE id(m) IN $seedIds " +
            "RETURN m, r, k " +
            "LIMIT $lim",
            Values.parameters(
                "seedIds", new ArrayList<>(seedMetaIds),
                "lim",     limit
            )
        );

        // 시드 키워드 id들 저장(필요하면 쓸 수 있음)
        Set<Long> seedKwIds = new HashSet<>();

        while (seedKwRes.hasNext()) {
            org.neo4j.driver.Record rec = seedKwRes.next();
            Node m = rec.get("m").asNode();               // 시드 메타
            Relationship r = rec.get("r").asRelationship();
            Node k = rec.get("k").asNode();               // 시드 키워드

            nodeSet.add(m);
            nodeSet.add(k);
            relSet.add(r);

            seedKwIds.add(k.id());
        }

        // --- [4] hop 확장 (1..3홉, medataResource만 따라가기) -------------------
        //
        // keywordMain : hop 확장 안 함
        // metaOnly    : hop 확장해서 메타 늘린다 (키워드 없이 메타 네트워크 보고 싶은 뷰)
        // all         : hop 확장해서 메타 늘린다
        //
        Set<Long> expandedMetaIds = new HashSet<>(seedMetaIds);

        if (!"keywordMain".equalsIgnoreCase(graphView)) {

            // hop 1..3으로 확장된 메타 id들
            Set<Long> hopExpanded = expandMetasByHop(
                session,
                seedMetaIds,
                1,
                3,
                limit * 3
            );
            expandedMetaIds.addAll(hopExpanded);

            // 4-1. 확장된 전체 메타 노드를 전부 nodeSet에 넣기
            Result loadExpandedNodes = session.run(
                "MATCH (m:medataResource) " +
                "WHERE id(m) IN $allMetaIds " +
                "RETURN m",
                Values.parameters(
                    "allMetaIds", new ArrayList<>(expandedMetaIds)
                )
            );
            while (loadExpandedNodes.hasNext()) {
                nodeSet.add(loadExpandedNodes.next().get("m").asNode());
            }

            // 4-2. 확장된 전체 메타 사이의 메타↔메타 관계도 다 가져오기
            Result relExpandedRes = session.run(
                "MATCH (x:medataResource)-[rel]-(y:medataResource) " +
                "WHERE id(x) < id(y) AND id(x) IN $allMetaIds AND id(y) IN $allMetaIds " +
                "RETURN x, rel, y " +
                "LIMIT $lim",
                Values.parameters(
                    "allMetaIds", new ArrayList<>(expandedMetaIds),
                    "lim",        limit * 5
                )
            );
            while (relExpandedRes.hasNext()) {
                org.neo4j.driver.Record rec = relExpandedRes.next();
                Node x   = rec.get("x").asNode();
                Node y   = rec.get("y").asNode();
                Relationship rel = rec.get("rel").asRelationship();
                nodeSet.add(x);
                nodeSet.add(y);
                relSet.add(rel);
            }
        }

        // --- [5] graphView별 키워드 처리 최종 반영 ------------------------------
        //
        // keywordMain:
        //   - 시드 메타 + 시드 키워드 OK
        //   - hop 확장 안 했으므로 추가 작업 없음
        //
        // metaOnly:
        //   - 어떤 키워드 노드도 보여주지 말아야 함
        //   - 지금 nodeSet에 시드 키워드가 이미 들어가 있으므로, 여기서 걔네를 제거
        //   - 또, 그 키워드와 연결된 관계도 relSet에서 제거
        //
        // all:
        //   - expandedMetaIds 에 붙어있는 모든 키워드까지 추가
        //   - (확장 메타에 붙은 키워드들 포함)
        //
        if ("metaOnly".equalsIgnoreCase(graphView)) {

            // 5-A: 메타만 남기고 키워드 노드 삭제
            //      nodeSet에서 ConceptKeyword 라벨 가진 노드를 걷어낸다
            //      그리고 그 키워드 노드를 start/end로 가진 관계 삭제
            Set<Long> keywordNodeIdsToRemove = new HashSet<>();
            for (Node n : nodeSet) {
                if (n.hasLabel("ConceptKeyword")) {
                    keywordNodeIdsToRemove.add(n.id());
                }
            }

            if (!keywordNodeIdsToRemove.isEmpty()) {
                // nodeSet 필터
                nodeSet.removeIf(n -> keywordNodeIdsToRemove.contains(n.id()));

                // relSet 필터
                relSet.removeIf(r ->
                    keywordNodeIdsToRemove.contains(r.startNodeId()) ||
                    keywordNodeIdsToRemove.contains(r.endNodeId())
                );
            }

            // done.
        }
        else if ("all".equalsIgnoreCase(graphView)) {

            // 5-B: 확장된 전체 메타(expandedMetaIds)에 붙은 모든 키워드들을 싹 가져와서 추가
            KeywordLinkBundle kwBundle = collectKeywordLinksForMetaIds(
                session,
                expandedMetaIds,
                limit * 5
            );

            // 추가 반영
            nodeSet.addAll(kwBundle.metaNodes);      // (중복시 무시됨)
            nodeSet.addAll(kwBundle.keywordNodes);   // 확장 메타들의 키워드
            relSet.addAll(kwBundle.keywordRels);     // 메타↔키워드 관계
        }
        // keywordMain 은 그대로 둠 (시드 키워드만 이미 nodeSet에 존재)

        // --- [6] build 해서 반환 -----------------------------------------------
        Neo4jGraphResultDto graph = new Neo4jGraphResultDto();
        graph.setNodes(nodeSet);
        graph.setRelationships(relSet);

        return this.buildResponseJson(session, graph, limit, vo, null);
    }  
    
    /* 2025-10-30 개념 키워드 넣기 전 조회 */
//	public String getNeo4jRdbMedata_old(Neo4jSearchVo searchVo) {
//		// 검색 유형이 없으면 all
//		if (StringUtils.isBlank(searchVo.getSearchType())) searchVo.setSearchType("all"); 
//		// 조회 LIMIT가 없으면 100
//		if (StringUtils.isBlank(searchVo.getMatchLimit())) searchVo.setMatchLimit("100");
//
//		// 필수 체크
//		StringBuffer sb = new StringBuffer();		
//		
//		// 검색 유형이 medataSet일 때 medataSetId 체크
//		if("medataSet".equals(searchVo.getSearchType())) {
//			if (StringUtils.isBlank(searchVo.getMedataSetId())) {
//				sb.append("medataSetId").append(ValueUtil.required()).append("\n");
//			}
//		}
//		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
//		
//		SimpleDateFormat dateFormat = new SimpleDateFormat(NEO4J_DATE_TIME_FORMAT);
//		
//		String jsonOutput = "";
//		int nLimit = Integer.parseInt(searchVo.getMatchLimit());
//	    
//	    // front-end neo4jd3.js에서 사용할 수 있도록 데이터를 가공
//	    // 참고 : https://github.com/eisman/neo4jd3#d3js-data-format
//        try (Session session = neo4jDriver.session()) {
//
//        	if("all".equals(searchVo.getSearchType())) {  
//	    		// node(medataResource) 정보 조회
//	    		String nodeQuery = "MATCH (n:medataResource) RETURN n LIMIT " + nLimit;
//	    		Result nodeResult = session.run(nodeQuery);
//	    		
//	    		List<Map<String, Object>> outputNodeList = new ArrayList<>();
//	    		
//	    		while (nodeResult.hasNext()) {
//	    			org.neo4j.driver.Record record = nodeResult.next();
//	    			Node node = record.get("n").asNode();
//	    			Map<String, Object> outputItem = new HashMap<>();
//	    			Iterable<String> labelTokens = node.labels();
//	    			List<String> labels = new ArrayList<>();
//	    			List<String> orgLabels = new ArrayList<>();
//	    			if(StringUtils.isBlank(searchVo.getLabelType())) {
//	    				for (String labelToken : labelTokens) {
//	    					labels.add(labelToken);
//	    				}
//	    			}
//	    			else {
//	    				String propertyType = (String) node.asMap().get(searchVo.getLabelType());
//	    				if(StringUtils.isNotBlank(propertyType)) {
//	    					labels.add(propertyType);
//	    				}
//	    				for (String labelToken : labelTokens) {
//	    					orgLabels.add(labelToken);
//	    				}
//	    			}
//	    			outputItem.put("id", node.id());
//	    			outputItem.put("labels", labels);
//	    			outputItem.put("orgLabels", orgLabels);
//	    			outputItem.put("properties", node.asMap());       			
//	    			
//	    			outputNodeList.add(outputItem);
//	    		}
//	    		
//	    		Set<Long> nodeIds = outputNodeList.stream()
//	    		        .map(node -> (Long) node.get("id"))
//	    		        .collect(Collectors.toSet());
//	    		String nodeIdsStr = nodeIds.toString();
//	    		
//	    		// relationship(관계) 정보 조회
//	    		/*
//	    		 * 2024-10-11 tklee
//	    		 * 기존에는 모든 relation을 조회 후 조회된 node에 관련된 relation만 추출해냈었지만, 
//	    		 * 성능적인 이슈를 고려하여 조회된 node에 해당되는 relation만 직접 조회해서 가져오도록 수정하였음.
//	    		 */
////	    		String relationshipQuery = "MATCH p=(n:medataResource)-->() RETURN p"; 
//	    		String relationshipQuery = "MATCH (n)-[p]-(m) "
//	    								 + "WHERE id(n) < id(m) AND id(n) IN "+ nodeIdsStr +" AND id(m) IN " + nodeIdsStr
//	    								 + " RETURN p";
//	    		Result relationshipResult = session.run(relationshipQuery);
//	    		
//	    		List<Map<String, Object>> outputRelationshipList = new ArrayList<>();
//	    		
//	    		while (relationshipResult.hasNext()) {
//	    			org.neo4j.driver.Record record = relationshipResult.next();
//
//	    			Relationship relationship = record.get("p").asRelationship();
//	    			Map<String, Object> outputItem = new HashMap<>();
//	    			outputItem.put("id", relationship.id());
//	    			outputItem.put("type", relationship.type());
//	    			outputItem.put("startNode", relationship.startNodeId());
//	    			outputItem.put("endNode", relationship.endNodeId());
//	    			outputItem.put("properties", relationship.asMap());
//	    			
//	    			outputRelationshipList.add(outputItem);
//	    		}
//	    		
//	    		// node count 조회
//	    		String nodeCount = "0";
//	    		String nodeCountQuery = "MATCH (n:medataResource) WITH n LIMIT " + nLimit + " RETURN COUNT(n) AS CNT";
//	    		Result nodeCountResult = session.run(nodeCountQuery);
//	    		
//	    		while (nodeCountResult.hasNext()) {
//	    			org.neo4j.driver.Record record = nodeCountResult.next();
//	    			nodeCount = record.get("CNT").toString();
//	    		}
//	    		
//	    		Map<String, Object> outputItem = new HashMap<>();
//	    		outputItem.put("nodecount", nodeCount);
//	    		outputItem.put("nodes", outputNodeList);
//	    		outputItem.put("relationships", outputRelationshipList);
//	    		
//	    		String totalCount = "0";
//        		String totalCountQuery = "MATCH (n:medataResource) WITH n RETURN COUNT(n) AS CNT";
//	    		Result totalCountResult = session.run(totalCountQuery);
//	    		while (totalCountResult.hasNext()) {
//	    			org.neo4j.driver.Record record = totalCountResult.next();
//	    			totalCount = record.get("CNT").toString();
//	    		}
//        		
//        		Map<String, Object> result = new HashMap<>();
//        		result.put("graph", outputItem);
//        		result.put("totalcount", totalCount);
//	    		
//	    		ObjectMapper objectMapper = new ObjectMapper();
//	    		objectMapper.setDateFormat(dateFormat);
//	    		objectMapper.registerModule(new JavaTimeModule());
//	    		jsonOutput = objectMapper.writeValueAsString(result);
//        	}
//        	
//        	
//        	if("medataSet".equals(searchVo.getSearchType())) {
//    			String searchMedataSetId = searchVo.getMedataSetId();
//    			
//    			// medataSetId에 해당하는 node 조회 (기준 node)
//    			String startNodeQuery = "MATCH (n:medataResource) "
//    								  + "WHERE n.medataSetId = $setId "
//    								  + "RETURN n";
//    			Result startNodeResult = session.run(startNodeQuery, Values.parameters("setId", searchMedataSetId));
//    			
//        		List<Map<String, Object>> outputNodeList = new ArrayList<>();
//        		
////        		int startNodeCnt = 0;
//        		while (startNodeResult.hasNext()) {
//        			org.neo4j.driver.Record record = startNodeResult.next();
//        			
//        			Node node = record.get("n").asNode();
//        			
//        			Map<String, Object> outputItem = new HashMap<>();
//        			Iterable<String> labelTokens = node.labels();
//        			List<String> labels = new ArrayList<>();
//        			List<String> orgLabels = new ArrayList<>();
//        			
//        			if(StringUtils.isBlank(searchVo.getLabelType())) {
//        				for (String labelToken : labelTokens) {
//        					labels.add(labelToken);
//        				}
//        			}
//        			else {
//        				String propertyType = (String) node.asMap().get(searchVo.getLabelType());
//        				if(StringUtils.isNotBlank(propertyType)) {
//        					labels.add(propertyType);
//        				}
//        				for (String labelToken : labelTokens) {
//        					orgLabels.add(labelToken);
//        				}
//        			}
//        			outputItem.put("id", node.id());
//        			outputItem.put("labels", labels);
//        			outputItem.put("orgLabels", orgLabels);
//        			outputItem.put("properties", node.asMap());
//        			
//        			outputNodeList.add(outputItem);
////        			startNodeCnt++;
//        		}
//    			
//        		// 기준 node와 관계된 node 조회 (3단계까지 관계 조회)
//        		String endNodeQuery = "MATCH (startNode:medataResource {medataSetId: \"" + searchMedataSetId + "\"}) "
//			        				+ "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
//			        				+ "RETURN relatedNode "
//		        				    + "LIMIT " + (nLimit - 1);
//        		Result endNodeResult = session.run(endNodeQuery);
//        		
//    			while (endNodeResult.hasNext()) {
//    				org.neo4j.driver.Record record = endNodeResult.next();
//    				
//    				if(!record.get("relatedNode").isNull()) {
//    					Node node = record.get("relatedNode").asNode();
//    					Map<String, Object> outputItem = new HashMap<>();
//    					Iterable<String> labelTokens = node.labels();
//    					List<String> labels = new ArrayList<>();    
//    					List<String> orgLabels = new ArrayList<>();
//    					
//    					if(StringUtils.isBlank(searchVo.getLabelType())) {
//    						for (String labelToken : labelTokens) {
//    							labels.add(labelToken);
//    						}
//    					}
//    					else {
//    						String propertyType = (String) node.asMap().get(searchVo.getLabelType());
//    						if(StringUtils.isNotBlank(propertyType)) {
//    							labels.add(propertyType);
//    						}
//    						for (String labelToken : labelTokens) {
//    							orgLabels.add(labelToken);
//    						}
//    					}
//    					outputItem.put("id", node.id());
//    					outputItem.put("labels", labels);
//    					outputItem.put("orgLabels", orgLabels);
//    					outputItem.put("properties", node.asMap());
//    					
//    					outputNodeList.add(outputItem);
//    				}
//    			}
//    			
//	    		Set<Long> nodeIds = outputNodeList.stream()
//	    		        .map(node -> (Long) node.get("id"))
//	    		        .collect(Collectors.toSet());
//	    		String nodeIdsStr = nodeIds.toString();
//        		
//        		// node relationship(관계) 정보 조회
//	    		/*
//	    		 * 2024-10-11 tklee
//	    		 * 기존에는 모든 relation을 조회 후 조회된 node에 관련된 relation만 추출해냈었지만, 
//	    		 * 성능적인 이슈를 고려하여 조회된 node에 해당되는 relation만 직접 조회해서 가져오도록 수정하였음.
//	    		 */
////        		String nodeRelationshipQuery = "MATCH (startNode:medataResource {medataSetId: \"" + searchMedataSetId + "\"}) "
////        									 + "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
////        									 + "RETURN path";
//	    		String nodeRelationshipQuery = "MATCH (n)-[p]-(m) "
//						 					 + "WHERE id(n) < id(m) AND id(n) IN "+ nodeIdsStr +" AND id(m) IN " + nodeIdsStr
//						 					 + " RETURN p";
//        		Result nodeRelationshipResult = session.run(nodeRelationshipQuery);
//        		
//        		List<Map<String, Object>> outputRelationshipList = new ArrayList<>();
//        		
//    			while (nodeRelationshipResult.hasNext()) {
//    				org.neo4j.driver.Record record = nodeRelationshipResult.next();
//
//    				Relationship relationship = record.get("p").asRelationship();
//    				
//    				Map<String, Object> outputItem = new HashMap<>();
//    				outputItem.put("id", relationship.id());
//    				outputItem.put("type", relationship.type());
//    				outputItem.put("startNode", relationship.startNodeId());
//    				outputItem.put("endNode", relationship.endNodeId());
//    				outputItem.put("properties", relationship.asMap());
//    				
//    				outputRelationshipList.add(outputItem);
//    			}
//        		
//        		// node count 조회
//    			String nodeCount = "0";
//        		String nodeCountQuery = "MATCH (startNode:medataResource {medataSetId: \"" + searchMedataSetId + "\"}) "
//			        				  + "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
//			        				  + "WITH DISTINCT relatedNode "
//			        				  + "WHERE relatedNode IS NOT NULL "
//			        				  + "WITH relatedNode LIMIT " + nLimit
//			        				  + " RETURN COUNT(relatedNode) AS CNT";
//        		Result nodeCountResult = session.run(nodeCountQuery);
//        		
//	    		while (nodeCountResult.hasNext()) {
//	    			org.neo4j.driver.Record record = nodeCountResult.next();
//	    			int cnt = record.get("CNT").asInt();
//	    			nodeCount = Integer.toString(cnt);
//	    		}
//        		
//        		Map<String, Object> outputItem = new HashMap<>();
//        		outputItem.put("nodecount", nodeCount);
//        		outputItem.put("nodes", outputNodeList);
//        		outputItem.put("relationships", outputRelationshipList);
//        		
//        		String totalCount = "0";
//        		String totalCountQuery = "MATCH (n:medataResource) WITH n RETURN COUNT(n) AS CNT";
//	    		Result totalCountResult = session.run(totalCountQuery);
//	    		
//	    		while (totalCountResult.hasNext()) {
//	    			org.neo4j.driver.Record record = totalCountResult.next();
//	    			totalCount = record.get("CNT").toString();
//	    		}
//        		
//        		Map<String, Object> result = new HashMap<>();
//        		result.put("graph", outputItem);
//        		result.put("totalcount", totalCount);
//        		
//        		ObjectMapper objectMapper = new ObjectMapper();
//        		objectMapper.setDateFormat(dateFormat);
//        		objectMapper.registerModule(new JavaTimeModule());
//        		jsonOutput = objectMapper.writeValueAsString(result);
//        	}
//
//        } catch (Exception e) {
//			log.error("[NEO4J 조회 (RDB)] 실패/오류", e);
//			throw new ResBaseRuntimeException(e);				
//		}
//		
//		log.debug("[NEO4J 조회 (RDB)] 서비스 종료");
//		return jsonOutput;		
//	}
//	
    /**
     * NEO4J 그래프 초기화 후 재등록 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 25.
	 * @modified 2025-11-05 initDataStatType (onlyUse/all) 추가.
     */
    public void initNeo4jRdbGraphAndAddDataAll(String initDataStatType) {
        log.debug("[NEO4J 그래프 초기화 후 재등록 (RDB)] 서비스 시작");
        
		try {
			if (!AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("그래프 초기화 후 재등록에 대한 권한이 없습니다.");
			}

	    	this.initNeo4jRdbGraph();
	    	
	    	this.saveRdbMetadataSetListAll(initDataStatType);
	    	
		} catch (ResBaseRuntimeException e) {
			log.info("[NEO4J 그래프 초기화 후 재등록 (RDB)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[NEO4J 그래프 초기화 후 재등록 (RDB)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("NEO4J 그래프 초기화 후 재등록 (RDB)] 서비스 종료");
    }
    
    /**
     * 그래프의 전체 내용 삭제 후 Config 초기화 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 25.
     */
    private void initNeo4jRdbGraph() {
        log.debug("[NEO4J 그래프 초기화 (RDB)] 서비스 시작");
        
		if (!AuthUtil.isSystemAdmin()) {
			throw new ResForbiddenException("NEO4J 그래프 초기화 권한이 없습니다.");
		}     
        
    	/* 필요한 경우. neo4j 브라우저에서 실행
    	 * --제약 사항 설정 (Neo4j에 저장할 때 medataSetId가 중복되지 않도록 제약)
    	 * CREATE CONSTRAINT FOR (n:medataResource) REQUIRE n.medataSetId IS UNIQUE;
    	 * --2025-10-29 개념 키워드 제약 설정
    	 * CREATE CONSTRAINT concept_keyword_value_unique FOR (k:ConceptKeyword) REQUIRE k.value IS UNIQUE;
    	 */
    	
    	// 1. medataResource 전체 삭제 쿼리
		String deleteDataQuery = "MATCH (n:medataResource) DETACH DELETE n";
		
	    // 2. 개념 키워드 전체 삭제 쿼리
	    String deleteConceptKeywordQuery = "MATCH (k:ConceptKeyword) DETACH DELETE k";
		
        try (Session session = neo4jDriver.session()) {
            session.writeTransaction(tx -> { // neo4j 트랜잭션
            	// 1. medataResource 전체 삭제
                tx.run(deleteDataQuery);
                // 2. 개념 키워드 전체 삭제
                tx.run(deleteConceptKeywordQuery);                
                return null;
            });
        } catch (Exception e) {
        	log.error("[NEO4J 그래프 초기화 (RDB)] 실패/오류", e);
        }
        
        log.debug("[NEO4J 그래프 초기화 (RDB)] 서비스 종료");
    }
    
    /**
     * NEO4J 검색 메타데이터셋 전체 저장 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 25.
     * @modified 2025-11-05 initDataStatType (onlyUse/all) 추가.
     */
    @SuppressWarnings("unchecked")
	public void saveRdbMetadataSetListAll(String initDataStatType) {
        log.debug("[NEO4J 검색 메타데이터셋 전체 저장 (RDB)] 서비스 시작");    	
    	
		if (!AuthUtil.isSystemAdmin()) {
			throw new ResForbiddenException("NEO4J 전체 데이터 저장 권한이 없습니다.");
		}
		
    	MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
    	metadataSearchVo.setIsPaging(false); // TODO 모든 데이터를 조회시 LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
		
		if (!"all".equals(initDataStatType)) {
	    	metadataSearchVo.setMedataSetSttusMtcd("use"); // 기본적으로 사용인 것만. onlyUse
		}
    	
    	SearchResultListVo listVo = metadataSetService.getMetadataSetList(metadataSearchVo);
    	if (listVo != null && listVo.getList() != null && listVo.getList().size() > 0) {
    		
    		List<CamelCaseMap> list = (List<CamelCaseMap>) listVo.getList();

            // 1. 노드(메타)/키워드 upsert, 메타↔키워드 관계
    	    Map<String, Map<String,Object>> cache = new HashMap<>();
    	    for (CamelCaseMap tMap : list) {
    	        String setId = String.valueOf(tMap.get("medataSetId"));
    	        Map<String,Object> prep = this.prepareNeo4jDataAsMap(setId);
    	        cache.put(setId, prep);
    	        this.saveToNeo4jNodesOnly(setId, prep);
    	    }

            // 2. 메타↔메타 관계 upsert
    	    for (CamelCaseMap tMap : list) {
    	        String setId = String.valueOf(tMap.get("medataSetId"));
    	        Map<String,Object> prep = cache.get(setId);
    	        this.saveToNeo4jRelationsOnly(setId, prep);
    	    }  		

    	}
        log.debug("[NEO4J 검색 메타데이터셋 전체 저장 (RDB)] 서비스 종료");    	
    }
    
    /**
     * 셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 25.
     * @param medataSetId
     */
    public void saveNeo4jRdbMetadataSet(String medataSetId) {
        log.debug("[셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDB)] 서비스 시작");
        
		try {
			MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
			if (setDto == null) throw new ResNotFoundException("메타데이터 셋 데이터가 존재하지 않습니다.");   
			
			// =================================================================================================================================
			// 개별 저장인 경우(=전체 저장이 아닌 경우) 셋에서 삭제된 이력이 있는 메타데이터의 관계를 재정의하기 위한 동작
			// =================================================================================================================================
			
    		// 셋에서 삭제된 이력이 있는 메타데이터의 셋 ID 조회
    		List<String> metadataDelHstList = metadataChgHstMapper.selectMetadataDelHstListBySetId(medataSetId);
    		boolean isReg = false;
    		
    		for (String deletedSetId : metadataDelHstList) {
    			MetadataChgHstVo metadataChgHstVo = new MetadataChgHstVo();
    			metadataChgHstVo.setMedataSetId(medataSetId);
    			metadataChgHstVo.setChgAftrVal(deletedSetId);
    			// 삭제된 이력이 있는 메타데이터의 최근 상태 조회
    			String metadataRecentStatus = metadataChgHstMapper.selectMetadataRecentStatusBySetId(metadataChgHstVo);
    			
    			if("del".equals(metadataRecentStatus)) { // 최근 상태가 del(삭제)인 경우
    				// 해당되는 node를 삭제 후 재생성해야 상위 node와의 관계가 끊어지므로, 삭제 - 재생성 동작을 진행
    				this.deleteNeo4jRdbMetadataSet(deletedSetId);
    				try {
    					this.saveNeo4jRdbMetadataSet(deletedSetId);
					} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
						log.error("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 실패/오류 (정보성) (SKIP) : {} - {}", deletedSetId, e.getReason());
					} catch (Exception e) {
						log.error("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 실패/오류 (SKIP) - {}", deletedSetId, e);
					}
    			}
    			if("reg".equals(metadataRecentStatus)) { // 최근 상태가 reg(등록)인 경우
    				isReg = true;
    			}
    		}
    		if(isReg) { 
    			// 삭제 이력이 있는 메타데이터의 최근 상태가 reg(등록)인 경우 상위 node를 삭제 후 재생성해야 관계가 다시 생성되므로 삭제 - 재생성 동작을 진행
    			this.deleteNeo4jRdbMetadataSet(medataSetId);
    		}
    		// =================================================================================================================================
			
    		
			this.saveToNeo4jByRdbMedataInfo(medataSetId);
			
		} catch (ResBaseRuntimeException e) {
			log.info("[셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDB)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDB)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("셋 ID 로 NEO4J 그래프에 메타데이터 저장 (RDB)] 서비스 종료");		
    }
    
	/**
	 * 셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 25.
	 * @param 		medataSetId
	 */
    public void deleteNeo4jRdbMetadataSet(String medataSetId) {
    	log.debug("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)] 서비스 시작");
    
		// 셋 ID에 해당하는 NEO4J 데이터 삭제 쿼리
		String deleteDataQuery = "MATCH (n:medataResource) "
							   + "WHERE n.medataSetId = $setId "
							   + "DETACH DELETE n";
			
        try (Session session = neo4jDriver.session()) {
            session.writeTransaction(tx -> { // neo4j 트랜잭션
            	// 셋 ID에 해당하는 NEO4J 데이터 삭제
                tx.run(deleteDataQuery, Values.parameters("setId", medataSetId));
                return null;
            });
        } catch (Exception e) {
            log.error("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)] 서비스 종료");
    }
    
    /**
	 * RDB 메타데이터 정보를 NEO4J에 저장 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 13.
	 * @param 		medataSetId
	 */
	private void saveToNeo4jByRdbMedataInfo(String medataSetId) {
	    log.debug("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 서비스 시작");
	    
	    try {
	        // RDB -> Neo4j 변환 준비 1번만!
	        Map<String,Object> prep = this.prepareNeo4jDataAsMap(medataSetId);

	        // 1. 노드(메타)/키워드 upsert, 메타↔키워드 관계
	        this.saveToNeo4jNodesOnly(medataSetId, prep);

	        // 2. 메타↔메타 관계 upsert
	        this.saveToNeo4jRelationsOnly(medataSetId, prep);
	        
	    } catch (ResBaseRuntimeException e) {
			log.error("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
	        log.error("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 실패/오류", e);
	        throw new ResBaseRuntimeException(e);
	    }
	    
	    log.debug("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 서비스 종료");
	}
	
	/**
	 * Neo4j Cypher에 인라인으로 넣을 수 있는 pseudo-JSON 문자열 생성 유틸.
	 *
	 * 동작:
	 * 1. 주어진 data(Map 등)를 ObjectMapper로 JSON 문자열화한다.
	 *    예: {"metaModel":"AbcObject","medataSetId":"~id","tags":null}
	 *
	 * 2. JSONObject로 파싱해서
	 *    - 최상위 key의 "key": 를 key: 로 바꾼다.
	 *    - value가 JSONObject인 경우 그 내부도 같은 방식("key": -> key:)으로 한 번 더 치환한다.
	 *
	 * 결과:
	 *  { metaModel: "AbcObject", medataSetId: "~id", tags: null }
	 *
	 * 주의:
	 *  - 이건 Cypher 쿼리 안에서 UNWIND [ ... ] AS data 같은 식으로 그냥 텍스트 인라인해서 쓰는 기존 로직을 그대로 지원하기 위한 것이다.
	 *  - 나중에 파라미터 바인딩(UNWIND $rows) 방식으로 바꾸면 이 유틸은 제거 가능.
	 */
	private String toInlineMapStr(Object data) {
	    try {
	        ObjectMapper objectMapper = new ObjectMapper();
	        // 객체 -> JSON 문자열
	        String json = objectMapper.writeValueAsString(data);

	        // JSON 문자열 -> JSONObject
	        JSONObject jsonObject = new JSONObject(json);

	        // JSONObject 내부에 있는 nested JSONObject들도 "key": -> key: 로 변환
	        //    (현재 로직은 1-depth만 처리하고 있었으므로 그대로 맞춘다)
	        for (String key : jsonObject.keySet()) {
	            Object value = jsonObject.get(key);
	            if (value instanceof JSONObject) {
	                String stringValue = ((JSONObject) value)
	                        .toString()
	                        .replaceAll("\"(\\w+)\":", "$1:");
	                jsonObject.put(key, stringValue);
	            }
	        }

	        // 최상위도 "key": -> key:
	        return jsonObject
	                .toString()
	                .replaceAll("\"(\\w+)\":", "$1:");

	    } catch (Exception e) {
	        log.error("[toInlineMapStr] 변환 실패", e);
	        return "{}";
	    }
	}
	
	/**
	 * 메타데이터 셋 ID 별 필요 정보 사전 조회
	 * @param medataSetId
	 * @return
	 */
	@SuppressWarnings("unchecked")
	private Map<String, Object> prepareNeo4jDataAsMap(String medataSetId) {

	    MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
	    if (setDto == null) throw new ResNotFoundException("메타데이터 셋 데이터가 존재하지 않습니다.");

	    // 전체 프라퍼티는 다 나오지만 값은 "배열이 아닌 data_type"만 나오게 setMap1 정보 조회
	    ListOrderedMap<String, Object> medataSetMap = metadataApiMapper.selectMetadataToJsonStrNoArrayBySetId(setDto);

	    // "배열인 data_type" 프라퍼티 목록 조회
	    ModelSearchVo searchVo = new ModelSearchVo();
	    searchVo.setModelId(setDto.getModelId());
	    searchVo.setModelTypeMtcd("data_type");
	    searchVo.setDataArrayYn("Y");
	    List<ModelPropertyInfoDto> dataTypePrptyList = modelPropertyMapper.selectModelPropertyInfoListByModelIdForNeo4j(searchVo);

    	// 모든 프라퍼티 값이 다 나오게 배열인 것은 건수 제한없이 다 나오게 setMap2 정보 조회
    	// 2025-10-29 Neo4j 에서만 사용됨. object_type 은 따로 조회해 오므로 data_type 조건 추가.	    
	    ListOrderedMap<String, Object> dataMap = metadataApiMapper.selectMetadataToJsonStrUnlimitedBySetId(setDto);

	    // // 개념 키워드용. 중복 제거된 데이터용. (prptyId -> canonical keyword list)
    	//  "keywords": ["스마트시티", "교통 데이터 허브", "CCTV 통합 관제"],
    	//  "subjects": ["도시안전", "환경 모니터링"]	    
	    Map<String, List<String>> normKeywordsByPrptyId = new HashMap<>();

	    // "배열인 data_type" 인 프라퍼티값을 setMap2 에서 찾아서 JSON 배열의 문자열로 만들어서 setMap1 에 설정
	    // data_type 이면서 배열(Y)인 프라퍼티들을 medataSetMap에 JSON 문자열로 덮어쓰기 + 키워드 수집
	    for (ModelPropertyInfoDto pDto : dataTypePrptyList) {
    	    String prptyId   = pDto.getPrptyId();            // ex) "keywords", "subjects", ...
    	    String dataType  = pDto.getRangeDataTypeMtcd();  // ex) "keywordsKo", "keywordsEn", ...

    	    // 1. medataSetMap 에 배열형 값을 JSON 배열 문자열로 세팅
	        List<Object> prptyList = (List<Object>) dataMap.get(prptyId);
	        JSONArray jsonArray    = new JSONArray(prptyList);

	        if (medataSetMap.containsKey(prptyId)) {
	            medataSetMap.put(prptyId, jsonArray.toString()); // "[ ... ]" 이런 문자열로 덮어씀
	        }

    		// 2025-10-29 개념 키워드 노드 	    	    
    	    // 2. 이 prptyId가 '개념 키워드' 계열인지 확인해서 별도 수집
	        if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {

	            List<String> rawVals = (List<String>) dataMap.get(prptyId);
	            if (rawVals != null && !rawVals.isEmpty()) {
	            	List<String> canonList = rawVals.stream()
	            		    .flatMap(v -> KeywordUtil.splitByComma(v).stream())
	            		    .map(KeywordUtil::toNormKeyword) // 의미 정규화 키(canonical 키)
	            		    .filter(StringUtils::isNotBlank)
	            		    .distinct()
	            		    .collect(Collectors.toList());

	                if (!canonList.isEmpty()) {
	                    normKeywordsByPrptyId.put(prptyId, canonList);
	                }
	            }
	        }
	    }
	    //log.debug("normKeywordsByPrptyId:\n{}", normKeywordsByPrptyId);
	    
        // object_type 데이터 조회
		MetadataSearchVo subSetParamVo = new MetadataSearchVo();
		subSetParamVo.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
		subSetParamVo.setMedataSetId(medataSetId);
		subSetParamVo.setOnlyObjectTypeYn("Y");
		List<MetadataVo> subSetIdAllList = metadataMapper.selectMetadataSimpleListBySetId(subSetParamVo);	    

	    // "object_type" 프라퍼티 목록 조회
	    ModelSearchVo paramVo = new ModelSearchVo();
	    paramVo.setModelId(setDto.getModelId());
	    paramVo.setModelTypeMtcd("object_type");
	    List<ModelPropertyInfoDto> objectTypePrptyList = modelPropertyMapper.selectModelPropertyInfoListByModelIdForNeo4j(paramVo);

	    // object_type이 가리키는 다른 메타데이터셋의 Map들
	    List<Object> subSetMapList = new ArrayList<>();
	    for (ModelPropertyInfoDto p : objectTypePrptyList) {
	        String dataArrayYn = p.getDataArrayYn();
	        String prptyId     = p.getPrptyId();
	        
	        List<String> targetSetIds = subSetIdAllList.stream()
	                .filter(vo -> StringUtils.equals(vo.getPrptyId(), prptyId))
	                .map(MetadataVo::getMedataVal) // medataSetId
	                .filter(Objects::nonNull)
	                .map(String::valueOf)
	                .filter(StringUtils::isNotBlank)
	                .distinct()
	                .collect(Collectors.toList());
	        if (targetSetIds.isEmpty()) continue;
	        
	        if ("Y".equals(dataArrayYn)) {
	        	for (String subSetId : targetSetIds) {
	        		if (StringUtils.isBlank(subSetId)) continue;
                    MetadataSetDto subSetDto = new MetadataSetDto();
                    subSetDto.setMedataSetId(subSetId);
                    ListOrderedMap<String,Object> subSetMap = metadataApiMapper.selectMetadataToJsonStrNoArrayBySetId(subSetDto);
                    subSetMapList.add(subSetMap);
	            }
	        } else { // N
	        	String subSetId = targetSetIds.get(0);
	            if (StringUtils.isNotBlank(subSetId)) {
	                MetadataSetDto subSetDto = new MetadataSetDto();
	                subSetDto.setMedataSetId(subSetId);
	                ListOrderedMap<String,Object> subSetMap = metadataApiMapper.selectMetadataToJsonStrNoArrayBySetId(subSetDto);
	                subSetMapList.add(subSetMap);
	            }
	        }
	    }

	    // DB 에서 개념 키워드 정보 목록 조회 후 개념 키워드별 정보 설정 - 키워드 상세 정보 조회 (디스플레이명 등)
	    Set<String> allNormKeywords = normKeywordsByPrptyId.values().stream()
	        .flatMap(List::stream)
	        .collect(Collectors.toSet());

	    Map<String, List<Map<String,Object>>> keywordInfoByNormKw = new HashMap<>();
	    if (!allNormKeywords.isEmpty()) {
	        KeywordSearchVo keywordSearchVo = new KeywordSearchVo();
	        keywordSearchVo.setNormKeywordList(new ArrayList<>(allNormKeywords));
	        List<KeywordVo> keywordList = keywordMapper.selectKeywordList(keywordSearchVo);
	        if (keywordList == null || keywordList.isEmpty()) throw new ResBizInfoException("개념키워드 DB 정보가 존재하지 않습니다.(" + allNormKeywords + ")"); // 일어나면 안되는 오류
	        
	    	List<Map<String, Object>> keywordInfoMapList = MapperUtil.dtoListToMapList(keywordList);

	    	// prptyId 마다 반복
	        for (Map.Entry<String,List<String>> e : normKeywordsByPrptyId.entrySet()) {
	            String prptyId = e.getKey();            // ex) "keywords"
	            List<String> normKwList = e.getValue(); // ex) ["SMART_CITY","TRAFFIC_HUB"]
	            if (normKwList == null || normKwList.isEmpty()) continue;

	            List<Map<String,Object>> filteredList = keywordInfoMapList.stream()
	                .filter(m -> normKwList.contains(m.get("kywrdNorm")))
	                .collect(Collectors.toList());

	            if (filteredList.isEmpty()) {
	            	log.debug("[{}] 프라퍼티의 개념키워드 DB 정보가 존재하지 않습니다.({})", prptyId, allNormKeywords);
	            	continue;
	            }
	            keywordInfoByNormKw.put(prptyId, filteredList);
	        }
	    }

	    // 이제 모두 하나의 Map으로 묶어서 리턴
	    Map<String,Object> bag = new HashMap<>();
	    bag.put("setDto", setDto);
	    bag.put("medataSetMap", medataSetMap);
	    bag.put("dataMap", dataMap);
	    bag.put("objectTypePrptyList", objectTypePrptyList);
	    bag.put("subSetIdAllList", subSetIdAllList);	    
	    bag.put("subSetMapList", subSetMapList);
	    bag.put("normKeywordsByPrptyId", normKeywordsByPrptyId);
	    bag.put("keywordInfoByNormKw", keywordInfoByNormKw);

	    return bag;
	}
	
	/**
	 * NEO4J 노드(메타)/키워드 upsert, 메타↔키워드 관계
	 * @param medataSetId
	 * @param prep
	 */
	@SuppressWarnings("unchecked")
	private void saveToNeo4jNodesOnly(String medataSetId, Map<String,Object> prep) {
	    ListOrderedMap<String,Object> medataSetMap = (ListOrderedMap<String,Object>) prep.get("medataSetMap");
	    List<Object> subSetMapList = (List<Object>) prep.get("subSetMapList");
	    Map<String, List<Map<String,Object>>> keywordInfoByNormKw = (Map<String, List<Map<String,Object>>>) prep.get("keywordInfoByNormKw");
	    Map<String, List<String>> normKeywordsByPrptyId = (Map<String, List<String>>) prep.get("normKeywordsByPrptyId");

	    try (Session session = neo4jDriver.session()) {

	        session.writeTransaction(tx -> {

		        // 1) 현재 setId 자체 노드 upsert
		        String formattedJsonString = this.toInlineMapStr(medataSetMap);
		        String importQuery =
		            "UNWIND [" + formattedJsonString + "] AS data " +
		            "MERGE (n:medataResource {medataSetId: $setId}) " +
		            "ON CREATE SET n = data " +
		            "ON MATCH SET n = data " +
		            "WITH n, data.metaModel AS label " +
		            "CALL apoc.create.addLabels([id(n)], [label]) YIELD node " +
		            "RETURN node";	        	
	            tx.run(importQuery, Values.parameters("setId", medataSetId));

	            // 2) 참조되는 다른 메타데이터셋들도 노드 upsert만
	            for (Object o : subSetMapList) {
	                Map<String,String> item = (Map<String,String>) o;
	                String subSetId = item.get("medataSetId");
	                if (StringUtils.isBlank(subSetId)) continue;

	                String formattedJsonArrayString = this.toInlineMapStr(o);
	                String prptyImportQuery =
	                    "UNWIND [" + formattedJsonArrayString + "] AS data " +
	                    "MERGE (n:medataResource {medataSetId: $subSetId}) " +
	                    "ON CREATE SET n = data " +
	                    "ON MATCH SET n = data " +
	                    "WITH n, data.metaModel AS label " +
	                    "CALL apoc.create.addLabels([id(n)], [label]) YIELD node " +
	                    "RETURN node";

	                tx.run(
	                    prptyImportQuery,
	                    Values.parameters("subSetId", subSetId)
	                );
	            }

	            // 3) ConceptKeyword 노드 upsert + (src)-[:keywords/...]->(k)
	            if (keywordInfoByNormKw != null && !keywordInfoByNormKw.isEmpty()) {
	                for (Map.Entry<String,List<Map<String,Object>>> e : keywordInfoByNormKw.entrySet()) {

	                    String prptyId = e.getKey();
	                    List<Map<String,Object>> kwRows = e.getValue();
	                    if (kwRows == null || kwRows.isEmpty()) continue;

	                    String mergeKeywordRelQuery =
	                        "UNWIND $keywords AS kw " +
	                        "MERGE (k:ConceptKeyword { value: kw.kywrdNorm }) " +
	                        "  ON CREATE SET " +
	                        "    k.lang = kw.kywrdLangMtcd, " +
	                        "    k.name = kw.kywrdDisp, " +
	                        "    k.tag  = kw.kywrdInfluxTag " +
	                        "WITH COLLECT(k) AS ks " +
	                        "MATCH (src:medataResource {medataSetId: $sourceId}) " +
	                        "UNWIND ks AS k " +
	                        "MERGE (src)-[:" + prptyId + "]->(k) " +
	                        "RETURN count(*)";

	                    tx.run(
	                        mergeKeywordRelQuery,
	                        Values.parameters(
	                            "keywords", kwRows,
	                            "sourceId", medataSetId
	                        )
	                    );

	                    // prune 관계 (이 setId에서 빠진 키워드 엣지 제거)
	                    List<String> canonList = normKeywordsByPrptyId.get(prptyId);
	                    if (canonList != null && !canonList.isEmpty()) {
	                        String pruneRelQuery =
	                            "MATCH (src:medataResource {medataSetId: $sourceId})" +
	                            "-[r:" + prptyId + "]->(k:ConceptKeyword) " +
	                            "WHERE NOT k.value IN $canonList " +
	                            "DELETE r " +
	                            "RETURN count(r)";
	                        tx.run(
	                            pruneRelQuery,
	                            Values.parameters(
	                                "sourceId", medataSetId,
	                                "canonList", canonList
	                            )
	                        );
	                    }
	                }
	            }

	            return null;
	        });
	        
	    } catch (ResBaseRuntimeException e) {
			log.error("[NEO4J 노드(메타)/키워드 upsert, 메타↔키워드 관계] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
	        log.error("[NEO4J 노드(메타)/키워드 upsert, 메타↔키워드 관계] 실패/오류", e);
	        throw new ResBaseRuntimeException(e);
	    }	        
	}

	/**
	 * NEO4J 메타↔메타 관계 upsert
	 * @param medataSetId
	 * @param prep
	 */
	@SuppressWarnings("unchecked")
	private void saveToNeo4jRelationsOnly(String medataSetId, Map<String,Object> prep) {
	    List<ModelPropertyInfoDto> objectTypePrptyList = (List<ModelPropertyInfoDto>) prep.get("objectTypePrptyList");
	    List<MetadataVo> subSetIdAllList = (List<MetadataVo>) prep.get("subSetIdAllList");

	    try (Session session = neo4jDriver.session()) {

	        session.writeTransaction(tx -> {
	            for (ModelPropertyInfoDto p : objectTypePrptyList) {
	                String prptyId = p.getPrptyId();
	                String dataArrayYn = p.getDataArrayYn();
	                
	    	        List<String> targetSetIds = subSetIdAllList.stream()
	    	                .filter(vo -> StringUtils.equals(vo.getPrptyId(), prptyId))
	    	                .map(MetadataVo::getMedataVal) // medataSetId
	    	                .filter(Objects::nonNull)
	    	                .map(String::valueOf)
	    	                .filter(StringUtils::isNotBlank)
	    	                .distinct()
	    	                .collect(Collectors.toList());
	    	        if (targetSetIds.isEmpty()) continue;	                

	                if ("Y".equals(dataArrayYn)) {
	    	        	for (String targetId : targetSetIds) {
	    	        		if (StringUtils.isBlank(targetId)) continue;
                            String relationImportQuery =
                                "MATCH (a {medataSetId: $sourceId}), (b {medataSetId: $targetId}) " +
                                "MERGE (a)-[:" + prptyId + "]->(b)";
                            tx.run(relationImportQuery, Values.parameters("sourceId", medataSetId, "targetId", targetId));
	                    }
	                } else { // "N"
	                    String targetId = targetSetIds.get(0);
	                    if (StringUtils.isBlank(targetId)) continue;
                        String relationImportQuery =
                            "MATCH (a {medataSetId: $sourceId}), (b {medataSetId: $targetId}) " +
                            "MERGE (a)-[:" + prptyId + "]->(b)";
                        tx.run(relationImportQuery, Values.parameters("sourceId", medataSetId, "targetId", targetId));
	                }
	            }
	            return null;
	        });

	    } catch (ResBaseRuntimeException e) {
			log.error("[NEO4J 메타↔메타 관계 upsert] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
	        log.error("[NEO4J 메타↔메타 관계 upsert] 실패/오류", e);
	        throw new ResBaseRuntimeException(e);
	    }	
	}
	
	/**
	 * NEO4J 개념 키워드 Orphan 정리
	 * 
	 * TODO: 필요시 화면에서 호출하는 거 만들 것!
	 */
	public void cleanupOrphanKeywords() {
	    log.debug("[NEO4J 개념 키워드 Orphan 정리] 시작");

	    if (!AuthUtil.isSystemAdmin()) {
	        throw new ResForbiddenException("개념 키워드 정리 권한이 없습니다.");
	    }

	    String cleanupCypher =
	        "MATCH (k:ConceptKeyword) " +
	        "WHERE NOT (k)<-[]-(:medataResource) " +
	        "DELETE k " +
	        "RETURN count(k) AS deletedCnt";

	    try (Session session = neo4jDriver.session()) {
	        session.writeTransaction(tx -> {
	            Result r = tx.run(cleanupCypher);
	            if (r.hasNext()) {
	                int deleted = r.next().get("deletedCnt").asInt();
	                log.info("[NEO4J 개념 키워드 Orphan 정리] 삭제된 ConceptKeyword 수 = {}", deleted);
	            } else {
	                log.info("[NEO4J 개념 키워드 Orphan 정리] 삭제된 ConceptKeyword 수 = 0");
	            }
	            return null;
	        });
	    } catch (Exception e) {
	        log.error("[NEO4J 개념 키워드 Orphan 정리] 실패/오류", e);
	        throw new ResBaseRuntimeException(e);
	    }

	    log.debug("[NEO4J 개념 키워드 Orphan 정리] 종료");
	}
   
}
