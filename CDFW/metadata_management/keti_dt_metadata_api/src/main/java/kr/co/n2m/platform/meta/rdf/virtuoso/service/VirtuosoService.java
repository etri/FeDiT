package kr.co.n2m.platform.meta.rdf.virtuoso.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.commons.lang3.StringUtils;
import org.apache.jena.graph.Triple;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.springframework.beans.factory.annotation.Autowired;
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
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingService;
import kr.co.n2m.platform.meta.rdf.property.service.RdfPropertyService;
import kr.co.n2m.platform.meta.rdf.rdfclass.service.RdfClassService;
import kr.co.n2m.platform.meta.rdf.schema.service.RdfSchemaService;
import kr.co.n2m.platform.meta.rdf.virtuoso.component.VirtuosoComponent;
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
import lombok.extern.slf4j.Slf4j;
import virtuoso.jena.driver.VirtGraph;
import virtuoso.jena.driver.VirtuosoQueryExecution;
import virtuoso.jena.driver.VirtuosoQueryExecutionFactory;
import virtuoso.jena.driver.VirtuosoUpdateFactory;
import virtuoso.jena.driver.VirtuosoUpdateRequest;

@Slf4j
@Service
public class VirtuosoService extends VirtuosoComponent {
	
	@Autowired
	RdfMappingService rdfMappingService;
	
	@Autowired
	RdfTripleLogService rdfTripleLogService;
	
	@Autowired
	MetadataSetService metadataSetService;
	
	@Autowired
	MetadataApiService metadataApiService;
	
	@Autowired
	ModelService modelService;
	
	@Autowired
	RdfSchemaService rdfSchemaService;
	
	@Autowired
	DtmetaProperty dtmetaProperty;
	
	@Autowired
	RdfPropertyService rdfPropertyService;
	
	@Autowired
	RdfClassService rdfClassService;
	
	@Autowired
	CategoryService categoryService;
	
	@PostConstruct
	public void init() {
		metadataSetService.setVirtuosoService(this); // 순환참조 오류 방지
		rdfPropertyService.setVirtuosoService(this);
		rdfClassService.setVirtuosoService(this);
		categoryService.setVirtuosoService(this);
	}
	
	/**
	 * 버투소 Conductor URL
	 * @Author      : heenim
	 * @Date        : 2023. 08. 30.
	 * @return
	 */
	public String getGraphConductorUrl() {
		return super.getConductorUrl();
	}

	/**
	 * 버투소 연결 테스트 (true/false)
	 * @Author      : heenim
	 * @Date        : 2023. 07. 06.
	 * @return
	 */
	public boolean testConnectVirtuoso() {
		VirtGraph graph = null;
		try {
			graph = this.getNewVirtGraphForDev();
		} catch (Exception e) {
			log.error("버투소 연결 ERROR : ", e);
		}
		return (graph != null);
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
		saveMetadataSetToGraph(medataSetId, "dev", logRegrId);
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
		saveMetadataSetToGraph(medataSetId, "use", logRegrId);
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
			StmtIterator iterator = rdfModel.listStatements();
			if (!iterator.hasNext()) {
				log.warn("[그래프에 메타데이터 셋 정보 저장] 저장할 RDF 문이 없습니다!");
				return;
			}
			
			VirtGraph virtGraph = null;
			try {
				if ("use".equals(graphType)) {					
					virtGraph = this.getNewVirtGraphForUse();
				} else {				
					virtGraph = this.getNewVirtGraphForDev();
				}
				
				virtGraph.getTransactionHandler().begin(); // graph transaction
				
				// 1. 기존데이터 삭제
				this.deleteMetadataSetFromGraph(virtGraph, medataSetId, graphType, logRegrId);
				
				// 2. 추가 저장
				while (iterator.hasNext()) {
					Statement stmt = iterator.nextStatement();
					
					// 그래프에 추가 (URI는 유니크하기 때문에 upsert 된다)
					Triple triple = stmt.asTriple();
					virtGraph.performAdd(triple);

					// 트리플 로그 저장
					this.logTriple(stmt, "save", graphType, logRegrId);
				}
				
				virtGraph.getTransactionHandler().commit(); // graph transaction
				
	        } catch (Exception e) {
	            log.error("[그래프에 메타데이터 셋 정보 저장] 실패/오류 (graph)", e);
	            virtGraph.getTransactionHandler().abort(); // graph transaction rollback
	            throw e;
			} finally {
				if (virtGraph != null) virtGraph.close();
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

	
	/**
	 * DEV 그래프에서 메타데이터 셋 정보 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 07. 25.
	 * @param medataSetId
	 * @param logRegrId
	 */
	public void deleteRdfStatementsFromGraphForDev(String medataSetId, String logRegrId) {
		log.debug("[DEV 그래프에서 메타데이터 셋 정보 삭제] 서비스 시작");
		deleteMetadataSetFromGraph(medataSetId, "dev", logRegrId);
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
		deleteMetadataSetFromGraph(medataSetId, "use", logRegrId);
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
			VirtGraph virtGraph = null;
			try {
				if ("use".equals(graphType)) {					
					virtGraph = this.getNewVirtGraphForUse();
				} else {				
					virtGraph = this.getNewVirtGraphForDev();
				}
				
				virtGraph.getTransactionHandler().begin(); // graph transaction
				
				// 삭제
				this.deleteMetadataSetFromGraph(virtGraph, medataSetId, graphType, logRegrId);
		        
				virtGraph.getTransactionHandler().commit(); // graph transaction
				
	        } catch (Exception e) {
	            log.error("[그래프에서 메타데이터 셋 정보 삭제] 실패/오류 (graph)", e);
	            virtGraph.getTransactionHandler().abort(); // graph transaction
	            throw e;
			} finally {
				if (virtGraph != null) virtGraph.close();
			}
        } catch (Exception e) {
            log.error("[그래프에서 메타데이터 셋 정보 삭제] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
	}
	
	/**
	 * medataSetId 의 IRI 가 주어인 모든 데이터 삭제. 목적어가 빈 노드가 라면 빈 노드 하위 데이터도 삭제.
	 * @param virtGraph
	 * @param medataSetId
	 * @param graphType
	 * @param logRegrId
	 */
	private void deleteMetadataSetFromGraph(VirtGraph virtGraph, String medataSetId, String graphType, String logRegrId) {
		String subjectUri = metadataApiService.getMetadataSetIri(medataSetId);
		
		// 삭제
		boolean bDeleted = this.deleteAllBySubjectFromGraph(virtGraph, subjectUri);
        
        // 트리플 로그 저장
        if (bDeleted) this.logTripleSubject(subjectUri, "del", graphType, logRegrId);        
	}	
	
	private boolean deleteAllBySubjectFromGraph(VirtGraph virtGraph, String subjectUri) {
		boolean bDeleted = false;
		
		// 1. 목적어가 빈 노드인 경우, 목적어를 주어로 하는 관련 데이터 삭제
		String sparqlQuery1 = 
			    "SELECT distinct ?o "
			    + "WHERE { ?s ?p ?o . "
			    + "  FILTER (CONTAINS(str(?s), \"" + subjectUri + "\")) "
			    + "}";
		
		// SPARQL 쿼리 실행
        VirtuosoQueryExecution vqe1 = VirtuosoQueryExecutionFactory.create(sparqlQuery1, virtGraph);
		ResultSet results1 = vqe1.execSelect();
		log.debug("[SPARQL] {}", sparqlQuery1);
		
        while (results1.hasNext()) {
        	QuerySolution sol = results1.nextSolution();        	
            RDFNode objectNode  = sol.get("o");
            
            if (objectNode.isAnon()) {
            	String objectUri = objectNode.toString();
            	log.debug("{} - {} isAnon.", subjectUri, objectUri);
            	// recursive call
            	boolean bSubDeleted = this.deleteAllBySubjectFromGraph(virtGraph, objectUri);
            	if (bSubDeleted) bDeleted = true;
            }
        }
		
        // 2. 주어 관련 데이터 전체 삭제
		String sparqlQuery = 
			    "SELECT distinct ?s "
			    + "WHERE { ?s ?p ?o . "
			    + "  FILTER (CONTAINS(str(?s), \"" + subjectUri + "\")) "
			    + "}";
		
		// SPARQL 쿼리 실행
        VirtuosoQueryExecution vqe = VirtuosoQueryExecutionFactory.create(sparqlQuery, virtGraph);
		ResultSet results = vqe.execSelect();
		log.debug("[SPARQL] {}", sparqlQuery);
		
        while (results.hasNext()) {
        	QuerySolution sol = results.nextSolution();
        	RDFNode subjectNode = sol.get("s");
        	RDFNode graphNode   = sol.get("graph");

            // subject, graph를 String으로 변환
            String subject = subjectNode.toString();
            String graph   = graphNode.toString();

            // 삭제 쿼리
            String sparqlDelQuery = "DELETE WHERE "
            						+ "{ GRAPH <" + graph + "> "
            						+ "  { <" + subject + "> ?p ?o . } "
    								+ "}";
            // SPARQL 쿼리 실행
            VirtuosoUpdateRequest vur = VirtuosoUpdateFactory.create(sparqlDelQuery, virtGraph);
            vur.exec();
            log.debug("[SPARQL] {}", sparqlDelQuery);
            bDeleted = true;
        }
        
        return bDeleted;
	}
	
	
	/**
	 * 트리플 로그 저장 (별도 트랜잭션)
	 */
	private void logTriple(Statement stmt, String logDivMtcd, String graphType, String logRegrId) {
		try {
			String sbjtRi = stmt.getSubject().toString();
			if (stmt.getSubject().getNameSpace() != null) sbjtRi = "<" + sbjtRi + ">";
			else sbjtRi = "_:" + sbjtRi;
			
			String predctRi = stmt.getPredicate().toString();
			if (stmt.getPredicate().getNameSpace() != null) predctRi = "<" + predctRi + ">";
			
			String objtRi = stmt.getObject().toString();
			if (stmt.getObject().isURIResource()) objtRi = "<" + objtRi + ">";
			else if (stmt.getObject().isAnon()) objtRi = "_:" + objtRi;
			else {
				objtRi = stmt.getObject().asNode().toString(true);
				String dtypeUri = stmt.getObject().asNode().getLiteralDatatypeURI();
				if (dtypeUri != null) {
					objtRi = objtRi.replace(dtypeUri, "<" + dtypeUri + ">");
				}
			}
			
			//log.debug("[Triple Log] {} {} {} {}", logDivMtcd, sbjtRi, predctRi, objtRi); // TODO 나중에 주석처리.
			
			RdfTripleLogVo logVo = new RdfTripleLogVo();
			logVo.setSbjtRi(sbjtRi);
			logVo.setPredctRi(predctRi);
			logVo.setObjtRi(objtRi);
			logVo.setLogDivMtcd(logDivMtcd);
			logVo.setLogRegrId(logRegrId);
			if ("use".equals(graphType)) {
				logVo.setLogStoreLoNm(this.getGraphNameForUse());
			} else {			
				logVo.setLogStoreLoNm(this.getGraphNameForDev());
			}
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
			String sbjtRi = "<" + subjectUri + ">";
			
			//log.debug("[Triple Log] {} {}", logDivMtcd, sbjtRi); // TODO 나중에 주석처리.
			
			RdfTripleLogVo logVo = new RdfTripleLogVo();
			logVo.setSbjtRi(sbjtRi);
			logVo.setLogDivMtcd(logDivMtcd);
			logVo.setLogRegrId(logRegrId);
			if ("use".equals(graphType)) {
				logVo.setLogStoreLoNm(this.getGraphNameForUse());
			} else {			
				logVo.setLogStoreLoNm(this.getGraphNameForDev());
			}
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
			if ("use".equals(graphType)) {
				logVo.setLogStoreLoNm(this.getGraphNameForUse());
			} else {			
				logVo.setLogStoreLoNm(this.getGraphNameForDev());
			}
			rdfTripleLogService.createRdfTripleLog(logVo);
		} catch (Exception e) {
            log.error("[Triple Log] 실패/오류. 무시 : {}", e.getMessage());
		}
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
		log.debug("[그래프 초기화 후 재등록] 서비스 시작 - {}", graphType);
		try {
			if (!AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("그래프 초기화 후 재등록에 대한 권한이 없습니다.");
			}	
			
			VirtGraph graph = this.getNewVirtGraphForUse();
			
			graph.clear(); // 전체 삭제
			
			// RDF 네임스페이스 등록
			this.saveRdfNsToGraph(graphType, logRegrId);
			
			// 카테고리 등록
			this.saveRdfSkosToGraph(graphType, logRegrId);
			
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
			
			VirtGraph virtGraph = this.getNewVirtGraphForUse();
			virtGraph.setQueryTimeout(sparqlReqVo.getTimeoutMillis());

			// SPARQL 쿼리 실행
			log.debug("[SPARQL] {}", sparqlReqVo.getQuery());
	        VirtuosoQueryExecution vqe = VirtuosoQueryExecutionFactory.create(sparqlReqVo.getQuery(), virtGraph);
			ResultSet results = vqe.execSelect();
			
			//log.debug("[SPARQL result] {}", results.getResultVars());
			List<String> headers = results.getResultVars();
			headers.remove("graph");
			resMap.put("headers", headers);
			
			List<Map> dataList = new ArrayList<>();
			resMap.put("dataList", dataList);
			
	        while (results.hasNext()) {
	        	QuerySolution sol = results.nextSolution();
	        	
	        	Map<String, Object> dataMap = new HashMap<>();
	        	for (String var : headers) {
	        		RDFNode valNode = sol.get(var);
	        		Object valObj = this.getResultVal(sparqlReqVo.getResultFormat(), valNode);
	        		//log.debug("[SPARQL result] {} = {}  =>  {}", var, valNode, valObj);
	        		dataMap.put(var, valObj);
	        	}
	        	dataList.add(dataMap);
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
			
			VirtGraph virtGraph = null;
			try {
				if ("use".equals(graphType)) {
					virtGraph = this.getNewVirtGraphForUse();
				} else {
					virtGraph = this.getNewVirtGraphForDev();
				}
				
				virtGraph.getTransactionHandler().begin(); // graph transaction
				
				// 1. 기존데이터 삭제
	            String sparqlDelQuery = "DELETE WHERE { GRAPH <" + virtGraph.getGraphName() + "> "
	            					  + "  { ?s ?p ?o . "
	            					  + "    FILTER (CONTAINS(str(?s), \"" + ketidtNs + "\")) "
	            					  + "  } "
	    							  + "}";
	            log.debug("[SPARQL] {}", sparqlDelQuery);
	            // SPARQL 쿼리 실행
	            VirtuosoUpdateRequest vur = VirtuosoUpdateFactory.create(sparqlDelQuery, virtGraph);
	            vur.exec();
	            
	            // 트리플 로그 저장
	            this.logTripleForDel("FILTER (CONTAINS(str(?s), \"" + ketidtNs + "\"))", graphType, logRegrId);
	            
	            
				// 2. 추가 저장
				StmtIterator iterator = model.listStatements();
				if (!iterator.hasNext()) {
					log.warn("[그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장] 저장할 RDF 문이 없습니다!");
					
				} else {
					while (iterator.hasNext()) {
						Statement stmt = iterator.nextStatement();
						
						// 그래프에 추가 (URI는 유니크하기 때문에 upsert 된다)
						Triple triple = stmt.asTriple();
						virtGraph.performAdd(triple);
	
						// 트리플 로그 저장
						this.logTriple(stmt, "save", graphType, logRegrId);
					}
				}
				
				virtGraph.getTransactionHandler().commit(); // graph transaction
				
	        } catch (Exception e) {
	            log.error("[그래프에 시스템에서 정의한 RDF 네임스페이스 정보 저장] 실패/오류 (graph)", e);
	            virtGraph.getTransactionHandler().abort(); // graph transaction rollback
	            throw e;
			} finally {
				if (virtGraph != null) virtGraph.close();
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
		this.saveRdfNsToGraphByUri(subjectUri, "use", false, logRegrId);
	}
	
	/**
	 * 그래프에 RDF 클래스/프라퍼티 정보 삭제 (시스템에서 정의한 RDF)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
	 * @param subjectUri
	 * @param logRegrId
	 */
	public void deleteRdfNsToGraphByUriForUse(String subjectUri, String logRegrId) {
		this.saveRdfNsToGraphByUri(subjectUri, "use", true, logRegrId);
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
	private void saveRdfNsToGraphByUri(String subjectUri, String graphType, boolean isOnlyDelete, String logRegrId) {
		log.debug("[그래프에 RDF 클래스/프라퍼티 정보 저장] 서비스 시작");
		Model model = null;
		
		try {

			VirtGraph virtGraph = null;
			try {
				if ("use".equals(graphType)) {
					virtGraph = this.getNewVirtGraphForUse();
				} else {
					virtGraph = this.getNewVirtGraphForDev();
				}
				
				virtGraph.getTransactionHandler().begin(); // graph transaction
				
				// 1. 기존데이터 삭제
	            String sparqlDelQuery = "DELETE WHERE { GRAPH <" + virtGraph.getGraphName() + "> "
	            					  + "  { <" +  subjectUri + "> ?p ?o . } "
	    							  + "}";
	            log.debug("[SPARQL] {}", sparqlDelQuery);
	            // SPARQL 쿼리 실행
	            VirtuosoUpdateRequest vur = VirtuosoUpdateFactory.create(sparqlDelQuery, virtGraph);
	            vur.exec();
	            
	            // 트리플 로그 저장
	            this.logTripleSubject(subjectUri, "del", graphType, logRegrId);
	            
	            
				// 2. 추가 저장
	            if (!isOnlyDelete) {
	            	
	            	model = rdfSchemaService.createRdfNsTtlModel();
	            	Resource sbjtRi = model.getResource(subjectUri);
					StmtIterator iterator = sbjtRi.listProperties();
					if (!iterator.hasNext()) {
						log.warn("[[그래프에 RDF 클래스/프라퍼티 정보 저장] 저장할 RDF 문이 없습니다!");
						
					} else {	            
						while (iterator.hasNext()) {
							Statement stmt = iterator.nextStatement();
							
							// 그래프에 추가 (URI는 유니크하기 때문에 upsert 된다)
							Triple triple = stmt.asTriple();
							virtGraph.performAdd(triple);
		
							// 트리플 로그 저장
							this.logTriple(stmt, "save", graphType, logRegrId);
						}
					}
	            }
				
				virtGraph.getTransactionHandler().commit(); // graph transaction
				
	        } catch (Exception e) {
	            log.error("[[그래프에 RDF 클래스/프라퍼티 정보 저장] 실패/오류 (graph)", e);
	            virtGraph.getTransactionHandler().abort(); // graph transaction rollback
	            throw e;
			} finally {
				if (virtGraph != null) virtGraph.close();
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
			
			VirtGraph virtGraph = null;
			try {
				if ("use".equals(graphType)) {
					virtGraph = this.getNewVirtGraphForUse();
				} else {
					virtGraph = this.getNewVirtGraphForDev();
				}
				
				virtGraph.getTransactionHandler().begin(); // graph transaction
				
				// 1. 기존데이터 삭제
	            String sparqlDelQuery = "DELETE WHERE { GRAPH <" + virtGraph.getGraphName() + "> "
	            					  + "  { ?s ?p ?o . "
	            					  + "    FILTER (CONTAINS(str(?s), \"" + ketidtSkos + "\")) "
	            					  + "  } "
	    							  + "}";
	            log.debug("[SPARQL] {}", sparqlDelQuery);
	            // SPARQL 쿼리 실행
	            VirtuosoUpdateRequest vur = VirtuosoUpdateFactory.create(sparqlDelQuery, virtGraph);
	            vur.exec();
	            
	            // 트리플 로그 저장
	            this.logTripleForDel("FILTER (CONTAINS(str(?s), \"" + ketidtSkos + "\"))", graphType, logRegrId);
	            
	            
				// 2. 추가 저장
				StmtIterator iterator = model.listStatements();
				if (!iterator.hasNext()) {
					log.warn("[그래프에 시스템에서 정의한 카테고리 정보 저장] 저장할 RDF 문이 없습니다!");
					
				} else {
					while (iterator.hasNext()) {
						Statement stmt = iterator.nextStatement();
						
						// 그래프에 추가 (URI는 유니크하기 때문에 upsert 된다)
						Triple triple = stmt.asTriple();
						virtGraph.performAdd(triple);
	
						// 트리플 로그 저장
						this.logTriple(stmt, "save", graphType, logRegrId);
					}
				}
				
				virtGraph.getTransactionHandler().commit(); // graph transaction
				
	        } catch (Exception e) {
	            log.error("[그래프에 시스템에서 정의한 카테고리 정보 저장] 실패/오류 (graph)", e);
	            virtGraph.getTransactionHandler().abort(); // graph transaction rollback
	            throw e;
			} finally {
				if (virtGraph != null) virtGraph.close();
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
	private void saveRdfSkosToGraphByUri(String subjectUri, String graphType, boolean isOnlyDelete, String logRegrId) {
		log.debug("[그래프에 카테고리 정보 저장] 서비스 시작");
		Model model = null;
		
		try {

			VirtGraph virtGraph = null;
			try {
				if ("use".equals(graphType)) {
					virtGraph = this.getNewVirtGraphForUse();
				} else {
					virtGraph = this.getNewVirtGraphForDev();
				}
				
				virtGraph.getTransactionHandler().begin(); // graph transaction
				
				// 1. 기존데이터 삭제
	            String sparqlDelQuery = "DELETE WHERE { GRAPH <" + virtGraph.getGraphName() + "> "
	            					  + "  { <" +  subjectUri + "> ?p ?o . } "
	    							  + "}";
	            log.debug("[SPARQL] {}", sparqlDelQuery);
	            // SPARQL 쿼리 실행
	            VirtuosoUpdateRequest vur = VirtuosoUpdateFactory.create(sparqlDelQuery, virtGraph);
	            vur.exec();
	            
	            // 트리플 로그 저장
	            this.logTripleSubject(subjectUri, "del", graphType, logRegrId);
	            
	            
				// 2. 추가 저장
	            if (!isOnlyDelete) {
	            	
	            	model = rdfSchemaService.createRdfSkosTtlModel();
	            	Resource sbjtRi = model.getResource(subjectUri);
					StmtIterator iterator = sbjtRi.listProperties();
					if (!iterator.hasNext()) {
						log.warn("[그래프에 카테고리 정보 저장] 저장할 RDF 문이 없습니다!");
						
					} else {	            
						while (iterator.hasNext()) {
							Statement stmt = iterator.nextStatement();
							
							// 그래프에 추가 (URI는 유니크하기 때문에 upsert 된다)
							Triple triple = stmt.asTriple();
							virtGraph.performAdd(triple);
		
							// 트리플 로그 저장
							this.logTriple(stmt, "save", graphType, logRegrId);
						}
					}
	            }
				
				virtGraph.getTransactionHandler().commit(); // graph transaction
				
	        } catch (Exception e) {
	            log.error("[그래프에 카테고리 정보 저장] 실패/오류 (graph)", e);
	            virtGraph.getTransactionHandler().abort(); // graph transaction rollback
	            throw e;
			} finally {
				if (virtGraph != null) virtGraph.close();
			}
			
        } catch (Exception e) {
            log.error("[그래프에 카테고리 정보 저장] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
		} finally {
			if (model != null) model.close();
		}
		
		log.debug("[그래프에 카테고리 정보 저장] 서비스 종료");
	}
	
}
