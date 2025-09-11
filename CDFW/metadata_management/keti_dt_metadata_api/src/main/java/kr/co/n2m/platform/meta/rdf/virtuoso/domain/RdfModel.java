
package kr.co.n2m.platform.meta.rdf.virtuoso.domain;

import java.io.IOException;
import java.io.OutputStream;
import java.io.StringWriter;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.Nullable;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.apache.jena.datatypes.xsd.XSDDatatype;
import org.apache.jena.geosparql.implementation.vocabulary.Geo;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.riot.RDFFormat;
import org.apache.jena.riot.RDFWriter;
import org.apache.jena.vocabulary.RDF;
import org.springframework.util.Assert;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RangeDataTypeMtcd;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RdfFormMtcd;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RdfWriteLangMtcd;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.RdfCheckedException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.BeanUtil;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.architecture.util.RdfUtil;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleDto;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingVo;
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingCacheService;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertyDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataApiService;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

/**
 * RDF 모델
 * 
 * <pre>사용 예제)
 * 	RdfModel rdfModel = null;
 * 	String rdfStr = "";
 * 	try {
 *		RdfModelSettingVo rdfModelSettingVo = new RdfModelSettingVo();
 *		rdfModelSettingVo.setShowEmptyPrpty(false);
 *		rdfModelSettingVo.setMakeMode(RdfModelMakeMode.CURR_RESOURCE);
 *		rdfModelSettingVo.setSettingEmptyNodeUri(false);
 *			
 *		rdfModel = new RdfModel(modelId, rdfFormMtcd);
 *		rdfModel.clearAndMakeRdfModel(medataSetId, rdfModelSettingVo);
 * 		rdfStr = rdfModel.getRdfStr();
 * 	} catch (RdfCheckedException e) {
 * 		log.error("[RDF 모델로 변환된 문자열 조회] 실패/오류 : {}", e.getReason());
 * 		throw new ResBaseRuntimeException("RDF 생성을 위한 정보가 없거나 올바르지 않습니다.");
 * 	} finally {
 * 		if (rdfModel != null) rdfModel.close();
 * 	}  
 * </pre>
 * 
 * @author  n2m
 */
@Slf4j
public class RdfModel {
	
	public enum RdfModelMakeMode {
		ALL_SUB_RESOURSE, CURR_RESOURCE
	}
	
	// 2025-08 주소 변환용. http://schema.org/PostalAddress 
	public static final Set<String> ALLOWED_ADDRESS_KEYS = Set.of(
	    "streetAddress",
	    "addressLocality",
	    "addressRegion",
	    "addressCountry",
	    "postalCode",
	    "postOfficeBoxNumber"
	);
	
	@Getter
	private final String modelId;
	
	@Getter
	private final String rdfFormMtcd;
	
	protected Model model;
	
	protected Resource rootRi;
	
	private ModelInfoDto modelInfoDto;
	
	private RdfMappingModelVo rdfModelVo;
	
	private List<RdfMappingRuleDto> ruleList;
	
//	private RdfMappingService rdfMappingService;
	
//	private RdfMappingRuleService rdfMappingRuleService;
	
	private ModelService modelService;
	
	private MetadataSetService metadataSetService;
	
	private MetadataApiService metadataApiService;
	
	private RdfMappingCacheService rdfMappingCacheService;
	
	public RdfModel (String modelId, String rdfFormMtcd) throws RdfCheckedException {
		Assert.notNull(modelId, "modelId is null.");
		Assert.notNull(rdfFormMtcd, "rdfFormMtcd is null.");
		
		this.modelId = modelId;
		this.rdfFormMtcd = rdfFormMtcd;
		
//		this.rdfMappingService      = BeanUtil.getBean("rdfMappingService", RdfMappingService.class);
//		this.rdfMappingRuleService  = BeanUtil.getBean("rdfMappingRuleService", RdfMappingRuleService.class);
		this.modelService           = BeanUtil.getBean("modelService", ModelService.class);
		this.metadataSetService     = BeanUtil.getBean("metadataSetService", MetadataSetService.class);
		this.metadataApiService     = BeanUtil.getBean("metadataApiService", MetadataApiService.class);
		this.rdfMappingCacheService = BeanUtil.getBean("rdfMappingCacheService", RdfMappingCacheService.class);
		
		this.createRdfModel();
	}
	
//	@SuppressWarnings("unchecked")	
	private void createRdfModel() throws RdfCheckedException {
		try {
			// 메타데이터 모델 ID 로 메타데이터 모델 정보 조회
			modelInfoDto = modelService.getModelInfoByIdFromCache(modelId);
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 2023-09-12 아래 from Cache 로 변경.
/*			// RDF 매핑 정보 조회
			RdfMappingSearchVo paramVo1 = new RdfMappingSearchVo();
			paramVo1.setRdfFormMtcd(rdfFormMtcd);
			paramVo1.setTypeModelId(modelInfoDto.getTypeModelId());
			paramVo1.setRdfMappgDataSttusMtcd("use");
			SearchResultListVo mappingListVo = rdfMappingService.getRdfMappingList(paramVo1); // 1건 나와야 정상.
			if (mappingListVo == null || CollectionUtils.isEmpty(mappingListVo.getList())) throw new ResBizInfoException("RDF 매핑 정보가 존재하지 않습니다.");
			RdfMappingVo mappingVo = ( (List<RdfMappingVo>) mappingListVo.getList() ).get(0);
			if (StringUtils.isBlank(mappingVo.getRdfMappgId())) throw new ResBizInfoException("RDF 매핑 정보가 존재하지 않습니다.");
			String rdfMappgId = mappingVo.getRdfMappgId();
			
			// RDF 매핑 모델 결정
			RdfMappingModelSearchVo paramVo2 = new RdfMappingModelSearchVo();
			paramVo2.setRdfMappgId(rdfMappgId);
			SearchResultListVo modelListVo = rdfMappingService.getMappingModelList(paramVo2);
			if (modelListVo == null || modelListVo.getList() == null) throw new ResBizInfoException("RDF 매핑 모델이 존재하지 않습니다.");
			List<RdfMappingModelVo> modelList = modelListVo.getList();
			
			// 조건에 맞는 모델
			rdfModelVo = modelList.stream()
			    		.filter(x -> StringUtils.equals(modelId, x.getCondModelId()))
			    		.findFirst()
			    		.orElse(null);
			// 없으면 대표 모델
			if (rdfModelVo == null) {
				rdfModelVo = modelList.stream()
			    		.filter(x -> StringUtils.equals("Y", x.getRdfRepModelYn()))
			    		.findFirst()
			    		.orElse(null);
			}
			if (rdfModelVo == null) throw new ResBizInfoException("RDF 매핑 모델이 존재하지 않습니다.");
			String rdfMappgModelId = rdfModelVo.getRdfMappgModelId();
			
			// RDF 매핑 규칙 목록 조회
			RdfMappingRuleSearchVo paramVo3 = new RdfMappingRuleSearchVo();
			paramVo3.setRdfMappgModelId(rdfMappgModelId);
			ruleList = rdfMappingRuleService.getRdfMappingRuleListByRdfModelId(paramVo3);
			if (ruleList == null || ruleList.size() == 0) throw new ResBizInfoException("RDF 매핑 규칙이 존재하지 않습니다.");
			
			// 메모리 GRAPH (모델) 생성
			model = ModelFactory.createDefaultModel();	
			
			// 모델에 네임스페이스 PREFIX 설정
			List<String> defNsList = new ArrayList<>();
			defNsList.add(RDF.getURI());
			defNsList.add(XSD.getURI());
			
			RdfMappingRuleSearchVo paramVo4 = new RdfMappingRuleSearchVo();
			paramVo4.setRdfMappgModelId(rdfMappgModelId);
			paramVo4.setDefaultNamespaceUriList(defNsList);
			List<RdfNamespaceVo> nsList = rdfMappingRuleService.getRdfNamespaceListByRdfModelId(paramVo4);
			if (nsList != null && nsList.size() > 0) {
				for (RdfNamespaceVo nsVo : nsList) {
					 model.setNsPrefix(nsVo.getRdfNmspPfix(), nsVo.getRdfNmspUri());
				}
			}
*/			
			
			// RDF 매핑 정보 조회 (from Cache)
			RdfMappingVo mappingVo = rdfMappingCacheService.getRdfMappingBySearching(rdfMappingCacheService.getRdfMappingKey(rdfFormMtcd, modelInfoDto.getTypeModelId()));
			if (mappingVo == null || StringUtils.isBlank(mappingVo.getRdfMappgId())) throw new ResBizInfoException("RDF 매핑 정보가 존재하지 않습니다.");
			String rdfMappgId = mappingVo.getRdfMappgId();
			
			// RDF 매핑 모델 결정 (from Cache)
			List<RdfMappingModelVo> modelList = rdfMappingCacheService.getRdfMappingModelList(rdfMappgId);
			if (modelList == null || modelList.isEmpty()) throw new ResBizInfoException("RDF 매핑 모델이 존재하지 않습니다.");
			
			// 조건에 맞는 모델
			rdfModelVo = modelList.stream()
			    		.filter(x -> StringUtils.equals(modelId, x.getCondModelId()))
			    		.findFirst()
			    		.orElse(null);
			// 없으면 대표 모델
			if (rdfModelVo == null) {
				rdfModelVo = modelList.stream()
			    		.filter(x -> StringUtils.equals("Y", x.getRdfRepModelYn()))
			    		.findFirst()
			    		.orElse(null);
			}
			if (rdfModelVo == null) throw new ResBizInfoException("RDF 매핑 모델이 존재하지 않습니다.");
			String rdfMappgModelId = rdfModelVo.getRdfMappgModelId();
			
			// RDF 매핑 규칙 목록 조회 (from Cache)
			ruleList = rdfMappingCacheService.getRdfMappingRuleList(rdfMappgModelId);
			if (ruleList == null || ruleList.size() == 0) throw new ResBizInfoException("RDF 매핑 규칙이 존재하지 않습니다.");
			
			// 메모리 GRAPH (모델) 생성
			model = ModelFactory.createDefaultModel();	
			
			// 모델에 네임스페이스 PREFIX 설정 (from Cache)
			List<RdfNamespaceVo> nsList = rdfMappingCacheService.getRdfNamespaceListByRdfModelId(rdfMappgModelId);
			if (nsList != null && nsList.size() > 0) {
				for (RdfNamespaceVo nsVo : nsList) {
					 model.setNsPrefix(nsVo.getRdfNmspPfix(), nsVo.getRdfNmspUri());
				}
			}
		} catch (ResBizInfoException e) {
			log.info("[RDF 모델 생성] 실패/오류 (정보성) : {}", e.getReason());
			throw new RdfCheckedException(e.getReason());
		} catch (Exception e) {
			log.error("[RDF 모델 생성] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
	}
	
	/**
	 * RDF 모델 만들기
	 * @param medataSetId
	 * @param settingVo
	 * @throws RdfCheckedException
	 */
	public void clearAndMakeRdfModel(@Nullable String medataSetId, final RdfModelSettingVo settingVo) throws RdfCheckedException {
		log.debug("[RDF 모델 만들기] 서비스 시작 - {}", medataSetId);
		try {
			
			// 모델 초기화
			model.removeAll();
	
			// 메타데이터 조회. 값이 없을 수 있음.
			ListOrderedMap<String, Object> dataMap = metadataApiService.getDataMapFromMetadataSet(medataSetId, null, false);
			if (dataMap == null) {
				dataMap = new ListOrderedMap<>(); // empty map
			}
					
			// ROOT
			if (StringUtils.isNotBlank(medataSetId)) {
				rootRi = model.createResource(metadataApiService.getMetadataSetIri(medataSetId));
			} else {
				rootRi = model.createResource();
			}
			this.makeResource(rootRi, rdfModelVo.getRdfClassIri(), "ROOT", medataSetId, dataMap, settingVo);
		
		} catch (RdfCheckedException e) {
			log.info("[RDF 모델 만들기] 실패/오류 (정보성) : {}", e.getReason());
			throw e;			
		} catch (ResBizInfoException e) {
			log.info("[RDF 모델 만들기] 실패/오류 (정보성) : {}", e.getReason());
			throw new RdfCheckedException(e.getReason());			
		} catch (Exception e) {
			log.error("[RDF 모델 만들기] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 모델 만들기] 서비스 종료 - {}", medataSetId);
	}
	
	private int makeResource(Resource sbjtRi, String typeIri, String upRuleId, String medataSetId, ListOrderedMap<String, Object> dataMap, RdfModelSettingVo settingVo) throws RdfCheckedException {
		int subCnt = 0;
		
		// properties
		for (RdfMappingRuleDto ruleDto : ruleList) {
			if (StringUtils.equals(upRuleId, ruleDto.getUpRdfMappgRuleId())) {
				
				Property p = model.createProperty(ruleDto.getPredctRdfPropertyIri());
				log.debug("property type : {}", ruleDto.getPredctRdfPropertyIri());
				
				// 경우1) 데이터 매핑 N.
				if ("N".equals(ruleDto.getObjtDataMappgYn())) {
					
					if (StringUtils.isNotBlank(ruleDto.getObjtRdfClassIri())) {
						// 2023-08-16 neo4j 에 빈 노드가 추가되지 않도록
						Resource objtRi = null;						
						if (settingVo.isSettingEmptyNodeUri() && StringUtils.isNotBlank(medataSetId)) {
							String uniqueTempUri = sbjtRi.getURI() + (sbjtRi.getURI().indexOf("#") == -1 ? "#" : "-") + ruleDto.getObjtRdfClassNm() + "-" + ruleDto.getEmptyNodeOrdg();
							objtRi = model.createResource(uniqueTempUri);
							log.debug("uniqueTempUri : {}", uniqueTempUri);
						} else {
							objtRi = model.createResource();
						}
												
						sbjtRi.addProperty(p, objtRi);
						
						int objtSubCnt = this.makeResource(objtRi, ruleDto.getObjtRdfClassIri(), ruleDto.getRdfMappgRuleId(), medataSetId, dataMap, settingVo);
						if (objtSubCnt == 0 && !settingVo.isShowEmptyPrpty()) {
							log.debug("빈 값 삭제 : {} {} {}", sbjtRi, p, objtRi);
							model.remove(sbjtRi, p, objtRi);
						} else {
							subCnt++;
						}
						
					} else if (settingVo.isShowEmptyPrpty()) {
						sbjtRi.addProperty(p, "");
						subCnt++;
					}
					
				// 경우2) 데이터 매핑 Y. 리터럴 Y.
				} else if ("Y".equals(ruleDto.getObjtLiteralYn())) {
					
					subCnt += this.addLiteral(sbjtRi, p, ruleDto.getObjtPrptyId(), medataSetId, dataMap, settingVo);
				
				// 경우3) 데이터 매핑 Y. 리터럴 N. 다른 RDF 매핑 ID 존재.
				} else if (StringUtils.isNotBlank(ruleDto.getObjtRdfMappgId())) {
					
					subCnt += this.addSubRdfModel(sbjtRi, p, ruleDto.getObjtPrptyId(), ruleDto.getObjtRdfMappgId(), medataSetId, dataMap, settingVo);
					
				// 경우4) 데이터 매핑 Y. 매핑 관련 데이터 없음.
				} else {
					
					// 데이터가 아직 제대로 입력이 안된 경우..... 생길 수 있음.
					log.warn("resource type : {} : 데이터가 아직 입력이 덜 되었거나 데이터 정합성에 문제가 있음.....", typeIri);
				}
				
			}
		}
		
		if (subCnt > 0 || settingVo.isShowEmptyPrpty()) {
			// type
			Resource typeRi = model.createResource(typeIri);
			log.debug("resource type : {}", typeIri);
			this.addStatement(sbjtRi, RDF.type, typeRi);
		}
		
		return subCnt;
	}

	/**
	 * RDF 문자열 반환.
	 * @param rdfWriteLang  "RDF/XML", "RDF/XML-ABBREV", "TURTLE", "N-TRIPLE", "JSON-LD", "RDF/JSON"
	 * @return
	 */
	public String getRdfStr(String rdfWriteLang) {
		log.debug("[RDF 문자열 반환] 서비스 시작 - write Lang : {}", rdfWriteLang);		
		String resStr = "";
		StringWriter stringWriter = null;
		
		try {
			// RDF 모델 쓰기
			stringWriter = new StringWriter();
			model.write(stringWriter, rdfWriteLang);
			resStr = stringWriter.toString();
			//log.debug("[RDF 문자열 반환] write Lang : {} : \n{}", rdfWriteLang, resStr); // 불필요시 주석처리 할 것!
			
		} catch (Exception e) {
			log.error("[RDF 문자열 반환] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		} finally {
			if (stringWriter != null) try { stringWriter.close(); } catch (IOException e) {	log.warn("StringWriter - IOException."); }
		}
		
		log.debug("[RDF 문자열 반환] 서비스 종료 - write Lang : {}", rdfWriteLang);	
		return resStr;
	}
	
	public String getRdfStr() {
		RdfFormMtcd rdfFormEnum = MetadataEnum.getValue(rdfFormMtcd, RdfFormMtcd.class);		
		return this.getRdfStr(rdfFormEnum.rdfLang());
	}	
	
	public String getRdfStr(RDFFormat rdfFormat) {
		log.debug("[RDF 문자열 반환] 서비스 시작 - rdfFormat : {}", rdfFormat);		
		String resStr = "";
		StringWriter stringWriter = null;
		
		try {
//			// 테스트용 로그. 불필요시 주석처리 할 것!
//			StmtIterator iterator = model.listStatements();
//			int idx = 0;
//			while (iterator.hasNext()) {
//				Statement stmt = iterator.nextStatement();
//				log.debug("[{}] {}   {}   {}", ++idx, stmt.getSubject().toString(), stmt.getPredicate().toString(), stmt.getObject().toString());
//			}
			
			// RDF 모델 쓰기
			stringWriter = new StringWriter();
			
			RDFWriter.source(model)
		     	.format(rdfFormat)
		     	.build()
		     	.output(stringWriter);
			
			resStr = stringWriter.toString();
			//log.debug("[RDF 문자열 반환] rdfFormat : {} : \n{}", rdfFormat, resStr); // 불필요시 주석처리 할 것!
			
		} catch (Exception e) {
			log.error("[RDF 문자열 반환] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		} finally {
			if (stringWriter != null) try { stringWriter.close(); } catch (IOException e) {	log.warn("StringWriter - IOException."); }
		}
		
		log.debug("[RDF 문자열 반환] 서비스 종료 - rdfFormat : {}", rdfFormat);	
		return resStr;
	}
	
	public String getRdfStrByWriteLangMtcd(RdfWriteLangMtcd rdfWriteLangMtcdEnum) {
		return this.getRdfStr(rdfWriteLangMtcdEnum.rdfFormat());
	}
	
	public String getRdfStrByWriteLangMtcd(String rdfWriteLangMtcd) {
		RdfWriteLangMtcd rdfWriteLangMtcdEnum = MetadataEnum.getValue(rdfWriteLangMtcd, RdfWriteLangMtcd.class);
		return this.getRdfStr(rdfWriteLangMtcdEnum.rdfFormat());
	}	
	
	/**
	 * RDF 모델 아웃풋스트림으로 쓰기
	 * @param out
	 * @param rdfWriteLang  "RDF/XML", "RDF/XML-ABBREV", "TURTLE", "N-TRIPLE", "JSON-LD", "RDF/JSON"
	 */
	public void write(OutputStream out, String rdfWriteLang) {
		log.debug("[RDF 모델 아웃풋스트림으로 쓰기] 서비스 시작 - write Lang : {}", rdfWriteLang);
		try {
			/*
				Jena writer name	RIOT RDFFormat
				"TURTLE"			TURTLE
				"TTL"				TURTLE
				"Turtle"			TURTLE
				"N-TRIPLES"			NTRIPLES
				"N-TRIPLE"			NTRIPLES
				"NT"				NTRIPLES
				"JSON-LD"			JSONLD
				"RDF/XML-ABBREV"	RDFXML
				"RDF/XML"			RDFXML_PLAIN
				"N3"				N3					--- 이것은 여기서 빼기로 함.
				"RDF/JSON"			RDFJSON 
			 */
			// RDF 모델 쓰기
			model.write(out, rdfWriteLang);
			
		} catch (Exception e) {
			log.error("[RDF 모델 아웃풋스트림으로 쓰기] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 모델 아웃풋스트림으로 쓰기] 서비스 종료 - write Lang : {}", rdfWriteLang);
	}
	
	public void write(OutputStream out, RDFFormat rdfFormat) {
		log.debug("[RDF 모델 아웃풋스트림으로 쓰기] 서비스 시작 - rdfFormat : {}", rdfFormat);
		try {
			// RDF 모델 쓰기
			RDFWriter.source(model)
		     	.format(rdfFormat)
		     	.output(out);
			
		} catch (Exception e) {
			log.error("[RDF 모델 아웃풋스트림으로 쓰기] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 모델 아웃풋스트림으로 쓰기] 서비스 종료 - rdfFormat : {}", rdfFormat);
	}
	
	/**
	 * RDF 모델의 전체 문 목록 iterator 반환
	 * @return
	 */
	public StmtIterator listStatements() {
		return model.listStatements();
	}
	
	/**
	 * RDF 모델 자원 해제. close
	 */
	public void close() {
		
		if (this.model != null && !this.model.isClosed()) { this.model.close(); }
		
		this.rootRi = null;
		this.modelInfoDto = null;
		this.rdfModelVo = null;
		this.ruleList = null;
	}
	
	/**
	 * 모델에 Triple 문 추가
	 */
	private void addStatement(Resource s, Property p, RDFNode o) {
		Statement stmt = model.createStatement(s, p, o);
		model.add(stmt);		
	}
	
	/**
	 * 모델에 리터럴 프라퍼티 추가 (data_type 의 메타데이터)
	 */
	@SuppressWarnings({ "rawtypes", "unchecked" })
	private int addLiteral(Resource sbjtRi, Property p, String prptyId, String medataSetId, ListOrderedMap<String, Object> dataMap, RdfModelSettingVo settingVo) {
		log.debug("[RDF 리터럴 추가] 서비스 시작  {} - {}", p.getLocalName(), prptyId);
		int cnt = 0;
		
		// 키워드 프라퍼티 metaModel
		if (Constant.KEYWORD_META_MODEL.equals(prptyId)) {
			sbjtRi.addLiteral(p, modelInfoDto.getModelNm());
			log.debug("[RDF 리터럴 추가] 서비스 종료  {} - {}", p.getLocalName(), prptyId);
			return 1;
		}
		
		try {
			// 메타데이터 프라퍼티 정보 조회
			String prptyNm = modelInfoDto.getPropertyNmById(prptyId);
			if (prptyNm == null) throw new ResBizInfoException("[" + prptyId + "] 프라퍼티가 존재하지 않거나 사용할 수 없는 프라퍼티입니다.");
			
			Object valObj = dataMap.get(prptyNm);
			if (valObj == null) throw new ResBizInfoException("[" + prptyNm + "] 프라퍼티의 값이 없습니다."); // cause e-1 
			
			ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(prptyNm);
			
			// 배열 데이터 여부
			List<MetadataPropertyDto> vallist = null;
			int valCount = 0;
			String val = null;
			boolean isArrayProperty = StringUtils.equals("Y", pDto.getDataArrayYn());
			log.debug("{} isArrayProperty : {}", prptyNm, isArrayProperty);
			if (isArrayProperty) {
				
				if (StringUtils.isNotBlank(medataSetId)) {
					// FIXME 배열 프라퍼티 경우 따로 조회. 최대 한계 건수 까지만.
					SearchResultListVo listVo = this.getMetadataListBySetPropertyNm(medataSetId, prptyNm);
					valCount = listVo.getPage().getTotalListSize();
					log.debug("[{}] 프라퍼티의 값은 총 {}건이 있습니다.", prptyNm, valCount);
					vallist  = (List<MetadataPropertyDto>) listVo.getList();
					
					//  TODO 임시로 프라퍼티 개수 만큼 단순 반복 추가, 추후 수정 필요할 수 있음
				}
				if (vallist == null) throw new ResBizInfoException("[" + prptyNm + "] 프라퍼티의 값이 없습니다. (배열)"); // cause e-1 에서 걸러지기에 이 오류는 나면 안됨.
				
			} else {
				val = String.valueOf(valObj);
				valCount = 1;
			}
			
			// 프라퍼티 범위 모델(값 모델) 에 따라 리터럴 설정
			RangeDataTypeMtcd dataTypeEnum = MetadataEnum.getValue(pDto.getRangeDataTypeMtcd(), RangeDataTypeMtcd.class);
			
			// 특수한 경우 하드코딩.
			// 2025-08 유형 프라퍼티 의 범위모델이 address 인 경우 schema:PostalAddress 객체로 하드코딩. (schema:spatial, vcard:hasAddress 사용시)
			if (RangeDataTypeMtcd.address.equals(dataTypeEnum)) {
				if ("http://schema.org/spatial".equals(p.getURI()) || "http://www.w3.org/2006/vcard/ns#hasAddress".equals(p.getURI())) {
					if (isArrayProperty) {
						for (MetadataPropertyDto valDto : vallist) {
							Resource addressRes = this.buildPostalAddressResource(valDto.getMedataVal());
							if (addressRes != null) {
								sbjtRi.addProperty(p, addressRes);
							}
						}
					} else {
						Resource addressRes = this.buildPostalAddressResource(valObj);
						if (addressRes != null) {
							sbjtRi.addProperty(p, addressRes);
						}
					}
					
					return valCount; // 여기서 끝.
				} else {
					// 그 외. address 지만 그냥 아래서 리터럴 로 취급.
				}
			}
			
			switch (dataTypeEnum) {
			case langString :
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						sbjtRi.addProperty(p, valDto.getMedataVal(), valDto.getLangMtcd());
					}
					
				} else {
					if (valObj instanceof Map) {
						// { "language" : "ko", "value" : "홍길동" }
						Map tMap = (Map) valObj;
						sbjtRi.addProperty(p, String.valueOf(tMap.get("value")), String.valueOf(tMap.get("language")));
						
					} else if (RdfUtil.isJson(val)) {
						Map tMap = (Map) JsonUtil.toMap(val);
						sbjtRi.addProperty(p, String.valueOf(tMap.get("value")), String.valueOf(tMap.get("language")));
						
					} else {
						throw new ResBizInfoException("[" + prptyId + "] 프라퍼티의 값이 유효하지 않습니다."); // 이런 경우가 나오면 안됨. 이미 저장된 데이터 이므로.
						
					}
				}
				break;
				
			case logicNameStringKo :
			case descStringKo :
			case stringKo :
			case stringEn :
			case keywordsKo : 
			case keywordsEn :
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						sbjtRi.addProperty(p, val, pDto.getRangeUseLangMtcd());
					}
				} else {
					sbjtRi.addProperty(p, val, pDto.getRangeUseLangMtcd());
				}
				break;
				
			case createDateTime :
			case updateDateTime :
			case dateTime :
				
				// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							// XSDdateTime 소수점 3자리 (밀리초)까지만 허용. 6자리 (마이크로초)는 에러날수 있다고 함. 소수점3자리 이후는 잘라버림.
							val = val.replaceFirst("(\\.\\d{3})\\d{1,3}(Z|[+-]\\d{2}:?\\d{2})?", "$1$2");
							sbjtRi.addProperty(p, val, XSDDatatype.XSDdateTime);
						}
					}
				} else {
					// XSDdateTime 소수점 3자리 (밀리초)까지만 허용. 6자리 (마이크로초)는 에러날수 있다고 함. 소수점3자리 이후는 잘라버림.
					val = val.replaceFirst("(\\.\\d{3})\\d{1,3}(Z|[+-]\\d{2}:?\\d{2})?", "$1$2");
					sbjtRi.addProperty(p, val, XSDDatatype.XSDdateTime);
				}
				break;
				
			case date :
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDdate);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDdate);
				}
				break;		
				
			case year :
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDgYear);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDgYear);
				}
				break;
				
			case yearMonth :
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDgYearMonth);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDgYearMonth);
				}
				break;		
				
			case integer:
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDinteger);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDinteger);
				}
				break;
				
			case positiveInteger:
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDpositiveInteger);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDpositiveInteger);
				}
				break;
				
			case nonNegativeInteger:
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDnonNegativeInteger);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDnonNegativeInteger);
				}
				break;
				
			case nonPositiveInteger:
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDnonPositiveInteger);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDnonPositiveInteger);
				}
				break;
				
			case negativeInteger:
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDnegativeInteger);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDnegativeInteger);
				}
				break;
				
			case long_:			
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDlong);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDlong);
				}
				break;
				
			case float_:
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDfloat);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDfloat);
				}
				break;
				
			case double_:
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDdouble);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDdouble);
				}
				break;
				
			case boolean_ :
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDboolean);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDboolean);
				}
				break;
				
			case anyURI : 
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addProperty(p, val, XSDDatatype.XSDanyURI);
						}
					}
				} else {
					sbjtRi.addProperty(p, val, XSDDatatype.XSDanyURI);
				}
				break;
				
			case json : 
			case address : // 2025-07 표준문서 관련 데이터타입 추가. TODO 필요시 변경
			case dataInfo : // 2025-07 표준문서 관련 데이터타입 추가. TODO 필요시 변경
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							// JSON 문자열에 포함된 "\n" 또는 실제 줄바꿈을 제거
							//저장시 제거해서 막음. val = val.replaceAll("\\\\n", "").replace("\n", "");
							sbjtRi.addProperty(p, val, RDF.dtRDFJSON);
						}
					}
				} else {
					// JSON 문자열에 포함된 "\n" 또는 실제 줄바꿈을 제거
					//저장시 제거해서 막음. val = val.replaceAll("\\\\n", "").replace("\n", "");
					sbjtRi.addProperty(p, val, RDF.dtRDFJSON);
				}
				break;	
				
			case geoJson : // http://www.opengis.net/ont/geosparql#geoJSONLiteral
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getGeodataVal());
						if (StringUtils.isNotBlank(val)) {
							Literal geoJSONLiteral = model.createTypedLiteral(val, Geo.GEO_JSON);
							sbjtRi.addProperty(p, geoJSONLiteral);
						}
					}
				} else {
					Literal geoJSONLiteral = model.createTypedLiteral(val, Geo.GEO_JSON);
					sbjtRi.addProperty(p, geoJSONLiteral);
				}
				break;
				
			case categoryConcept : 
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							Resource skosRi = model.createResource(metadataApiService.getSkosIri(val));
							sbjtRi.addProperty(p, skosRi);
						}
					}
				} else {
					Resource skosRi = model.createResource(metadataApiService.getSkosIri(val));
					sbjtRi.addProperty(p, skosRi);
				}
				
				break;
				
			default:
				
				if (isArrayProperty) {
					for (MetadataPropertyDto valDto : vallist) {
						val = StringUtils.defaultString(valDto.getMedataVal());
						if (StringUtils.isNotBlank(val)) {
							sbjtRi.addLiteral(p, val);
						}
					}
				} else {
					sbjtRi.addLiteral(p, val);
				}
				break;
					
			}
			
			cnt = valCount;
		
		} catch (ResBaseRuntimeException e) {
			log.info("[RDF 리터럴 추가] 실패/오류 (정보성) -> 빈 값 : {}", e.getReason());
			if (settingVo.isShowEmptyPrpty()) {
				// 빈 값 넣기
				sbjtRi.addLiteral(p, "");
				cnt++;
			}
			
		} catch (Exception e) {
			log.error("[RDF 리터럴 추가] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 리터럴 추가] 서비스 종료  {} - {}", p.getLocalName(), prptyId);
		return cnt;
	}
	
	/**
	 * 모델에 RDF 하위 모델 추가 (object_type 의 메타데이터)
	 */
	@SuppressWarnings("unchecked")
	private int addSubRdfModel(Resource sbjtRi, Property p, String prptyId, String rdfMappgId, String medataSetId, ListOrderedMap<String, Object> dataMap, RdfModelSettingVo settingVo) throws RdfCheckedException {
		log.debug("[RDF 하위 모델 추가] 서비스 시작  {} - {}", p.getLocalName(), rdfMappgId);
		int cnt = 0;
		
		try {
			// 메타데이터 프라퍼티 정보 조회
			String prptyNm = modelInfoDto.getPropertyNmById(prptyId);
			if (prptyNm == null) throw new ResBizInfoException("[" + prptyId + "] 프라퍼티가 존재하지 않거나 사용할 수 없는 프라퍼티입니다.");
			
			Object valObj = dataMap.get(prptyNm);
			if (valObj == null) throw new ResBizInfoException("[" + prptyNm + "] 프라퍼티의 값이 없습니다."); // cause e-1 
			
			// RDF 매핑 정보 조회 (from Cache)
//			RdfMappingVo mappingVo = rdfMappingService.getRdfMapping(rdfMappgId);
			RdfMappingVo mappingVo = rdfMappingCacheService.getRdfMapping(rdfMappgId);
			if (mappingVo == null) throw new RdfCheckedException("[" + rdfMappgId + "] RDF 매핑 정보가 존재하지 않습니다.");
			
			// object_type 의 메타데이터 다시 조회
			List<MetadataPropertyDto> vallist = null;
			if (StringUtils.isNotBlank(medataSetId)) {
				
				// FIXME 배열 프라퍼티 경우 따로 조회. 최대 한계 건수 까지만.
				SearchResultListVo listVo = this.getMetadataListBySetPropertyNm(medataSetId, prptyNm);
				log.debug("[{}] 프라퍼티의 값은 총 {}건이 있습니다.", prptyNm, listVo.getPage().getTotalListSize());
				vallist  = (List<MetadataPropertyDto>) listVo.getList();
				
			//  TODO 임시로 프라퍼티 개수 만큼 단순 반복 추가, 추후 수정 필요할 수 있음
			}
			if (vallist == null) throw new ResBizInfoException("[" + prptyNm + "] 프라퍼티의 값이 없습니다. (배열)"); // cause e-1 에서 걸러지기에 이 오류는 나면 안됨.
			
			// 배열 데이터 여부 상관없이. 배열이 아닌 경우는 1건.
			for (MetadataPropertyDto valDto : vallist) {
				
				boolean isAdd = settingVo.isShowEmptyPrpty();
				if (StringUtils.isNotBlank(valDto.getMedataVal())) isAdd = true;
				
				if (isAdd) {
					
					if (settingVo.getMakeMode().equals(RdfModelMakeMode.ALL_SUB_RESOURSE)) {
					
						// 하위 모델 생성
						RdfModel subModel = new RdfModel(valDto.getMedataValModelId(), mappingVo.getRdfFormMtcd());
						subModel.clearAndMakeRdfModel(valDto.getMedataVal(), settingVo);
						
						// 연결 프라퍼티
						sbjtRi.addProperty(p, subModel.rootRi);
						cnt++;
						
						// 모델 내용 추가
						model.add(subModel.model);
						
						// 하위 모델 자원 해제.
						subModel.close();
						
					} else { // RdfModelMakeMode.CURR_RESOURCE
						
						Resource objtRi = null;
						if (StringUtils.isNotBlank(valDto.getMedataVal())) {
							objtRi = model.createResource(metadataApiService.getMetadataSetIri(valDto.getMedataVal()));
						} else {
							objtRi = model.createResource();
						}
						
						// 연결 프라퍼티
						sbjtRi.addProperty(p, objtRi);
						cnt++;
						
					}
				}
			}
		
		} catch (RdfCheckedException e) {
			log.info("[RDF 하위 모델 추가] 실패/오류 (정보성) : {}", e.getReason());
			throw e;
		} catch (ResBaseRuntimeException e) {
			log.info("[RDF 하위 모델 추가] 실패/오류 (정보성) -> 빈 값 : {}", e.getReason());
			if (settingVo.isShowEmptyPrpty()) {
				// 빈 값 넣기
				sbjtRi.addProperty(p, "");
				cnt++;
			}
			
		} catch (Exception e) {
			log.error("[RDF 리터럴 추가] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[RDF 하위 모델 추가] 서비스 종료  {} - {}", p.getLocalName(), rdfMappgId);
		return cnt;
	}
	
	/**
	 * 메타데이터의 프라퍼티 값 목록 조회
	 */
	private SearchResultListVo getMetadataListBySetPropertyNm(String medataSetId, String prptyNm) {
		// FIXME 배열 프라퍼티 경우 따로 조회. 최대 한계 건수 까지만.
		MetadataPropertySearchVo paramVo = new MetadataPropertySearchVo();
		paramVo.setIsPaging(false);
		paramVo.setMedataSetId(medataSetId);
		paramVo.setPrptyNm(prptyNm);
		return metadataSetService.getMetadataListBySetPropertyNm(paramVo);
	}
	
	/**
	 * 2005-08 유형 프라퍼티 의 범위모델이 address 인 경우 schema:PostalAddress 객체로 하드코딩. (schema:spatial, vcard:hasAddress 사용시)
	 */
	@SuppressWarnings("unchecked")
	private Resource buildPostalAddressResource(Object valObj) {
		Resource addressRes = null;
		Map<String, Object> addressMap = null;
		
		if (valObj instanceof Map) {
			// { "addressCountry" : "KR", "addressRegion" : "제주도", "addressLocality" : "제주시" , "streetAddress": "광양9길 10" }
			addressMap = (Map<String, Object>) valObj;
		} else {
			String val = StringUtils.defaultString((String) valObj);
			// JSON 문자열에 포함된 "\n" 또는 실제 줄바꿈을 제거
			//저장시 제거해서 막음. val = val.replaceAll("\\\\n", "").replace("\n", "");
			addressMap = (Map<String, Object>) JsonUtil.toMap(val);
		}
		
		if (addressMap != null) {
		    addressRes = model.createResource();  // 빈 노드
		    addressRes.addProperty(RDF.type, model.createResource("http://schema.org/PostalAddress"));
	
		    for (String key : ALLOWED_ADDRESS_KEYS) {
		        Object value = addressMap.get(key);
		        if (value != null && StringUtils.isNotBlank(value.toString())) {
		            Property prop = model.createProperty("http://schema.org/" + key);
		            addressRes.addProperty(prop, value.toString());
		        }
		    }
		}

	    return addressRes;
	}	
	
}
