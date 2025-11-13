package kr.co.n2m.platform.meta.rdf.virtuoso.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.rdfconnection.RDFConnection;
import org.apache.jena.sparql.exec.http.QueryExecutionHTTP;
import org.apache.jena.update.UpdateFactory;
import org.apache.jena.update.UpdateRequest;
import org.springframework.stereotype.Service;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.RdfCheckedException;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResForbiddenException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.DtmetaProperty;
import kr.co.n2m.platform.meta.architecture.property.SparqlProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingService;
import kr.co.n2m.platform.meta.rdf.property.service.RdfPropertyService;
import kr.co.n2m.platform.meta.rdf.rdfclass.service.RdfClassService;
import kr.co.n2m.platform.meta.rdf.schema.service.RdfSchemaService;
import kr.co.n2m.platform.meta.rdf.virtuoso.component.SparqlConnectionFactory;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.DtmetaSkolem;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModel;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModel.RdfModelMakeMode;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModelReqVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModelSettingVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfTripleLogVo;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.SparqlReqVo;
import kr.co.n2m.platform.meta.resource.category.service.CategoryService;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataApiService;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class VirtuosoService {

	// ===== 의존성 주입 (필요한 서비스들) =====
	private final RdfMappingService rdfMappingService;
	private final RdfTripleLogService rdfTripleLogService;
	private final MetadataSetService metadataSetService;
	private final MetadataApiService metadataApiService;
	private final ModelService modelService;
	private final RdfSchemaService rdfSchemaService;
	private final DtmetaProperty dtmetaProperty;
	private final RdfPropertyService rdfPropertyService;
	private final RdfClassService rdfClassService;
	private final CategoryService categoryService;

	// ===== Jena HTTP 커넥션 팩토리/설정 =====
	private final SparqlConnectionFactory connFactory;
	private final SparqlProperty sparqlProperty;

	@PostConstruct
	public void init() {
		// 기존 패턴 유지(필요 시 인터페이스로 치환 권장)
		metadataSetService.setVirtuosoService(this); // 순환참조 오류 방지
		rdfPropertyService.setVirtuosoService(this);
		rdfClassService.setVirtuosoService(this);
		categoryService.setVirtuosoService(this);
	}

	private String getGraphNameForDev() {
		return sparqlProperty.getDevGraphName();
	}

	private String getGraphNameForUse() {
		return sparqlProperty.getUseGraphName();
	}

	/**
	 * 버투소 Conductor URL
	 * @Author      : heenim
	 * @Date        : 2023. 08. 30.
	 * @return
	 */	
	public String getGraphConductorUrl() {
		return sparqlProperty.getConductorUrl();
	}

	/**
	 * 버투소 연결 테스트 (true/false) - ASK {}
	 * @Author      : heenim
	 * @Date        : 2023. 07. 06.
	 * @return
	 */	
	public boolean testConnectVirtuoso() {
		try (RDFConnection c = connFactory.newConn()) {
			return c.queryAsk("ASK {}");
		} catch (Exception e) {
			log.error("버투소 연결 ERROR : ", e);
			return false;
		}
	}

	/**
	 * RDF 모델로 변환된 문자열 조회
	 * @Author      : heenim
	 * @Date        : 2023. 07. 13.
	 * @param rdfModelReqVo
	 * @return
	 */
	public String getRdfModelStr(RdfModelReqVo rdfModelReqVo) {
		log.debug("[RDF 모델로 변환된 문자열 조회] 서비스 시작");
		
		RdfModel rdfModel = null;
		String rdfStr = "";		
		try {
			boolean isShowEmptyPrpty = "Y".equals(rdfModelReqVo.getEmptyPrptyShowYn());
			boolean isSettingEmptyNodeUri = "Y".equals(rdfModelReqVo.getEmptyNodeUriSettingYn());
			RdfModelMakeMode makeMode = RdfModelMakeMode.ALL_SUB_RESOURSE; // default
			if (StringUtils.isNotBlank(rdfModelReqVo.getRdfModelMakeMode())) {
				try {
					makeMode = RdfModelMakeMode.valueOf(rdfModelReqVo.getRdfModelMakeMode());
				} catch (Exception e1) {
					log.debug("RdfModelMakeMode 파라미터 오류 -> 기본값 설정 : {}", e1.getMessage());
				}
			}
			
			RdfModelSettingVo rdfModelSettingVo = new RdfModelSettingVo();
			rdfModelSettingVo.setShowEmptyPrpty(isShowEmptyPrpty);
			rdfModelSettingVo.setMakeMode(makeMode);
			rdfModelSettingVo.setSettingEmptyNodeUri(isSettingEmptyNodeUri);

			rdfModel = new RdfModel(rdfModelReqVo.getModelId(), rdfModelReqVo.getRdfFormMtcd());
			rdfModel.clearAndMakeRdfModel(rdfModelReqVo.getMedataSetId(), rdfModelSettingVo);
			if (StringUtils.isNotBlank(rdfModelReqVo.getRdfWriteLangMtcd())) {
				rdfStr = rdfModel.getRdfStrByWriteLangMtcd(rdfModelReqVo.getRdfWriteLangMtcd());
			} else {
				rdfStr = rdfModel.getRdfStr();
			}
			
		} catch (RdfCheckedException e) {
			log.error("[RDF 모델로 변환된 문자열 조회] 실패/오류 : {}", e.getReason());
			throw new ResBizInfoException("RDF 생성을 위한 정보가 없거나 올바르지 않습니다.");
        } catch (Exception e) {
            log.error("[RDF 모델로 변환된 문자열 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);			
		} finally {
			if (rdfModel != null) rdfModel.close();
		}
		
		log.debug("[RDF 모델로 변환된 문자열 조회] 서비스 종료");
		return rdfStr;		
	}

	/**
	 * DEV 그래프에 메타데이터 셋 정보 저장 (upsert)
	 * @Author      : heenim
	 * @Date        : 2023. 07. 25.
	 * @param medataSetId
	 * @param logRegrId
	 */
	public void saveRdfStatementsToGraphForDev(String medataSetId, String logRegrId) {
		log.debug("[DEV 그래프에 메타데이터 셋 정보 저장] 서비스 시작");
		this.saveMetadataSetToGraph(medataSetId, "dev", logRegrId);
		log.debug("[DEV 그래프에 메타데이터 셋 정보 저장] 서비스 종료");
	}

	/**
	 * USE 그래프에 메타데이터 셋 정보 저장 (upsert)
	 * @Author      : tklee
	 * @Date        : 2023. 08. 02.
	 * @param medataSetId
	 * @param logRegrId
	 */	
	public void saveRdfStatementsToGraphForUse(String medataSetId, String logRegrId) {
		log.debug("[USE 그래프에 메타데이터 셋 정보 저장] 서비스 시작");
		this.saveMetadataSetToGraph(medataSetId, "use", logRegrId);
		log.debug("[USE 그래프에 메타데이터 셋 정보 저장] 서비스 종료");
	}

	/**
	 * 그래프에 메타데이터 셋 정보 저장
	 * @param medataSetId
	 * @param graphType
	 * @param logRegrId
	 */
	public void saveMetadataSetToGraph(String medataSetId, String graphType, String logRegrId) {
		RdfModel rdfModel = null;
		try {
			MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
			if (setDto == null) throw new ResNotFoundException("메타데이터 셋 데이터가 존재하지 않습니다.");
			
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(setDto.getModelId());

			RdfModelSettingVo rdfModelSettingVo = new RdfModelSettingVo();
			rdfModelSettingVo.setShowEmptyPrpty(false);
			rdfModelSettingVo.setMakeMode(RdfModelMakeMode.CURR_RESOURCE);
			rdfModelSettingVo.setSettingEmptyNodeUri(false);

			rdfModel = new RdfModel(modelInfoDto.getModelId(), Constant.RDF_FORM_MTCD_DEFAULT);
			rdfModel.clearAndMakeRdfModel(medataSetId, rdfModelSettingVo);

			Model m = rdfModel.getModel(); // 모델 참조는 한 번만
			long tripleCount = m.size();
			if (tripleCount == 0) {
				log.warn("[그래프에 메타데이터 셋 정보 저장] 저장할 RDF 문이 없습니다! (model.size=0) medataSetId={}", medataSetId);
				return;
			}

			final String g = "use".equalsIgnoreCase(graphType) ? getGraphNameForUse() : getGraphNameForDev();
			final String subjectUri = metadataApiService.getMetadataSetIri(medataSetId);

			log.info("[그래프에 메타데이터 셋 정보 저장]  targetGraph={}, subject={}, triples={}", g, subjectUri, tripleCount);

			try (RDFConnection conn = connFactory.newConn()) {
				// 1. 기존데이터 삭제 (블랭크노드 cascade 포함)
				this.deleteSubjectAndPruneSkolemsAtomic(conn, g, subjectUri);

				// 2. 추가 저장 (URI는 유니크하기 때문에 upsert 된다)
				conn.load(g, m);

//				// 3) 즉시 검증 (subject 존재 여부)
//				boolean ok = askExists(conn, g, subjectUri);
//				if (!ok) {
//					log.error("[그래프에 메타데이터 셋 정보 저장] 검증 실패: subject가 그래프에 존재하지 않습니다. graph={}, subject={}", g, subjectUri);
//					// 필요시 예외
//					// throw new ResBaseRuntimeException("그래프 적재 검증 실패");
//				}

				// 트리플 로그 저장
				m.listStatements().forEachRemaining(st -> logTriple(st, "save", graphType, logRegrId));
			}
		} catch (RdfCheckedException e) {
			log.error("[그래프에 메타데이터 셋 정보 저장] 실패/오류 : {}", e.getReason());
			throw new ResBizInfoException("RDF 생성을 위한 정보가 없거나 올바르지 않습니다.");
        } catch (Exception e) {
            log.error("[그래프에 메타데이터 셋 정보 저장] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
		} finally {
			if (rdfModel != null) rdfModel.close();
		}
	}

//	/** subject가 그래프 g에 존재하는지 즉시 확인 */
//	private boolean askExists(RDFConnection conn, String graphIri, String subjectUri) {
//		ParameterizedSparqlString p = new ParameterizedSparqlString();
//		p.append("ASK { GRAPH ?g { ?s ?p ?o } }");
//		p.setIri("g", graphIri);
//		p.setIri("s", subjectUri);
//		return conn.queryAsk(p.asQuery());
//	}

	/**
	 * DEV 그래프에서 메타데이터 셋 정보 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 07. 25.
	 * @param medataSetId
	 * @param logRegrId
	 */
	public void deleteRdfStatementsFromGraphForDev(String medataSetId, String logRegrId) {
		log.debug("[DEV 그래프에서 메타데이터 셋 정보 삭제] 서비스 시작");
		this.deleteMetadataSetFromGraph(medataSetId, "dev", logRegrId);
		log.debug("[DEV 그래프에서 메타데이터 셋 정보 삭제] 서비스 종료");
	}

	/**
	 * USE 그래프에서 메타데이터 셋 정보 삭제
	 * @Author      : tklee
	 * @Date        : 2023. 08. 02.
	 * @param medataSetId
	 * @param logRegrId
	 */	
	public void deleteRdfStatementsFromGraphForUse(String medataSetId, String logRegrId) {
		log.debug("[USE 그래프에서 메타데이터 셋 정보 삭제] 서비스 시작");
		this.deleteMetadataSetFromGraph(medataSetId, "use", logRegrId);
		log.debug("[USE 그래프에서 메타데이터 셋 정보 삭제] 서비스 종료");
	}

	/**
	 * 그래프에서 메타데이터 셋 정보 삭제
	 * @param medataSetId
	 * @param graphType
	 * @param logRegrId
	 */	
	public void deleteMetadataSetFromGraph(String medataSetId, String graphType, String logRegrId) {
		try {
			String g = "use".equals(graphType) ? getGraphNameForUse() : getGraphNameForDev();
			String subjectUri = metadataApiService.getMetadataSetIri(medataSetId);
			
			// 삭제			
			boolean bDeleted = false;
			try (RDFConnection conn = connFactory.newConn()) {
				bDeleted = this.deleteSubjectAndPruneSkolemsAtomic(conn, g, subjectUri);
			}
			
	        // 트리플 로그 저장
	        if (bDeleted) this.logTripleSubject(subjectUri, "del", graphType, logRegrId);
	        
		} catch (Exception e) {
			log.error("[그래프 삭제] 실패", e);
			throw new ResBaseRuntimeException(e);
		}
	}

	/**
	 * medataSetId 의 IRI 가 주어인 모든 데이터 삭제. 목적어가 빈 노드가 라면 빈 노드 하위 데이터도 삭제.
	 */
	private boolean deleteSubjectAndPruneSkolemsAtomic(RDFConnection conn, String graphIri, String subjectUri) {
		try {
			this.deleteSubjectsAndPruneSkolemsAtomic(conn, graphIri, java.util.List.of(subjectUri));
	    	return true;    // 예외 없으면 성공
	    } catch (Exception e) {
	        // 필요하면 로그
	        log.error("[삭제 오류] graph={}, subject={}", graphIri, subjectUri, e);
	        return false;   // 예외 발생 = 실패
	    }	    	
	}
	
	/**
	 * 주어 IRI 목록 들의 모든 데이터 삭제. 목적어가 빈 노드가 라면 빈 노드 하위 데이터도 삭제.
	 * 
	 * 주어진 주어 IRI들에 대해 그래프 내 연결 트리플을 원자적으로 삭제한다.
	 * 절차: (1) 과거 BLANK 노드(옵션) 정리 
	 *    → (2) 주어의 outgoing 트리플 삭제 
	 *    → (3) 주어를 object로 참조하던 역참조 삭제
	 *    → (4) 우리 스코렘(prefixes) 중 이번 삭제로 고아가 된 리소스만 삭제
	 *    → (5) 임시 마킹 정리.
	 *
	 * @param conn               Jena RDFConnection (SPARQL Update 가능)
	 * @param graphIri           삭제 대상 그래프 IRI
	 * @param subjectUris        삭제할 주어 IRI 목록
	 */
	private void deleteSubjectsAndPruneSkolemsAtomic(
	        RDFConnection conn,
	        String graphIri,
	        List<String> subjectUris
	) {
	    // 임시 그래프 (트랜잭션 내 마킹용)
	    String tmpGraph = "urn:dtmeta:tmp:gc:" + UUID.randomUUID();

	    // VALUES 블록 만들기
	    StringBuilder valuesS = new StringBuilder("VALUES ?s { ");
	    for (String s : subjectUris) valuesS.append("<").append(s).append("> ");
	    valuesS.append("} ");

	    // VALUES 프리픽스 // 우리 시스템 스코렘 프리픽스 목록(예: DtmetaSkolem.prefixes())
	    StringBuilder valuesPref = new StringBuilder("VALUES ?pref { ");
	    for (String p : DtmetaSkolem.prefixes()) valuesPref.append("\"").append(p).append("\" ");
	    valuesPref.append("} ");

	    String sparql =
	        // 0) 삭제 후보 스코렘 마킹(임시 그래프에 기록)
	        "INSERT { GRAPH <" + tmpGraph + "> { ?k <urn:dtmeta:tmp:isCandidate> true } } WHERE { " +
	        "  GRAPH <" + graphIri + "> { " +
	        valuesS +
	        valuesPref +
	        "    ?s ?p ?k . FILTER( STRSTARTS(STR(?k), ?pref) ) " +
	        "  } " +
	        "} ; " +

	        // 1) 과거 BN 1~2홉 정리(옵션)
	        "DELETE { GRAPH <" + graphIri + "> { ?b ?p2 ?o2 } } " +
	        "WHERE  { GRAPH <" + graphIri + "> { " +
	        valuesS +
	        "         ?s ?p ?b . FILTER(isBlank(?b)) ?b ?p2 ?o2 " +
	        "       } " +
	        "} ; " +

	        "DELETE { GRAPH <" + graphIri + "> { ?b ?p2 ?o2 } } " +
	        "WHERE  { GRAPH <" + graphIri + "> { " +
	        valuesS +
	        "         ?s ?p ?x . FILTER(isBlank(?x)) ?x ?p1 ?b . FILTER(isBlank(?b)) ?b ?p2 ?o2 " +
	        "       } " +
	        "} ; " +

	        // 2) 주어 트리플 삭제 (outgoing)
	        "DELETE { GRAPH <" + graphIri + "> { ?s ?p ?o } } " +
	        "WHERE  { GRAPH <" + graphIri + "> { " +
	        valuesS +
	        "         ?s ?p ?o " +
	        "       } " +
	        "} ; " +

	        // 3) 주어를 object로 참조하던 역참조도 같이 삭제 (깨끗이)
	        "DELETE { GRAPH <" + graphIri + "> { ?x ?p ?s } } " +
	        "WHERE  { GRAPH <" + graphIri + "> { " +
	        valuesS +
	        "         ?x ?p ?s " +
	        "       } " +
	        "} ; " +

	        // 4) 마킹된 스코렘 중 진짜 고아만 삭제
	        //    고아 정의: 그래프 전체에서 어떤 triple의 object로도 더 이상 참조되지 않는 ?k
	        "DELETE { GRAPH <" + graphIri + "> { ?k ?pk ?ok } } " +
	        "WHERE  { GRAPH <" + tmpGraph + "> { ?k <urn:dtmeta:tmp:isCandidate> true } " +
	        "         GRAPH <" + graphIri + ">  { ?k ?pk ?ok } " +
	        "         FILTER NOT EXISTS { GRAPH <" + graphIri + "> { ?any ?anyP ?k } } " +
	        "} ; " +

	        // 5) 임시 그래프 정리
	        "CLEAR GRAPH <" + tmpGraph + ">";

	    UpdateRequest ur = UpdateFactory.create(sparql);
	    conn.update(ur);
	}	
	
	/**
	 * 그래프 초기화 후 재등록
	 * @Author      : heenim
	 * @Date        : 2023. 08. 28.
	 * @param graphType  (use / dev)
	 * @param logRegrId
	 */
	@SuppressWarnings("unchecked")
	public void initGraph(String graphType, String logRegrId) {
		log.debug("[그래프 초기화 후 재등록] 시작 - {}", graphType);
		try {
			if (!AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("그래프 초기화 후 재등록에 대한 권한이 없습니다.");
			}
			
			String g = getGraphNameForUse(); // 기존 로직 유지(필요 시 dev/use 분기)

			// 전체 삭제
			try (RDFConnection conn = connFactory.newConn()) {
				conn.update("CLEAR GRAPH <" + g + ">");
			}

			// RDF 네임스페이스 등록
			this.saveRdfNsToGraph(graphType, logRegrId);
			
			// 카테고리 등록
			this.saveRdfSkosToGraph(graphType, logRegrId);

			// 메타데이터 셋 전제 조회 후 각각 등록
			MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
	    	metadataSearchVo.setIsPaging(false); // TODO 모든 데이터를 조회시 LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
	    	if ("use".equals(graphType)) {
	    		metadataSearchVo.setMedataSetSttusMtcd("use");
	    	}

			SearchResultListVo listVo = metadataSetService.getMetadataSetList(metadataSearchVo);
	    	if (listVo != null && listVo.getList() != null && listVo.getList().size() > 0) {
	    		List<CamelCaseMap> list = (List<CamelCaseMap>) listVo.getList();
	    		for (CamelCaseMap tMap : list) {
	    			// 메타데이터 셋 별 등록
		    		this.saveMetadataSetToGraph((String) tMap.get("medataSetId"), graphType, logRegrId);
	    		}
	    	}
		} catch (ResBaseRuntimeException e) {
			log.info("[그래프 초기화 후 재등록] - {} 실패/오류 (정보성) : {}", graphType, e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[그래프 초기화 후 재등록] - {} 실패/오류", graphType, e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[그래프 초기화 후 재등록] 서비스 종료 - {}", graphType);
	}	

	/**
	 * SPARQL 쿼리 실행
	 * @Author      : heenim
	 * @Date        : 2023. 11. 08.
	 * @param sparqlReqVo
	 * @return
	 */	
	@SuppressWarnings("rawtypes")
	public Map executeSparqlQuery(SparqlReqVo sparqlReqVo) {
		log.debug("[SPARQL 쿼리 실행] 서비스 시작");
		Map<String, Object> resMap = new HashMap<>();
		try {
			
			if (StringUtils.isBlank(sparqlReqVo.getQuery())) { throw new ResBadRequestException("query" + ValueUtil.required()); }
			if (StringUtils.isBlank(sparqlReqVo.getResultFormat())) sparqlReqVo.setResultFormat("html");
			
			String endpoint = sparqlProperty.getQueryEndpoint();
			String auth = connFactory.basicAuthHeader(); // 팩토리에 만들어 둔 Basic 헤더 반환 메서드

			QueryExecution qexec;
			if (StringUtils.isBlank(auth)) {
				qexec = QueryExecutionHTTP.service(endpoint).query(sparqlReqVo.getQuery())
						.timeout(sparqlReqVo.getTimeoutMillis(), TimeUnit.MILLISECONDS).build();
			} else {
				qexec = QueryExecutionHTTP.service(endpoint).query(sparqlReqVo.getQuery()).httpHeader("Authorization", auth) // 헤더가 있을 때만 부착
						.timeout(sparqlReqVo.getTimeoutMillis(), TimeUnit.MILLISECONDS).build();
			}

			try (qexec) {
				// SPARQL 쿼리 실행
				log.debug("[SPARQL] {}", sparqlReqVo.getQuery());				
				ResultSet rs = qexec.execSelect();
	
				List<String> headers = new ArrayList<>(rs.getResultVars());
				headers.remove("graph");
				resMap.put("headers", headers);
	
				List<Map> dataList = new ArrayList<>();
				while (rs.hasNext()) {
					QuerySolution sol = rs.nextSolution();
					
		        	Map<String, Object> dataMap = new HashMap<>();
		        	for (String var : headers) {
		        		RDFNode valNode = sol.get(var);
		        		Object valObj = this.getResultVal(sparqlReqVo.getResultFormat(), valNode);
		        		//log.debug("[SPARQL result] {} = {}  =>  {}", var, valNode, valObj);
		        		dataMap.put(var, valObj);
		        	}
		        	dataList.add(dataMap);
				}
				resMap.put("dataList", dataList);
			}
			
		} catch (ResBaseRuntimeException e) {
			log.info("[SPARQL 쿼리 실행] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[SPARQL 쿼리 실행] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[SPARQL 쿼리 실행] 서비스 종료");
		return resMap;		
	}

	private Object getResultVal(String resultFormat, RDFNode valNode) {
		if ("html".equals(resultFormat)) {
			if (valNode.isLiteral()) {
				return valNode.asLiteral().getString();
			} else if (valNode.asResource().getURI() != null) {
				return "<a href=\"" + valNode.asResource().getURI() + "\">" + valNode.asResource().getURI() + "</a>";
			} else {
				return valNode.toString();
			}
		}
		return valNode.toString();
	}

	/**
	 * 그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장 (전체 삭제 후 등록)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
	 * @param graphType  (use/dev)
	 * @param logRegrId
	 */
	public void saveRdfNsToGraph(String graphType, String logRegrId) {
		log.debug("[그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장] 서비스 시작");
		Model model = null;
		
		try {
			String ketidtNs = dtmetaProperty.getRdfSchemaBaseUrl();
			model = rdfSchemaService.createRdfNsTtlModel();
			
			String g = "use".equals(graphType) ? getGraphNameForUse() : getGraphNameForDev();

			try (RDFConnection conn = connFactory.newConn()) {
				
				// 1. 기존데이터 삭제
				ParameterizedSparqlString p = new ParameterizedSparqlString();
				p.append("DELETE { GRAPH ?g { ?s ?p ?o } } ");
				p.append("WHERE  { GRAPH ?g { ?s ?p ?o . ");
				p.append("                 FILTER (STRSTARTS(STR(?s), ?ns)) "); // 접두 매칭
				p.append("         } }");
				p.setIri("g", g);
				p.setLiteral("ns", ketidtNs);

				String sparql = p.asUpdate().toString();
				log.debug("[SPARQL] {}", sparql);
				
				// SPARQL 쿼리 실행
				UpdateRequest delReq = p.asUpdate();
				conn.update(delReq);

	            // 트리플 로그 저장
	            this.logTripleForDel("FILTER (STRSTARTS(STR(?s), \"" + ketidtNs + "\"))", graphType, logRegrId);

				if (!model.isEmpty()) {
					// 2. 추가 저장
					conn.load(g, model);
					
					// 트리플 로그 저장
					model.listStatements().forEachRemaining(st -> logTriple(st, "save", graphType, logRegrId));
				} else {
					log.warn("[그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장] 저장할 트리플 없음");
				}
			}
			
        } catch (Exception e) {
            log.error("[그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
		} finally {
			if (model != null) model.close();
		}
		
		log.debug("[그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장] 서비스 종료");
	}

	/**
	 * 그래프에 RDF 클래스/프라퍼티 정보 저장 (시스템에서 정의한 RDF, 삭제 후 등록)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
	 * @param subjectUri
	 * @param logRegrId
	 */
	public void saveRdfNsToGraphByUriForUse(String subjectUri, String logRegrId) {
		saveRdfNsToGraphByUri(subjectUri, "use", false, logRegrId);
	}

	/**
	 * 그래프에 RDF 클래스/프라퍼티 정보 삭제 (시스템에서 정의한 RDF)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
	 * @param subjectUri
	 * @param logRegrId
	 */
	public void deleteRdfNsToGraphByUriForUse(String subjectUri, String logRegrId) {
		saveRdfNsToGraphByUri(subjectUri, "use", true, logRegrId);
	}

	/**
	 * 그래프에 RDF 클래스/프라퍼티 정보 저장 (시스템에서 정의한 RDF, 삭제 후 등록)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
	 * @param subjectUri
	 * @param graphType
	 * @oaram isOnlyDel
	 * @param logRegrId
	 */	
	private void saveRdfNsToGraphByUri(String subjectUri, String graphType, boolean onlyDelete, String logRegrId) {
		log.debug("[그래프에 RDF 클래스/프라퍼티 정보 저장] 서비스 시작");
		Model model = null;
		
		try {
			String g = "use".equals(graphType) ? getGraphNameForUse() : getGraphNameForDev();

			try (RDFConnection conn = connFactory.newConn()) {
				
				// 1. 기존데이터 삭제
				// DELETE WHERE { GRAPH ?g { ?s ?p ?o } }
				ParameterizedSparqlString p = new ParameterizedSparqlString();
				p.append("DELETE WHERE { GRAPH ?g { ?s ?p ?o } }");
				p.setIri("g", g);
				p.setIri("s", subjectUri);
				
				String sparql = p.asUpdate().toString();
				log.debug("[SPARQL] {}", sparql);
				
				// SPARQL 쿼리 실행
				UpdateRequest delReq = p.asUpdate();
				conn.update(delReq);

	            // 트리플 로그 저장
	            this.logTripleSubject(subjectUri, "del", graphType, logRegrId);

	            //2. 추가 저장
				if (!onlyDelete) {
					model = rdfSchemaService.createRdfNsTtlModel();
					Resource sbjtRi = model.getResource(subjectUri);
					StmtIterator it = sbjtRi.listProperties();
					if (!it.hasNext()) {
						log.warn("[[그래프에 RDF 클래스/프라퍼티 정보 저장] 저장할 RDF 문이 없습니다!");
					} else {
						// 그래프에 추가 (URI는 유니크하기 때문에 upsert 된다)
						conn.load(g, model);

						// 트리플 로그 저장
						it = sbjtRi.listProperties();
						while (it.hasNext()) {
							logTriple(it.nextStatement(), "save", graphType, logRegrId);
						}
					}
				}
			}
			
        } catch (Exception e) {
            log.error("[[그래프에 RDF 클래스/프라퍼티 정보 저장] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
		} finally {
			if (model != null) model.close();
		}
		
		log.debug("[[그래프에 RDF 클래스/프라퍼티 정보 저장] 서비스 종료");
	}

	/**
	 * 그래프에 시스템에서 정의한 카테고리 정보 저장 (전체 삭제 후 등록)
	 * @Author      : tklee
	 * @Date        : 2023. 11. 14.
	 * @param graphType  (use/dev)
	 * @param logRegrId
	 */
	public void saveRdfSkosToGraph(String graphType, String logRegrId) {
		log.debug("[그래프에 시스템에서 정의한 카테고리 정보 저장] 서비스 시작");
		Model model = null;
		
		try {
			String ketidtSkos = dtmetaProperty.getRdfSchemaSkosUrl();
			model = rdfSchemaService.createRdfSkosTtlModel();
			
			String g = "use".equals(graphType) ? getGraphNameForUse() : getGraphNameForDev();

			try (RDFConnection conn = connFactory.newConn()) {
				
				// 1. 기존데이터 삭제
				ParameterizedSparqlString p = new ParameterizedSparqlString();
				p.append("DELETE { GRAPH ?g { ?s ?p ?o } } ");
				p.append("WHERE  { GRAPH ?g { ?s ?p ?o . ");
				p.append("                 FILTER( STRSTARTS(STR(?s), ?ns) ) "); // 접두 매칭
				p.append("         } }");
				p.setIri("g", g);
				p.setLiteral("ns", ketidtSkos);
				
				String sparql = p.asUpdate().toString();
				log.debug("[SPARQL] {}", sparql);
				
				// SPARQL 쿼리 실행
				UpdateRequest delReq = p.asUpdate();
				conn.update(delReq);

	            // 트리플 로그 저장
	            this.logTripleForDel("FILTER (STRSTARTS(STR(?s), \"" + ketidtSkos + "\"))", graphType, logRegrId);

	            // 2. 추가 저장
				if (!model.isEmpty()) {
					// 그래프에 추가 (URI는 유니크하기 때문에 upsert 된다)
					conn.load(g, model);
					
					// 트리플 로그 저장
					StmtIterator it = model.listStatements();
					while (it.hasNext()) {
						logTriple(it.nextStatement(), "save", graphType, logRegrId);
					}
				} else {
					log.warn("[그래프에 시스템에서 정의한 카테고리 정보 저장] 저장할 RDF 문이 없습니다!");
				}
			}
			
        } catch (Exception e) {
            log.error("[그래프에 시스템에서 정의한 카테고리 정보 저장] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
		} finally {
			if (model != null) model.close();
		}
		
		log.debug("[그래프에 시스템에서 정의한 카테고리 정보 저장] 서비스 종료");
	}

	/**
	 * 그래프에 카테고리 정보 저장 (시스템에서 정의한 RDF, 삭제 후 등록)
	 * @Author      : tklee
	 * @Date        : 2023. 11. 14.
	 * @param subjectUri
	 * @param logRegrId
	 */
	public void saveRdfSkosToGraphByUriForUse(String subjectUri, String logRegrId) {
		this.saveRdfSkosToGraphByUri(subjectUri, "use", false, logRegrId);
	}

	/**
	 * 그래프에 카테고리 정보 삭제 (시스템에서 정의한 RDF)
	 * @Author      : tklee
	 * @Date        : 2023. 11. 14.
	 * @param subjectUri
	 * @param logRegrId
	 */	
	public void deleteRdfSkosToGraphByUriForUse(String subjectUri, String logRegrId) {
		this.saveRdfSkosToGraphByUri(subjectUri, "use", true, logRegrId);
	}

	/**
	 * 그래프에 카테고리 정보 저장 (시스템에서 정의한 RDF, 삭제 후 등록)
	 * @Author      : tklee
	 * @Date        : 2023. 11. 14.
	 * @param subjectUri
	 * @param graphType
	 * @oaram isOnlyDel
	 * @param logRegrId
	 */	
	private void saveRdfSkosToGraphByUri(String subjectUri, String graphType, boolean onlyDelete, String logRegrId) {
		log.debug("[그래프에 카테고리 정보 저장] 서비스 시작");
		Model model = null;
		
		try {
			String g = "use".equals(graphType) ? getGraphNameForUse() : getGraphNameForDev();
			
			try (RDFConnection conn = connFactory.newConn()) {

				// 1. 기존데이터 삭제
				// DELETE WHERE { GRAPH ?g { ?s ?p ?o } }
				ParameterizedSparqlString p = new ParameterizedSparqlString();
				p.append("DELETE WHERE { GRAPH ?g { ?s ?p ?o } }");
				p.setIri("g", g);
				p.setIri("s", subjectUri);
				
				String sparql = p.asUpdate().toString();
				log.debug("[SPARQL] {}", sparql);
				
				// SPARQL 쿼리 실행
				UpdateRequest delReq = p.asUpdate();
				conn.update(delReq);

	            // 트리플 로그 저장
	            this.logTripleSubject(subjectUri, "del", graphType, logRegrId);

	            // 2. 추가 저장
				if (!onlyDelete) {
					model = rdfSchemaService.createRdfSkosTtlModel();

					// 주어진 subject가 모델에 존재하는지 확인
					Resource sbjtRi = model.getResource(subjectUri);
					StmtIterator it = sbjtRi.listProperties();
					if (!it.hasNext()) {
						log.warn("[그래프에 카테고리 정보 저장] 저장할 RDF 문이 없습니다!");
					} else {
						// 그래프에 추가 (URI는 유니크하기 때문에 upsert 된다)
						conn.load(g, model);

						// 트리플 로그 저장
						it = sbjtRi.listProperties();
						while (it.hasNext()) {
							this.logTriple(it.nextStatement(), "save", graphType, logRegrId);
						}

						/*
						 * // [대안] 필요한 subject의 트리플만 적재하고 싶다면 얇은 모델(thin)로 로드: Model thin =
						 * ModelFactory.createDefaultModel(); it = sbjtRi.listProperties(); while
						 * (it.hasNext()) thin.add(it.nextStatement()); conn.load(g, thin); it =
						 * thin.listStatements(); while (it.hasNext()) logTriple(it.nextStatement(),
						 * "save", graphType, logRegrId);
						 */
					}
				}
			}
			
        } catch (Exception e) {
            log.error("[그래프에 카테고리 정보 저장] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
		} finally {
			if (model != null) model.close();
		}
		
		log.debug("[그래프에 카테고리 정보 저장] 서비스 종료");
	}

	// ===== 트리플 로그 =====
	/**
	 * 트리플 로그 저장 (별도 트랜잭션)
	 */	
	private void logTriple(Statement stmt, String logDivMtcd, String graphType, String logRegrId) {
		try {
			String sbjtRi = stmt.getSubject().toString();
			if (stmt.getSubject().getNameSpace() != null) sbjtRi = "<" + sbjtRi + ">";
			else sbjtRi = "_:" + sbjtRi;

			String predctRi = stmt.getPredicate().toString();
			if (stmt.getPredicate().getNameSpace() != null)	predctRi = "<" + predctRi + ">";

			String objtRi = stmt.getObject().toString();
			if (stmt.getObject().isURIResource()) objtRi = "<" + objtRi + ">";
			else if (stmt.getObject().isAnon())	objtRi = "_:" + objtRi;
			else {
				objtRi = stmt.getObject().asNode().toString(true);
				String dtypeUri = stmt.getObject().asNode().getLiteralDatatypeURI();
				if (dtypeUri != null)
					objtRi = objtRi.replace(dtypeUri, "<" + dtypeUri + ">");
			}
			
			//log.debug("[Triple Log] {} {} {} {}", logDivMtcd, sbjtRi, predctRi, objtRi); // TODO 나중에 주석처리.			

			RdfTripleLogVo logVo = new RdfTripleLogVo();
			logVo.setSbjtRi(sbjtRi);
			logVo.setPredctRi(predctRi);
			logVo.setObjtRi(objtRi);
			logVo.setLogDivMtcd(logDivMtcd);
			logVo.setLogRegrId(logRegrId);
			logVo.setLogStoreLoNm("use".equals(graphType) ? getGraphNameForUse() : getGraphNameForDev());
			rdfTripleLogService.createRdfTripleLog(logVo);
		} catch (Exception e) {
			log.error("[Triple Log] 실패/오류. 무시 : {}", e.getMessage());
		}
	}

	/**
	 * 트리플 로그 저장 (별도 트랜잭션)
	 */	
	private void logTripleSubject(String subjectUri, String logDivMtcd, String graphType, String logRegrId) {
		try {
			RdfTripleLogVo logVo = new RdfTripleLogVo();
			logVo.setSbjtRi("<" + subjectUri + ">");
			logVo.setLogDivMtcd(logDivMtcd);
			logVo.setLogRegrId(logRegrId);
			logVo.setLogStoreLoNm("use".equals(graphType) ? getGraphNameForUse() : getGraphNameForDev());
			rdfTripleLogService.createRdfTripleLog(logVo);
		} catch (Exception e) {
			log.error("[Triple Log] 실패/오류. 무시 : {}", e.getMessage());
		}
	}

	/**
	 * 트리플 로그 저장 (별도 트랜잭션)
	 */	
	private void logTripleForDel(String subject, String graphType, String logRegrId) {
		try {
			RdfTripleLogVo logVo = new RdfTripleLogVo();
			logVo.setSbjtRi(subject);
			logVo.setLogDivMtcd("del");
			logVo.setLogRegrId(logRegrId);
			logVo.setLogStoreLoNm("use".equals(graphType) ? getGraphNameForUse() : getGraphNameForDev());
			rdfTripleLogService.createRdfTripleLog(logVo);
		} catch (Exception e) {
			log.error("[Triple Log] 실패/오류. 무시 : {}", e.getMessage());
		}
	}
}
