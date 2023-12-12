package kr.co.n2m.platform.meta.rdf.neo4j.service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Value;
import org.neo4j.driver.Values;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Path;
import org.neo4j.driver.types.Relationship;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RdfWriteLangMtcd;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResForbiddenException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.Neo4jProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceSearchVo;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import kr.co.n2m.platform.meta.rdf.namespace.mapper.RdfNamespaceMapper;
import kr.co.n2m.platform.meta.rdf.neo4j.domain.Neo4jSearchVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModel.RdfModelMakeMode;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModelReqVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataApiMapper;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataApiService;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
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
	
	@Autowired
	private MetadataApiService metadataApiService;
	
	@Autowired
	private RdfNamespaceMapper rdfNamespaceMapper;
	
	@Autowired
	private MetadataApiMapper metadataApiMapper;
	
	@Autowired
	private ModelPropertyMapper modelPropertyMapper;
	
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
		
		
		String jsonOutput = "";
		
	    String uri = property.getUri();
	    String username = property.getUsername();
	    String password = property.getPassword();
	    
	    // front-end neo4jd3.js에서 사용할 수 있도록 데이터를 가공
	    // 참고 : https://github.com/eisman/neo4jd3#d3js-data-format
	    neo4jDriver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
        try (Session session = neo4jDriver.session()) {

        	if("all".equals(searchVo.getSearchType())) {        		
        		// node(Resource) 정보 조회
        		String nodeQuery = "MATCH (n:Resource) RETURN n LIMIT " + searchVo.getMatchLimit();
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
        		
        		// relationship(관계) 정보 조회
        		String relationshipQuery = "MATCH p=(n:Resource)-->() RETURN p LIMIT " + searchVo.getMatchLimit();
        		Result relationshipResult = session.run(relationshipQuery);
        		List<Map<String, Object>> outputRelationshipList = new ArrayList<>();
        		while (relationshipResult.hasNext()) {
        			org.neo4j.driver.Record record = relationshipResult.next();
        			Path path = record.get("p").asPath();
        			
        			for (Path.Segment segment : path) {
        				Relationship relationship = segment.relationship();
        				Map<String, Object> outputItem = new HashMap<>();
        				outputItem.put("id", relationship.id());
        				outputItem.put("type", relationship.type());
        				outputItem.put("startNode", relationship.startNodeId());
        				outputItem.put("endNode", relationship.endNodeId());
        				outputItem.put("properties", relationship.asMap());
        				
        				outputRelationshipList.add(outputItem);
        			}
        		}
        		
        		// node count 조회
	    		String nodeCountQuery = "MATCH (n:Resource) RETURN COUNT(n) AS CNT LIMIT " + searchVo.getMatchLimit();
	    		Result nodeCountResult = session.run(nodeCountQuery);
	    		String nodeCount = "0";
	    		while (nodeCountResult.hasNext()) {
	    			org.neo4j.driver.Record record = nodeCountResult.next();
	    			nodeCount = record.get("CNT").toString();
	    		}
        		
        		Map<String, Object> outputItem = new HashMap<>();
        		outputItem.put("nodecount", nodeCount);
        		outputItem.put("nodes", outputNodeList);
        		outputItem.put("relationships", outputRelationshipList);
        		
        		Map<String, Object> result = new HashMap<>();
        		result.put("graph", outputItem);
        		
        		ObjectMapper objectMapper = new ObjectMapper();
        		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
        		objectMapper.setDateFormat(dateFormat);
        		objectMapper.registerModule(new JavaTimeModule());
        		jsonOutput = objectMapper.writeValueAsString(result);
        	}
        	
        	if("medataSet".equals(searchVo.getSearchType())) {
        		// URI(baseUrl + / + medataSetId)
    			String searchUri = metadataApiService.getMetadataSetIri(searchVo.getMedataSetId());
    			
    			// URI에 해당하는 node 조회 (기준 node)
    			String startNodeQuery = "MATCH (n:Resource) "
    								  + "WHERE n.uri = \"" + searchUri + "\" "
    								  + "RETURN n"; 
    			Result startNodeResult = session.run(startNodeQuery);
        		List<Map<String, Object>> outputNodeList = new ArrayList<>();
        		int startNodeCnt = 0;
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
        			startNodeCnt++;
        		}
    			
        		// 기준 node와 관계된 node 조회 (3단계까지 관계 조회)
        		String endNodeQuery = "MATCH (startNode:Resource {uri: \"" + searchUri + "\"}) "
			        				+ "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
			        				+ "RETURN relatedNode "
		        				    + "LIMIT " + searchVo.getMatchLimit();
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
        		
        		// node relationship(관계) 정보 조회
        		String nodeRelationshipQuery = "MATCH (startNode:Resource {uri: \"" + searchUri + "\"}) "
        									 + "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
        									 + "RETURN path "
        									 + "LIMIT " + searchVo.getMatchLimit();
        		Result nodeRelationshipResult = session.run(nodeRelationshipQuery);
        		List<Map<String, Object>> outputRelationshipList = new ArrayList<>();
        		while (nodeRelationshipResult.hasNext()) {
        			org.neo4j.driver.Record record = nodeRelationshipResult.next();
        			Path path = record.get("path").asPath();
        			
        			for (Path.Segment segment : path) {
        				Relationship relationship = segment.relationship();
        				Map<String, Object> outputItem = new HashMap<>();
        				outputItem.put("id", relationship.id());
        				outputItem.put("type", relationship.type());
        				outputItem.put("startNode", relationship.startNodeId());
        				outputItem.put("endNode", relationship.endNodeId());
        				outputItem.put("properties", relationship.asMap());
        				
        				outputRelationshipList.add(outputItem);
        			}
        		}
        		
        		// node count 조회
        		String nodeCountQuery = "MATCH (startNode:Resource {uri: \"" + searchUri + "\"}) "
			        				  + "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
			        				  + "WITH DISTINCT relatedNode "
			        				  + "WHERE relatedNode IS NOT NULL "
			        				  + "RETURN COUNT(relatedNode) AS CNT "
		        				      + "LIMIT " + searchVo.getMatchLimit();
        		Result nodeCountResult = session.run(nodeCountQuery);
        		String nodeCount = "0";
	    		while (nodeCountResult.hasNext()) {
	    			org.neo4j.driver.Record record = nodeCountResult.next();
	    			int cnt = record.get("CNT").asInt()+startNodeCnt;
	    			nodeCount = Integer.toString(cnt);
	    		}
        		
        		Map<String, Object> outputItem = new HashMap<>();
        		outputItem.put("nodecount", nodeCount);
        		outputItem.put("nodes", outputNodeList);
        		outputItem.put("relationships", outputRelationshipList);
        		
        		Map<String, Object> result = new HashMap<>();
        		result.put("graph", outputItem);
        		
        		ObjectMapper objectMapper = new ObjectMapper();
        		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
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
     */
    public void initNeo4jGraphAndAddDataAll() {
        log.debug("[NEO4J 그래프 초기화 후 재등록 (RDF)] 서비스 시작");
        
		try {
			if (!AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("그래프 초기화 후 재등록에 대한 권한이 없습니다.");
			}        
        
	    	this.initNeo4jGraph();
	    	
	    	this.saveMetadataSetListAll();
	    	
		} catch (ResBaseRuntimeException e) {
			log.info("[NEO4J 그래프 초기화 후 재등록 (RDF)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[NEO4J 그래프 초기화 후 재등록 (RDF)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
        log.debug("NEO4J 그래프 초기화 후 재등록 (RDF)] 서비스 종료");
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
		
	    String uri = property.getUri();
	    String username = property.getUsername();
	    String password = property.getPassword();
	    
	    neo4jDriver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
        
    	/* 필요한 경우. neo4j 브라우저에서 실행
    	 * --제약 사항 설정 (Neo4j에 저장할 때 uri가 중복되지 않도록 제약)
    	 * CREATE CONSTRAINT n10s_unique_uri FOR (n:Resource) REQUIRE n.uri IS UNIQUE;
    	 * 
    	 * --graph config 초기 설정
    	 * CALL n10s.graphconfig.init();
    	 */
    	
    	// 1. 전체 삭제 쿼리
		String deleteDataQuery = "MATCH (n:Resource) DETACH DELETE n";
		// 2. 네임스페이스 프리픽스 전체 삭제 쿼리
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
     * NEO4J 검색 메타데이터셋 전체 저장 (RDF)
	 * @Author      : heenim
	 * @Date        : 2023. 08. 30.
     * @param metadataSearchVo
     */
    @SuppressWarnings("unchecked")
	public void saveMetadataSetListAll() {
        log.debug("[NEO4J 검색 메타데이터셋 전체 저장 (RDF)] 서비스 시작");    	
    	
		if (!AuthUtil.isSystemAdmin()) {
			throw new ResForbiddenException("NEO4J 전체 데이터 저장 권한이 없습니다.");
		}
		
    	MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
    	metadataSearchVo.setIsPaging(false); // TODO 모든 데이터를 조회시 LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
    	metadataSearchVo.setMedataSetSttusMtcd("use");
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
        
        String uri = property.getUri();
	    String username = property.getUsername();
	    String password = property.getPassword();
	    
	    neo4jDriver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
        try {
        	// URI(baseUrl + / + medataSetId)
			String deleteUri = metadataApiService.getMetadataSetIri(medataSetId);
			
			// URI에 해당하는 NEO4J 데이터 삭제 쿼리
			String deleteDataQuery = "MATCH (n:Resource) "
								   + "WHERE n.uri CONTAINS \"" + deleteUri + "\" "
								   + "DETACH DELETE n";
            try (Session session = neo4jDriver.session()) {
                session.writeTransaction(tx -> { // neo4j 트랜잭션
                	// URI에 해당하는 NEO4J 데이터 삭제
                    tx.run(deleteDataQuery);
                    return null;
                });
            } catch (Exception e) {
            	log.error("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDF)] 실패/오류", e);
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
	public void saveToNeo4jByRdfInfo(RdfModelReqVo rdfModelReqVo) {
	    log.debug("[RDF 정보를 NEO4J에 저장 (RDF)] 서비스 시작");
	    
	    String uri = property.getUri();
	    String username = property.getUsername();
	    String password = property.getPassword();
	    
	    neo4jDriver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
	    try {
	    	
			// NEO4J 네임스페이스 프리픽스 지정
			RdfNamespaceSearchVo searchVo = new RdfNamespaceSearchVo();
			searchVo.setIsPaging(false);
			List<RdfNamespaceVo> nmspList = rdfNamespaceMapper.selectRdfNamespaceList(searchVo);
			for(int i = 0; i < nmspList.size(); i++) {
				RdfNamespaceVo namespace = nmspList.get(i);
				String nmspPrefix = namespace.getRdfNmspPfix();
				String nmspUri = namespace.getRdfNmspUri();
				// NEO4J 네임스페이스 프리픽스 추가 쿼리
				String addPrefixQuery = "CALL n10s.nsprefixes.add('" + nmspPrefix + "', '" + nmspUri + "')";
				try (Session session = neo4jDriver.session()) {
					session.writeTransaction(tx -> { // neo4j 트랜잭션
						// NEO4J 네임스페이스 프리픽스 추가
						tx.run(addPrefixQuery);
						return null;
					});
				} catch (Exception e) {
					continue;
				}
			}
			
			// RDF 조회
			String rdfData = virtuosoService.getRdfModelStr(rdfModelReqVo);
			// 조회한 RDF 정보로 NEO4J에 데이터를 넣는 쿼리
			String importQuery = "WITH '" + rdfData + "' AS payload "
							   + "CALL n10s.rdf.import.inline(payload, $rdfFormat) yield terminationStatus, triplesLoaded, triplesParsed, namespaces "
							   + "RETURN terminationStatus, triplesLoaded, triplesParsed, namespaces";
			try (Session session = neo4jDriver.session()) {
				session.writeTransaction(tx -> { // neo4j 트랜잭션
					// TODO : 리팩토링 필요
					String rdfFormat = "";
					if("xml".equals(rdfModelReqVo.getRdfWriteLangMtcd()) || "xml_abbrev".equals(rdfModelReqVo.getRdfWriteLangMtcd())) {
						rdfFormat = "RDF/XML";
					}
					if("turtle".equals(rdfModelReqVo.getRdfWriteLangMtcd()) || "turtle_flat".equals(rdfModelReqVo.getRdfWriteLangMtcd())) {
						rdfFormat = "Turtle";
					}
					if("n_triple".equals(rdfModelReqVo.getRdfWriteLangMtcd())) {
						rdfFormat = "N-Triples";
					}
					if("json_ld".equals(rdfModelReqVo.getRdfWriteLangMtcd())) {
						rdfFormat = "JSON-LD";
					}
					if("json".equals(rdfModelReqVo.getRdfWriteLangMtcd())) {
						rdfFormat = "RDF/JSON";
					}
					
					// 조회한 RDF 정보로 NEO4J에 데이터 추가
					tx.run(importQuery, Values.parameters("rdfFormat", rdfFormat));
					return null;
				});
			}
	        
	    } catch (Exception e) {
	        log.error("[RDF 정보를 NEO4J에 저장 (RDF)] 실패/오류", e);
	        throw new ResBaseRuntimeException(e);
	    }
	    finally {	    	
	    	neo4jDriver.close();
	    }
	    
	    log.debug("[RDF 정보를 NEO4J에 저장 (RDF)] 서비스 종료");
	}    
	
	
	

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	/**
	 * RDB 메타데이터 정보를 NEO4J에 저장 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 13.
	 * @param 		rdfModelReqVo
	 */
	public void saveToNeo4jByRdbMedataInfo(String medataSetId) {
	    log.debug("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 서비스 시작");
	    
	    try {
	    	MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
	    	if (setDto == null) throw new ResNotFoundException("메타데이터 셋 데이터가 존재하지 않습니다.");
	    	
	    	ListOrderedMap<String, Object> medataSetMap = metadataApiMapper.selectMetadataToJsonStrNoArrayBySetId(setDto);
	    	
	    	ModelSearchVo searchVo = new ModelSearchVo();
	    	searchVo.setModelId(setDto.getModelId());
	    	searchVo.setModelTypeMtcd("data_type");
	    	searchVo.setDataArrayYn("Y");
	    	List<ModelPropertyInfoDto> dataTypeArrayList = modelPropertyMapper.selectModelPropertyInfoListByModelIdForNeo4j(searchVo);
	    	
	    	ListOrderedMap<String, Object> dataMap = metadataApiMapper.selectMetadataToJsonStrUnlimitedBySetId(setDto);
	    	
	    	for(int i=0; i<dataTypeArrayList.size(); i++) {
	    		String prptyId = dataTypeArrayList.get(i).getPrptyId();
	    		List<String> prptyList = new ArrayList<>();
	    		prptyList = (List) dataMap.get(prptyId);
	    		
	    		for(int j=0; j<medataSetMap.size(); j++) {
	    			if(prptyId.equals(medataSetMap.get(j))) {
	    				medataSetMap.setValue(j, prptyList.toString());
	    			}
	    		}
	    	}
	    	
	    	/*
	    	 	NEO4J에 JSON 형태로 저장 시, KEY에 큰따옴표가 존재하면 쿼리 에러가 발생하므로
	    	 	KEY의 큰따옴표를 제거한 후 toString 하는 작업을 진행함
	    	 	
	    	 	변환 예시)
		    	 		 {
						  metaModel: "AbcObject",
						  medataSetId: "~vCG3-AUuGrk-H_7hP-G1RItJ",
						  tags: null,
						  ...
						 }
	    	 */
	    	String formattedJsonString = "";
	    	try {
	    		ObjectMapper objectMapper = new ObjectMapper();
	    		String json = objectMapper.writeValueAsString(medataSetMap);
	    		JSONObject jsonObject = new JSONObject(json);
	    		for (String key : jsonObject.keySet()) {
		            Object value = jsonObject.get(key);
		            if (value instanceof JSONObject) {
		                String stringValue = ((JSONObject) value).toString().replaceAll("\"(\\w+)\":", "$1:");
		                jsonObject.put(key, stringValue);
		            }
    	        }
	    		formattedJsonString = jsonObject.toString().replaceAll("\"(\\w+)\":", "$1:");
	    	} catch (Exception e) {
	    		e.printStackTrace();
	    	}
	    	
	    	String uri = property.getUri();
	    	String username = property.getUsername();
	    	String password = property.getPassword();
	    	
	    	neo4jDriver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
	    	
			// 조회한 RDB 메타데이터 정보로 NEO4J에 데이터 추가 쿼리
			String importQuery = "UNWIND [" + formattedJsonString + "] AS data "
					           + "MERGE (n:medataResource {medataSetId: \"" + medataSetId + "\"}) "
							   + "ON CREATE SET n = data "
							   + "ON MATCH SET n = data "
							   + "WITH n, data.metaModel AS label "
							   + "CALL apoc.create.addLabels([id(n)], [label]) YIELD node "
							   + "RETURN node";

	    	ModelSearchVo paramVo = new ModelSearchVo();
	    	paramVo.setModelId(setDto.getModelId());
	    	paramVo.setModelTypeMtcd("object_type");
	    	List<ModelPropertyInfoDto> propertyList = modelPropertyMapper.selectModelPropertyInfoListByModelIdForNeo4j(paramVo);
	    	
	    	List<Object> prptyInfoList = new ArrayList<>();
	    	
	    	for(int i=0; i<propertyList.size(); i++) {
	    		String dataArrayYn = propertyList.get(i).getDataArrayYn();
	    		String prptyId = propertyList.get(i).getPrptyId();
	    		if("Y".equals(dataArrayYn)) {
	    			List<String> prptyList = new ArrayList<>();
	    			prptyList = (List) dataMap.get(prptyId);
	    			
	    			if(prptyList != null) {	    				
	    				for(int j=0; j<prptyList.size(); j++) {
	    					MetadataSetDto setPrptyDto = new MetadataSetDto();  
	    					setPrptyDto.setMedataSetId(prptyList.get(j));
	    					ListOrderedMap<String, Object> medataMap = metadataApiMapper.selectMetadataToJsonStrNoArrayBySetId(setPrptyDto);
	    					prptyInfoList.add(medataMap);
	    				}
	    			}
	    		}
	    		else if ("N".equals(dataArrayYn)) {
	    			String prpty = (String) dataMap.get(prptyId);
	    			MetadataSetDto setPrptyDto = new MetadataSetDto();  
					setPrptyDto.setMedataSetId(prpty);
					ListOrderedMap<String, Object> medataMap = metadataApiMapper.selectMetadataToJsonStrNoArrayBySetId(setPrptyDto);
	    			prptyInfoList.add(medataMap);
	    		}
	    	}
	    	
			try (Session session = neo4jDriver.session()) {
				session.writeTransaction(tx -> { // neo4j 트랜잭션
					// 조회한 RDB 메타데이터 정보로 NEO4J에 데이터 추가
					tx.run(importQuery);
					// 메타데이터의 프라퍼티 정보 추가
					for(int i=0; i<prptyInfoList.size(); i++) {
						/*
				    	 	NEO4J에 JSON 형태로 저장 시, KEY에 큰따옴표가 존재하면 쿼리 에러가 발생하므로
				    	 	KEY의 큰따옴표를 제거한 후 toString 하는 작업을 진행함
				    	 	
				    	 	변환 예시)
					    	 		 {
									  metaModel: "AbcObject",
									  medataSetId: "~vCG3-AUuGrk-H_7hP-G1RItJ",
									  tags: null,
									  ...
									 }
				    	 */
						String formattedJsonArrayString = "";
						Map<String, String> item = (Map<String, String>) prptyInfoList.get(i);
						String prptyMedataSetId = item.get("medataSetId");
						if(StringUtils.isNotEmpty(prptyMedataSetId)) {							
							try {
								ObjectMapper objectMapper = new ObjectMapper();
								String json = objectMapper.writeValueAsString(prptyInfoList.get(i));
								JSONObject jsonObject = new JSONObject(json);
								for (String key : jsonObject.keySet()) {
									Object value = jsonObject.get(key);
									if (value instanceof JSONObject) {
										String stringValue = ((JSONObject) value).toString().replaceAll("\"(\\w+)\":", "$1:");
										jsonObject.put(key, stringValue);
									}
								}
								formattedJsonArrayString = jsonObject.toString().replaceAll("\"(\\w+)\":", "$1:");
							} catch (Exception e) {
								e.printStackTrace();
							}
							// 메타데이터의 프라퍼티 정보 추가 쿼리
							String prptyImportQuery = "UNWIND [" + formattedJsonArrayString + "] AS data "
													+ "MERGE (n:medataResource {medataSetId: \"" + prptyMedataSetId + "\"}) "
													+ "ON CREATE SET n = data "
													+ "ON MATCH SET n = data "
													+ "WITH n, data.metaModel AS label "
													+ "CALL apoc.create.addLabels([id(n)], [label]) YIELD node "
													+ "RETURN node";
							tx.run(prptyImportQuery);
						}
					}
					
					// 관계(relation) 추가
					for(int i=0; i<propertyList.size(); i++) {
			    		String dataArrayYn = propertyList.get(i).getDataArrayYn();
			    		String prptyId = propertyList.get(i).getPrptyId();
			    		String relationImportQuery = "";
			    		if("Y".equals(dataArrayYn)) {
			    			List<String> prptyList = new ArrayList<>();
			    			prptyList = (List) dataMap.get(prptyId);
			    			
			    			if(prptyList != null) {	    				
			    				for(int j=0; j<prptyList.size(); j++) {
			    					// 관계(relation) 추가 쿼리
			    					relationImportQuery = "MATCH (a {medataSetId: \"" + medataSetId + "\"}), "
			    							            +       "(b {medataSetId: \"" + prptyList.get(j) + "\"}) "
			    							            + "MERGE (a)-[:" + prptyId + "]->(b)";
			    					tx.run(relationImportQuery);
			    				}
			    			}
			    		}
			    		else if ("N".equals(dataArrayYn)) {
			    			String prpty = (String) medataSetMap.get(prptyId);
			    			// 관계(relation) 추가 쿼리
			    			relationImportQuery = "MATCH (a {medataSetId: \"" + medataSetId + "\"}), "
									            +       "(b {medataSetId: \"" + prpty + "\"}) "
									            + "MERGE (a)-[:" + prptyId + "]->(b)";
			    			tx.run(relationImportQuery);
			    		}
			    	}
					return null;
				});
			}
	         
	        
	    } catch (ResBaseRuntimeException e) {
			log.error("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
	        log.error("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 실패/오류", e);
	        throw new ResBaseRuntimeException(e);
	    }
	    finally {	    	
	    	neo4jDriver.close();
	    }
	    
	    log.debug("[RDB 메타데이터 정보를 NEO4J에 저장 (RDB)] 서비스 종료");
	}   
	
	/**
	 * NEO4J 조회 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 15.
	 * @return
	 */	
	public String getNeo4jRdbMedata(Neo4jSearchVo searchVo) {
		log.debug("[NEO4J 조회 (RDB)] 서비스 시작");
		
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
		
		
		String jsonOutput = "";
		
	    String uri = property.getUri();
	    String username = property.getUsername();
	    String password = property.getPassword();
	    
	    // front-end neo4jd3.js에서 사용할 수 있도록 데이터를 가공
	    // 참고 : https://github.com/eisman/neo4jd3#d3js-data-format
	    neo4jDriver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
        try (Session session = neo4jDriver.session()) {

        	if("all".equals(searchVo.getSearchType())) {  
	    		// node(medataResource) 정보 조회
	    		String nodeQuery = "MATCH (n:medataResource) RETURN n LIMIT " + searchVo.getMatchLimit();
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
	    		
	    		// relationship(관계) 정보 조회
	    		String relationshipQuery = "MATCH p=(n:medataResource)-->() RETURN p LIMIT " + searchVo.getMatchLimit();
	    		Result relationshipResult = session.run(relationshipQuery);
	    		List<Map<String, Object>> outputRelationshipList = new ArrayList<>();
	    		while (relationshipResult.hasNext()) {
	    			org.neo4j.driver.Record record = relationshipResult.next();
	    			Path path = record.get("p").asPath();
	    			
	    			for (Path.Segment segment : path) {
	    				Relationship relationship = segment.relationship();
	    				Map<String, Object> outputItem = new HashMap<>();
	    				outputItem.put("id", relationship.id());
	    				outputItem.put("type", relationship.type());
	    				outputItem.put("startNode", relationship.startNodeId());
	    				outputItem.put("endNode", relationship.endNodeId());
	    				outputItem.put("properties", relationship.asMap());
	    				
	    				outputRelationshipList.add(outputItem);
	    			}
	    		}
	    		
	    		// node count 조회
	    		String nodeCountQuery = "MATCH (n:medataResource) RETURN COUNT(n) AS CNT LIMIT " + searchVo.getMatchLimit();
	    		Result nodeCountResult = session.run(nodeCountQuery);
	    		String nodeCount = "0";
	    		while (nodeCountResult.hasNext()) {
	    			org.neo4j.driver.Record record = nodeCountResult.next();
	    			nodeCount = record.get("CNT").toString();
	    		}
	    		
	    		Map<String, Object> outputItem = new HashMap<>();
	    		outputItem.put("nodecount", nodeCount);
	    		outputItem.put("nodes", outputNodeList);
	    		outputItem.put("relationships", outputRelationshipList);
	    		
	    		Map<String, Object> result = new HashMap<>();
	    		result.put("graph", outputItem);
	    		
	    		ObjectMapper objectMapper = new ObjectMapper();
	    		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
	    		objectMapper.setDateFormat(dateFormat);
	    		objectMapper.registerModule(new JavaTimeModule());
	    		jsonOutput = objectMapper.writeValueAsString(result);
        	}
        	
        	
        	if("medataSet".equals(searchVo.getSearchType())) {
    			String searchMedataSetId = searchVo.getMedataSetId();
    			
    			// medataSetId에 해당하는 node 조회 (기준 node)
    			String startNodeQuery = "MATCH (n:medataResource) "
    								  + "WHERE n.medataSetId = \"" + searchMedataSetId + "\" "
    								  + "RETURN n"; 
    			Result startNodeResult = session.run(startNodeQuery);
        		List<Map<String, Object>> outputNodeList = new ArrayList<>();
        		int startNodeCnt = 0;
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
        			startNodeCnt++;
        		}
    			
        		// 기준 node와 관계된 node 조회 (3단계까지 관계 조회)
        		String endNodeQuery = "MATCH (startNode:medataResource {medataSetId: \"" + searchMedataSetId + "\"}) "
			        				+ "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
			        				+ "RETURN relatedNode "
		        				    + "LIMIT " + searchVo.getMatchLimit();
        		Result endNodeResult = session.run(endNodeQuery);
    			while (endNodeResult.hasNext()) {
    				org.neo4j.driver.Record record = endNodeResult.next();
    				if(!record.get("relatedNode").isNull()) {
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
    			}
        		
        		// node relationship(관계) 정보 조회
        		String nodeRelationshipQuery = "MATCH (startNode:medataResource {medataSetId: \"" + searchMedataSetId + "\"}) "
        									 + "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
        									 + "RETURN path "
        									 + "LIMIT " + searchVo.getMatchLimit();
        		Result nodeRelationshipResult = session.run(nodeRelationshipQuery);
        		List<Map<String, Object>> outputRelationshipList = new ArrayList<>();
    			while (nodeRelationshipResult.hasNext()) {
    				org.neo4j.driver.Record record = nodeRelationshipResult.next();
    				if(!record.get("path").isNull()) {
    					Path path = record.get("path").asPath();
    					
    					for (Path.Segment segment : path) {
    						Relationship relationship = segment.relationship();
    						Map<String, Object> outputItem = new HashMap<>();
    						outputItem.put("id", relationship.id());
    						outputItem.put("type", relationship.type());
    						outputItem.put("startNode", relationship.startNodeId());
    						outputItem.put("endNode", relationship.endNodeId());
    						outputItem.put("properties", relationship.asMap());
    						
    						outputRelationshipList.add(outputItem);
    					}
    				}
    			}
        		
        		// node count 조회
        		String nodeCountQuery = "MATCH (startNode:medataResource {medataSetId: \"" + searchMedataSetId + "\"}) "
			        				  + "OPTIONAL MATCH path=(startNode)-[r*1..3]-(relatedNode) "
			        				  + "WITH DISTINCT relatedNode "
			        				  + "WHERE relatedNode IS NOT NULL "
			        				  + "RETURN COUNT(relatedNode) AS CNT "
		        				      + "LIMIT " + searchVo.getMatchLimit();
        		Result nodeCountResult = session.run(nodeCountQuery);
        		String nodeCount = "0";
	    		while (nodeCountResult.hasNext()) {
	    			org.neo4j.driver.Record record = nodeCountResult.next();
	    			int cnt = record.get("CNT").asInt()+startNodeCnt;
	    			nodeCount = Integer.toString(cnt);
	    		}
        		
        		Map<String, Object> outputItem = new HashMap<>();
        		outputItem.put("nodecount", nodeCount);
        		outputItem.put("nodes", outputNodeList);
        		outputItem.put("relationships", outputRelationshipList);
        		
        		Map<String, Object> result = new HashMap<>();
        		result.put("graph", outputItem);
        		
        		ObjectMapper objectMapper = new ObjectMapper();
        		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");
        		objectMapper.setDateFormat(dateFormat);
        		objectMapper.registerModule(new JavaTimeModule());
        		jsonOutput = objectMapper.writeValueAsString(result);
        	}

        } catch (Exception e) {
			log.error("[NEO4J 조회 (RDB)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);				
		}
		
		log.debug("[NEO4J 조회 (RDB)] 서비스 종료");
		return jsonOutput;		
	}
	
    /**
     * NEO4J 그래프 초기화 후 재등록 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 25.
     */
    public void initNeo4jRdbGraphAndAddDataAll() {
        log.debug("[NEO4J 그래프 초기화 후 재등록 (RDB)] 서비스 시작");
        
		try {
			if (!AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("그래프 초기화 후 재등록에 대한 권한이 없습니다.");
			}        
        
	    	this.initNeo4jRdbGraph();
	    	
	    	this.saveRdbMetadataSetListAll();
	    	
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
		
	    String uri = property.getUri();
	    String username = property.getUsername();
	    String password = property.getPassword();
	    
	    neo4jDriver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
        
    	/* 필요한 경우. neo4j 브라우저에서 실행
    	 * --제약 사항 설정 (Neo4j에 저장할 때 medataSetId가 중복되지 않도록 제약)
    	 * CREATE CONSTRAINT FOR (n:medataResource) REQUIRE n.medataSetId IS UNIQUE;
    	 */
    	
    	// 1. medataResource 전체 삭제 쿼리
		String deleteDataQuery = "MATCH (n:medataResource) DETACH DELETE n";
		
        try (Session session = neo4jDriver.session()) {
            session.writeTransaction(tx -> { // neo4j 트랜잭션
            	// 1. medataResource 전체 삭제
                tx.run(deleteDataQuery);
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
     * @param metadataSearchVo
     */
    @SuppressWarnings("unchecked")
	public void saveRdbMetadataSetListAll() {
        log.debug("[NEO4J 검색 메타데이터셋 전체 저장 (RDB)] 서비스 시작");    	
    	
		if (!AuthUtil.isSystemAdmin()) {
			throw new ResForbiddenException("NEO4J 전체 데이터 저장 권한이 없습니다.");
		}
		
    	MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
    	metadataSearchVo.setIsPaging(false); // TODO 모든 데이터를 조회시 LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
    	metadataSearchVo.setMedataSetSttusMtcd("use");
    	
    	SearchResultListVo listVo = metadataSetService.getMetadataSetList(metadataSearchVo);
    	if (listVo != null && listVo.getList() != null && listVo.getList().size() > 0) {
    		List<CamelCaseMap> list = (List<CamelCaseMap>) listVo.getList();
    		for (CamelCaseMap tMap : list) {
	    		this.saveToNeo4jByRdbMedataInfo(String.valueOf(tMap.get("medataSetId")));
    		}
    	}
        log.debug("[NEO4J 검색 메타데이터셋 전체 저장 (RDB)] 서비스 시작");    	
    }
    
	/**
	 * 셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)
	 * @Author      : tklee
	 * @Date        : 2023. 09. 25.
	 * @param 		medataSetId
	 */
    public void deleteNeo4jRdbMetadataSet(String medataSetId) {
        log.debug("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)] 서비스 시작");
        
        String uri = property.getUri();
	    String username = property.getUsername();
	    String password = property.getPassword();
	    
	    neo4jDriver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
        try {
			// 셋 ID에 해당하는 NEO4J 데이터 삭제 쿼리
			String deleteDataQuery = "MATCH (n:medataResource) "
								   + "WHERE n.medataSetId CONTAINS \"" + medataSetId + "\" "
								   + "DETACH DELETE n";
            try (Session session = neo4jDriver.session()) {
                session.writeTransaction(tx -> { // neo4j 트랜잭션
                	// 셋 ID에 해당하는 NEO4J 데이터 삭제
                    tx.run(deleteDataQuery);
                    return null;
                });
            } catch (Exception e) {
            	log.error("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)] 실패/오류", e);
            }
        		
        } catch (Exception e) {
            log.error("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)] 서비스 종료");
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
   
}
