package kr.co.n2m.platform.meta.resource.metadata.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.reflect.FieldUtils;
import org.json.simple.JSONObject;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.PropertyRequired;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.RangeDataTypeMtcd;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.SqlDatePart;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.kafka.KafkaConst;
import kr.co.n2m.platform.meta.architecture.kafka.MyKafkaProducer;
import kr.co.n2m.platform.meta.architecture.property.DtmetaProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.DateUtil;
import kr.co.n2m.platform.meta.architecture.util.KeywordUtil;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.architecture.util.MapperUtil;
import kr.co.n2m.platform.meta.architecture.util.RdfUtil;
import kr.co.n2m.platform.meta.architecture.util.SecurityUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbKeywordDto;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbKeywordVo;
import kr.co.n2m.platform.meta.datastore.influxdb.domain.InfluxDbMetadataVo;
import kr.co.n2m.platform.meta.datastore.influxdb.service.InfluxDbService;
import kr.co.n2m.platform.meta.federation.api.domain.ApiDigitalTwinType;
import kr.co.n2m.platform.meta.portal.code.service.CodeGroupService;
import kr.co.n2m.platform.meta.rdf.neo4j.service.Neo4jService;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;
import kr.co.n2m.platform.meta.resource.category.service.CategoryService;
import kr.co.n2m.platform.meta.resource.keyword.service.KeywordService;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataChgHstSaveDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataChgHstSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataChgHstVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataConnectDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataElasticJsonMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertyDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSaveDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetSaveDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataVo;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataApiMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataChgHstMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataSetMapper;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import kr.co.n2m.platform.meta.search.elasticsearch.service.ElasticSearchService;
import kr.co.n2m.platform.meta.search.vector.service.VectorSearchService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class MetadataSetService {
	
	@Autowired
	private DtmetaProperty dtmetaProperty;

	@Autowired
	private MetadataSetMapper metadataSetMapper;
	
	@Autowired
	private MetadataMapper metadataMapper;
	
	@Autowired
	private MetadataChgHstMapper metadataChgHstMapper;
	
	@Autowired
	private ModelService modelService;
	
	@Autowired
	private KeywordService keywordService;
	
	@Autowired
	private CodeGroupService codeGroupService;
	
	@Autowired
	private	CategoryService categoryService;
	
	@Autowired
	private Executor virtuosoExecutor;
	
	@Autowired
	private Executor neo4jExecutor;
	
	@Autowired
	private Executor elasticSearchExecutor;
	
	@Autowired
	private Executor influxExecutor;
	
	@Autowired(required = false)
	private MyKafkaProducer myKafkaProducer;
	
	@Autowired
	private MetadataApiMapper metadataApiMapper;
	
	private VirtuosoService virtuosoService; // 순환참조 오류 방지
	
	public void setVirtuosoService(VirtuosoService virtuosoService) { // 순환참조 오류 방지
		this.virtuosoService = virtuosoService;
	}
	
	private Neo4jService neo4jService; // 순환참조 오류 방지
	
	public void setNeo4jService (Neo4jService neo4jService) { // 순환참조 오류 방지
		this.neo4jService = neo4jService;
	}
	
	private ElasticSearchService elasticSearchService; // 순환참조 오류 방지
	
	public void setElasticSearchService (ElasticSearchService elasticSearchService) { // 순환참조 오류 방지
		this.elasticSearchService = elasticSearchService;
	}
	
	private InfluxDbService influxDbService; // 순환참조 오류 방지
	
	public void setInfluxDbService (InfluxDbService influxDbService) { // 순환참조 오류 방지
		this.influxDbService = influxDbService;
	}
	
	private VectorSearchService vectorSearchService; // 순환참조 오류 방지
	
	public void setVectorSearchService (VectorSearchService vectorSearchService) { // 순환참조 오류 방지
		this.vectorSearchService = vectorSearchService;
	}

	/**
	 * 메타데이터 셋의 모델 정보 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param medataSetId
	 * @return
	 */
	public ModelInfoDto getModelInfoBySetId(String medataSetId) {
		log.debug("[메타데이터 셋의 모델 정보 조회] 서비스 시작");
		ModelInfoDto mDto = null;
		
		try {
			MetadataSetDto setDto = this.getMetadataSet(medataSetId);
			if (setDto != null) { 
				mDto = modelService.getModelInfoByNameFromCache(setDto.getModelNm());
			}
			
		} catch (Exception e) {
			log.error("[메타데이터 셋의 모델 정보 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 셋의 모델 정보 조회] 서비스 종료");
		return mDto;
	}
	
	/**
	 * 메타데이터 셋 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSearchVo
	 * @return
	 */
	public SearchResultListVo getMetadataSetList(MetadataSearchVo metadataSearchVo) {
		log.debug("[메타데이터 셋 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = metadataSetMapper.selectMetadataSetCount(metadataSearchVo);
			metadataSearchVo.setTotalListSize(totalListSize);
			
			List<CamelCaseMap> list = metadataSetMapper.selectMetadataSetList(metadataSearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(metadataSearchVo));
			
		} catch (Exception e) {
			log.error("[메타데이터 셋 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 셋 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 메타데이터 셋 ID로 연결된 상위 디지털트윈 메타데이터 셋 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 30.
	 * @param medataSetId
	 * @return
	 */
	public SearchResultListVo getMetadataSetDtwListBySubSetId(String medataSetId) {
		log.debug("[메타데이터 셋 ID로 연결된 상위 디지털트윈 메타데이터 셋 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			// 많은 건이 나오지 않는게 정상.
			MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
			metadataSearchVo.setIsPaging(false);
			metadataSearchVo.setMedataSetId(medataSetId);
			List<CamelCaseMap> list = metadataSetMapper.selectMetadataSetDtwListBySubSetId(metadataSearchVo);
			
			if (list != null && list.size() > 0) {
				metadataSearchVo.setTotalListSize(list.size());
			}
			
			listVo.setList(list);
			listVo.setPage(new PageVo(metadataSearchVo));
			
		} catch (Exception e) {
			log.error("[메타데이터 셋 ID로 연결된 상위 디지털트윈 메타데이터 셋 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 셋 ID로 연결된 상위 디지털트윈 메타데이터 셋 목록 조회] 서비스 종료");
		return listVo;
	}		
	
	/**
	 * 메타데이터 셋 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param medataSetId
	 * @return
	 */
	public MetadataSetDto getMetadataSet(String medataSetId) {
		log.debug("[메타데이터 셋 조회] 서비스 시작");
		MetadataSetDto dto = null;
		
		try {
			MetadataSetVo metadataSetVo = new MetadataSetVo();
			metadataSetVo.setMedataSetId(medataSetId);
			dto = metadataSetMapper.selectMetadataSet(metadataSetVo);

		} catch (Exception e) {
			log.error("[메타데이터 셋 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 셋 조회] 서비스 종료");
		return dto;
	}
	
	/**
	 * 메타데이터 셋 ID 로 메타데이터 셋 명 조회. (작고 빠르게 조회하기 위함)
	 * @Author      : heenim
	 * @Date        : 2023. 07. 28.
	 * @param medataSetId
	 * @return nullable
	 */
	public String getMetadataSetNameById(String medataSetId) {
		try {
			if (StringUtils.isBlank(medataSetId)) return "";
			return metadataSetMapper.selectMetadataSetNameById(medataSetId);
		} catch (Exception e) {
			log.error("[메타데이터 셋 ID 로 메타데이터 셋 명 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
	}
	
	/**
	 * 메타데이터 변경이력 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 21.
	 * @param metadataSearchVo
	 * @return
	 */
	public SearchResultListVo getMetadataChgHstList(MetadataChgHstSearchVo metadataChgHstSearchVo) {
		log.debug("[메타데이터 변경이력 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = metadataChgHstMapper.selectMetadataChgHstCount(metadataChgHstSearchVo);
			metadataChgHstSearchVo.setTotalListSize(totalListSize);
			
			List<CamelCaseMap> list = metadataChgHstMapper.selectMetadataChgHstList(metadataChgHstSearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(metadataChgHstSearchVo));
			
		} catch (Exception e) {
			log.error("[메타데이터 변경이력 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 변경이력 목록 조회] 서비스 종료");
		return listVo;
	}	
	
	/**
	 * 메타데이터 셋 등록 (from setVo) - 비정형 모델
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param metadataSetSaveDto
	 * @return
	 */
	public String createMetadataSetFromSetVo(MetadataSetSaveDto metadataSetSaveDto) {
		log.debug("[메타데이터 셋 등록 (from setVo)] 서비스 시작");
		String medataSetId = "";
		
		try {
			// 1. 유효성 체크
			
			if (metadataSetSaveDto == null) throw new ResBadRequestException(4000, "메타데이터 셋에 필요한 정보가 없습니다.");
			
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(metadataSetSaveDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 화면에서는 등록 상태만 등록할 수 있게 함. 그 외 상태는 여기서 등록 못함.
			if (StringUtils.isBlank(metadataSetSaveDto.getMedataSetSttusMtcd())) {
				metadataSetSaveDto.setMedataSetSttusMtcd(Constant.SET_STATUS_REG);
				metadataSetSaveDto.setMedataSetNwstRvsn(0);
			} else if (!StringUtils.equalsAny(metadataSetSaveDto.getMedataSetSttusMtcd(), Constant.SET_STATUS_REG)) {
				throw new ResBizInfoException("[" + metadataSetSaveDto.getMedataSetNm() + "] 등록할 수 없는 데이터입니다. (상태: " + metadataSetSaveDto.getMedataSetSttusMtcd() + ")");
			}
			
			// 2. 메타데이터 셋을 등록하고 셋에 해당하는 특수 메타데이터들을 등록
			medataSetId = this.createMetadataSetAndMetadataForSet(modelInfoDto, metadataSetSaveDto);
			
			// 새롭게 저장된 메타데이터 셋 조회
			// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
			metadataSetSaveDto.setSqlDateFormat(SqlDatePart.iso6z.format());
			MetadataSetDto metadataSetDto = metadataSetMapper.selectMetadataSet(metadataSetSaveDto);
			
			// 2-1. NOTE: 2025-07-28 표준문서 적용을 위한 하드 코딩.
			// modelId 가 SingleDigitalTwin 단일디지털트윈, FederatedDigitalTwin 연합디지털트윈 경우만 type 강제 저장.
			this.saveInitialDigitalTwinType(medataSetId, modelInfoDto, metadataSetDto);
			
			// 3. 연결 메타데이터 셋 프라퍼티 가 존재하면 연결 정보 등록 
			if (StringUtils.isNotBlank(metadataSetSaveDto.getCnctMedataSetId()) || StringUtils.isNotBlank(metadataSetSaveDto.getCnctPrptyId())) {
				if (StringUtils.isNotBlank(metadataSetSaveDto.getCnctMedataSetId()) && StringUtils.isNotBlank(metadataSetSaveDto.getCnctPrptyId()) ) {
					// 연결 메타데이터 셋 프라프티 정보 저장 (상위로 연결)
					MetadataConnectDto metadataConnectDto = new MetadataConnectDto();
					metadataConnectDto.setMedataSetId(metadataSetSaveDto.getCnctMedataSetId());
					metadataConnectDto.setPrptyId(metadataSetSaveDto.getCnctPrptyId());
					metadataConnectDto.setMedataVal(medataSetId);
					this.saveCnctMetadataSetProperty(metadataConnectDto);
					
				} else {
					throw new ResBadRequestException(4000, "연결 메타데이터 셋과 연결 프라퍼티 정보가 모두 필요합니다.");					
				}
			}
			
			// 4. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_CREATE, metadataSetDto, null, null);
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 셋 등록 (from setVo)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 셋 등록 (from setVo)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
		
		log.debug("[메타데이터 셋 등록 (from setVo)] 서비스 종료");
		return medataSetId;
	}
	
	/**
	 * 메타데이터 셋이 수정 가능한 상태인지 체크. 불가능한 경우 Exception 발생
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param medataSetId
	 * @param validStatus
	 * @return
	 * @throws ResBizInfoException
	 */
	public MetadataSetDto checkEditableAndGetMetadataSetDto(String medataSetId, final CharSequence... validStatus) throws ResBizInfoException {
		Assert.notEmpty(validStatus, "validStatus is empty.");
		
		MetadataSetDto setDto = this.getMetadataSet(medataSetId);
		if (setDto == null) throw new ResNotFoundException("메타데이터 셋 데이터가 존재하지 않습니다.");
				
		// 등록/사용 상태만 수정 가능. 사용요청/폐기 상태는 수정 불가능. 상태 변경시에는 해당 상태만.
		if (!StringUtils.equalsAny(setDto.getMedataSetSttusMtcd(), validStatus)) {
			throw new ResBizInfoException("[" + setDto.getMedataSetNm() + "] 처리할 수 없는 데이터입니다. (상태: " + setDto.getMedataSetSttusMtcdNm() + ")");
		}
		
		return setDto;
	}	
	
	/**
	 * 메타데이터 셋 수정 (from setVo) - 비정형 모델
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param metadataSetSaveDto
	 * @return
	 */
	public int modifyMetadataSetFromSetVo(MetadataSetSaveDto metadataSetSaveDto) {
		log.debug("[메타데이터 셋 수정 (from setVo)] 서비스 시작");
		int cnt = 0;
	
		try {
			// 1. 유효성 체크
			if (metadataSetSaveDto == null) throw new ResBadRequestException(4000, "메타데이터 셋에 필요한 정보가 없습니다.");
			
			String medataSetId = metadataSetSaveDto.getMedataSetId();
			
			// 등록/미사용 상태만 수정 가능. 사용요청/사용/폐기 상태는 수정 불가능.
			MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(medataSetId, Constant.SET_STATUS_REG, Constant.SET_STATUS_UN);			
			
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 2. 메타데이터 셋을 수정하고 셋에 해당하는 특수 메타데이터들을 저장
			cnt = this.modifyMetadataSetAndMetadataForSet(modelInfoDto, metadataSetSaveDto);
			
			// 3. 연결 메타데이터 셋 프라퍼티 가 존재하면 연결 정보 등록 
			if (StringUtils.isNotBlank(metadataSetSaveDto.getCnctMedataSetId()) || StringUtils.isNotBlank(metadataSetSaveDto.getCnctPrptyId())) {
				if (StringUtils.isNotBlank(metadataSetSaveDto.getCnctMedataSetId()) && StringUtils.isNotBlank(metadataSetSaveDto.getCnctPrptyId()) ) {
					// 연결 메타데이터 셋 프라프티 정보 저장 (상위로 연결)
					MetadataConnectDto metadataConnectDto = new MetadataConnectDto();
					metadataConnectDto.setMedataSetId(metadataSetSaveDto.getCnctMedataSetId());
					metadataConnectDto.setPrptyId(metadataSetSaveDto.getCnctPrptyId());
					metadataConnectDto.setMedataVal(medataSetId);
					this.saveCnctMetadataSetProperty(metadataConnectDto);
					
				} else {
					throw new ResBadRequestException(4000, "연결 메타데이터 셋과 연결 프라퍼티 정보가 모두 필요합니다.");					
				}
			}
			
			// 4. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, prevSetDto, null, null);		
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터 셋 수정 (from setVo)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 셋 수정 (from setVo)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
	
		log.debug("[메타데이터 셋 수정 (from setVo)] 서비스 종료");
		return cnt;
	}
	
	/**
	 * 메타데이터 셋 과 셋의 연결(관계) 메타데이터 등록
	 * @Author      : heenim
	 * @Date        : 2023. 05. 26.
	 * @param metadataConnectDto
	 * @return
	 */
	public int saveCnctMetadataSetProperty(MetadataConnectDto metadataConnectDto) {
		log.debug("[메타데이터 셋 과 셋의 연결(관계) 메타데이터 등록] 서비스 시작");
		int cnt = 0;
    	StringBuilder sb = new StringBuilder();
    	
		try {
			// 1. 유효성 체크
			if (metadataConnectDto == null) throw new ResBadRequestException(4000, "메타데이터 셋에 필요한 정보가 없습니다.");
	    	
	    	// 필수 체크
	    	if (StringUtils.isBlank(metadataConnectDto.getMedataSetId())) { sb.append("연결 메타데이터 셋 ID").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(metadataConnectDto.getPrptyId())) { sb.append("연결 프라퍼티 ID").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(metadataConnectDto.getMedataVal())) { sb.append("연결되는 값 메타데이터 셋 ID").append(ValueUtil.required()).append("\n"); }
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());		
			
	    	// 등록/미사용 상태만 수정 가능. 사용요청/사용/폐기 상태는 수정 불가능.
			MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(metadataConnectDto.getMedataSetId(), Constant.SET_STATUS_REG, Constant.SET_STATUS_UN);
	    	
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 해당 데이터가 이미 존재하는지 체크. 중복 데이터 생기지 않게 튕기자.
			String propertyNm = modelInfoDto.getPropertyNmById(metadataConnectDto.getPrptyId());
			if (propertyNm == null) throw new ResBizInfoException(modelInfoDto.getModelNm() + " - " + metadataConnectDto.getPrptyId() + " : 모델에 속한 프라퍼티가 아닙니다.");
			
			MetadataPropertySearchVo paramVo = new MetadataPropertySearchVo();
			paramVo.setMedataSetId(metadataConnectDto.getMedataSetId());
			paramVo.setPrptyNm(propertyNm);
			paramVo.setMedataVal(metadataConnectDto.getMedataVal());
			List<MetadataPropertyDto> prevDataList = metadataMapper.selectMetadataListByPropertyNm(paramVo);
			if (prevDataList != null && !prevDataList.isEmpty()) {
				if (prevDataList.size() == 1) {
					throw new ResBizInfoException(propertyNm + " : 에 해당 값이 이미 존재합니다. (" + metadataConnectDto.getMedataVal() + ")");
					
				} else if (prevDataList.size() > 1) {
					throw new ResBizInfoException(propertyNm + " : 데이터가 여러 건이 존재합니다.");
				}
    		}
			
			// 값이 등록된 메타데이터 셋인지 확인.
			MetadataSetDto valSetDto = this.getMetadataSet(metadataConnectDto.getMedataVal());
			if (valSetDto == null) throw new ResBizInfoException("값(메타데이터 셋 ID)에 대한 정보가 존재하지 않습니다.");
			
			// 프라퍼티 범위 모델에 해당하는 값인지 확인
			ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(propertyNm);
			if ("data_type".equals(pDto.getRangeModelTypeMtcd())) {
				if (!StringUtils.equals(valSetDto.getModelId(), pDto.getRangeModelId())) {
					throw new ResBizInfoException(String.join("", propertyNm, " : (", pDto.getRangeModelNm(), " ", pDto.getRangeModelLogicNm(), ") 범위 모델과 (", valSetDto.getModelNm(), " ", valSetDto.getModelLogicNm(), ") 값 모델이 동일하지 않습니다."));
				}
			} else { // object_type
				// 원래 설계는 object type 모델명도 똑같은 것만 하려고 했으나... 유형 모델이 같은 것까지 허용. FIXME 요구 조건이 바뀐다면 data_type 과 같은 로직으로 수정할 것!
				if (!StringUtils.equals(valSetDto.getTypeModelId(), pDto.getRangeTypeModelId())) {
					throw new ResBizInfoException(String.join("", propertyNm, " : (", pDto.getRangeTypeModelNm(), ") 범위 모델의 유형과 (", valSetDto.getTypeModelNm(), " ", valSetDto.getTypeModelLogicNm(), ") 값 모델의 유형이 동일하지 않습니다."));
				}
			}
			
			// 2. 메타데이터 등록
			
			// 메타데이터 값 설정
			List<MetadataSaveDto> dataDtoList = new ArrayList<>();
			MetadataSaveDto saveDto = new MetadataSaveDto();
			saveDto.setPrptyId(metadataConnectDto.getPrptyId());		
			saveDto.setMedataVal(metadataConnectDto.getMedataVal());
			dataDtoList.add(saveDto);
			
			// 데이터 유효성 체크
			this.checkMetadataSaveDtoList(modelInfoDto, prevSetDto, dataDtoList);
			
			// 등록
			cnt = this.saveMetadataSaveDtoList(modelInfoDto, prevSetDto, dataDtoList, true, true);
			
			// 3. 개수 프라퍼티 저장
			List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, prevSetDto);
			if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
				this.saveMetadataSaveDtoList(modelInfoDto, prevSetDto, cntPrptySaveDtoList, true, false);
			}
			
			// 4. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, prevSetDto, null, null);
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터 셋 과 셋의 연결(관계) 메타데이터 등록] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 셋 과 셋의 연결(관계) 메타데이터 등록] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
	
		log.debug("[메타데이터 셋 과 셋의 연결(관계) 메타데이터 등록] 서비스 종료");
		return cnt;
	}
	
	/**
	 * 메타데이터셋 과 메타데이터 삭제 - 비정형 모델
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param medataSetId
	 * @param typeModelVo
	 * @param checkTypeModel
	 * @return
	 */
	public int deleteMetadataSetAndMetadataBySetId(String medataSetId, ModelVo typeModelVo, boolean checkTypeModel) {
		log.debug("[메타데이터셋 과 메타데이터 삭제] 서비스 시작 - {}", medataSetId);
		int cnt = 0;
    	StringBuilder sb = new StringBuilder();
    	String logRegrId = AuthUtil.getLoginUserId();
    	
		try {
			// 1. 유효성 체크
			
	    	// 필수 체크
	    	if (StringUtils.isBlank(medataSetId)) { sb.append("medataSetId").append(ValueUtil.required()).append("\n"); }
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());
			
			// 등록 상태만 삭제 가능.
	    	MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(medataSetId, Constant.SET_STATUS_REG);		
	    	
	    	// 필요시 유형 체크
	    	if (checkTypeModel) { 
				if (typeModelVo == null || !StringUtils.equals(typeModelVo.getModelId(), prevSetDto.getTypeModelId())) {
					throw new ResNotFoundException("해당 유형의 리소스가 존재하지 않습니다.");
				}
	    	}
	    	
	    	// 2. 삭제 전 데이터 조회 (카프카 전송용)
	    	ListOrderedMap<String, Object> delDataMap = this.getMetadataForKafka(medataSetId);
	    	MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
			metadataSearchVo.setIsPaging(false);
			metadataSearchVo.setMedataSetId(medataSetId);
			List<CamelCaseMap> delUpSetList = metadataSetMapper.selectMetadataSetDtwListBySubSetId(metadataSearchVo);
	    		    	
	    	// 3-1. 연결(상위) 메타데이터 셋 체크 (나를 하위에 가지고 있고 상태가 [사용]인 메타데이터 셋 조회)
	    	MetadataSearchVo paramVo = new MetadataSearchVo();
	    	paramVo.setExceptForMetadataSetYn("Y");
	    	paramVo.setMedataSetSttusMtcd(Constant.SET_STATUS_USE);
	    	paramVo.setMedataVal(medataSetId);
	    	int superCnt = metadataSetMapper.selectMetadataSetCount(paramVo);
	    	if (superCnt > 0) throw new ResBizInfoException("연결된 메타데이터 셋(" + superCnt + "건) 이 사용 상태입니다. 삭제할 수 없습니다.");
	    	
	    	// 3-2. 연결(상위) 메타데이터 셋에서 현재 메타데이터를 삭제
	    	MetadataSearchVo paramVo2 = new MetadataSearchVo();
	    	paramVo2.setIsPaging(false);
	    	paramVo2.setExceptForMetadataSetYn("Y");
	    	paramVo2.setMedataVal(medataSetId);
	    	List<CamelCaseMap> superlist = metadataMapper.selectMetadataList(paramVo2);
	    	if (superlist != null && superlist.size() > 0) {
	    		for (CamelCaseMap delMap : superlist) {
	    			String medataId = String.valueOf(delMap.get("medataId"));
	    			this.deleteMetadata(medataId); // 연결 메타데이터 셋의 상태에 따라 삭제 처리 진행. 변경이력 등록.
	    		}
	    	}

	    	// 4. 메타데이터 셋 ID로 메타데이터 전체 삭제
	    	metadataMapper.deleteMetadataAllBySetId(medataSetId);

			// 5. 메타데이터 셋 삭제
	    	MetadataSetVo delParamVo = new MetadataSetVo();
	    	delParamVo.setMedataSetId(medataSetId);
			cnt = metadataSetMapper.deleteMetadataSet(delParamVo);
			
			// 6. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_DELETE, prevSetDto, delDataMap, delUpSetList);
			
			// 7. influxDB에서 메타데이터 셋 키워드 삭제
			CompletableFuture.runAsync(() -> { // 비동기 처리	
				try {
					influxDbService.deleteKeywordDataBySetId(medataSetId, logRegrId, prevSetDto.getMedataSetRegDt(), null);
					log.debug("[메타데이터셋 과 메타데이터 삭제] influxDB에서 키워드 정보 삭제 : {}", medataSetId);
					
				} catch (Exception e) {
					log.error("[메타데이터셋 과 메타데이터 삭제] influxDB에서 키워드 정보 삭제 실패/오류 (SKIP) : {}", medataSetId, e);
				}
			}, influxExecutor);
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터셋 과 메타데이터 삭제] 실패/오류 (정보성) - {} : {}", medataSetId, e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터셋 과 메타데이터 삭제] 실패/오류 - {}", medataSetId, e);
			throw new ResBaseRuntimeException(e);
		}		
	
		log.debug("[메타데이터셋 과 메타데이터 삭제] 서비스 종료 - {}", medataSetId);
		return cnt;
	}
		
	/**
	 * 메타데이터 셋 상태 변경
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param metadataSetVo
	 * @param typeModelVo
	 * @param checkTypeModel
	 * @return
	 */
	public int modifyMetadataSetStatusFromSetVo(MetadataSetVo metadataSetVo, ModelVo typeModelVo, boolean checkTypeModel) {
		log.debug("[메타데이터 셋 상태 변경] 서비스 시작");
		int cnt = 0;
    	StringBuilder sb = new StringBuilder();
    	
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		if (loginUserVo == null) { // 비동기 처리시 null 될 수 있음. 
			loginUserVo = metadataSetVo.getAsyncUserVo();
		}
    	
		try {
			// 1. 유효성 체크
			
	    	// 필수 체크
	    	if (metadataSetVo == null) throw new ResBadRequestException(4000, "메타데이터 셋에 필요한 정보가 없습니다.");
	    	if (StringUtils.isBlank(metadataSetVo.getMedataSetId())) { sb.append("medataSetId").append(ValueUtil.required()).append("\n"); } 	
	    	if (StringUtils.isBlank(metadataSetVo.getMedataSetSttusMtcd())) { sb.append("medataSetSttusMtcd").append(ValueUtil.required()).append("\n"); }
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());

	    	String medataSetId = metadataSetVo.getMedataSetId();
	    	
	    	// 전 데이터 조회
			MetadataSetDto prevSetDto = this.getMetadataSet(medataSetId);
			if (prevSetDto == null) throw new ResBizInfoException("메타데이터 셋 데이터가 존재하지 않습니다.");
			
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
	    	// 필요시 유형 체크
	    	if (checkTypeModel) { 
				if (typeModelVo == null || !StringUtils.equals(typeModelVo.getModelId(), prevSetDto.getTypeModelId())) {
					throw new ResNotFoundException("해당 유형의 리소스가 존재하지 않습니다.");
				}
	    	}

			// 2-1. 등록, 미사용 -> 사용 상태 변경
			if (StringUtils.equals(Constant.SET_STATUS_USE, metadataSetVo.getMedataSetSttusMtcd())) {

				// 2023-09-13 로직 변경
				if (StringUtils.equalsAny(prevSetDto.getMedataSetSttusMtcd(), Constant.SET_STATUS_REG, Constant.SET_STATUS_UN)) {
					List<String> outChangedIdList = new ArrayList<>();
					
					// 현재 셋부터 하위 셋 전체를 사용 상태 변경 (하위 셋이 사용 상태로 변경이 가능한 경우만)
					Set<String> visitedIdSet = new LinkedHashSet<>();
					this.changeSetStatusHierachilyToUse(visitedIdSet, outChangedIdList, modelInfoDto, prevSetDto.getMedataSetId(), prevSetDto.getMedataSetNm(), prevSetDto.getMedataSetSttusMtcd(), metadataSetVo.getMedataSetSttusWhy(), loginUserVo);
					
					// 버투소 USE 그래프에 메타데이터 셋 정보 저장 (오류나도 SKIP)
					String logRegrId = loginUserVo.getUserId();
					for (String changedId : outChangedIdList) {
						// 비동기 처리
						CompletableFuture.runAsync(() -> {
							try {
								virtuosoService.saveRdfStatementsToGraphForUse(changedId, logRegrId);
							} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
								log.error("[메타데이터 셋 상태 변경] 버투소 USE 그래프에 메타데이터 셋 정보 저장 실패/오류 (SKIP) : {} - {}", changedId, e.getReason());
							} catch (Exception e) {
								log.error("[메타데이터 셋 상태 변경] 버투소 USE 그래프에 메타데이터 셋 정보 저장 실패/오류 (SKIP) : {}", changedId, e);
							}
						}, virtuosoExecutor);
					}
					
					// NEO4J에 메타데이터 셋 정보 저장 (오류나도 SKIP)
					for (String changedId : outChangedIdList) {
						// 비동기 처리
						CompletableFuture.runAsync(() -> {						
							try {
								neo4jService.saveNeo4jMetadataSet(changedId);
								neo4jService.saveNeo4jRdbMetadataSet(changedId);
							} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
								log.error("[메타데이터 셋 상태 변경] NEO4J에 메타데이터 셋 정보 저장 저장 실패/오류 (SKIP) : {} - {}", changedId, e.getReason());
							} catch (Exception e) {
								log.error("[메타데이터 셋 상태 변경] NEO4J에 메타데이터 셋 정보 저장 실패/오류 (SKIP) : {}", changedId, e);
							}
						}, neo4jExecutor);
					}
					
					// ElasticSearch에 메타데이터 셋 정보 저장 (오류나도 SKIP)
					for (String changedId : outChangedIdList) {
						// 비동기 처리
						CompletableFuture.runAsync(() -> {						
							try {
								elasticSearchService.saveElasticData(changedId);
							} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
								log.error("[메타데이터 셋 상태 변경] ElasticSearch에 메타데이터 셋 정보 저장 저장 실패/오류 (SKIP) : {} - {}", changedId, e.getReason());
							} catch (Exception e) {
								log.error("[메타데이터 셋 상태 변경] ElasticSearch에 메타데이터 셋 정보 저장 실패/오류 (SKIP) : {}", changedId, e);
							}
						}, elasticSearchExecutor);
					}
				} else {
					// 등록, 미사용 상태인지 체크
					throw new ResBizInfoException("[" + prevSetDto.getMedataSetNm() + "] 처리할 수 없는 데이터입니다. (상태: " + prevSetDto.getMedataSetSttusMtcdNm() + ")");
				}
				
			// TODO: 사용요청 프로세스가 필요할 수 있음, 등록 -> 사용요청 상태 변경   -- 필요한 경우 별도 메소드 생성 필요
			// TODO: 사용요청 프로세스가 필요할 수 있음, 사용요청 -> 사용 상태 변경   -- 필요한 경우 별도 메소드 생성 필요
				
			// 2-2. 사용 -> 미사용 상태 변경
			} else if (StringUtils.equals(Constant.SET_STATUS_UN, metadataSetVo.getMedataSetSttusMtcd())) {
				// 사용 상태인지 체크
				if (!StringUtils.equalsAny(prevSetDto.getMedataSetSttusMtcd(), Constant.SET_STATUS_USE)) {
					throw new ResBizInfoException("[" + prevSetDto.getMedataSetNm() + "] 처리할 수 없는 데이터입니다. (상태: " + prevSetDto.getMedataSetSttusMtcdNm() + ")");
				}				
				
				this.changeSetStatusToUnused(modelInfoDto, medataSetId, metadataSetVo.getMedataSetSttusWhy());
							
			// 2-3. 사용, 미사용 -> 폐기 상태 변경
			} else if (StringUtils.equals(Constant.SET_STATUS_DIS, metadataSetVo.getMedataSetSttusMtcd())) {
				// 사용, 미사용 상태인지 체크
				if (!StringUtils.equalsAny(prevSetDto.getMedataSetSttusMtcd(), Constant.SET_STATUS_USE, Constant.SET_STATUS_UN)) {
					throw new ResBizInfoException("[" + prevSetDto.getMedataSetNm() + "] 처리할 수 없는 데이터입니다. (상태: " + prevSetDto.getMedataSetSttusMtcdNm() + ")");
				}				
				
				this.changeSetStatusToDisuse(modelInfoDto, medataSetId, metadataSetVo.getMedataSetSttusWhy());
				
			} else {
				throw new ResBizInfoException("해당 상태로는 변경이 안됩니다.");
				
			}
			
			// 3. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, prevSetDto, null, null);			
	
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터 셋 상태 변경] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 셋 상태 변경] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
	
		log.debug("[메타데이터 셋 상태 변경] 서비스 종료");
		return cnt;
	}
	
	/**
	 * 메타데이터 셋을 등록하고 셋에 해당하는 특수 메타데이터들을 등록
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param modelInfoDto
	 * @param metadataSetSaveDto
	 * @return
	 */
	private String createMetadataSetAndMetadataForSet(ModelInfoDto modelInfoDto, MetadataSetSaveDto metadataSetSaveDto) {
		
		// ID 생성 로직 - 디지털트윈 식별체계 정보가 있을 경우 설정
		if (StringUtils.equals("Y", metadataSetSaveDto.getIdSchmUseYn())){			
			this.setIdSchmPrefix(modelInfoDto.getTypeModelId(), metadataSetSaveDto);
		}
		
		// 1. 메타데이터 셋 DB 등록
		String medataSetId = this.createMetadataSet(metadataSetSaveDto, null);
		
		// 2. 셋 용 메타데이터 들 등록
		this.saveMetadataListForSet(modelInfoDto, medataSetId, null, false, null);
		
		// 3. 개수 프라퍼티 저장
		List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, metadataSetSaveDto);
		if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
			this.saveMetadataSaveDtoList(modelInfoDto, metadataSetSaveDto, cntPrptySaveDtoList, false, false);
		}

		return medataSetId;
	}
	
	/**
	 * modelId 가 SingleDigitalTwin 단일디지털트윈, FederatedDigitalTwin 연합디지털트윈 경우만 type 강제 저장 (하드코딩) (from setVo)
	 * @Author      : heenim
	 * @Date        : 2025. 07. 28.
	 * @param medataSetId
	 * @param modelInfoDto
	 * @param metadataSetDto
	 */
	private void saveInitialDigitalTwinType(String medataSetId, ModelInfoDto modelInfoDto, MetadataSetDto metadataSetDto) {
		// 특정 모델ID 인지 확인, 특정 프라퍼티 ID 인지 확인
		if (modelInfoDto == null || !Constant.DIGITAL_TWIN_MODEL_NM.equals(modelInfoDto.getTypeModelId())) return;

		String prptyId = modelInfoDto.getPropertyId(Constant.DIGITAL_TWIN_TYPE_PROPERTY_NM);
		if (prptyId == null) return; // type 이라는 프라퍼티가 있어야 함.
		
		String typeVal = null;
		try {
			ApiDigitalTwinType enumType = ApiDigitalTwinType.fromModelId(modelInfoDto.getModelId());
			typeVal = enumType.krCode();
		} catch (IllegalArgumentException e) {
			// 해당 사항 없음. 무시.
			typeVal = null;
		}
		
		if (typeVal == null) return;

		// 저장
		List<MetadataSaveDto> dataDtoList = new ArrayList<>();
		MetadataSaveDto dataDto = new MetadataSaveDto();
		dataDto.setPrptyId(prptyId);
		dataDto.setMedataVal(typeVal);
		dataDtoList.add(dataDto);
		
		this.saveMetadataSaveDtoList(modelInfoDto, metadataSetDto, dataDtoList, false, false);
	}
	
	/**
	 * modelId 가 SingleDigitalTwin 단일디지털트윈, FederatedDigitalTwin 연합디지털트윈 경우만 type 강제 설정 (하드코딩) (from dataMap)
	 * @Author      : heenim
	 * @Date        : 2025. 07. 28.
	 * @param medataSetId
	 * @param modelInfoDto
	 * @param dataMap
	 */
	private void setInitialDigitalTwinType(String medataSetId, ModelInfoDto modelInfoDto, ListOrderedMap<String, Object> dataMap) {
		// 특정 모델ID 인지 확인, 특정 프라퍼티 ID 인지 확인
		if (modelInfoDto == null || !Constant.DIGITAL_TWIN_MODEL_NM.equals(modelInfoDto.getTypeModelId())) return;
		
		String typePrptyNm = Constant.DIGITAL_TWIN_TYPE_PROPERTY_NM;
		String prptyId = modelInfoDto.getPropertyId(typePrptyNm);
		if (prptyId == null) return; // type 이라는 프라퍼티가 있어야 함.
		
		String typeVal = null;
		try {
			ApiDigitalTwinType enumType = ApiDigitalTwinType.fromModelId(modelInfoDto.getModelId());
			typeVal = enumType.krCode();
		} catch (IllegalArgumentException e) {
			// 해당 사항 없음. 무시.
			typeVal = null;
		}
		
		if (typeVal == null) return;
		
		// 값이 비어 있는 경우 강제 설정
		dataMap.put(typePrptyNm, StringUtils.defaultIfBlank((String) dataMap.get(typePrptyNm), typeVal));
	}	
	
	/**
	 * 메타데이터 셋을 수정하고 셋에 해당하는 특수 메타데이터들을 저장
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param modelInfoDto
	 * @param metadataSetVo
	 * @return
	 */
	private int modifyMetadataSetAndMetadataForSet(ModelInfoDto modelInfoDto, MetadataSetVo metadataSetVo) {
		int cnt = 0;
		
		// 1. 수정 전 변경이력을 위한 셋 용 메타데이터 들 조회
		MetadataSetVo idParamVo = new MetadataSetVo();
		idParamVo.setMedataSetId(metadataSetVo.getMedataSetId());
		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
		idParamVo.setSqlDateFormat(SqlDatePart.iso6z.format());
		List<MetadataChgHstSaveDto> prevSetValueList = metadataChgHstMapper.selectSelValueListBySetIdForChgHst(idParamVo);
		
		// 2. 메타데이터 셋 DB 수정
		cnt = this.modifyMetadataSet(metadataSetVo);
		
		// 3. 셋 용 메타데이터 들 저장
		this.saveMetadataListForSet(modelInfoDto, metadataSetVo.getMedataSetId(), prevSetValueList, true, null);
		
		return cnt;
	}
	
	/**
	 * 메타데이터 셋 ID 로 내용을 조회하여 해당하는 특수 메타데이터들을 저장. 
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param modelInfoDto
	 * @param medataSetId
	 * @param prevSetValueList
	 * @param isIncreaseRevision
	 * @param asyncUserVo
	 */
	private void saveMetadataListForSet(ModelInfoDto modelInfoDto, String medataSetId, List<MetadataChgHstSaveDto> prevSetValueList, boolean isIncreaseRevision, LoginUserVo asyncUserVo) {
		
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		if (loginUserVo == null) { // 비동기 처리시 null 될 수 있음. 
			loginUserVo = asyncUserVo;
		}
		
		// 1. 새롭게 저장된 메타데이터 셋 조회
		MetadataSetVo paramVo1 = new MetadataSetVo();
		paramVo1.setMedataSetId(medataSetId);
		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
		paramVo1.setSqlDateFormat(SqlDatePart.iso6z.format());
		MetadataSetDto metadataSetDto = metadataSetMapper.selectMetadataSet(paramVo1);
		metadataSetDto.setAsyncUserVo(asyncUserVo);
				
		// 2. 기존 메타데이터 셋 특수 범위 모델의 메타데이터 목록 조회
		MetadataSearchVo paramVo2 = new MetadataSearchVo();
		paramVo2.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
		paramVo2.setMedataSetId(medataSetId);
		paramVo2.setOnlyMetadataSetYn("Y");
		List<MetadataVo> metaList = metadataMapper.selectMetadataSimpleListBySetId(paramVo2);
						
		List<MetadataSaveDto> metaSaveList = new ArrayList<>();
		
		// 3. 메타데이터 셋 특수 범위 모델의 프라퍼티에 해당하는 것을 찾기
		for (Map.Entry<String, String> sMap : modelInfoDto.getSelColToPropertyNmMap().entrySet()) {
			boolean bFound = false;					
			String metadataSetCol = sMap.getKey();
			String propertyNm     = sMap.getValue();
			String propertyId	  = modelInfoDto.getPropertyId(propertyNm);
			
			String val = null;
			try {
				val = (String) FieldUtils.readField(metadataSetDto, metadataSetCol, true);
				log.debug("readField {} -> {} = {}", metadataSetCol, propertyNm, val);
			} catch (IllegalArgumentException e1) {
				log.debug("readField {} -> {} ERROR - SKIP! : {}", metadataSetCol, propertyNm, e1.getMessage());
			} catch (IllegalAccessException e1) {
				log.error("readField {} -> {} 실패/오류", sMap.getKey(), sMap.getValue(), e1);
				
				throw new ResBaseRuntimeException(e1);
			}
			
			// 4. 찾으면 메타데이터 수정
			if (metaList != null && !metaList.isEmpty()) {
				for (MetadataVo tVo : metaList) {
					if (StringUtils.equals(propertyId, tVo.getPrptyId())) {
						
						if (!StringUtils.equals(val, tVo.getMedataVal())) {
							MetadataVo newVo = this.getMetadataVoFromMetadata(medataSetId, val, null, modelInfoDto.getPropertyInfoDto(propertyNm), tVo.getMedataId());
							metaSaveList.add(new MetadataSaveDto(newVo));
						}
						
						bFound = true;
						break;
					}
				}
			}
			
			// 5. 못찾으면 등록
			if (!bFound) {
				MetadataVo newVo = this.getMetadataVoFromMetadata(medataSetId, val, null, modelInfoDto.getPropertyInfoDto(propertyNm));
				if (newVo != null) {
					metaSaveList.add(new MetadataSaveDto(newVo));
				}
			}
		}
		
		// 6. 셋 용 메타데이터 들 저장
		this.saveMetadataSaveDtoList(modelInfoDto, metadataSetDto, metaSaveList, false, false);
		
		// 7. 셋 용 변경이력 등록
    	if (!Constant.SET_STATUS_REG.equals(metadataSetDto.getMedataSetSttusMtcd())) { // 셋이 등록 상태가 아닌 경우
    		MetadataChgHstSaveDto prevHstDto = null;
    		
    		if (isIncreaseRevision) {
    			// 8. 리비전 증가
	    		metadataSetDto.setMedataSetAmdrId(loginUserVo.getUserId());
	    		metadataSetDto.setMedataSetAmdrNm(loginUserVo.getUserNm());
				metadataSetMapper.updateMetadataSetNwstRvsn(metadataSetDto);
    		}
    		
    		// 9. 수정 후 변경이력을 위한 셋 용 메타데이터 들 조회
    		MetadataSetVo idParamVo = new MetadataSetVo();
    		idParamVo.setMedataSetId(metadataSetDto.getMedataSetId());
    		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
    		idParamVo.setSqlDateFormat(SqlDatePart.iso6z.format());	
    		List<MetadataChgHstSaveDto> currSetValueList = metadataChgHstMapper.selectSelValueListBySetIdForChgHst(idParamVo);
    		if (currSetValueList != null && currSetValueList.size() > 0) {
    			for (MetadataChgHstSaveDto currHstDto : currSetValueList) {
  
    				prevHstDto = null;
    				if (prevSetValueList != null && prevSetValueList.size() > 0) {
    					prevHstDto = prevSetValueList.stream()
    							.filter(x -> StringUtils.equals(currHstDto.getPrptyId(), x.getPrptyId()))
    							.findFirst()
    							.orElse(null);
    				}
    				
    				if (prevHstDto != null) {
    					if (!StringUtils.equals(prevHstDto.getChgAftrVal(), currHstDto.getChgAftrVal())) {
    			    		// 10. 변경이력 등록
    						currHstDto.setChgHstDivMtcd("amd");
    						currHstDto.setChgHstRegrId(loginUserVo.getUserId());
    						currHstDto.setChgHstRegrNm(loginUserVo.getUserNm());
    						metadataChgHstMapper.insertMetadataChgHstAutoKey(currHstDto);
    					}
    				} else {
			    		// 10. 변경이력 등록
						currHstDto.setChgHstDivMtcd("reg");
						currHstDto.setChgHstRegrId(loginUserVo.getUserId());
						currHstDto.setChgHstRegrNm(loginUserVo.getUserNm());
						metadataChgHstMapper.insertMetadataChgHstAutoKey(currHstDto);
    				}
    			}
    		}
    	}			
	}
	
	/** 
	 * 디지털트윈 연합 식별체계 의 ID prefix 설정
	 * @Author      : heenim
	 * @Date        : 2024. 02. 19.
	 * @param typeModelId
	 * @param metadataSetVo
	 */
	private void setIdSchmPrefix(String typeModelId, MetadataSetSaveDto metadataSetSaveDto) {
		
		String applyDtModelId  = dtmetaProperty.getIdSchmDigitalTwin();
		String applyObjModelId = dtmetaProperty.getIdSchmDigitalTwinObject();
		String applyObjVmModelId = dtmetaProperty.getIdSchmDigitalTwinObjectVm();
		
		if (StringUtils.equals(applyDtModelId, typeModelId)) {
			/*
			 * 디지털트윈 식별체계 (21자리) -------------------------------------
			 * 국가코드 (2자리) : ISO 3166-1 alpha-2 표준을 활용하며 알파벳 두 자리로 구성. ex) 대한민국=KR
			 * 분류체계 종류 코드 (2자리) : 01 표준산업분류체계 / 02 공공자원분류체계
			 * 분류체계 코드 (6자리) : 
			 * - 표준산업분류체계 : 대분류 (1자리) + 세세분류 (5자리)
			 * - 공공자원분류체계 : 대분류 (1자리) + 중분류 (5자리) 
			 * 생성연도 (4자리)
			 * 일련번호 (4자리)
			 * 
			 * ex) KR-01-A10000-20240001
			 */			
			StringBuilder sb = new StringBuilder();
			
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmCntryCd())) { sb.append("디지털트윈 식별체계 국가코드").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmType())) { sb.append("디지털트윈 식별체계 분류코드 종류").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmCd())) { sb.append("디지털트윈 식별체계 코드").append(ValueUtil.required()).append("\n"); }
			
			// TODO 위 세 값이 옯은 값인지 체크. NOTE: 우선 전체 코드값을 가지고 있지 않을 수 있기 때문에 체크하지 않는다.
			
	    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());
			
			String prefix = metadataSetSaveDto.getIdSchmCntryCd() + "-" + metadataSetSaveDto.getIdSchmType() + "-" + metadataSetSaveDto.getIdSchmCd() + "-";
			log.debug("디지털트윈 식별체계 prefix : {} {}", prefix, prefix.length() + "lengths");
			metadataSetSaveDto.setIdSchmPrefix(prefix);
			metadataSetSaveDto.setIdSchmYearUseYn("Y");
			metadataSetSaveDto.setIdSchmSeqGenYn("Y");
						
		} else if (StringUtils.equals(applyObjModelId, typeModelId)) {
		
			/*
			 * 디지털트윈 객체 식별체계 (14자리 이상) -------------------------------------
			 * 국가코드 (2자리) : ISO 3166-1 alpha-2 표준을 활용하며 알파벳 두 자리로 구성. ex) 대한민국=KR
			 * 분류체계 코드 대분류 (1자리) : 1 물품 / 2 시설 / 3 지형지물
			 * 분류체계 코드 중분류 (5자리), 지형지물은 (16자리)
			 * 일련번호 (4자리) // TODO 이슈!!! 4자리로 충분한가?!!!!!
			 * 
			 * ex) KR-101010-0001, KR-213000-0001, KR-3A001000012345678-0001
			 */			
			StringBuilder sb = new StringBuilder();
			
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmCntryCd())) { sb.append("디지털트윈 객체 식별체계 국가코드").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmType())) { sb.append("디지털트윈 객체 식별체계 분류코드 (대분류)").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmCd())) { sb.append("디지털트윈 객체 식별체계 분류코드 (중분류)").append(ValueUtil.required()).append("\n"); }
			
			// TODO 위 세 값이 옯은 값인지 체크. NOTE: 우선 전체 코드값을 가지고 있지 않을 수 있기 때문에 체크하지 않는다.
			
	    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());

			String prefix = metadataSetSaveDto.getIdSchmCntryCd() + "-" + metadataSetSaveDto.getIdSchmType() + metadataSetSaveDto.getIdSchmCd() + "-";
			log.debug("디지털트윈 객체 식별체계 prefix : {} {}", prefix, prefix.length() + "lengths");
			metadataSetSaveDto.setIdSchmPrefix(prefix);
			metadataSetSaveDto.setIdSchmYearUseYn("N");
			metadataSetSaveDto.setIdSchmSeqGenYn("Y");
			
		} else if (StringUtils.equals(applyObjVmModelId, typeModelId)) {
			
			/*
			 * 디지털트윈 시각화모델 식별체계 (16자리 이상) -------------------------------------
			 * 국가코드 (2자리) : ISO 3166-1 alpha-2 표준을 활용하며 알파벳 두 자리로 구성. ex) 대한민국=KR
			 * 분류체계 코드 대분류 (1자리) : 1 물품 / 2 시설 / 3 지형지물
			 * 분류체계 코드 중분류 (5자리), 지형지물은 (16자리)
			 * - 여기까지는 객체 식별체계와 동일...
			 * 3D 모델 객체 분류코드 (1자리) : 1 Mesh / 2 CSG Primitive / 3 NURBS / M Mixed
			 * 일련번호 (4자리) // TODO 이슈!!! 4자리로 충분한가?!!!!!
			 * 
			 * ex) KR-101010-1-0001, KR-213000-1-0001, KR-3A001000012345678-1-0001
			 */			
			StringBuilder sb = new StringBuilder();
			
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmCntryCd())) { sb.append("디지털트윈 시각화모델 식별체계 국가코드").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmType())) { sb.append("디지털트윈 시각화모델 식별체계 분류코드 (대분류)").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmCd())) { sb.append("디지털트윈 시각화모델 식별체계 분류코드 (중분류)").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(metadataSetSaveDto.getIdSchmCd2())) { sb.append("디지털트윈 시각화모델 식별체계 분류코드 (3D모델객체분류)").append(ValueUtil.required()).append("\n"); }
			
			// TODO 위 세 값이 옯은 값인지 체크. NOTE: 우선 전체 코드값을 가지고 있지 않을 수 있기 때문에 체크하지 않는다.
			
	    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());

			String prefix = metadataSetSaveDto.getIdSchmCntryCd() + "-" + metadataSetSaveDto.getIdSchmType() + metadataSetSaveDto.getIdSchmCd() + "-" + metadataSetSaveDto.getIdSchmCd2() + "-";
			log.debug("디지털트윈 시각화모델 식별체계 prefix : {} {}", prefix, prefix.length() + "lengths");
			metadataSetSaveDto.setIdSchmPrefix(prefix);
			metadataSetSaveDto.setIdSchmYearUseYn("N");
			metadataSetSaveDto.setIdSchmSeqGenYn("Y");
			
		}
		
	}
	
	/**
	 * 메타데이터 셋 등록
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param metadataSetVo
	 * @parma asyncUserVo
	 * @return
	 */
	private String createMetadataSet(MetadataSetVo metadataSetVo, LoginUserVo asyncUserVo) {
    	StringBuilder sb = new StringBuilder();
    	
    	// 필수 체크
    	if (metadataSetVo == null) throw new ResBadRequestException(4000, "메타데이터 셋에 필요한 정보가 없습니다.");
    	if (StringUtils.isBlank(metadataSetVo.getModelId())) { sb.append("modelId").append(ValueUtil.required()).append("\n"); } 	
    	if (StringUtils.isBlank(metadataSetVo.getMedataSetNm())) { sb.append("medataSetNm").append(ValueUtil.required()).append("\n"); } 
    	if (StringUtils.isNotBlank(metadataSetVo.getMedataSetSttusMtcd()) 
    		&& !StringUtils.equalsAny(metadataSetVo.getMedataSetSttusMtcd(), Constant.SET_STATUS_REG, Constant.SET_STATUS_USE, Constant.SET_STATUS_UN)) {
    		sb.append("medataSetSttusMtcd").append(ValueUtil.invalid()).append("\n"); 
    	}
    	
    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());
    	
    	// 기본값 설정
    	if (StringUtils.isBlank(metadataSetVo.getMedataSetLogicNm())) { 
    		metadataSetVo.setMedataSetLogicNm(metadataSetVo.getMedataSetNm()); 
    	}
    	if (StringUtils.isBlank(metadataSetVo.getMedataSetSttusMtcd())) { 
    		metadataSetVo.setMedataSetSttusMtcd(Constant.SET_STATUS_REG); // regist 등록
    		metadataSetVo.setMedataSetNwstRvsn(0);
    	} 
    	
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		if (loginUserVo == null) { // 비동기 처리시 null 될 수 있음. 
			loginUserVo = asyncUserVo;
		}
		metadataSetVo.setMedataSetRegrId(loginUserVo.getUserId());
		metadataSetVo.setMedataSetRegrNm(loginUserVo.getUserNm());
		
		if (StringUtils.isNotBlank(metadataSetVo.getIdSchmPrefix())) {
			// 디지털트윈 연합 식별체계로 ID 생성 및 메타데이터 셋 등록
			metadataSetMapper.insertMetadataSetAutoKey(metadataSetVo);
			
		} else {
			// random ID 생성
			String medataSetId = SecurityUtil.generateRandomHyphenId(); // 25자 random Unique ID (거의 중복 확률 없다고 함)
			metadataSetVo.setMedataSetId(medataSetId);

			// 등록
			metadataSetMapper.insertMetadataSet(metadataSetVo);
		}
	
		return metadataSetVo.getMedataSetId();
	}
	
	/**
	 * 메타데이터 셋 수정
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param metadataSetVo
	 * @return
	 */
	private int modifyMetadataSet(MetadataSetVo metadataSetVo) {
    	StringBuilder sb = new StringBuilder();
    	
    	// 필수 체크
    	if (metadataSetVo == null) throw new ResBadRequestException(4000, "메타데이터 셋에 필요한 정보가 없습니다.");
    	if (StringUtils.isBlank(metadataSetVo.getMedataSetId())) { sb.append("medataSetId").append(ValueUtil.required()).append("\n"); }
    	if (StringUtils.isBlank(metadataSetVo.getModelId())) { sb.append("modelId").append(ValueUtil.required()).append("\n"); }
    	if (StringUtils.isBlank(metadataSetVo.getMedataSetNm())) { sb.append("medataSetNm").append(ValueUtil.required()).append("\n"); }
    	
    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());
    	
    	// 기본값 설정
    	if (StringUtils.isBlank(metadataSetVo.getMedataSetLogicNm())) { 
    		metadataSetVo.setMedataSetLogicNm(metadataSetVo.getMedataSetNm()); 
    	}
    	
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		metadataSetVo.setMedataSetAmdrId(loginUserVo.getUserId());
		metadataSetVo.setMedataSetAmdrNm(loginUserVo.getUserNm());

		// 수정
		return metadataSetMapper.updateMetadataSet(metadataSetVo);
	}
	
	/**
	 * 메타데이터 셋을 사용 상태로 변경 + 하위 메타데이터 셋 전체도 사용 상태로 변경(사용 상태 아닌 경우)
	 * 폐기(제외) 상태인 하위 셋은 건너뛴다. 이미 들른 셋도 건너뛰어 자기 참조·상호 참조로 재귀가 끝나지 않는 것을 막는다.
	 * @Author      : heenim
	 * @Date        : 2023. 09. 13.
	 * @param visitedIdSet
	 * @param outChangedIdList
	 * @param modelInfoDto
	 * @param medataSetId
	 * @param medataSetLabel
	 * @param prevStatus
	 * @param statusWhy
	 * @param asyncUserVo
	 */
	private void changeSetStatusHierachilyToUse(Set<String> visitedIdSet, List<String> outChangedIdList, ModelInfoDto modelInfoDto, String medataSetId, String medataSetLabel, String prevStatus, String statusWhy, LoginUserVo asyncUserVo) {
		// 이미 들른 셋이면 건너뛴다. 자기 자신이나 서로를 참조하고 있으면 재귀가 끝나지 않는다.
		// 먼저 들른 쪽이 하위 처리를 마친 뒤 상태를 바꾸므로 건너뛰어도 누락되지 않는다.
		if (!visitedIdSet.add(medataSetId)) return;
		
		StringBuilder sb = new StringBuilder();
		int errCnt = 0;
		
		// 1. 필수 체크
		MetadataSearchVo paramVo1 = new MetadataSearchVo();
		paramVo1.setModelId(modelInfoDto.getModelId());
		paramVo1.setMedataSetId(medataSetId);
		paramVo1.setPageListSize(Constant.ERR_MSG_LIMIT_CNT);
		List<CamelCaseMap> propertyList = metadataMapper.selectMetadataPropertyListBySetIdForRequiredCheck(paramVo1);
		if (propertyList != null && !propertyList.isEmpty()) {
			sb.append("[").append(medataSetLabel).append("]\n");
			for (CamelCaseMap tMap : propertyList) {
				sb.append(tMap.get("prptyNm")).append(ValueUtil.required()).append("\n");
				errCnt++;
				
				if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
					break;
				}	
			}
		}
		
		// 2. 모델과 데이터 정합성 체크 - 배열 프라퍼티가 아닌 데이터의 건수가 1 초과인지 체크
		MetadataSearchVo paramVo2 = new MetadataSearchVo();
		paramVo2.setModelId(modelInfoDto.getModelId());
		paramVo2.setMedataSetId(medataSetId);
		paramVo2.setPageListSize(Constant.ERR_MSG_LIMIT_CNT);		
		List<CamelCaseMap> propertyList2 = metadataMapper.selectMetadataPropertyListBySetIdForCountCheck(paramVo2);
		if (propertyList2 != null && !propertyList2.isEmpty()) {
			if (errCnt == 0) sb.append("[").append(medataSetLabel).append("]\n");
			for (CamelCaseMap tMap : propertyList2) {
				sb.append(tMap.get("prptyNm")).append(" : 배열 프라퍼티가 아닌 데이터가 여러 건이 존재합니다. (").append(tMap.get("valCnt")).append("건)").append("\n");
				errCnt++;
				
				if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
					break;
				}	
			}
		}
		
		// 3. DataType 모델 데이터 유효성 체크 - 이미 저장된 DataType 모델의 데이터는 유효하다고 본다.
		// nothing
		
		if (errCnt > 0) throw new ResBadRequestException(4000, sb.toString());
		
		// 현재 메타데이터 셋 체크시 문제가 없다면 하위 메타데이터 셋들을 체크
		
		// 4. ObjectType 모델 데이터 유효성 체크 (사용 상태가 아닌 것)
		MetadataSearchVo paramVo3 = new MetadataSearchVo();
		paramVo3.setMedataSetId(medataSetId);
		paramVo3.setPageListSize(Constant.ERR_MSG_LIMIT_CNT);
		List<CamelCaseMap> valueList = metadataMapper.selectMetadataValStatusListBySetIdForObjectTypeCheck(paramVo3);
		if (valueList != null && !valueList.isEmpty()) {
			for (CamelCaseMap tMap : valueList) {
				// 폐기(제외) 상태인 셋은 건드리지 않는다. 사용자가 일부러 내린 상태라 상위 셋 전환으로 되살리지 않는다.
				if (StringUtils.equals(Constant.SET_STATUS_DIS, String.valueOf(tMap.get("medataValSttusMtcd")))) continue;
				
				String subModelId = String.valueOf(tMap.get("medataValModelId"));
				ModelInfoDto subModelInfoDto = modelService.getModelInfoByIdFromCache(subModelId);
				String subLabel = medataSetLabel + "\n  - " + String.valueOf(tMap.get("prptyNm")) + " : " + String.valueOf(tMap.get("medataValNm"));
				// recursive call
				this.changeSetStatusHierachilyToUse(visitedIdSet, outChangedIdList, subModelInfoDto, String.valueOf(tMap.get("medataVal")), subLabel, String.valueOf(tMap.get("medataValSttusMtcd")), statusWhy, asyncUserVo);
			}
		}

		// 여기까지 오면 하위 메타데이터 셋들이 전체가 사용 상태인 것
		// 5. 현재 메타데이터 셋을 사용 상태로 변경
		if (StringUtils.equals(prevStatus, Constant.SET_STATUS_REG)) {
			// 등록 -> 사용 상태 변경
			this.changeSetStatusToUse(modelInfoDto, medataSetId, statusWhy, asyncUserVo);
		} else { 
			// 미사용 -> 사용 상태 변경
			this.changeSetStatusToReuse(modelInfoDto, medataSetId, statusWhy);
		}

		// 변경된 medataSetId ID 저장
		outChangedIdList.add(medataSetId);
		
	}
	
	/**
	 * 메타데이터 셋을 사용 상태로 변경
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param modelInfoDto
	 * @param medataSetId
	 * @param statusWhy
	 * @param asyncUserVo
	 */
	private void changeSetStatusToUse(ModelInfoDto modelInfoDto, String medataSetId, String statusWhy, LoginUserVo asyncUserVo) {
		
		// 2023-09-13 앞에서 이미 유효성 체크 끝냄!
//		// 1. 셋의 메타데이터 전체에 대해 필수 체크과 값 유효성 체크. 유효하지 않을 경우 Exception 발생. 원복!
//		this.checkAllValidDataBySetId(modelInfoDto, medataSetId);
		
		// 2. 수정 전 변경이력을 위한 셋 용 메타데이터 들 조회
		List<MetadataChgHstSaveDto> prevSetValueList = null;
		
		int newRvsn = 1; // 1 고정
		
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();	
		if (loginUserVo == null) { // 비동기 처리시 null 될 수 있음. 
			loginUserVo = asyncUserVo;
		}
		
		// 메타데이터 셋 값 설정
		MetadataSetVo aftrSetVo = new MetadataSetVo();
		aftrSetVo.setMedataSetId(medataSetId);
		aftrSetVo.setMedataSetSttusMtcd(Constant.SET_STATUS_USE);
		aftrSetVo.setMedataSetNwstRvsn(newRvsn);
		aftrSetVo.setMedataSetSttusWhy(statusWhy);
		aftrSetVo.setMedataSetAmdrId(loginUserVo.getUserId());
		aftrSetVo.setMedataSetAmdrNm(loginUserVo.getUserNm());		
		
		// 3. 메타데이터 셋 상태 변경
		metadataSetMapper.updateMetadataSetStatus(aftrSetVo);
		
		// 4. 셋 용 메타데이터 들 저장
		this.saveMetadataListForSet(modelInfoDto, medataSetId, prevSetValueList, false, asyncUserVo);

		// 5. 현재 메타데이터 셋의 변경이력 등록
		MetadataChgHstSaveDto newHstVo = new MetadataChgHstSaveDto();
		newHstVo.setChgHstDivMtcd("reg");
		newHstVo.setChgAftrRvsn(newRvsn);
		newHstVo.setChgHstRegrId(loginUserVo.getUserId());
		newHstVo.setChgHstRegrNm(loginUserVo.getUserNm());
		
		newHstVo.setMedataSetId(medataSetId);
		newHstVo.setExceptForMetadataSetYn("Y"); // 셋 용 제외. saveMetadataListForSet 여기서 이미 함.
		metadataChgHstMapper.insertMetadataChgHstAutoKeyListBySelectingBySetId(newHstVo);
	}
	
	/**
	 * 메타데이터 셋을 다시 사용 상태로 변경
	 * @Author      : heenim
	 * @Date        : 2023. 06. 15.
	 * @param modelInfoDto
	 * @param medataSetId
	 * @param statusWhy
	 */
	private void changeSetStatusToReuse(ModelInfoDto modelInfoDto, String medataSetId, String statusWhy) {
		
		// 2023-09-13 앞에서 이미 유효성 체크 끝냄!		
//		// 1. 셋의 메타데이터 전체에 대해 필수 체크과 값 유효성 체크. 유효하지 않을 경우 Exception 발생. 원복!
//		this.checkAllValidDataBySetId(modelInfoDto, medataSetId);		
		
		// 2. 수정 전 변경이력을 위한 셋 용 메타데이터 들 조회
		MetadataSetVo idParamVo = new MetadataSetVo();
		idParamVo.setMedataSetId(medataSetId);
		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
		idParamVo.setSqlDateFormat(SqlDatePart.iso6z.format());
		List<MetadataChgHstSaveDto> prevSetValueList = metadataChgHstMapper.selectSelValueListBySetIdForChgHst(idParamVo);		

		// 메타데이터 셋 값 설정
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();		
		MetadataSetVo aftrSetVo = new MetadataSetVo();
		aftrSetVo.setMedataSetId(medataSetId);
		aftrSetVo.setMedataSetSttusMtcd(Constant.SET_STATUS_USE);
		aftrSetVo.setMedataSetSttusWhy(statusWhy);
		aftrSetVo.setMedataSetAmdrId(loginUserVo.getUserId());
		aftrSetVo.setMedataSetAmdrNm(loginUserVo.getUserNm());		
		
		// 3. 메타데이터 셋 상태 변경
		metadataSetMapper.updateMetadataSetStatus(aftrSetVo);
		
		// 4. 셋 용 메타데이터 들 저장
		this.saveMetadataListForSet(modelInfoDto, medataSetId, prevSetValueList, true, null);		
	}	
	
	/**
	 * 메타데이터 셋을 미사용 상태로 변경
	 * @Author      : heenim
	 * @Date        : 2023. 06. 15.
	 * @param modelInfoDto
	 * @param medataSetId
	 * @param statusWhy
	 */
	private void changeSetStatusToUnused(ModelInfoDto modelInfoDto, String medataSetId, String statusWhy) {
		
		// 1. 수정 전 변경이력을 위한 셋 용 메타데이터 들 조회
		MetadataSetVo idParamVo = new MetadataSetVo();
		idParamVo.setMedataSetId(medataSetId);
		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
		idParamVo.setSqlDateFormat(SqlDatePart.iso6z.format());
		List<MetadataChgHstSaveDto> prevSetValueList = metadataChgHstMapper.selectSelValueListBySetIdForChgHst(idParamVo);		

		// 메타데이터 셋 값 설정
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();		
		MetadataSetVo aftrSetVo = new MetadataSetVo();
		aftrSetVo.setMedataSetId(medataSetId);
		aftrSetVo.setMedataSetSttusMtcd(Constant.SET_STATUS_UN);
		aftrSetVo.setMedataSetSttusWhy(statusWhy);
		aftrSetVo.setMedataSetAmdrId(loginUserVo.getUserId());
		aftrSetVo.setMedataSetAmdrNm(loginUserVo.getUserNm());		
		
		// 2. 메타데이터 셋 상태 변경
		metadataSetMapper.updateMetadataSetStatus(aftrSetVo);
		
		// 3. 셋 용 메타데이터 들 저장
		this.saveMetadataListForSet(modelInfoDto, medataSetId, prevSetValueList, true, null);		
	}	
	
	/**
	 * 메타데이터 셋을 폐기 상태로 변경
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param modelInfoDto
	 * @param medataSetId
	 * @param statusWhy
	 */
	private void changeSetStatusToDisuse(ModelInfoDto modelInfoDto, String medataSetId, String statusWhy) {
		
		// 1. 수정 전 변경이력을 위한 셋 용 메타데이터 들 조회
		MetadataSetVo idParamVo = new MetadataSetVo();
		idParamVo.setMedataSetId(medataSetId);
		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
		idParamVo.setSqlDateFormat(SqlDatePart.iso6z.format());
		List<MetadataChgHstSaveDto> prevSetValueList = metadataChgHstMapper.selectSelValueListBySetIdForChgHst(idParamVo);			

		// 메타데이터 셋 값 설정
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();		
		MetadataSetVo aftrSetVo = new MetadataSetVo();
		aftrSetVo.setMedataSetId(medataSetId);
		aftrSetVo.setMedataSetSttusMtcd(Constant.SET_STATUS_DIS);
		aftrSetVo.setMedataSetSttusWhy(statusWhy);
		aftrSetVo.setMedataSetAmdrId(loginUserVo.getUserId());
		aftrSetVo.setMedataSetAmdrNm(loginUserVo.getUserNm());		
		
		// 2. 메타데이터 셋 상태 변경
		metadataSetMapper.updateMetadataSetStatus(aftrSetVo);
		
		// 3. 셋 용 메타데이터 들 저장
		this.saveMetadataListForSet(modelInfoDto, medataSetId, prevSetValueList, true, null);		
	}
	
	/**
	 * 셋의 메타데이터 전체에 대해 필수 체크과 값 유효성 체크. 유효하지 않을 경우 Exception 발생.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param modelInfoDto
	 * @param medataSetId
	 */
//	private void checkAllValidDataBySetId(ModelInfoDto modelInfoDto, String medataSetId) {
//		
//		StringBuilder sb = new StringBuilder();
//		int errCnt = 0;
//		
//		// 1. 필수 체크
//		MetadataSearchVo paramVo1 = new MetadataSearchVo();
//		paramVo1.setModelId(modelInfoDto.getModelId());
//		paramVo1.setMedataSetId(medataSetId);
//		paramVo1.setPageListSize(Constant.ERR_MSG_LIMIT_CNT);
//		List<CamelCaseMap> propertyList = metadataMapper.selectMetadataPropertyListBySetIdForRequiredCheck(paramVo1);
//		if (propertyList != null && !propertyList.isEmpty()) {
//			for (CamelCaseMap tMap : propertyList) {
//				sb.append(tMap.get("prptyNm")).append(ValueUtil.required()).append("\n");
//				errCnt++;
//				
//				if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
//					break;
//				}	
//			}
//		}
//		
//		// 2. 모델과 데이터 정합성 체크 - 배열 프라퍼티가 아닌 데이터의 건수가 1 초과인지 체크
//		MetadataSearchVo paramVo2 = new MetadataSearchVo();
//		paramVo2.setModelId(modelInfoDto.getModelId());
//		paramVo2.setMedataSetId(medataSetId);
//		paramVo2.setPageListSize(Constant.ERR_MSG_LIMIT_CNT);		
//		List<CamelCaseMap> propertyList2 = metadataMapper.selectMetadataPropertyListBySetIdForCountCheck(paramVo2);
//		if (propertyList2 != null && !propertyList2.isEmpty()) {
//			for (CamelCaseMap tMap : propertyList2) {
//				sb.append(tMap.get("prptyNm")).append(" : 배열 프라퍼티가 아닌 데이터가 여러 건이 존재합니다. (").append(tMap.get("valCnt")).append("건)").append("\n");
//				errCnt++;
//				
//				if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
//					break;
//				}	
//			}
//		}
//		
//		// 3. ObjectType 모델 데이터 유효성 체크
//		MetadataSearchVo paramVo3 = new MetadataSearchVo();
//		paramVo3.setMedataSetId(medataSetId);
//		paramVo3.setPageListSize(Constant.ERR_MSG_LIMIT_CNT);
//		List<CamelCaseMap> valueList = metadataMapper.selectMetadataValStatusListBySetIdForObjectTypeCheck(paramVo3);
//		if (valueList != null && !valueList.isEmpty()) {
//			for (CamelCaseMap tMap : valueList) {
//				sb.append(tMap.get("medataVal")).append(" ").append(tMap.get("medataValNm")).append(" : 사용 상태가 아닙니다.").append("\n");
//				errCnt++;
//				
//				if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
//					break;
//				}	
//			}
//		}
//		
//		// 4. DataType 모델 데이터 유효성 체크 - 이미 저장된 DataType 모델의 데이터는 유효하다고 본다.
//		// nothing
//		
//		if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());
//	}
	
	/**
	 * 메타데이터 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 17.
	 * @param metadataSearchVo
	 * @return
	 */
	public SearchResultListVo getMetadataList(MetadataSearchVo metadataSearchVo) {
		log.debug("[메타데이터 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = metadataMapper.selectMetadataCount(metadataSearchVo);
			metadataSearchVo.setTotalListSize(totalListSize);
			
			List<CamelCaseMap> list = metadataMapper.selectMetadataList(metadataSearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(metadataSearchVo));
			
		} catch (Exception e) {
			log.error("[메타데이터 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 메타데이터 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param medataSetId
	 * @return
	 */
	public MetadataDto getMetadata(String medataId) {
		log.debug("[메타데이터 조회] 서비스 시작");
		MetadataDto dto = null;
		
		try {
			MetadataVo metadataVo = new MetadataVo();
			metadataVo.setMedataId(medataId);
			dto = metadataMapper.selectMetadata(metadataVo);

		} catch (Exception e) {
			log.error("[메타데이터 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 조회] 서비스 종료");
		return dto;
	}
	
	/**
	 * 메타데이터 셋의 프라퍼티 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 17.
	 * @param medataSetId
	 * @param prptyNm
	 * @param metadataSearchVo
	 * @return
	 */
	public SearchResultListVo getMetadataListBySetPropertyNm(MetadataPropertySearchVo metadataPropertySearchVo) {
		log.debug("[메타데이터 셋의 프라퍼티 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = metadataMapper.selectMetadataCountByPropertyNm(metadataPropertySearchVo);
			metadataPropertySearchVo.setTotalListSize(totalListSize);
				
			List<MetadataPropertyDto> list = metadataMapper.selectMetadataListByPropertyNm(metadataPropertySearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(metadataPropertySearchVo));
			
		} catch (Exception e) {
			log.error("[메타데이터 셋의 프라퍼티 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 셋의 프라퍼티 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * <pre>
	 * 저장을 위한 메타데이터 목록 조회 (배열 프라퍼티, json, geoJson 아닌 것만 조회)
	 * 
	 * - saveMetadataListBySetId 를 사용하여 저장.
	 * - 배열 프라퍼티, json, geoJson 에 대한 것은 getMetadataListBySetPropertyNm(메타데이터 셋의 프라퍼티 조회) 후 개별 저장.
	 * </pre>
	 * @Author      : heenim
	 * @Date        : 2023. 05. 19.
	 * @param medataSetId
	 * @param cntPrptyYn
	 * @return
	 */
	public List<MetadataDto> getMetadataListWithSetIdForSave(String medataSetId, String cntPrptyYn) {
		log.debug("[저장을 위한 메타데이터 목록 조회] 서비스 시작");
		List<MetadataDto> list = null;
		
		try {
			MetadataSetDto setDto = this.getMetadataSet(medataSetId);
			if (setDto == null) throw new ResBizInfoException("메타데이터 셋 데이터가 존재하지 않습니다.");
			
			String resourceUrl = dtmetaProperty.getResourceBaseUrl() + (StringUtils.endsWithAny(dtmetaProperty.getResourceBaseUrl(), "/", "#") ? "" : "/"); // TODO 리소스 URL, IRI 가 정해진 후 수정 작업 필요
			
			MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
			metadataSearchVo.setModelId(setDto.getModelId());
			metadataSearchVo.setMedataSetId(medataSetId);
			metadataSearchVo.setResourceUrl(resourceUrl); 
			metadataSearchVo.setCntPrptyYn(cntPrptyYn);
			
			list = metadataMapper.selectMetadataListForSave(metadataSearchVo);
			
		} catch (Exception e) {
			log.error("[저장을 위한 메타데이터 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[저장을 위한 메타데이터 목록 조회] 서비스 종료");
		return list;
	}
	
	/**
	 * 메타데이터 셋의 메타데이터 저장 (Multi) - upsert ( DTO 안의 값이 배열로 들어오지 않음! )
	 * @Author      : heenim
	 * @Date        : 2023. 05. 19.
	 * @param medataSetId
	 * @param dataDtoList
	 * return
	 */
	public int saveMetadataListBySetId(String medataSetId, List<MetadataSaveDto> dataDtoList) {
		log.debug("[메타데이터 셋의 메타데이터 저장 (Multi)] 서비스 시작");
		int cnt = 0;

		try {		
			// 1. 유효성 체크
			
			if (dataDtoList == null || dataDtoList.isEmpty()) throw new ResBizInfoException("입력 데이터가 존재하지 않습니다.");
			
			// 메타데이터 셋이 등록/미사용 상태만 등록/수정 가능. 상태 변경시에는 해당 상태만.
	    	MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(medataSetId, Constant.SET_STATUS_REG, Constant.SET_STATUS_UN);
			
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");

			// 데이터 유효성 체크
			this.checkMetadataSaveDtoList(modelInfoDto, prevSetDto, dataDtoList);
			
			// 2. 저장
			cnt = this.saveMetadataSaveDtoList(modelInfoDto, prevSetDto, dataDtoList, true, true);
			
			// 3. 개수 프라퍼티 저장
			List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, prevSetDto);
			if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
				this.saveMetadataSaveDtoList(modelInfoDto, prevSetDto, cntPrptySaveDtoList, true, false);
			}
			
			// 4. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, prevSetDto, null, null);
			
			// 5. 키워드 프라퍼티가 존재하는 경우 influxDB에서 정크 키워드 제거
			if (modelInfoDto.getKeywordPropertyNmList().size() > 0) {
				this.removeJunkKeywordFromInfluxDb(prevSetDto);
			}
    	
    		log.debug("[메타데이터 셋의 메타데이터 저장 (Multi)] 총 {}건 중 저장 성공 : {}건", dataDtoList.size(), cnt);
		
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터 셋의 메타데이터 저장 (Multi)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 셋의 메타데이터 저장 (Multi)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 셋의 메타데이터 저장 (Multi)] 서비스 종료");
		return cnt;
	}
	
	/**
	 * 메타데이터 등록
	 * @Author      : heenim
	 * @Date        : 2023. 05. 12.
	 * @param metadataVo
	 * @return
	 */
	private int createMetadata(MetadataVo metadataVo) {
    	StringBuilder sb = new StringBuilder();
    	
    	// 필수 체크
    	if (metadataVo == null) throw new ResBadRequestException(4000, "metadataVo 값이 null 입니다.");
    	if (StringUtils.isBlank(metadataVo.getMedataSetId())) { sb.append("medataSetId").append(ValueUtil.required()).append("\n"); } 	
    	if (StringUtils.isBlank(metadataVo.getPrptyId())) { sb.append("prptyId").append(ValueUtil.required()).append("\n"); } 
    	if (StringUtils.isBlank(metadataVo.getValModelId())) { sb.append("valModelId").append(ValueUtil.required()).append("\n"); }
    	if (StringUtils.isBlank(metadataVo.getModelPrptyId())) { sb.append("modelPrptyId").append(ValueUtil.required()).append("\n"); }
    	
    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());

		// 등록
		return metadataMapper.insertMetadataAutoKey(metadataVo);
	}
	
	/**
	 * 메타데이터 수정
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @param metadataVo
	 * @return
	 */
	private int modifyMetadata(MetadataVo metadataVo) {
    	StringBuilder sb = new StringBuilder();
    	
    	// 필수 체크
    	if (metadataVo == null) throw new ResBadRequestException(4000, "metadataVo 값이 null 입니다.");
    	if (StringUtils.isBlank(metadataVo.getMedataId())) { sb.append("medataId").append(ValueUtil.required()).append("\n"); } 	
    	if (StringUtils.isBlank(metadataVo.getValModelId())) { sb.append("valModelId").append(ValueUtil.required()).append("\n"); }
    	
    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());

		// 수정
		return metadataMapper.updateMetadata(metadataVo);
	}
	
	/**
	 * <pre>
	 * 메타데이터 dataMap 의 건 별로 필수 체크과 값 유효성 체크. 유효한 값이 아니면 Exception 발생.
	 * 
	 * - 등록 -> 사용요청 또는 사용 상태로 변경할 경우 Set에 속한 모든 프라퍼티들의 유효성 체크를 한다. checkAllValid = true
	 * </pre>
	 * @Author      : heenim
	 * @Date        : 2023. 05. 11.
	 * @param valObj
	 * @param pDto
	 * @param checkAllValid
	 */
	@SuppressWarnings("rawtypes")
	private void checkValue(Object valObj, ModelPropertyInfoDto pDto, boolean checkAllValid) {
		String dataType  = pDto.getRangeDataTypeMtcd();
		String modelType = pDto.getRangeModelTypeMtcd();
		log.debug("propertyNm : {}, dataType : {}, valObj : {}, modelType : {}", pDto.getPrptyNm(), dataType, valObj, modelType);		
		
		String val = valObj == null ? null : String.valueOf(valObj);
		
		if (StringUtils.isBlank(val)) {
			if (checkAllValid) {
				// 필수 체크
				if (PropertyRequired.required.code().equals(pDto.getModelPrptyMandMtcd())) {
					throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.required()).toString());
	
				}
			}
			
		} else if ("object_type".equals(modelType)) { // ObjectType 모델인 경우
			if (checkAllValid) {
				MetadataSetDto valSetDto = this.getMetadataSet(val);
				if (valSetDto == null) throw new ResBizInfoException(pDto.getPrptyNm() + ": " + pDto.getRangeModelNm() + " 모델의 메타데이터가 존재하지 않습니다.");
			}
			
		} else { // date_type - DataType 모델인 경우
			
			// 범위 모델 의 데이터 유형 체크 (메타데이터 셋 용 과 조회전용 codeName, categoryName 제외)
			if (RangeDataTypeMtcd.langString.code().equals(dataType)) {
				if (valObj instanceof Map) {
					// { "language" : "ko", "value" : "홍길동" } 형식 체크
					Map tMap = (Map) valObj;
					if (StringUtils.isBlank((String) tMap.get("language")) || (StringUtils.isBlank((String) tMap.get("value")))) {
						throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("{ \"language\" : \"ko\", \"value\" : \"홍길동\" }")).toString());
					}
				} else if (RdfUtil.isJson(val)) {
					Map tMap = (Map) JsonUtil.toMap(val);
					if (StringUtils.isBlank((String) tMap.get("language")) || (StringUtils.isBlank((String) tMap.get("value")))) {
						throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("{ \"language\" : \"ko\", \"value\" : \"홍길동\" }")).toString());
					}
				}
				
			} else if (RangeDataTypeMtcd.date.code().equals(dataType) && ValueUtil.isInvalidDd(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("yyyy-MM-dd")).toString());
				
			// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
			//} else if (RangeDataTypeMtcd.dateTime.code().equals(dataType) && !DateUtil.isISOTime(val)) {
			//	throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("yyyy-MM-dd'T'HH:mm:ssXXX")).toString());
			} else if (RangeDataTypeMtcd.dateTime.code().equals(dataType) && !DateUtil.isISO6Time(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXX")).toString()); // XXX 가 맞음. DateTimeFormatter.ofPattern("...") 쓸 경우 출력 포맷 XXXXX 로 쓰면 Z 도 표시됨.
				
			} else if (RangeDataTypeMtcd.year.code().equals(dataType) && ValueUtil.isInvalidYear(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("yyyy")).toString());
				
			} else if (RangeDataTypeMtcd.yearMonth.code().equals(dataType) && ValueUtil.isInvalidYearMonth(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("yyyy-MM")).toString());
				
			} else if (RangeDataTypeMtcd.integer.code().equals(dataType) && !ValueUtil.isInteger(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("integer")).toString());
				
			} else if (RangeDataTypeMtcd.long_.code().equals(dataType) && !ValueUtil.isLong(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("long")).toString());
				
			} else if (RangeDataTypeMtcd.positiveInteger.code().equals(dataType) && ( !ValueUtil.isInteger(val) || Integer.valueOf(val) <= 0 )) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("positiveInteger")).toString());
				
			} else if (RangeDataTypeMtcd.nonNegativeInteger.code().equals(dataType) && ( !ValueUtil.isInteger(val) || Integer.valueOf(val) < 0 )) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("nonNegativeInteger")).toString());
				
			} else if (RangeDataTypeMtcd.nonPositiveInteger.code().equals(dataType) && ( !ValueUtil.isInteger(val) || Integer.valueOf(val) > 0 )) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("nonPositiveInteger")).toString());
				
			} else if (RangeDataTypeMtcd.negativeInteger.code().equals(dataType) && ( !ValueUtil.isInteger(val) || Integer.valueOf(val) >= 0 )) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("negativeInteger")).toString());
				
			} else if (RangeDataTypeMtcd.float_.code().equals(dataType) && !ValueUtil.isFloat(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("float")).toString());
				
			} else if (RangeDataTypeMtcd.double_.code().equals(dataType) && !ValueUtil.isDouble(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("double")).toString());
				
			} else if (RangeDataTypeMtcd.boolean_.code().equals(dataType) && !ValueUtil.isBoolean(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("boolean")).toString());
				
			} else if (RangeDataTypeMtcd.anyURI.code().equals(dataType) && !RdfUtil.isAnyURI(val)) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("URI")).toString());
				
			} else if (RangeDataTypeMtcd.json.code().equals(dataType)) {
				String jsonStr = this.toJsonStr(valObj); // NOTE : 우선 여기까지 온거면 Controller 제대로 파싱되었다는 거 아닐까? 필요없으면 주석 처리할 것.
				if (!RdfUtil.isJson(jsonStr)) {
					throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("JSON")).toString());
				}
			
			// 2025-07 표준문서 관련 데이터타입 추가. TODO 필요시 변경
			} else if (RangeDataTypeMtcd.address.code().equals(dataType)) {
				String jsonStr = this.toJsonStr(valObj); // NOTE : 우선 여기까지 온거면 Controller 제대로 파싱되었다는 거 아닐까? 필요없으면 주석 처리할 것.
				if (!RdfUtil.isJson(jsonStr)) {
					throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("JSON")).toString());
				}
			
			// 2025-07 표준문서 관련 데이터타입 추가. TODO 필요시 변경
			} else if (RangeDataTypeMtcd.dataInfo.code().equals(dataType)) { // 2025-07 표준문서 관련 데이터타입 추가. TODO 필요시 변경
				String jsonStr = this.toJsonStr(valObj); // NOTE : 우선 여기까지 온거면 Controller 제대로 파싱되었다는 거 아닐까? 필요없으면 주석 처리할 것.
				if (!RdfUtil.isJson(jsonStr)) {
					throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("JSON")).toString());
				}				
				
			} else if (RangeDataTypeMtcd.geoJson.code().equals(dataType)) {
				String jsonStr = this.toJsonStr(valObj); // TODO : GeoJSON 형식이 개발 중 임시 가정한 geometry 값과 같은지 확인 필요
				if (!RdfUtil.isGeoJson(jsonStr)) {
					throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.invalid("GeoJSON")).toString());
				}
				
			} else if (RangeDataTypeMtcd.code_.code().equals(dataType) && StringUtils.isBlank(pDto.getRangeMtcdGrpId())) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.notDefined("코드그룹ID")).toString());
				
			} else if (RangeDataTypeMtcd.codeName.code().equals(dataType) && StringUtils.isBlank(pDto.getRangeRefPrptyNm())) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.notDefined("참조 프라퍼티")).toString());
				
			} else if (RangeDataTypeMtcd.categoryName.code().equals(dataType) && StringUtils.isBlank(pDto.getRangeRefPrptyNm())) {
				throw new ResBadRequestException(4000, new StringBuilder(pDto.getPrptyNm()).append(ValueUtil.notDefined("참조 프라퍼티")).toString());
				
			} else {
				// 기타 데이터 유형은 필요할 때 추가.
			}
		
		}
	}
	
	/**
	 * 저장용 DTO 에 담긴 메타데이터들의 유효성 체크. 필수 체크는 하지 않는다.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param modelInfoDto
	 * @param metadataSetDto
	 * @param dataDtoList
	 */
	private void checkMetadataSaveDtoList(ModelInfoDto modelInfoDto, MetadataSetDto metadataSetDto, List<MetadataSaveDto> dataDtoList) {
		// 필수 체크 - 여기서는 하지 않는다.
		// 배열 데이터 여부 - 배열 데이터 프라퍼티 라도 Dto 한 건씩 들어온다.
		// 실제로는 DataType 값 모델에 대한 유효성 체크.
		
		StringBuilder sb = new StringBuilder();
		int errCnt = 0;
		
		for (MetadataSaveDto tDto : dataDtoList) {
			
			try {
				String propertyNm = modelInfoDto.getPropertyNmById(tDto.getPrptyId());
				if (propertyNm == null) throw new ResBizInfoException(modelInfoDto.getModelNm() + " - " + tDto.getPrptyId() + " : 모델에 속한 프라퍼티가 아닙니다.");
				
				ModelPropertyInfoDto pDto =	modelInfoDto.getPropertyInfoDto(propertyNm);
			
				this.checkValue(tDto.getMedataVal(), pDto, false);
				
			} catch(ResBadRequestException e1) {
				sb.append(e1.getReason()).append("\n");
				errCnt++;
			}
			
			if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
				break;
			}				
		}
		
    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());		
	}
	
	/**
	 * 저장용 DTO 에 참조 프라퍼티를 활용하여 조회전용 참조값 설정.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 31.
	 * @param modelInfoDto
	 * @param dataDtoList
	 */
	private void setRefValToMetadataSaveDtoList(ModelInfoDto modelInfoDto, List<MetadataSaveDto> dataDtoList) {
		// 참조 프라퍼티가 있는 경우 미리 값 설정 (참조 프라퍼티는 배열이 아니라고 가정)
		if (modelInfoDto.getRefPropertyNmMap() != null && modelInfoDto.getRefPropertyNmMap().size() > 0) {
			for (Map.Entry<String, String> rMap : modelInfoDto.getRefPropertyNmMap().entrySet()) {
				String refPrptyNm     = rMap.getKey();   // code, categoryId 데이터 유형 등 참조 프라퍼티
				String derivedPrptyNm = rMap.getValue(); // codeName, categoryName, refSetName 데이터 유형 프라퍼티 DerivedDataTypeMtcd
				String refPrptyId     = modelInfoDto.getPropertyId(refPrptyNm);	
				String derivedPrptyId = modelInfoDto.getPropertyId(derivedPrptyNm);			
				
		    	MetadataSaveDto refDto = dataDtoList.stream()
			    		.filter(x -> StringUtils.equals(refPrptyId, x.getPrptyId()))
			    		.findFirst()
			    		.orElse(null);

				if (refDto == null) {
					// 이건 전체 프라퍼티가 들어오는 게 아니기 대문에 warning 아님. log.warn("{} 프라퍼티가 참조할 {} 프라퍼티가 존재하지 않습니다!", derivedPrptyNm, refPrptyNm);
					continue;
				}
				
	    		ModelPropertyInfoDto pDto1 = modelInfoDto.getPropertyInfoDto(refPrptyNm);
				ModelPropertyInfoDto pDto2 = modelInfoDto.getPropertyInfoDto(derivedPrptyNm);
				String dataType = pDto2.getRangeDataTypeMtcd();		
				String refDataType = pDto1.getRangeDataTypeMtcd();
				
				// codeName, categoryName, refSetName 데이터 유형 프라퍼티의 조회 값 설정
		    	String derivedVal = null;
				if (RangeDataTypeMtcd.codeName.code().equals(dataType)) {
					derivedVal = codeGroupService.getCodeNameFromCache(pDto1.getRangeMtcdGrpId(), refDto.getMedataVal());
				} else if (RangeDataTypeMtcd.categoryName.code().equals(dataType)) {
					if (RangeDataTypeMtcd.categoryConcept.code().equals(refDataType)) {
						derivedVal = categoryService.getCategoryNameByConcept(refDto.getMedataVal());
					} else {
						derivedVal = categoryService.getCategoryName(refDto.getMedataVal());
					}
			    } else if (RangeDataTypeMtcd.refSetName.code().equals(dataType)) {	
			    	derivedVal = this.getMetadataSetNameById(refDto.getMedataVal());
			    }
				
		    	MetadataSaveDto derivedDto = dataDtoList.stream()
			    		.filter(x -> StringUtils.equals(derivedPrptyId, x.getPrptyId()))
			    		.findFirst()
			    		.orElse(null);				
				
		    	if (derivedDto != null) {
		    		derivedDto.setMedataVal(derivedVal);
		    	} else {
		    		MetadataSaveDto newDto = new MetadataSaveDto();
		    		newDto.setPrptyId(derivedPrptyId);
					newDto.setMedataVal(derivedVal);	    
					dataDtoList.add(newDto);
		    	}				
			}
		}
	}
	
	/**
	 * 저장용 DTO 에 담긴 메타데이터들을 저장. (이미 유효성 검사는 끝났다고 가정)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 24.
	 * @param modelInfoDto
	 * @param metadataSetVo
	 * @param dataDtoList
	 * @param isSaveHist
	 * @param isIncreaseRevision
	 * @return
	 */
	private int saveMetadataSaveDtoList(ModelInfoDto modelInfoDto, MetadataSetVo metadataSetVo, List<MetadataSaveDto> dataDtoList, boolean isSaveHist, boolean isIncreaseRevision) {
		int cnt = 0;
			
		String medataSetId   = metadataSetVo.getMedataSetId();
		String medataSetStts = metadataSetVo.getMedataSetSttusMtcd();
    	int    newRvsn       = isIncreaseRevision ? metadataSetVo.getMedataSetNwstRvsn() + 1 : metadataSetVo.getMedataSetNwstRvsn();
		
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		if (loginUserVo == null) { // 비동기 처리시 null 될 수 있음. 
			loginUserVo = metadataSetVo.getAsyncUserVo();
		}
		
		// 참조 프라퍼티를 활용하여 조회전용 참조값 설정.
		this.setRefValToMetadataSaveDtoList(modelInfoDto, dataDtoList);
		
		for (MetadataSaveDto tDto : dataDtoList) {
			
			boolean isSaved = false;
			
			String propertyNm = modelInfoDto.getPropertyNmById(tDto.getPrptyId());
			ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(propertyNm);
	    	String dataType = pDto.getRangeDataTypeMtcd();
	    	
			MetadataVo newVo = null;
			MetadataVo prevVo = null;			
			String chgHstDivMtcd = "";
			String medataId = tDto.getMedataId();
			
			// medataId 가 없을 경우 중복이 되는지 체크
			if (StringUtils.isBlank(medataId)) {
				
				// 배열 프라퍼티가 아닌 경우, 중복이 되는지 체크   TODO: 성능 저하 우려, 추후 수정이 필요할 수 있음
		    	if ("N".equals(pDto.getDataArrayYn())) {
	    			MetadataPropertySearchVo paramVo = new MetadataPropertySearchVo();
	    			paramVo.setMedataSetId(medataSetId);
	    			paramVo.setPrptyNm(propertyNm);
	    			List<MetadataPropertyDto> prevDataList = metadataMapper.selectMetadataListByPropertyNm(paramVo);
	    			if (prevDataList != null && !prevDataList.isEmpty()) {
	    				if (prevDataList.size() > 1) {
	    					throw new ResBizInfoException(propertyNm + " : 배열 프라퍼티가 아닌 데이터가 여러 건이 존재합니다.");
	    				} else { // size == 1
	    					medataId = prevDataList.get(0).getMedataId(); // 1건 존재 경우 수정 모드가 되게 함.
	    					prevVo = prevDataList.get(0);
	    				}
		    		}
	    			
	    		// 배열 프라퍼티인 경우, 중복이 되는지 체크   TODO: 성능 저하 우려, 추후 수정이 필요할 수 있음
		    	} else if ("Y".equals(pDto.getDataArrayYn()) && tDto.getMedataVal() != null) {
					MetadataVo chkValVo = new MetadataVo();
					this.setValueToVo(chkValVo, tDto.getMedataVal(), tDto.getLangMtcd(), pDto.getRangeDataTypeMtcd());
					
		    		MetadataPropertySearchVo dupParamVo = new MetadataPropertySearchVo();
		    		dupParamVo.setMedataSetId(medataSetId);
		    		dupParamVo.setPrptyNm(propertyNm);
		    		dupParamVo.setMedataVal(chkValVo.getMedataVal());
		    		dupParamVo.setLangMtcd(chkValVo.getLangMtcd());
		    		List<CamelCaseMap> dupDataList = metadataMapper.selectMetadataListByPropertyNmForDupCheck(dupParamVo); 
					if (dupDataList != null && dupDataList.size() > 0) {
						medataId = (String) dupDataList.get(0).get("medataId"); // 배열 프라퍼티 이고 동일한 값이 존재하는 경우 수정 모드가 되게 함.
						prevVo = this.getMetadata(medataId);
						int dupCnt = (int) dupDataList.get(0).get("cnt");
						if (dupCnt > 1) log.warn("{} 프라퍼티에 동일한 값이 {}건 있음!", propertyNm, dupCnt);
					}
		    		
		    	}
		    	
		    	tDto.setMedataId(medataId);
			} else {
				prevVo = this.getMetadata(medataId);
			}
			
			// 키워드인 경우 저장 전 목록 조회
			List<String> prevKeywordList = null;
	    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
    			MetadataSearchVo paramVo = new MetadataSearchVo();
    			paramVo.setMedataSetId(medataSetId);
    			paramVo.setPrptyId(pDto.getPrptyId());
	    		prevKeywordList = metadataMapper.selectKeywordListBySetId(paramVo);
	    		if (prevKeywordList == null) {
	    			prevKeywordList = new ArrayList<String>(); // not null
	    		}
	    	}
	    	
	    	if (StringUtils.isBlank(medataId)) {	    	
	    		// 1-1. 등록
	    		newVo = this.getMetadataVoFromMetadata(medataSetId, tDto.getMedataVal(), tDto.getLangMtcd(), pDto);
	    		if (newVo != null) {
	    			cnt += this.createMetadata(newVo);
	    			chgHstDivMtcd = "reg";
	    			isSaved = true;
	    		}
	    	} else {
	    		// 1-2. 수정
	    		newVo = this.getMetadataVoFromMetadata(medataSetId, tDto.getMedataVal(), tDto.getLangMtcd(), pDto, medataId);
	    		if (this.isValueChanged(newVo, prevVo)) { // FIXME : 값 비교를 하여 변경된 것만 수정
	    			cnt += this.modifyMetadata(newVo);
	    			chgHstDivMtcd = "amd";
	    			isSaved = true;
	    		}
	    	}
	    	
	    	if (newVo != null && isSaved) {
			    // 셋이 등록 상태가 아닌 경우
		    	if (!Constant.SET_STATUS_REG.equals(medataSetStts) && isSaveHist) {
		    		// 2. 변경이력 등록
					MetadataChgHstVo newHstVo = new MetadataChgHstVo();
					newHstVo.copyPropertiesFrom(newVo);
					newHstVo.setChgHstDivMtcd(chgHstDivMtcd);
					newHstVo.setChgAftrRvsn(newRvsn);
					newHstVo.setChgAftrLangMtcd(newVo.getLangMtcd());
					newHstVo.setChgAftrVal(newVo.getMedataVal());
					newHstVo.setChgAftrGeoVal(newVo.getGeodataVal());
					newHstVo.setChgHstRegrId(loginUserVo.getUserId());
					newHstVo.setChgHstRegrNm(loginUserVo.getUserNm());
					metadataChgHstMapper.insertMetadataChgHstAutoKey(newHstVo);
		    	} 	
		    	
		    	// 3. 키워드인 경우 따로 저장
		    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
		    		// 3-1. 키워드만 따로 저장
		    		keywordService.saveKeywordList(newVo.getMedataVal(), newVo.getLangMtcd());

		    		// 3-2. influxDB에 키워드 저장
		    		InfluxDbKeywordDto keywordDto = new InfluxDbKeywordDto();
		    		keywordDto.setKeyword(newVo.getMedataVal());
		    		keywordDto.setLangMtcd(newVo.getLangMtcd());
		    		keywordDto.setPrptyId(tDto.getPrptyId());
		    		keywordDto.setMedataSetId(medataSetId);
		    		keywordDto.setDateTimeStr(metadataSetVo.getMedataSetAmdDt());
		    		this.saveKeywordToInfluxDb(keywordDto, prevKeywordList);
		    	}
	    	}
	    }
    	
	    // 셋이 등록 상태가 아닌 경우
    	if (!Constant.SET_STATUS_REG.equals(medataSetStts) && isSaveHist) {	
    		
    		// 4. 수정 전 변경이력을 위한 셋 용 메타데이터 들 조회
    		MetadataSetVo idParamVo = new MetadataSetVo();
    		idParamVo.setMedataSetId(medataSetId);
    		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
    		idParamVo.setSqlDateFormat(SqlDatePart.iso6z.format());
    		List<MetadataChgHstSaveDto> prevSetValueList = metadataChgHstMapper.selectSelValueListBySetIdForChgHst(idParamVo);	
    		
    		if (isIncreaseRevision) {
				// 5. 리비전 증가
	    		metadataSetVo.setMedataSetAmdrId(loginUserVo.getUserId());
	    		metadataSetVo.setMedataSetAmdrNm(loginUserVo.getUserNm());
				metadataSetMapper.updateMetadataSetNwstRvsn(metadataSetVo);
    		}
			
			// 6. 셋 용 메타데이터 들 저장
			this.saveMetadataListForSet(modelInfoDto, medataSetId, prevSetValueList, false, loginUserVo);
    	}
	
		log.debug("SaveDto 총 {}건 중 저장 성공 : {}건", dataDtoList.size(), cnt);
		return cnt;
	}
	
	/**
	 * 개수 프라퍼티 저장 위한 설정
	 * @Author      : heenim
	 * @Date        : 2023. 10. 23.
	 * @param modelInfoDto
	 * @param metadataSetVo
	 * @return nullable
	 */
	private List<MetadataSaveDto> getCntPrptySaveDtoList(ModelInfoDto modelInfoDto, MetadataSetVo metadataSetVo) {
		List<MetadataSaveDto> dataDtoList = null;
		
		if (modelInfoDto.getCntPropertyNmList().size() > 0) {
			dataDtoList = new ArrayList<>();
			
			MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
			metadataSearchVo.setMedataSetId(metadataSetVo.getMedataSetId());
			metadataSearchVo.setModelId(metadataSetVo.getModelId());
			List<CamelCaseMap> valList = metadataMapper.selectMetadataValModelCntListBySetId(metadataSearchVo);
			
			for (String prptyNm : modelInfoDto.getCntPropertyNmList()) {
				MetadataSaveDto saveDto = new MetadataSaveDto();
				String prptyId = modelInfoDto.getPropertyId(prptyNm);
				String valModelCnt  = "0";
				
				if (valList != null) {
					CamelCaseMap valMap = valList.stream().filter((x) -> StringUtils.equals(prptyId, String.valueOf(x.get("prptyId")))).findFirst().orElse(null);
					if (valMap != null) {
						valModelCnt = String.valueOf(valMap.get("valModelCnt"));
					}
				}
				
				saveDto.setPrptyId(prptyId);
				saveDto.setMedataVal(valModelCnt);
				dataDtoList.add(saveDto);
			}
		}
		
		return dataDtoList;
	}
	
	/**
	 * 메타데이터 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 19.
	 * @param medataId
	 * @return
	 */
	public int deleteMetadata(String medataId) {
		log.debug("[메타데이터 삭제] 서비스 시작");
		int cnt = 0;
    	StringBuilder sb = new StringBuilder();	
    	
		try {
			// 1. 유효성 체크
			
	    	// 필수 체크
	    	if (StringUtils.isBlank(medataId)) { sb.append("medataId").append(ValueUtil.required()).append("\n"); }
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(4000, sb.toString());
	    	
	    	MetadataDto dataDto = this.getMetadata(medataId);
	    	if (dataDto == null) throw new ResNotFoundException("해당 메타데이터가 존재하지 않습니다.");
	    	
	    	// 삭제 가능 체크
	    	
	    	String medataSetId = dataDto.getMedataSetId();
	    	LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();	
	    	
			// 메타데이터 셋이 등록/미사용 상태만 삭제 가능.
	    	MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(medataSetId, Constant.SET_STATUS_REG, Constant.SET_STATUS_UN);
	    	int newRvsn = prevSetDto.getMedataSetNwstRvsn() + 1;
	    	
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
	    	
	    	// 셋 용 특수 프라퍼티인 경우 삭제 불가
	    	if ("Y".equals(dataDto.getSetUsgPrptyYn())) {
	    		throw new ResBizInfoException("해당 메타데이터는 특수 프라퍼티로 삭제가 불가능합니다.");
	    	}
	    	
	    	// 셋이 등록 상태가 아닌 경우
	    	if (!Constant.SET_STATUS_REG.equals(prevSetDto.getMedataSetSttusMtcd())) {
	    		
	    		// 2. 수정 전 변경이력을 위한 셋 용 메타데이터 들 조회
	    		MetadataSetVo idParamVo = new MetadataSetVo();
	    		idParamVo.setMedataSetId(medataSetId);
	    		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
	    		idParamVo.setSqlDateFormat(SqlDatePart.iso6z.format());
	    		List<MetadataChgHstSaveDto> prevSetValueList = metadataChgHstMapper.selectSelValueListBySetIdForChgHst(idParamVo);
    			
	    		// 3. 변경이력 등록
				MetadataChgHstVo newHstVo = new MetadataChgHstVo();
				newHstVo.copyPropertiesFrom(dataDto);
				newHstVo.setChgHstDivMtcd("del");
				newHstVo.setChgAftrRvsn(newRvsn);
				newHstVo.setChgAftrLangMtcd(dataDto.getLangMtcd());
				newHstVo.setChgAftrVal(dataDto.getMedataVal());
				newHstVo.setChgAftrGeoVal(dataDto.getGeodataVal());
				newHstVo.setChgHstRegrId(loginUserVo.getUserId());
				newHstVo.setChgHstRegrNm(loginUserVo.getUserNm());
				metadataChgHstMapper.insertMetadataChgHstAutoKey(newHstVo);
	    		
	    		// 4. 리비전 증가
				prevSetDto.setMedataSetAmdrId(loginUserVo.getUserId());
				prevSetDto.setMedataSetAmdrNm(loginUserVo.getUserNm());
    			metadataSetMapper.updateMetadataSetNwstRvsn(prevSetDto);
    			
    			// 5. 셋 용 메타데이터 들 저장
				this.saveMetadataListForSet(modelInfoDto, medataSetId, prevSetValueList, false, null);
	    	}
			
			// 6. 메타데이터 삭제
	    	cnt = metadataMapper.deleteMetadata(dataDto);
	    	
	    	// 7. 현재 프라퍼티를 참조하고 있는 프라퍼티가 있는 경우 같이 메타데이터 삭제, 위의 삭제 건수가 존재하는 경우만.
	    	if (modelInfoDto.getRefPropertyNmMap().containsKey(dataDto.getPrptyNm()) && cnt > 0) {
		    	MetadataPropertySearchVo delSearchVo = new MetadataPropertySearchVo();
		    	delSearchVo.setMedataSetId(medataSetId);
		    	delSearchVo.setPrptyId(dataDto.getPrptyId());	    		
	    		metadataMapper.deleteMetadataAllByRefPropertyId(delSearchVo);
	    	}
	    	
			// 8. 개수 프라퍼티 저장
	    	if ("object_type".equals(dataDto.getValModelTypeMtcd())) {
				List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, prevSetDto);
				if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
					this.saveMetadataSaveDtoList(modelInfoDto, prevSetDto, cntPrptySaveDtoList, true, false);
				}
	    	}
	    	
			// 9. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, prevSetDto, null, null);
			
			// 10. 키워드 프라퍼티인 경우 influxDB에서 정크 키워드 제거
			String dataType = dataDto.getDataTypeMtcd();
			if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
				this.removeJunkKeywordFromInfluxDb(prevSetDto);
			}
	
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
	
		log.debug("[메타데이터 삭제] 서비스 종료");
		return cnt;		
	}
	
	/**
	 * 메타데이터 셋 등록 (from dataMap)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param dataMap
	 * @param typeModelVo
	 * @param checkTypeModel
	 * @return
	 */
	public String createMetadataSetFromDataMap(ListOrderedMap<String, Object> dataMap, ModelVo typeModelVo, boolean checkTypeModel, boolean isKafkaSend) {
		log.debug("[메타데이터 셋 등록 (from dataMap)] 서비스 시작");
		String medataSetId = "";
		
		try {
			// 1. 유효성 체크
			
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			String modelNm = (String) dataMap.get(Constant.KEYWORD_META_MODEL);
			if (StringUtils.isEmpty(modelNm)) {
				if (typeModelVo == null) throw new ResBizInfoException("유형 모델이 지정되지 않았습니다.");
				modelNm = typeModelVo.getModelNm(); // 지정 모델명이 없으면 유형 모델로 설정.
			}
			ModelInfoDto modelInfoDto = modelService.getModelInfoByNameFromCache(modelNm);
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 필요시 유형 모델 일치 체크
			if (checkTypeModel) {
				if (typeModelVo == null || !StringUtils.equals(typeModelVo.getModelId(), modelInfoDto.getTypeModelId())) {
					throw new ResBizInfoException("유형과 맞지 않는 모델입니다.");
				}
			}

			// FIXME 2023-07-27 정형모델 사용안함 - 비정형 모델만 구현함!! // 2. 정형 모델 경우 if (StringUtils.equals("Y", modelInfoDto.getStructdModelYn())) { 

			// 비정형 모델 경우
			
			LoginUserVo asyncUserVo = null;
			if (dataMap.containsKey(Constant.LOGIN_USER_VO)) { // 비동기 처리 경우
				asyncUserVo = (LoginUserVo) dataMap.get(Constant.LOGIN_USER_VO);
			}

			// 메타데이터 셋 설정
			MetadataSetSaveDto metadataSetSaveDto = this.getMetadataSetSaveDtoFromMetadata(modelInfoDto, dataMap);
			if (metadataSetSaveDto == null) throw new ResBadRequestException(4000, "메타데이터 셋에 필요한 정보가 없습니다.");
			
			// ID 생성 로직 - 디지털트윈 식별체계 정보가 있을 경우 설정
			this.setIdSchmPrefix(modelInfoDto.getTypeModelId(), metadataSetSaveDto);
				
			// 2. 메타데이터 셋 등록
			medataSetId = this.createMetadataSet(metadataSetSaveDto, asyncUserVo);
			
			// 새롭게 저장된 메타데이터 셋 조회
			// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
			metadataSetSaveDto.setSqlDateFormat(SqlDatePart.iso6z.format());
			MetadataSetDto metadataSetDto = metadataSetMapper.selectMetadataSet(metadataSetSaveDto);
			metadataSetDto.setAsyncUserVo(asyncUserVo);
			
			// 메타데이터 셋 특수 범위 모델의 프라퍼티들 값 설정
			this.setMetadataSetValueToMetadata(metadataSetDto, modelInfoDto, dataMap);
			
			// 2-1. NOTE: 2025-07-28 표준문서 적용을 위한 하드 코딩.
			// modelId 가 SingleDigitalTwin 단일디지털트윈, FederatedDigitalTwin 연합디지털트윈 경우만 type 강제 설정.
			this.setInitialDigitalTwinType(medataSetId, modelInfoDto, dataMap);
			
			// 필수 체크
			this.checkRequiredAndValidData(modelInfoDto, dataMap);
			
			// 3. 메타데이터 들 등록
			this.createMetadataMulti(metadataSetDto, modelInfoDto, dataMap);
			
			// 4. 개수 프라퍼티 저장
			List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, metadataSetDto);
			if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
				this.saveMetadataSaveDtoList(modelInfoDto, metadataSetDto, cntPrptySaveDtoList, false, false);
			}
			
			// 5. 카프카 전송
			if (isKafkaSend) { // 2025-08-19 API 로 한번에 많은 SetID 를 생성할 경우 별도 작업
				this.sendMetadataViaKafka(KafkaConst.ACTION_CREATE, metadataSetDto, null, null);
			}

			log.debug("[메타데이터 셋 등록 (from dataMap)] 등록 성공");		
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 셋 등록 (from dataMap)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 셋 등록 (from dataMap)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
		
		log.debug("[메타데이터 셋 등록 (from dataMap)] 서비스 종료");
		return medataSetId;
	}
	
	/**
	 * 메타데이터 셋 수정 (from dataMap) - 이 dataMap 에는 한 데이터 셋의 온전한 변경 목표 데이터가 있다. (셋 전체 데이터 변경)
	 * @Author      : heenim
	 * @Date        : 2023. 09. 05.
	 * @param medataSetId
	 * @param dataMap
	 * @param typeModelVo
	 * @param checkTypeModel
	 */
	public void modifyMetadataSetFromDataMap(String medataSetId, ListOrderedMap<String, Object> dataMap, ModelVo typeModelVo, boolean checkTypeModel) {
		log.debug("[메타데이터 셋 수정 (from dataMap)] 서비스 시작");
		
		try {
			// 1. 유효성 체크
			
			// 등록/미사용 상태만 수정 가능. 사용요청/사용/폐기 상태는 수정 불가능.
			MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(medataSetId, Constant.SET_STATUS_REG, Constant.SET_STATUS_UN);
			
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 필요시 유형 모델 일치 체크
			if (checkTypeModel) {
				if (typeModelVo == null || !StringUtils.equals(typeModelVo.getModelId(), modelInfoDto.getTypeModelId())) {
					throw new ResBizInfoException("유형과 맞지 않는 모델입니다.");
				}
			}
			
			// 비정형 모델 경우
			
			// 메타데이터 셋 설정
			MetadataSetSaveDto metadataSetSaveDto = this.getMetadataSetSaveDtoFromMetadata(modelInfoDto, dataMap);
			if (metadataSetSaveDto == null) throw new ResBadRequestException(4000, "메타데이터 셋에 필요한 정보가 없습니다.");
			
			// 2. 메타데이터 셋을 수정하고 셋에 해당하는 특수 메타데이터들을 저장
			this.modifyMetadataSetAndMetadataForSet(modelInfoDto, metadataSetSaveDto);
						
			// 새롭게 저장된 메타데이터 셋 조회
			MetadataSetVo paramVo2 = new MetadataSetVo();
			paramVo2.setMedataSetId(medataSetId);
			// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
			paramVo2.setSqlDateFormat(SqlDatePart.iso6z.format());
			MetadataSetDto metadataSetDto = metadataSetMapper.selectMetadataSet(paramVo2);
			
			int newRvsn = metadataSetDto.getMedataSetNwstRvsn();
			
			// 메타데이터 셋 특수 범위 모델의 프라퍼티들 값 설정
			this.setMetadataSetValueToMetadata(metadataSetDto, modelInfoDto, dataMap);
			
			// 필수 체크
			this.checkRequiredAndValidData(modelInfoDto, dataMap);
						
			// 3. 메타데이터 들 저장
			this.modifyMetadataMulti(metadataSetDto, modelInfoDto, dataMap, newRvsn, false);
			
			// 4. 개수 프라퍼티 저장
			List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, metadataSetDto);
			if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
				this.saveMetadataSaveDtoList(modelInfoDto, metadataSetDto, cntPrptySaveDtoList, true, false);
			}
			
			// 5. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, metadataSetDto, null, null);

			// 6. 키워드 프라퍼티가 존재하는 경우 influxDB에서 정크 키워드 제거
			if (modelInfoDto.getKeywordPropertyNmList().size() > 0) {
				this.removeJunkKeywordFromInfluxDb(metadataSetDto);
			}
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 셋 수정 (from dataMap)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 셋 수정 (from dataMap)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
		
		log.debug("[메타데이터 셋 수정 (from dataMap)] 서비스 종료");
	}
	
	/**
	 * 메타데이터 셋 의 일부 데이터 수정 (from dataMap) - dataMap 에 포함된 프라퍼티(속성)에 대해서만 저장 (upsert)
	 * 디지털 트윈 연합 레지스트리 관련 API 용.
	 * @Author      : heenim
	 * @Date        : 2025. 08. 21.
	 * @param medataSetId
	 * @param dataMap
	 */
	public void savePartialMetadataSetFromDataMap(String medataSetId, ListOrderedMap<String, Object> dataMap) {
		log.debug("[메타데이터 셋 의 일부 데이터 수정 (from dataMap)] 서비스 시작");
		int cnt = 0;
		
		try {
			// 1. 유효성 체크
			
			// 등록/미사용 상태만 수정 가능. 사용요청/사용/폐기 상태는 수정 불가능.
			MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(medataSetId, Constant.SET_STATUS_REG, Constant.SET_STATUS_UN);
			
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 2. 메타데이터 셋 에 해당하는 프라퍼티가 있다면 저장
			MetadataSetDto metadataSetDto = null;
			
			// 메타데이터 셋 설정
			MetadataSetSaveDto metadataSetSaveDto = this.getMetadataSetSaveDtoFromMetadata(modelInfoDto, dataMap);
			if (metadataSetSaveDto != null) { // null 아니면 해당 프라퍼티가 있는 것.
			    String[] ignoreProps = MapperUtil.getNonNullPropertyNames(metadataSetSaveDto);
			    BeanUtils.copyProperties(prevSetDto, metadataSetSaveDto, ignoreProps);
			    
				// 메타데이터 셋을 수정하고 셋에 해당하는 특수 메타데이터들을 저장
			    cnt += this.modifyMetadataSetAndMetadataForSet(modelInfoDto, metadataSetSaveDto);
			    log.debug("[메타데이터 셋 의 일부 데이터 수정 (from dataMap)] - {} 셋 정보 변경됨.", medataSetId);

				// 새롭게 저장된 메타데이터 셋 조회
				MetadataSetVo paramVo2 = new MetadataSetVo();
				paramVo2.setMedataSetId(medataSetId);
				// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
				paramVo2.setSqlDateFormat(SqlDatePart.iso6z.format());
				metadataSetDto = metadataSetMapper.selectMetadataSet(paramVo2);
			} else {
				metadataSetDto = prevSetDto;
			}
			
			// 일부 데이터만 저장하므로 필수 체크 안함
			
			int newRvsn = metadataSetDto.getMedataSetNwstRvsn();
						
			// 3. 메타데이터 들 저장 (dataMap에 key 값이 존재하는 것들만 저장)
			cnt += this.modifyMetadataMulti(metadataSetDto, modelInfoDto, dataMap, newRvsn, true);
			
			// 변경된 것이 있다면
			if (cnt > 0) {
				// 4. 개수 프라퍼티 저장
				List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, metadataSetDto);
				if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
					this.saveMetadataSaveDtoList(modelInfoDto, metadataSetDto, cntPrptySaveDtoList, true, false);
				}
				
				// 5. 카프카 전송
				this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, metadataSetDto, null, null);
	
				// 6. 키워드 프라퍼티가 존재하는 경우 influxDB에서 정크 키워드 제거
				if (modelInfoDto.getKeywordPropertyNmList().size() > 0) {
					this.removeJunkKeywordFromInfluxDb(metadataSetDto);
				}
				
				log.debug("[메타데이터 셋 의 일부 데이터 수정 (from dataMap)] - {} 변경됨.", medataSetId);				
			} else {
				log.debug("[메타데이터 셋 의 일부 데이터 수정 (from dataMap)] - {} 변경된 정보 없음.", medataSetId);
			}
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 셋 의 일부 데이터 수정 (from dataMap)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 셋 의 일부 데이터 수정 (from dataMap)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
		
		log.debug("[메타데이터 셋 의 일부 데이터 수정 (from dataMap)] 서비스 종료");
	}	
	
	/**
	 * dataMap 에서 범위모델로 값을 추출하여 메타데이터 셋 저장용 Dto를 생성하고 값을 설정 후 반환.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 11.
	 * @param modelInfoDto
	 * @param dataMap
	 * @return
	 * @modified 2025-08-26 savePartialMetadataSetFromDataMap 에서 사용시 dataMap 에 셋 칼럼의 일부만 들어올 수 있음. 필요한 프라퍼티 없는 경우 null 반환
	 */
	public MetadataSetSaveDto getMetadataSetSaveDtoFromMetadata(ModelInfoDto modelInfoDto, Map<String, Object> dataMap) {
		if (modelInfoDto.getPropertyMap() == null || modelInfoDto.getPropertyMap().isEmpty()) {
			log.debug("modelInfoDto.getPropertyMap() is empty.");
			return null;
		}
		if (modelInfoDto.getPropertyNmToSetColMap() == null || modelInfoDto.getPropertyNmToSetColMap().isEmpty()) {
			log.debug("modelInfoDto.getProperyNmToSetColMap() is empty.");
			return null;
		}
		if (dataMap == null || dataMap.isEmpty()) {
			log.debug("dataMap is empty.");
			return null;
		}
	    // 2025-08-26 dataMap 에 셋 칼럼에 해당하는 프라퍼티가 없다면 null 반환
	    // dataMap 에 기본 프라퍼티(idString 프라퍼티, metaModel 프라퍼티)만 있는 경우 null 반환
	    // -> 셋 칼럼 프라퍼티 중에서 기본 프라퍼티를 제외하고 나머지 프라퍼티가 존재하는지 확인
	    Set<String> keys = dataMap.keySet();		
		Set<String> baseSet = Set.of(Constant.KEYWORD_META_MODEL, modelInfoDto.getSetIdPropertyNm());
	    Set<String> allowedKeys = modelInfoDto.getPropertyNmToSetColMap().keySet();		
	    allowedKeys.removeAll(baseSet);
		if (java.util.Collections.disjoint(keys, allowedKeys)) { // 교집합이 없다면
			return null;
		}
		
		MetadataSetSaveDto dto = null;
		for (Map.Entry<String, String> pMap : modelInfoDto.getPropertyNmToSetColMap().entrySet()) {
			String val = (String) dataMap.get(pMap.getKey());
			if (StringUtils.isNotBlank(val)) {
				if (dto == null) { 
					dto = new MetadataSetSaveDto();
					dto.setModelId(modelInfoDto.getModelId());
				}
				
				try {
					FieldUtils.writeField(dto, pMap.getValue(), val, true);
					log.debug("writeField {} -> {} = {}", pMap.getKey(), pMap.getValue(), val);
				} catch  (IllegalArgumentException e1) {
					log.debug("writeField {} -> {} = {} ERROR - SKIP! : {}", pMap.getKey(), pMap.getValue(), val, e1.getMessage());
				} catch (IllegalAccessException e1) {
					log.error("writeField {} -> {} = {} 실패/오류", pMap.getKey(), pMap.getValue(), val, e1);
					throw new ResBaseRuntimeException(e1);
				}
			}
		}
		
		log.debug("metadataSetSaveDto : {}", dto);
		return dto;
	}
	
	/**
	 * 메타데이터 셋 Dto 에 있는 값을 해당 모델의 프라퍼티 값으로 dataMap 에 put 하기.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 11.
	 * @param metadataSetDto
	 * @param modelInfoDto
	 * @param dataMap
	 */
	public void setMetadataSetValueToMetadata(MetadataSetDto metadataSetDto, ModelInfoDto modelInfoDto, Map<String, Object> dataMap) {
		Assert.notNull(metadataSetDto, "metadataSetDto is null.");
		Assert.notNull(modelInfoDto, "modelInfoDto is null.");
		Assert.notNull(dataMap, "dataMap is null.");
		
		for (Map.Entry<String, String> sMap : modelInfoDto.getSelColToPropertyNmMap().entrySet()) {
			try {
				String val = (String) FieldUtils.readField(metadataSetDto, sMap.getKey(), true);
				if (StringUtils.isNotBlank(val)) {
					dataMap.put(sMap.getValue(), val);
					log.debug("readField {} -> {} = {})", sMap.getKey(), sMap.getValue(), val);
				}
			} catch (IllegalArgumentException e1) {
				log.debug("readField {} -> {} ERROR - SKIP! : {}", sMap.getKey(), sMap.getValue(), e1.getMessage());
			} catch (IllegalAccessException e1) {
				log.error("readField {} -> {} 실패/오류", sMap.getKey(), sMap.getValue(), e1);
				throw new ResBaseRuntimeException(e1);
			}
		}
		
		// medataSetNm 필수! 해당 프라퍼티가 없다면 임의의 값 설정.
		if (StringUtils.isBlank(modelInfoDto.getPropertyNm("medataSetNm"))) {
			metadataSetDto.setMedataSetNm("메타데이터 셋 명_" + DateUtil.getCurrDateTime("yyyyMMddHHmmss"));
		}
	}
	
	/**
	 * 메타데이터 프라퍼티 명의 메타데이터 저장 (Multi) (with ValueList)
	 * @Author      : heenim
	 * @Date        : 2023. 06. 02.
	 * @param medataSetId
	 * @param prptyNm
	 * @param dataValList
	 * @param typeModelVo
	 * @param checkTypeModel
	 * @return
	 */
	public int saveMetadataListByPropertyNm(String medataSetId, String prptyNm, List<Object> dataValList, ModelVo typeModelVo, boolean checkTypeModel) {
		log.debug("[메타데이터 프라퍼티 명의 메타데이터 저장 (Multi) (with ValueList)] 서비스 시작");
		int cnt = 0;

		try {		
			// 1. 유효성 체크
			
			if (dataValList == null || dataValList.isEmpty()) throw new ResBadRequestException(4000, "메타데이터 정보가 없습니다.");
			
			// 등록/미사용 상태만 수정 가능. 사용요청/사용/폐기 상태는 수정 불가능.
	    	MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(medataSetId, Constant.SET_STATUS_REG, Constant.SET_STATUS_UN);
	    	
	    	// 필요시 유형 체크
	    	if (checkTypeModel) { 
				if (typeModelVo == null || !StringUtils.equals(typeModelVo.getModelId(), prevSetDto.getTypeModelId())) {
					throw new ResNotFoundException("해당 유형의 리소스가 존재하지 않습니다.");
				}
	    	}
	    	
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 프라퍼티 체크
			ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(prptyNm);
			if (pDto == null) throw new ResBizInfoException("프라퍼티가 존재하지 않거나 사용할 수 없는 프라퍼티입니다.");
			
			if (PropertyRequired.readonly.code().equals(pDto.getModelPrptyMandMtcd())) throw new ResBizInfoException("조회전용 프라퍼티입니다.");
			
			String dataType = pDto.getRangeDataTypeMtcd();
			
			
			// 셋 용 프라퍼티인 경우
			if (modelInfoDto.getPropertyNmToSetColMap().containsKey(prptyNm)) {
				// 셋 Vo 에 값 설정
				Map<String, Object> setDataMap = new HashMap<>();
				this.setMetadataSetValueToMetadata(prevSetDto, modelInfoDto, setDataMap);
				setDataMap.put(prptyNm, dataValList.get(0)); // 셋 용은 배열 데이터 없음.
				MetadataSetSaveDto setSaveDto = this.getMetadataSetSaveDtoFromMetadata(modelInfoDto, setDataMap);
				
				// 2. 메타데이터 셋을 수정하고 셋에 해당하는 특수 메타데이터들을 저장
				this.modifyMetadataSetAndMetadataForSet(modelInfoDto, setSaveDto);
				
			// 셋 용 프라퍼티가 아닌 경우
			} else {
				
				// 데이터 유효성 체크
				StringBuffer sb = new StringBuffer();
				int errCnt = 0;
				
				this.checkRequiredAndValidDataByPropertyNm(sb, errCnt, pDto, prptyNm, dataValList);
				
				if (sb.length() > 0) {
					this.trimLastNewline(sb);
					throw new ResBadRequestException(4000, sb.toString());
				}
				
				// 키워드인 경우 저장 전 목록 조회
				List<String> prevKeywordList = null;
		    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
	    			MetadataSearchVo paramVo = new MetadataSearchVo();
	    			paramVo.setMedataSetId(medataSetId);
	    			paramVo.setPrptyId(pDto.getPrptyId());
		    		prevKeywordList = metadataMapper.selectKeywordListBySetId(paramVo);
		    		if (prevKeywordList == null) {
		    			prevKeywordList = new ArrayList<String>(); // not null
		    		}
		    	}
				
				// 2. 메타데이터 프라퍼티 명의 메타데이터들을 저장.
				int newRvsn = prevSetDto.getMedataSetNwstRvsn() + 1;
				cnt = this.saveMetadataValueListByPropertyNm(modelInfoDto, prevSetDto, prptyNm, dataValList, newRvsn, prevKeywordList);
				
				// 3. 개수 프라퍼티 저장
				if ("object_type".equals(pDto.getRangeModelTypeMtcd())) {
					prevSetDto.setMedataSetNwstRvsn(newRvsn);
					List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, prevSetDto);
					if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
						this.saveMetadataSaveDtoList(modelInfoDto, prevSetDto, cntPrptySaveDtoList, true, false);
					}
				}
				
			    // 4. 메타데이터 셋 리비전 증가
				this.modifyToIncreaseMetadataSetNwstRvsn(modelInfoDto, prevSetDto);
	    	
			}
						
			// 5. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, prevSetDto, null, null);
			
			// 6. 키워드 프라퍼티가 존재하는 경우 influxDB에서 정크 키워드 제거
			if (modelInfoDto.getKeywordPropertyNmList().size() > 0) {
				this.removeJunkKeywordFromInfluxDb(prevSetDto);
			}
		
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터 프라퍼티 명의 메타데이터 저장 (Multi) (with ValueList)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 프라퍼티 명의 메타데이터 저장 (Multi) (with ValueList)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 프라퍼티 명의 메타데이터 저장 (Multi) (with ValueList)] 서비스 종료");
		return cnt;
	}
	
	/**
	 * 메타데이터 프라퍼티 명의 메타데이터 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 06. 07.
	 * @param medataSetId
	 * @param prptyNm
	 * @param deleteValList
	 * @param typeModelVo
	 * @param checkTypeModel
	 * @return
	 */
	public int deleteMetadataListByPropertyNm(String medataSetId, String prptyNm, List<Object> deleteValList, ModelVo typeModelVo, boolean checkTypeModel) {
		log.debug("[메타데이터 프라퍼티 명의 메타데이터 삭제] 서비스 시작");
		int cnt = 0;
    	
		try {
			// 1. 유효성 체크
			
			// 메타데이터 셋이 등록/미사용 상태만 삭제 가능.
	    	MetadataSetDto prevSetDto = this.checkEditableAndGetMetadataSetDto(medataSetId, Constant.SET_STATUS_REG, Constant.SET_STATUS_UN);
	    	
	    	// 필요시 유형 체크
	    	if (checkTypeModel) { 
				if (typeModelVo == null || !StringUtils.equals(typeModelVo.getModelId(), prevSetDto.getTypeModelId())) {
					throw new ResNotFoundException("해당 유형의 리소스가 존재하지 않습니다.");
				}
	    	}
	    	
			// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
			ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(prevSetDto.getModelId());
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			// 프라퍼티 체크
			ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(prptyNm);
		
			if (pDto == null) throw new ResBizInfoException("프라퍼티가 존재하지 않거나 사용할 수 없는 프라퍼티입니다.");
			
			if (PropertyRequired.readonly.code().equals(pDto.getModelPrptyMandMtcd())) throw new ResBizInfoException("조회전용 프라퍼티입니다.");
			
    		// 필수 프라퍼티 경우 삭제 불가
    		if (PropertyRequired.required.code().equals(pDto.getModelPrptyMandMtcd())) {
    			
    			if ("N".equals(pDto.getDataArrayYn())) {
    				throw new ResBizInfoException("필수 프라퍼티로 삭제가 불가능합니다.");
    			} else if (deleteValList == null || deleteValList.size() == 0) {
    				throw new ResBizInfoException("필수 프라퍼티로 삭제가 불가능합니다.");
    			} else {
    				// 배열 프라퍼티 이고 삭제 하려는 값이 일부인 경우는 삭제 가능. 다시 체크!
    			}    			
    			
    		}	
	    	
	    	// 셋 용 특수 프라퍼티인 경우 삭제 불가
	    	if ("Y".equals(pDto.getSetUsgPrptyYn())) {
	    		throw new ResBizInfoException("특수 프라퍼티로 삭제가 불가능합니다.");
	    	}	
	    	
	    	int newRvsn = prevSetDto.getMedataSetNwstRvsn() + 1;
	    	
	    	// 2. 삭제 대상 메타데이터 삭제
	    	this.deleteMetadataValueListByPropertyNm(modelInfoDto, prevSetDto, prptyNm, deleteValList, newRvsn, true);
	    	
			// 3. 개수 프라퍼티 저장
			if ("object_type".equals(pDto.getRangeModelTypeMtcd())) {
				prevSetDto.setMedataSetNwstRvsn(newRvsn);
				List<MetadataSaveDto> cntPrptySaveDtoList = this.getCntPrptySaveDtoList(modelInfoDto, prevSetDto);
				if (cntPrptySaveDtoList != null && cntPrptySaveDtoList.size() > 0) {
					this.saveMetadataSaveDtoList(modelInfoDto, prevSetDto, cntPrptySaveDtoList, true, false);
				}
			}
	    	
	    	// 4. 메타데이터 셋 리비전 증가
	    	this.modifyToIncreaseMetadataSetNwstRvsn(modelInfoDto, prevSetDto);
	    	
			// 5. 카프카 전송
			this.sendMetadataViaKafka(KafkaConst.ACTION_MODIFY, prevSetDto, null, null);
			
			// 6. 키워드 프라퍼티인 경우 influxDB에서 정크 키워드 제거
			String dataType = pDto.getRangeDataTypeMtcd();
			if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
				this.removeJunkKeywordFromInfluxDb(prevSetDto);
			}
    	
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터 프라퍼티 명의 메타데이터 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[메타데이터 프라퍼티 명의 메타데이터 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
	
		log.debug("[메타데이터 프라퍼티 명의 메타데이터 삭제] 서비스 종료");
		return cnt;		
	}
	
	private int deleteMetadataValueListByPropertyNm(ModelInfoDto modelInfoDto, MetadataSetDto prevSetDto, String prptyNm, List<Object> deleteValList, int newRvsn, boolean isThrowException) {
		int cnt = 0;
		
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();	    	
    	String delPrptyId = modelInfoDto.getPropertyId(prptyNm);
    	ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(prptyNm);
    	String dataType = pDto.getRangeDataTypeMtcd();
		
		String medataSetId   = prevSetDto.getMedataSetId();
		
		// 삭제 대상 설정 및 건수 조회
    	MetadataPropertySearchVo delSearchVo = new MetadataPropertySearchVo();
    	delSearchVo.setMedataSetId(medataSetId);
    	delSearchVo.setPrptyNm(prptyNm);
    	delSearchVo.setPrptyId(delPrptyId);
    	
    	// 1. 전체 건수 조회
    	int totCnt = metadataMapper.selectMetadataCountByPropertyNm(delSearchVo);
    	if (totCnt == 0) {
    		if (isThrowException) {
    			throw new ResNotFoundException("해당 리소스가 존재하지 않습니다.");
	    	} else {
	    		log.warn("{} - {} : 해당 리소스가 존재하지 않습니다.", medataSetId, prptyNm);
	    		return cnt;
	    	}
    	}
    	
    	// 2. 선택 건수 조회
    	List<Map<String, String>> delValMapList = null;
    	List<String> delValList = null;
    	MetadataVo delValVo = new MetadataVo();
    	if (deleteValList != null && deleteValList.size() > 0) { // 선택한 값들
    		if (RangeDataTypeMtcd.langString.code().equals(dataType)) {
    			delValMapList = new ArrayList<>();
	    		Map<String, String> delValMap = null;
	    		for (Object delValObj : deleteValList) {
	    			this.checkValue(delValObj, pDto, true);
	    			this.setValueToVo(delValVo, delValObj, null, pDto.getRangeDataTypeMtcd());
	    			delValMap = new HashMap<>();
	    			delValMap.put("medataVal", delValVo.getMedataVal());
	    			delValMap.put("langMtcd", delValVo.getLangMtcd());
	    			delValMapList.add(delValMap);
	    		}
	    		delSearchVo.setIncludedMetadataMapList(delValMapList);
    		} else {
    			delValList = new ArrayList<>();
	    		for (Object delValObj : deleteValList) {
	    			this.checkValue(delValObj, pDto, true);
	    			this.setValueToVo(delValVo, delValObj, null, pDto.getRangeDataTypeMtcd());
	    			delValList.add(delValVo.getMedataVal());
	    		}
	    		delSearchVo.setIncludedMetadataValList(delValList);	    			
    		}
    	}
    	
    	int selCnt = metadataMapper.selectMetadataCountByPropertyNm(delSearchVo);
    	if (selCnt == 0) {
    		if (isThrowException) {
    			throw new ResNotFoundException("해당 리소스가 존재하지 않습니다.");
	    	} else {
	    		log.warn("{} - {} : 해당 리소스가 존재하지 않습니다.", medataSetId, prptyNm);
	    		return cnt;
	    	}
    	}
    	
    	if (isThrowException) {
			// 필수 프라퍼티 경우 삭제 불가 (선택 건수가 전체 건수보다 작아야 함)
			if (PropertyRequired.required.code().equals(pDto.getModelPrptyMandMtcd())) {
				if (totCnt <= selCnt || totCnt == 1) {
					throw new ResBizInfoException("필수 프라퍼티로 삭제가 불가능합니다.");
				}
			}
    	}

    	// 셋이 등록 상태가 아닌 경우
    	if (!Constant.SET_STATUS_REG.equals(prevSetDto.getMedataSetSttusMtcd())) {
    		// 3. 현재 메타데이터 셋 프라퍼티의 변경이력 등록
    		MetadataChgHstSaveDto newHstVo = new MetadataChgHstSaveDto();
			newHstVo.setChgHstDivMtcd("del");
			newHstVo.setChgAftrRvsn(newRvsn);
			newHstVo.setChgHstRegrId(loginUserVo.getUserId());
			newHstVo.setChgHstRegrNm(loginUserVo.getUserNm());
			
			newHstVo.setMedataSetId(medataSetId);
			newHstVo.setPrptyId(delPrptyId);
			newHstVo.setIncludedMetadataMapList(delValMapList);
			newHstVo.setIncludedMetadataValList(delValList);
			metadataChgHstMapper.insertMetadataChgHstAutoKeyListBySelectingBySetId(newHstVo);  		
    	}
		
		// 4. 메타데이터 삭제
    	cnt = metadataMapper.deleteMetadataAllByPropertyId(delSearchVo);
    	
    	// 5. 현재 프라퍼티를 참조하고 있는 프라퍼티가 있는 경우 같이 메타데이터 삭제, 위의 삭제 건수가 존재하는 경우만.
    	if (modelInfoDto.getRefPropertyNmMap().containsKey(prptyNm) && cnt > 0) {
    		metadataMapper.deleteMetadataAllByRefPropertyId(delSearchVo);
    	}
		
		return cnt;
	}
	
	/**
	 * 메타데이터 프라퍼티 명의 메타데이터들을 저장. (이미 유효성 검사는 끝났다고 가정. 셋 용 프라퍼티는 따로 저장 할 것.)
	 * @Author      : heenim
	 * @Date        : 2023. 06. 07.
	 * @param modelInfoDto
	 * @param metadataSetDto
	 * @param prptyNm
	 * @param dataValList
	 * @param newRvsn
	 * @param prevKeywordList
	 * @return
	 */
	private int saveMetadataValueListByPropertyNm(ModelInfoDto modelInfoDto, MetadataSetDto metadataSetDto, String prptyNm, List<Object> dataValList, int newRvsn, List<String> prevKeywordList) {
		int cnt = 0;
		
		String medataSetId   = metadataSetDto.getMedataSetId();
		String medataSetStts = metadataSetDto.getMedataSetSttusMtcd();
		
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(prptyNm);
		
		// 조회전용 프라퍼티는 여기서 저장 안함.
		if (PropertyRequired.readonly.code().equals(pDto.getModelPrptyMandMtcd())) {
			return cnt;
		}
		
    	if ("N".equals(pDto.getDataArrayYn())) {
			if (dataValList.size() > 1) {
				log.debug("{} : 배열 프라퍼티 아님. 값이 {}건 들어와서 첫번째 값 이후 값 삭제.", prptyNm, dataValList.size());
				// 배열 프라퍼티가 아니기 때문에 1번째 값만 남기고 삭제.
				dataValList.subList(1, dataValList.size()).clear();
			}
    	}

    	String dataType = pDto.getRangeDataTypeMtcd();
    	
		MetadataVo newVo = null;
		MetadataVo prevVo = null;
		String chgHstDivMtcd = "";
		
		for (Object valObj : dataValList) {
			
			boolean isSaved = false;
			String medataId = "";			
			
			// medataId 가 없더라도 배열 프라퍼티가 아닌 경우, 중복이 되는지 체크   TODO: 성능 저하 우려, 추후 수정이 필요할 수 있음
	    	if ("N".equals(pDto.getDataArrayYn())) {
				MetadataPropertySearchVo paramVo = new MetadataPropertySearchVo();
				paramVo.setMedataSetId(medataSetId);
				paramVo.setPrptyNm(prptyNm);
				List<MetadataPropertyDto> prevDataList = metadataMapper.selectMetadataListByPropertyNm(paramVo);
				if (prevDataList != null && !prevDataList.isEmpty()) {
					if (prevDataList.size() > 1) {
						throw new ResBizInfoException(prptyNm + " : 배열 프라퍼티가 아닌 데이터가 여러 건이 존재합니다.");
					} else { // size == 1
						medataId = prevDataList.get(0).getMedataId(); // 1건 존재 경우 수정 모드가 되게 함.
						prevVo = prevDataList.get(0);
					}
	    		}
				
			// 배열 프라퍼티인 경우, 중복이 되는지 체크   TODO: 성능 저하 우려, 추후 수정이 필요할 수 있음
	    	} else if ("Y".equals(pDto.getDataArrayYn()) && valObj != null) {
			
				MetadataVo chkValVo = new MetadataVo();
				this.setValueToVo(chkValVo, valObj, null, pDto.getRangeDataTypeMtcd());
				
	    		MetadataPropertySearchVo dupParamVo = new MetadataPropertySearchVo();
	    		dupParamVo.setMedataSetId(medataSetId);
	    		dupParamVo.setPrptyNm(prptyNm);
	    		dupParamVo.setMedataVal(chkValVo.getMedataVal());
	    		dupParamVo.setLangMtcd(chkValVo.getLangMtcd());
	    		List<CamelCaseMap> dupDataList = metadataMapper.selectMetadataListByPropertyNmForDupCheck(dupParamVo); 
				if (dupDataList != null && dupDataList.size() > 0) {
					medataId = (String) dupDataList.get(0).get("medataId"); // 배열 프라퍼티 이고 동일한 값이 존재하는 경우 수정 모드가 되게 함.
					prevVo = this.getMetadata(medataId);
					int dupCnt = (int) dupDataList.get(0).get("cnt");
					if (dupCnt > 1) log.warn("{} 프라퍼티에 동일한 값이 {}건 있음!", prptyNm, dupCnt);
				}
			}
	    	
	    	if (StringUtils.isBlank(medataId)) {
	    		// 1-1. 등록
	    		newVo = this.getMetadataVoFromMetadata(medataSetId, valObj, null, pDto);
	    		if (newVo != null) {
	    			cnt += this.createMetadata(newVo);
	    			chgHstDivMtcd = "reg";
	    			isSaved = true;
	    		}
	    	} else {
	    		// 1-2. 수정
	    		newVo = this.getMetadataVoFromMetadata(medataSetId, valObj, null, pDto, medataId);
	    		if (this.isValueChanged(newVo, prevVo)) { // FIXME : 값 비교를 하여 변경된 것만 수정
	    			cnt += this.modifyMetadata(newVo);
	    			chgHstDivMtcd = "amd";
	    			isSaved = true;
	    		}
	    	}
	    	
	    	if (newVo != null && isSaved) {
			    // 셋이 등록 상태가 아닌 경우
		    	if (!Constant.SET_STATUS_REG.equals(medataSetStts)) {
		    		// 2. 변경이력 등록
					MetadataChgHstVo newHstVo = new MetadataChgHstVo();
					newHstVo.copyPropertiesFrom(newVo);
					newHstVo.setChgHstDivMtcd(chgHstDivMtcd);
					newHstVo.setChgAftrRvsn(newRvsn);
					newHstVo.setChgAftrLangMtcd(newVo.getLangMtcd());
					newHstVo.setChgAftrVal(newVo.getMedataVal());
					newHstVo.setChgAftrGeoVal(newVo.getGeodataVal());
					newHstVo.setChgHstRegrId(loginUserVo.getUserId());
					newHstVo.setChgHstRegrNm(loginUserVo.getUserNm());
					metadataChgHstMapper.insertMetadataChgHstAutoKey(newHstVo);
		    	} 	
		    	
		    	// 3. 키워드인 경우 따로 저장
		    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
		    		// 3-1. 키워드만 따로 저장
		    		keywordService.saveKeywordList(newVo.getMedataVal(), newVo.getLangMtcd());

		    		// 3-2. influxDB에 키워드 저장
		    		InfluxDbKeywordDto keywordDto = new InfluxDbKeywordDto();
		    		keywordDto.setKeyword(newVo.getMedataVal());
		    		keywordDto.setLangMtcd(newVo.getLangMtcd());
		    		keywordDto.setPrptyId(pDto.getPrptyId());
		    		keywordDto.setMedataSetId(medataSetId);
		    		keywordDto.setDateTimeStr(metadataSetDto.getMedataSetAmdDt());
		    		this.saveKeywordToInfluxDb(keywordDto, prevKeywordList);
		    	}
	    	}
	    }
		
		// 참조 프라퍼티이고 참조하는 프라퍼티가 존재하면 따라서 저장  (참조 프라퍼티는 배열이 아니라고 가정)
		if (modelInfoDto.getRefPropertyNmMap() != null && modelInfoDto.getRefPropertyNmMap().size() > 0) {
		    	
	    	// 프라퍼티가 code, categoryId 데이터 유형 등 참조 프라퍼티 라면
	    	if (modelInfoDto.getRefPropertyNmMap().containsKey(prptyNm)) {
	    		String derivedPrptyNm = modelInfoDto.getRefPropertyNmMap().get(prptyNm);
	    		ModelPropertyInfoDto pDto1 = modelInfoDto.getPropertyInfoDto(prptyNm);
				ModelPropertyInfoDto pDto2 = modelInfoDto.getPropertyInfoDto(derivedPrptyNm);
		    	String dataType2 = pDto2.getRangeDataTypeMtcd();
				boolean isSaved = false;
				String medataId = "";
		    	
				MetadataPropertySearchVo paramVo2 = new MetadataPropertySearchVo();
				paramVo2.setMedataSetId(medataSetId);
				paramVo2.setPrptyNm(derivedPrptyNm);
				List<MetadataPropertyDto> prevDataList = metadataMapper.selectMetadataListByPropertyNm(paramVo2);
				if (prevDataList != null && prevDataList.size() == 1) {
					medataId = prevDataList.get(0).getMedataId(); // 1건 존재 경우 수정 모드가 되게 함.
					prevVo = prevDataList.get(0);
	    		}		
		    	
				for (Object valObj : dataValList) { // 1건
					// codeName, categoryName, refSetName 데이터 유형 프라퍼티의 조회 값 설정
			    	String derivedVal = null;
					if (RangeDataTypeMtcd.codeName.code().equals(dataType2)) {
						derivedVal = codeGroupService.getCodeNameFromCache(pDto1.getRangeMtcdGrpId(), (String) valObj);
					} else if (RangeDataTypeMtcd.categoryName.code().equals(dataType2)) {
						if (RangeDataTypeMtcd.categoryConcept.code().equals(dataType)) {
							derivedVal = categoryService.getCategoryNameByConcept((String) valObj);
						} else {
							derivedVal = categoryService.getCategoryName((String) valObj);
						}
				    } else if (RangeDataTypeMtcd.refSetName.code().equals(dataType2)) {	
				    	derivedVal = this.getMetadataSetNameById((String) valObj);
				    }    	
			    	
			    	if (StringUtils.isBlank(medataId)) {
			    		// 1-1. 등록
			    		newVo = this.getMetadataVoFromMetadata(medataSetId, derivedVal, null, pDto2);
			    		if (newVo != null) {
			    			cnt += this.createMetadata(newVo);
			    			chgHstDivMtcd = "reg";
			    			isSaved = true;
			    		}
			    	} else {
			    		// 1-2. 수정
			    		newVo = this.getMetadataVoFromMetadata(medataSetId, derivedVal, null, pDto2, medataId);
			    		if (this.isValueChanged(newVo, prevVo)) { // FIXME : 값 비교를 하여 변경된 것만 수정
			    			cnt += this.modifyMetadata(newVo);
			    			chgHstDivMtcd = "amd";
			    			isSaved = true;
			    		}    			
			    	}
			    	
			    	if (newVo != null && isSaved) {
					    // 셋이 등록 상태가 아닌 경우
				    	if (!Constant.SET_STATUS_REG.equals(medataSetStts)) {
				    		// 2. 변경이력 등록
							MetadataChgHstVo newHstVo = new MetadataChgHstVo();
							newHstVo.copyPropertiesFrom(newVo);
							newHstVo.setChgHstDivMtcd(chgHstDivMtcd);
							newHstVo.setChgAftrRvsn(newRvsn);
							newHstVo.setChgAftrLangMtcd(newVo.getLangMtcd());
							newHstVo.setChgAftrVal(newVo.getMedataVal());
							newHstVo.setChgAftrGeoVal(newVo.getGeodataVal());
							newHstVo.setChgHstRegrId(loginUserVo.getUserId());
							newHstVo.setChgHstRegrNm(loginUserVo.getUserNm());
							metadataChgHstMapper.insertMetadataChgHstAutoKey(newHstVo);
				    	} 	
				    	
//				    	// 3. 키워드인 경우 따로 저장 (참조 프라퍼티는 키워드 아님)
//				    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType2) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType2)) {
//				    		keywordService.saveKeywordList(newVo.getMedataVal(), newVo.getLangMtcd());
//				    	}
			    	}
			    }
	    	}
		}
		
		return cnt;
	}
	
	/**
	 * 메타데이터 셋 리비전 증가
	 * @Author      : heenim
	 * @Date        : 2023. 06. 07.
	 * @param modelInfoDto
	 * @param metadataSetDto
	 */
	private void modifyToIncreaseMetadataSetNwstRvsn(ModelInfoDto modelInfoDto, MetadataSetDto metadataSetDto) {
		String medataSetId   = metadataSetDto.getMedataSetId();
		String medataSetStts = metadataSetDto.getMedataSetSttusMtcd();
		
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		
	    // 셋이 등록 상태가 아닌 경우
    	if (!Constant.SET_STATUS_REG.equals(medataSetStts)) {
    		
    		// 1. 수정 전 변경이력을 위한 셋 용 메타데이터 들 조회
    		MetadataSetVo idParamVo = new MetadataSetVo();
    		idParamVo.setMedataSetId(medataSetId);
    		// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
    		idParamVo.setSqlDateFormat(SqlDatePart.iso6z.format());
    		List<MetadataChgHstSaveDto> prevSetValueList = metadataChgHstMapper.selectSelValueListBySetIdForChgHst(idParamVo);	    		
    		
			// 2. 리비전 증가
    		metadataSetDto.setMedataSetAmdrId(loginUserVo.getUserId());
    		metadataSetDto.setMedataSetAmdrNm(loginUserVo.getUserNm());
			metadataSetMapper.updateMetadataSetNwstRvsn(metadataSetDto);
			
			// 3. 셋 용 메타데이터 들 저장
			this.saveMetadataListForSet(modelInfoDto, medataSetId, prevSetValueList, false, null);
    	}
	}

	/**
	 * 메타데이터 dataMap 에서 필수 체크과 값 유효성 체크. 유효한 값이 아니면 Exception 발생.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 11.
	 * @param modelInfoDto
	 * @param dataMap
	 */
	private void checkRequiredAndValidData(ModelInfoDto modelInfoDto, Map<String, Object> dataMap) {
		Assert.notNull(modelInfoDto, "modelInfoDto is null.");
		Assert.notEmpty(dataMap, "dataMap is empty.");
		
		StringBuffer sb = new StringBuffer();
		int errCnt = 0;
		
		for (Map.Entry<String, ModelPropertyInfoDto> pMap : modelInfoDto.getPropertyMap().entrySet()) {
			ModelPropertyInfoDto pDto = pMap.getValue();
			String propertyNm = pMap.getKey();
			
			// 프라퍼티 별로 체크
			errCnt += this.checkRequiredAndValidDataByPropertyNm(sb, errCnt, pDto, propertyNm, dataMap.get(propertyNm));
			
			if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
				break;
			}				

		}
		
		if (sb.length() > 0) {
			this.trimLastNewline(sb);
			throw new ResBadRequestException(4000, sb.toString());
		}
	}
	
	/**
	 * 프라퍼티별 메타데이터 필수 체크과 값 유효성 체크. 유효한 값이 아니면 에러메세지 append 후 errCnt 반환.
	 * @Author      : heenim
	 * @Date        : 2023. 06. 02.
	 * @param sb
	 * @param errCnt
	 * @param pDto
	 * @param propertyNm
	 * @param dataObj
	 * @return
	 */
	@SuppressWarnings("rawtypes")
	private int checkRequiredAndValidDataByPropertyNm(StringBuffer sb, int errCnt, ModelPropertyInfoDto pDto, String propertyNm, Object dataObj) {
		
		// 배열 데이터 여부
		boolean isArrayProperty = StringUtils.equals("Y", pDto.getDataArrayYn());
		log.debug("{} isArrayProperty : {}", propertyNm, isArrayProperty);
		if (isArrayProperty) {
			Object valArrObj = dataObj;
			if (valArrObj == null) {
				// 필수 체크
				if (PropertyRequired.required.code().equals(pDto.getModelPrptyMandMtcd())) {
					sb.append(propertyNm).append(ValueUtil.required()).append("\n");
					errCnt++;
				}
				return errCnt;
			}
			
			if (ValueUtil.isList(valArrObj)) { // List 데이터
				List listObj = (List) valArrObj;
				if (listObj.isEmpty()) {
					// 필수 체크
					if (PropertyRequired.required.code().equals(pDto.getModelPrptyMandMtcd())) {
						sb.append(propertyNm).append(ValueUtil.required()).append("\n");
						errCnt++;
					}
				}
				
				for (Object valObj : listObj) {
					try {
						this.checkValue(valObj, pDto, true);
						
					} catch(ResBadRequestException e1) {
						sb.append(e1.getReason()).append("\n");
						errCnt++;
						
						if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
							return errCnt;
						}				
					}
				}					
			} else if (ValueUtil.isArray(valArrObj)) { // 배열 데이터
				Object[] valObjArr = (Object[]) valArrObj;
				for (Object valObj : valObjArr) {
					try {
						this.checkValue(valObj, pDto, true);
						
					} catch(ResBadRequestException e1) {
						sb.append(e1.getReason()).append("\n");
						errCnt++;
						
						if (errCnt > Constant.ERR_MSG_LIMIT_CNT) { // 30건 이상 오류가 나면 더 체크하지 않고 오류 발생
							return errCnt;
						}				
					}
				}
			} else {
				sb.append(propertyNm).append(ValueUtil.mustBeArray()).append("\n");
				errCnt++;
			}
			
		} else {
			
			Object valObj = dataObj;
			try {
				this.checkValue(valObj, pDto, true);
				
			} catch(ResBadRequestException e1) {
				sb.append(e1.getReason()).append("\n");
				errCnt++;
			}
			
		}
		
		return errCnt;
	}

	/** 맨 끝의 \n 삭제 */
	private void trimLastNewline(StringBuffer sb) {
		int n = sb.length();
		if (n > 0 && sb.charAt(n - 1) == '\n') {
		    sb.setLength(n - 1);
		}
	}
	
	/**
	 * 메타데이터 dataMap 에 참조 프라퍼티를 활용하여 조회전용 참조값 설정.
	 * @Author      : heenim
	 * @Date        : 2023. 06. 02.
	 * @param modelInfoDto
	 * @param dataMap
	 */
	private void setRefValToDataMap(ModelInfoDto modelInfoDto, Map<String, Object> dataMap) {
		// 참조 프라퍼티가 있는 경우 미리 값 설정 (참조 프라퍼티는 배열이 아니라고 가정)
		if (modelInfoDto.getRefPropertyNmMap() != null && modelInfoDto.getRefPropertyNmMap().size() > 0) {
			for (Map.Entry<String, String> rMap : modelInfoDto.getRefPropertyNmMap().entrySet()) {
				String refPrptyNm     = rMap.getKey();   // code, categoryId 데이터 유형 등 참조 프라퍼티
				String derivedPrptyNm = rMap.getValue(); // codeName, categoryName, refSetName 데이터 유형 프라퍼티

				if (!dataMap.containsKey(refPrptyNm)) {
					log.warn("{} 프라퍼티가 참조할 {} 프라퍼티가 존재하지 않습니다!", derivedPrptyNm, refPrptyNm);
					continue;
				}
				
	    		ModelPropertyInfoDto pDto1 = modelInfoDto.getPropertyInfoDto(refPrptyNm);
				ModelPropertyInfoDto pDto2 = modelInfoDto.getPropertyInfoDto(derivedPrptyNm);
				String dataType = pDto2.getRangeDataTypeMtcd();
				String refDataType = pDto1.getRangeDataTypeMtcd();		
						
				// codeName, categoryName, refSetName 데이터 유형 프라퍼티의 조회 값 설정
		    	String derivedVal = null;
		    	String refVal = (String) dataMap.get(refPrptyNm);
				if (RangeDataTypeMtcd.codeName.code().equals(dataType)) {
					derivedVal = codeGroupService.getCodeNameFromCache(pDto1.getRangeMtcdGrpId(), refVal);
				} else if (RangeDataTypeMtcd.categoryName.code().equals(dataType)) {
					if (RangeDataTypeMtcd.categoryConcept.code().equals(refDataType)) {
						derivedVal = categoryService.getCategoryNameByConcept(refVal);
					} else {
						derivedVal = categoryService.getCategoryName(refVal);
					}					
			    } else if (RangeDataTypeMtcd.refSetName.code().equals(dataType)) {	
			    	derivedVal = this.getMetadataSetNameById(refVal);
			    }				
				
				dataMap.put(derivedPrptyNm, derivedVal);
			}
		}
	}	
	
	/**
	 * 유효한 값을 가진 메타데이터 dataMap 에 있는 값들을 메타데이터 DB에 등록.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 12.
	 * @param metadataSetDto
	 * @param modelInfoDto
	 * @param dataMap
	 * @return
	 */
	@SuppressWarnings("rawtypes")
	private int createMetadataMulti(MetadataSetDto metadataSetDto, ModelInfoDto modelInfoDto, Map<String, Object> dataMap) {
		Assert.notNull(metadataSetDto, "metadataSetDto is null.");
		Assert.notNull(metadataSetDto.getMedataSetId(), "medataSetId is empty.");
		Assert.notNull(modelInfoDto, "modelInfoDto is null.");
		Assert.notEmpty(dataMap, "dataMap is empty.");
		String medataSetId = metadataSetDto.getMedataSetId();
		
		// 키워드인 경우 저장 전 목록를 위함
		List<String> prevKeywordList = new ArrayList<String>(); // not null
		
		// 참조 프라퍼티를 활용하여 조회전용 참조값 설정.
		this.setRefValToDataMap(modelInfoDto, dataMap);
		
		int cnt = 0;
		for (Map.Entry<String, ModelPropertyInfoDto> pMap : modelInfoDto.getPropertyMap().entrySet()) {
			ModelPropertyInfoDto pDto = pMap.getValue();
			String propertyNm = pMap.getKey();
			String dataType = pDto.getRangeDataTypeMtcd();
			
			// 배열 데이터 여부
			boolean isArrayProperty = StringUtils.equals("Y", pDto.getDataArrayYn());
			log.debug("{} isArrayProperty : {}", propertyNm, isArrayProperty);
			if (isArrayProperty) {
				Object valArrObj = dataMap.get(propertyNm);
				if (ValueUtil.isList(valArrObj)) { // List 데이터
					List listObj = (List) valArrObj;
					for (Object valObj : listObj) {
						MetadataVo newVo = this.getMetadataVoFromMetadata(medataSetId, valObj, null, pDto);
						if (newVo != null) {
							cnt += this.createMetadata(newVo);
							
					    	// 키워드인 경우 따로 저장
					    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
					    		// 키워드만 따로 저장
					    		keywordService.saveKeywordList(newVo.getMedataVal(), newVo.getLangMtcd());

					    		// influxDB에 키워드 저장
					    		InfluxDbKeywordDto keywordDto = new InfluxDbKeywordDto();
					    		keywordDto.setKeyword(newVo.getMedataVal());
					    		keywordDto.setLangMtcd(newVo.getLangMtcd());
					    		keywordDto.setPrptyId(pDto.getPrptyId());
					    		keywordDto.setMedataSetId(medataSetId);
					    		keywordDto.setDateTimeStr(metadataSetDto.getMedataSetAmdDt());
					    		this.saveKeywordToInfluxDb(keywordDto, prevKeywordList);
					    	}
						}
					}					
				}
				else if (ValueUtil.isArray(valArrObj)) { // 배열 데이터
					Object[] valObjArr = (Object[]) valArrObj;
					for (Object valObj : valObjArr) {
						MetadataVo newVo = this.getMetadataVoFromMetadata(medataSetId, valObj, null, pDto);
						if (newVo != null) {
							cnt += this.createMetadata(newVo);
							
					    	// 키워드인 경우 따로 저장
					    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
					    		// 키워드만 따로 저장
					    		keywordService.saveKeywordList(newVo.getMedataVal(), newVo.getLangMtcd());

					    		// influxDB에 키워드 저장
					    		InfluxDbKeywordDto keywordDto = new InfluxDbKeywordDto();
					    		keywordDto.setKeyword(newVo.getMedataVal());
					    		keywordDto.setLangMtcd(newVo.getLangMtcd());
					    		keywordDto.setPrptyId(pDto.getPrptyId());
					    		keywordDto.setMedataSetId(medataSetId);
					    		keywordDto.setDateTimeStr(metadataSetDto.getMedataSetAmdDt());
					    		this.saveKeywordToInfluxDb(keywordDto, prevKeywordList);
					    	}						
						}
					}
				} 
				
			} else {
				Object valObj = dataMap.get(propertyNm);
				MetadataVo newVo = this.getMetadataVoFromMetadata(medataSetId, valObj, null, pDto);
				if (newVo != null) {
					cnt += this.createMetadata(newVo);
					
			    	// 키워드인 경우 따로 저장
			    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
			    		// 키워드만 따로 저장
			    		keywordService.saveKeywordList(newVo.getMedataVal(), newVo.getLangMtcd());

			    		// influxDB에 키워드 저장
			    		InfluxDbKeywordDto keywordDto = new InfluxDbKeywordDto();
			    		keywordDto.setKeyword(newVo.getMedataVal());
			    		keywordDto.setLangMtcd(newVo.getLangMtcd());
			    		keywordDto.setPrptyId(pDto.getPrptyId());
			    		keywordDto.setMedataSetId(medataSetId);
			    		keywordDto.setDateTimeStr(metadataSetDto.getMedataSetAmdDt());
			    		this.saveKeywordToInfluxDb(keywordDto, prevKeywordList);
			    	}				
				}
			}
		}
		
		log.debug("{} 메타데이터 {}건 등록함", medataSetId, cnt);
		return cnt;
	}
	
	/**
	 * 유효한 값을 가진 메타데이터 dataMap 에 있는 값들을 메타데이터 DB에 저장. 변경이력 등록. (셋 용 프라퍼티는 따로 저장???)
	 * @Author      : heenim
	 * @Date        : 2023. 09. 05.
	 * @param metadataSetDto
	 * @param modelInfoDto
	 * @param dataMap
	 * @param newRvsn
	 * @return
	 * @modified 2025-08-25 ifPresent dataMap 에 키가 존재할때만 저장 하는 로직 추가. API PUT(내용 PATCH) 용
	 */
	@SuppressWarnings({"rawtypes", "unchecked"})
	private int modifyMetadataMulti(MetadataSetDto metadataSetDto, ModelInfoDto modelInfoDto, Map<String, Object> dataMap, int newRvsn, boolean ifPresent) {
		Assert.notNull(metadataSetDto, "metadataSetDto is null.");
		Assert.notNull(modelInfoDto, "modelInfoDto is null.");
		Assert.notEmpty(dataMap, "dataMap is empty.");
		
		String medataSetId = metadataSetDto.getMedataSetId();
		
		// 참조 프라퍼티를 활용하여 조회전용 참조값 설정.
		this.setRefValToDataMap(modelInfoDto, dataMap);
    	
		int cnt = 0;
		for (Map.Entry<String, ModelPropertyInfoDto> pMap : modelInfoDto.getPropertyMap().entrySet()) {
			ModelPropertyInfoDto pDto = pMap.getValue();
			String prptyNm            = pMap.getKey();
			
			// 2025-08-25 ifPresent 경우 dataMap 에 존재하는 key 에 대해서는 저장 처리. 없으면 SKIP. 그 외 경우는 dataMap 전체가 한 Set 의 데이터라고 봄.
			if (ifPresent && !dataMap.containsKey(prptyNm)) {
				continue;
			}
			
			boolean isArrayProperty   = StringUtils.equals("Y", pDto.getDataArrayYn()); // 배열 데이터 여부
			List<Object> dataValList  = null;
			String dataType           = pDto.getRangeDataTypeMtcd();
			
			// 키워드인 경우 저장 전 목록 조회
			List<String> prevKeywordList = null;
	    	if (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
    			MetadataSearchVo paramVo = new MetadataSearchVo();
    			paramVo.setMedataSetId(medataSetId);
    			paramVo.setPrptyId(pDto.getPrptyId());
	    		prevKeywordList = metadataMapper.selectKeywordListBySetId(paramVo);
	    		if (prevKeywordList == null) {
	    			prevKeywordList = new ArrayList<String>(); // not null
	    		}
	    	}
			
			// 새 값
			if (isArrayProperty) {
				Object valArrObj = dataMap.get(prptyNm);
				if (ValueUtil.isList(valArrObj)) { // List 데이터
					dataValList = (List) valArrObj;
				} else if (ValueUtil.isArray(valArrObj)) { // 배열 데이터
					Object[] valObjArr = (Object[]) valArrObj;
					dataValList = Arrays.asList(valObjArr);
				} else {
					dataValList = new ArrayList<>();
				}
			} else {
				Object valObj = dataMap.get(prptyNm);
				dataValList = new ArrayList<>();
				dataValList.add(valObj);
			}
			
			// 배열 프라퍼티 경우 기존 값과 비교 하여 새 값에 없으면 삭제 처리
			if (isArrayProperty) {
				List<Object> deleteValList = new ArrayList<>();
				
				MetadataPropertySearchVo paramVo = new MetadataPropertySearchVo();
				paramVo.setMedataSetId(medataSetId);
				paramVo.setPrptyNm(prptyNm);
				List<MetadataPropertyDto> prevDataList = metadataMapper.selectMetadataListByPropertyNm(paramVo);
				if (prevDataList != null && !prevDataList.isEmpty()) {
					
					for (MetadataPropertyDto prevValDto : prevDataList) {
						
						if (StringUtils.equals(RangeDataTypeMtcd.geoJson.code(), prevValDto.getDataTypeMtcd())) {
							Object foundObj = dataValList.stream()
									.filter(x -> StringUtils.equals(prevValDto.getGeodataVal(), this.toJsonStr(x)))
									.findFirst()
									.orElse(null);
							
							if (foundObj == null) {
								deleteValList.add(prevValDto.getGeodataVal());
							}
							
						} else {
							Object foundObj = dataValList.stream()
									.filter(x -> {
										MetadataVo valVo = new MetadataVo();
										this.setValueToVo(valVo, x, null, prevValDto.getDataTypeMtcd());
										return (StringUtils.equals(prevValDto.getMedataVal(), valVo.getMedataVal()))
												&& StringUtils.equals(prevValDto.getLangMtcd(), valVo.getLangMtcd());
									})
									.findFirst()
									.orElse(null);
							
							if (foundObj == null) {
								deleteValList.add(this.toObjectValue(prevValDto, prevValDto.getDataTypeMtcd()));
							}							
						}
					}
					
					if (deleteValList.size() > 0) {
						this.deleteMetadataValueListByPropertyNm(modelInfoDto, metadataSetDto, prptyNm, deleteValList, newRvsn, false);
					}
	    		}
			}
			
			// 프라퍼티 별로 저장
			cnt += this.saveMetadataValueListByPropertyNm(modelInfoDto, metadataSetDto, prptyNm, dataValList, newRvsn, prevKeywordList);
			
		}
		
		log.debug("{} 메타데이터 {}건 저장함", medataSetId, cnt);
		return cnt;
	}
	
	/**
	 * 유효한 값으로 MetadataVo 생성하고 설정 후 반환.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 12.
	 * @param medataSetId
	 * @param valObj
	 * @param langMtcd (langString 용 - MetadataVo 나 MetadataSaveDto 를 사용한 경우 설정)
	 * @param pDto
	 * @return (nullable)
	 */
	private MetadataVo getMetadataVoFromMetadata(String medataSetId, Object valObj, String langMtcd, ModelPropertyInfoDto pDto) {
		return getMetadataVoFromMetadata(medataSetId, valObj, langMtcd, pDto, null);
	}
	
	/**
	 * 유효한 값으로 MetadataVo 생성하고 설정 후 반환.
	 * @Author      : heenim
	 * @Date        : 2023. 05. 12.
	 * @param medataSetId
	 * @param valObj
	 * @param langMtcd (langString 용 - MetadataVo 나 MetadataSaveDto 를 사용한 경우 설정)
	 * @param pDto
	 * @param medataId
	 * @return (medataId 값이 없는 경우 nullable)
	 */
	private MetadataVo getMetadataVoFromMetadata(String medataSetId, Object valObj, String langMtcd, ModelPropertyInfoDto pDto, String medataId) {
		String dataType = pDto.getRangeDataTypeMtcd();
		log.debug("{} - {}, dataType : {}, valObj : {}", medataSetId, pDto.getPrptyNm(), dataType, valObj);		
		
		String val = valObj == null ? null : String.valueOf(valObj);
		
		// NOTE: 신규로 저장되는 프라퍼티 값인 경우 (필수,조회전용도 아니고) 권장,선택인 프라퍼티에 대해서는 저장하지 않는다. null 반환.
		String requiredType = pDto.getModelPrptyMandMtcd();
		if (StringUtils.isBlank(medataId)) {
			if (StringUtils.isBlank(val) && StringUtils.equalsAny(requiredType, PropertyRequired.recommended.code(), PropertyRequired.optional.code())) {
				return null; // nullable
			}
		}
		
		MetadataVo vo = new MetadataVo();
		vo.setMedataId(medataId);
		vo.setMedataSetId(medataSetId);
		vo.setPrptyId(pDto.getPrptyId());
		vo.setValModelId(pDto.getRangeModelId());
		vo.setModelPrptyId(pDto.getModelPrptyId());
		vo.setLangMtcd(pDto.getRangeUseLangMtcd());
		
		this.setValueToVo(vo, valObj, langMtcd, dataType);
		
		return vo;
	}
	
	/**
	 * 유효한 값을 MetadataVo 에 설정
	 * @Author      : heenim
	 * @Date        : 2023. 05. 12.
	 * @param vo
	 * @param valObj
	 * @param langMtcd
	 * @param dataType
	 */
	@SuppressWarnings("rawtypes")
	private void setValueToVo(MetadataVo vo, Object valObj, String langMtcd, String dataType) {
		String val = valObj == null ? null : String.valueOf(valObj);
		
		if (val != null) {
			// 범위 모델 의 데이터 유형에 따라 값 설정. 이미 데이터 형식에 맞는지 체크한 후이기 때문에 특별한 경우를 제외하고는 그대로 저장.
			if (RangeDataTypeMtcd.langString.code().equals(dataType)) {
				if (valObj instanceof Map) {
					// { "language" : "ko", "value" : "홍길동" }
					Map tMap = (Map) valObj;
					vo.setLangMtcd(String.valueOf(tMap.get("language")));
					vo.setMedataVal(String.valueOf(tMap.get("value")));
				} else if (RdfUtil.isJson(val)) {
					Map tMap = (Map) JsonUtil.toMap(val);
					vo.setLangMtcd(String.valueOf(tMap.get("language")));
					vo.setMedataVal(String.valueOf(tMap.get("value")));
				} else  {
					vo.setLangMtcd(langMtcd);
					vo.setMedataVal(val);
				}
				
			} else if (RangeDataTypeMtcd.createDateTime.code().equals(dataType)) {
				// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
				vo.setMedataVal(DateUtil.toISO6TimeStr(val));
				
			} else if (RangeDataTypeMtcd.updateDateTime.code().equals(dataType)) {
				// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
				vo.setMedataVal(DateUtil.toISO6TimeStr(val));
				
			} else if (RangeDataTypeMtcd.dateTime.code().equals(dataType)) {
				// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
				vo.setMedataVal(DateUtil.toISO6TimeStr(val));
				
			} else if (RangeDataTypeMtcd.boolean_.code().equals(dataType)) {
				vo.setMedataVal(val.toLowerCase()); // 소문자로 true/false 만
				
			} else if (RangeDataTypeMtcd.json.code().equals(dataType)) {
				vo.setMedataVal(this.toJsonStr(valObj));
				
			} else if (RangeDataTypeMtcd.address.code().equals(dataType)) { // 2025-07 표준문서 관련 데이터타입 추가. TODO 필요시 변경
				vo.setMedataVal(this.toJsonStr(valObj));
				
			} else if (RangeDataTypeMtcd.dataInfo.code().equals(dataType)) { // 2025-07 표준문서 관련 데이터타입 추가. TODO 필요시 변경
				vo.setMedataVal(this.toJsonStr(valObj));
				
			} else if (RangeDataTypeMtcd.geoJson.code().equals(dataType)) {
				vo.setGeodataVal(this.toJsonStr(valObj));
				
			} else if  (RangeDataTypeMtcd.keywordsKo.code().equals(dataType) || RangeDataTypeMtcd.keywordsEn.code().equals(dataType)) {
				// 키워드 관련 값인 경우만 공백(spaces) 처리
				vo.setMedataVal(KeywordUtil.toCleanCommaSeparated(val));

			} else {
				// code_, categoryId 가 DB에 존재하는 데이터 인지는 체크하지 말자!
				// 그 외 전부 문자열로 저장.
				vo.setMedataVal(val);
			}
		}		
	}
	
	private Object toObjectValue(MetadataVo vo, String dataType) {
		Assert.notNull(vo, "vo is null");
		Object valObj = null;
		
		// 범위 모델 의 데이터 유형에 따라 값 설정. 이미 데이터 형식에 맞는지 체크한 후이기 때문에 특별한 경우를 제외하고는 그대로 저장.
		if (RangeDataTypeMtcd.langString.code().equals(dataType)) {
			Map<String, Object> map = new HashMap<>();
			map.put("language", vo.getLangMtcd());
			map.put("value", vo.getMedataVal());
			valObj = map;

		} else if (RangeDataTypeMtcd.geoJson.code().equals(dataType)) {
			valObj = vo.getGeodataVal();

		} else {
			valObj = vo.getMedataVal();
		}
		
		return valObj;
	}
	
	private String toJsonStr(Object valObj) {
		String jsonStr = null;
		if (valObj instanceof String) {
			// 2025-08-08 아래로 변경.jsonStr = (String) valObj;
			jsonStr = MapperUtil.stringify((String) valObj);
		} else {
			jsonStr = JsonUtil.toJson(valObj);
		}	
		return jsonStr;
	}
	
	private boolean isValueChanged(MetadataVo vo1, MetadataVo vo2) {
		Assert.notNull(vo1, "vo1 is null");
		Assert.notNull(vo2, "vo2 is null");
		if (!StringUtils.equals(vo1.getMedataVal(), vo2.getMedataVal())) return true;
		if (!StringUtils.equals(vo1.getLangMtcd(), vo2.getLangMtcd())) return true;
		if (!StringUtils.equals(vo1.getGeodataVal(), vo2.getGeodataVal())) return true;
		return false;
	}
	
	/**
	 * 카프카 전송을 위한 메타데이터 셋 조회
	 * @Author      : heenim
	 * @Date        : 2024. 03. 20.
	 * @param medataSetId
	 * @return
	 */
	@SuppressWarnings("unchecked")
	private ListOrderedMap<String, Object> getMetadataForKafka(String medataSetId) {
		ListOrderedMap<String, Object> dataMap = null;		
		try {
			MetadataSetDto paramVo = new MetadataSetDto();
			paramVo.setMedataSetId(medataSetId);
			paramVo.setArrayDataLimitYn("N");
			
			dataMap = metadataApiMapper.selectMetadataToJsonStrBySetId(paramVo);
		} catch (Exception e) {
			log.error("[카프카 전송용 메타데이터 셋 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		return dataMap;
	}
	
	/**
	 * 메타데이터 변경시 카프카 전송
	 * @Author      : heenim
	 * @Date        : 2024. 03. 19.
	 * @param action
	 * @param metadataSetDto
	 * @param delDataMap
	 * @param delUpSetList
	 * @modified 2025. 08. 19 디지털 트윈 연합 레지스트리 관련 API 위해 pubic 메서드로 변경.
	 */
	@SuppressWarnings("unchecked")
	public void sendMetadataViaKafka(String action, MetadataSetDto metadataSetDto, ListOrderedMap<String, Object> delDataMap, List<CamelCaseMap> delUpSetList) {
		log.debug("[메타데이터 변경시 카프카 전송] action: {}", action);
		final ListOrderedMap<String, Object> dataMap;
		
		String medataSetId = metadataSetDto.getMedataSetId();
		String typeModelId = metadataSetDto.getTypeModelId();
		String modelId     = metadataSetDto.getModelId();
		
		final MetadataElasticJsonMap medataSetMap;
//		final VectorStoreDto vectorStoreDto;
		final List<CamelCaseMap> upSetList;
		final String jwtToken = AuthUtil.getCurrentJwtToken();
		ModelInfoDto modelInfoDto = modelService.getModelInfoByIdFromCache(modelId);
		
		if (KafkaConst.ACTION_DELETE.equals(action)) {
			dataMap = delDataMap;
			upSetList = delUpSetList;
			medataSetMap = new MetadataElasticJsonMap();
//			vectorStoreDto = null;
			
		} else {
			dataMap = this.getMetadataForKafka(medataSetId);
			
			MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
			metadataSearchVo.setIsPaging(false);
			metadataSearchVo.setMedataSetId(medataSetId);
			metadataSearchVo.setSqlDateFormat(typeModelId);
			upSetList = metadataSetMapper.selectMetadataSetDtwListBySubSetId(metadataSearchVo);
			
			MetadataSetDto setDto = new MetadataSetDto();
			setDto.setMedataSetId(medataSetId);
			setDto.setArrayDataLimitYn("N");
			
			medataSetMap =  metadataApiMapper.selectMetadataToJsonStrBySetIdAsText(setDto);
			
			// 벡터 저장 위한 조회
//			// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
//			metadataSearchVo.setSqlDateFormat(SqlDatePart.iso6z.format());
//			vectorStoreDto = metadataSetMapper.selectMetadataSetForVectorStore(metadataSearchVo);
//			if (vectorStoreDto != null && upSetList != null) {
//				if (vectorStoreDto.getCustomFields() == null) {
//					vectorStoreDto.setCustomFields(Map.of("upSetList", upSetList));
//				} else {
//					vectorStoreDto.getCustomFields().put("upSetList", upSetList);
//				}
//			}
//			// 하위 데이터 목록.
//			MetadataSearchVo paramVo = new MetadataSearchVo();
//			paramVo.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
//			paramVo.setMedataSetId(medataSetId);
//			paramVo.setOnlyObjectTypeYn("Y");
//			List<MetadataVo> downList = metadataMapper.selectMetadataSimpleListBySetId(paramVo);			
//			// geometry 정보. 여러건 존재할 경우 (거의 없지만) 첫번째 건이 선택됨
//			CamelCaseMap geoInfo = metadataApiMapper.selectGeometryInfoBySetId(paramVo);			
//			vectorStoreDto = new VectorStoreDto(medataSetId, medataSetMap, modelInfoDto, downList, upSetList, geoInfo); // 기본 엔티티, down 관계

		}
		
		Map<String, Object> sendData = new HashMap<>();
		sendData.put("action", action);
		sendData.put("key", medataSetId);
		sendData.put("metadata", dataMap);
		sendData.put("upSetList", upSetList);
		
		if(myKafkaProducer != null) {			
			myKafkaProducer.send(KafkaConst.TOPIC_DT_META_CHANGELOG, sendData); // async 보내고 끝
		}

		// elasticSearch 저장/삭제
		CompletableFuture.runAsync(() -> { // 비동기 처리	
			try {
				
				if (KafkaConst.ACTION_DELETE.equals(action)) {
					elasticSearchService.deleteElasticData(medataSetId);
				}
				else {
					elasticSearchService.saveElasticKafkaData(medataSetId, medataSetMap);
				}
				
			} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
				log.error("[메타데이터 변경시 카프카 전송] ElasticSearch에 메타데이터 셋 정보 저장/삭제 실패/오류 (SKIP) : {} - {}", medataSetId, e.getReason());
			} catch (Exception e) {
				log.error("[메타데이터 변경시 카프카 전송] ElasticSearch에 메타데이터 셋 정보 저장/삭제 실패/오류 (SKIP) : {}", medataSetId, e);
			}
		}, elasticSearchExecutor);
		
		// 벡터 서버를 통해 elasticSearch 에 벡터 저장/삭제
		if (KafkaConst.ACTION_DELETE.equals(action) || (dataMap != null && !dataMap.isEmpty())) {
			CompletableFuture.runAsync(() -> { // 비동기 처리
				try {
					
					if (KafkaConst.ACTION_DELETE.equals(action)) {
						vectorSearchService.deleteVectorData(medataSetId, jwtToken);
					}
					else {
						vectorSearchService.saveVentorData(medataSetId, dataMap, modelInfoDto, upSetList, jwtToken);
					}
					
				} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
					log.error("[메타데이터 변경시 카프카 전송] 벡터 서버에 저장/삭제 요청 실패/오류 (SKIP) : {} - {}", medataSetId, e.getReason());
				} catch (Exception e) {
					log.error("[메타데이터 변경시 카프카 전송] 벡터 서버에 저장/삭제 요청 실패/오류 (SKIP) : {}", medataSetId, e);
				}
			}, elasticSearchExecutor);
		}
				
		// influx db 저장
		CompletableFuture.runAsync(() -> { // 비동기 처리
			try {
                ListOrderedMap<String, Object> influxDbJson = new ListOrderedMap<>();
                influxDbJson.put("action", action);
                influxDbJson.put("metadata", medataSetMap);
                influxDbService.addMetadataAsync(InfluxDbMetadataVo.dataMapToDto(medataSetId, typeModelId, influxDbJson));
            } catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
                log.error("[메타데이터 변경시 카프카 전송] InfluxDB에 메타데이터 셋 정보 저장/삭제 실패/오류 (SKIP) : {} - {}", medataSetId, e.getReason());
            } catch (Exception e) {
                log.error("[메타데이터 변경시 카프카 전송] InfluxDB에 메타데이터 셋 정보 저장/삭제 실패/오류 (SKIP) : {}", medataSetId, e);
            }
		}, influxExecutor);
		
	}

	/**
	 * 지형지물 코드 - 메타데이터 셋 등록 시,지형지물 코드 중복확인 여부 조회
	 * ( 메타데이터 유형 모델, 식별체계 - 국가코드, 식별체계 - 분류코드, 식별체계 - 코드(지형지물) )
	 * @Date        : 2025. 07. 31.
	 * @param metadataSetSaveDto
	 * @return resMap
	 */
	// 2025-08-08 로직 변경으로 사용할 일이 없어짐. 지형지물도 일련번호 자동생성.
//	public Map<String, Boolean> checkMetadatasetsIdByIdSchms(MetadataSetSaveDto metadataSetSaveDto) {
//		log.debug("[지형지물 코드 - 메타데이터 셋 등록 시,지형지물 코드 중복확인 여부 조회] 서비스 시작 ");
//		Map<String, Boolean> resMap = new HashMap<>();
//		try {
//			// 메타데이터셋 data 의 model id >> 유형 모델 id 와 동일 
//			String typeModelId = metadataSetSaveDto.getModelId();
//			this.setIdSchmPrefix(typeModelId, metadataSetSaveDto);
//			// 지형지물 코드의 경우, 메타데이터셋 id 로 사용되는 prefix 와 식별체계 컬럼에 대한 중복 여부 확인 
//			boolean isDuplicatedMetadatasetsIdByIdSchms = metadataSetMapper.checkMetadatasetsIdByIdSchms(metadataSetSaveDto);
//			resMap.put("duplicated", isDuplicatedMetadatasetsIdByIdSchms);
//		} catch (Exception e) {
//			log.debug("[지형지물 코드 - 메타데이터 셋 등록 시,지형지물 코드 중복확인 여부 조회] 서비스 실패 ");
//			throw new ResBaseRuntimeException(e);
//		}
//		log.debug("[지형지물 코드 - 메타데이터 셋 등록 시,지형지물 코드 중복확인 여부 조회] 서비스 종료 ");
//		return resMap;
//	}

	/**
	 * influxDB 에 키워드 저장
	 * @Author      : heenim
	 * @Date        : 2025. 02. 04.
	 * @param dto
	 * @param prevKeywordList
	 */
	public void saveKeywordToInfluxDb(InfluxDbKeywordDto dto, List<String> prevKeywordList) {
		Assert.notNull(prevKeywordList, "prevKeywordList is null.");
		dto.setKeyword(StringUtils.trimToNull(dto.getKeyword()));
		
		if (dto.getKeyword() == null || dto.getKeyword().isEmpty()) { 
			return; // 기존에 있던 키워드를 삭제한 것에 대해서는 나중에 junk 데이터 삭제로 처리.
		}
		
		if (dto.getKeyword().indexOf(",") == -1) {
			if (prevKeywordList.indexOf(dto.getKeyword()) != -1) {
				return; // 해당 메타데이터 셋에 이미 존재하는 키워드
			}
			
			this.addKeywordToInfluxDb(dto);
			prevKeywordList.add(dto.getKeyword());
			
		} else { // "," 로 나열되어 있으면 분리해서 저장
			List<String> list = Arrays.asList(dto.getKeyword().split(","));
			InfluxDbKeywordDto eachDto = new InfluxDbKeywordDto();
			BeanUtils.copyProperties(dto, eachDto);
			for (String keyword : list) {
				keyword = StringUtils.trimToNull(keyword);
				if (keyword != null) {
					if (prevKeywordList.indexOf(keyword) != -1) {
						continue; // 해당 메타데이터 셋에 이미 존재하는 키워드
					}
					
					eachDto.setKeyword(keyword);
					this.addKeywordToInfluxDb(eachDto);
					prevKeywordList.add(keyword);
				}
			}
		}
	}
	
	/**
	 * 키워드 유효성 확인 후 실제 influxDB에 추가
	 * @Author      : heenim
	 * @Date        : 2025. 02. 04.
	 * @param dto
	 */
	private void addKeywordToInfluxDb(InfluxDbKeywordDto dto) {
		// 싱크가 안맞아서 동기 처리로 변경.
		try {
			InfluxDbKeywordVo keywordVo = new InfluxDbKeywordVo(dto);
			influxDbService.addKeywordData(keywordVo);
			
		} catch (IllegalArgumentException e) {
			log.error("[메타데이터 저장] InfluxDB에 키워드 정보 저장 실패/오류 (SKIP) : {}", dto.getMedataSetId(), e.getMessage());
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.error("[메타데이터 저장] InfluxDB에 키워드 정보 저장 실패/오류 (SKIP) : {} - {}", dto.getMedataSetId(), e.getReason());
		} catch (Exception e) {
			log.error("[메타데이터 저장] InfluxDB에 키워드 정보 저장 실패/오류 (SKIP) : {}", dto.getMedataSetId(), e);
		}
	}
	
	/**
	 * influxDB에서 정크 키워드 제거
	 * @Author      : heenim
	 * @Date        : 2025. 02. 11.
	 * @param metadataSetDto
	 */
	@SuppressWarnings("unchecked")
	private void removeJunkKeywordFromInfluxDb(MetadataSetDto metadataSetDto) {
		// 싱크가 안맞아서 동기 처리로 변경.
		Assert.notNull(metadataSetDto, "metadataSetDto is null.");		
		String medataSetId = metadataSetDto.getMedataSetId();
		String regDt       = metadataSetDto.getMedataSetRegDt();
		String logRegrId   = AuthUtil.getLoginUserId();
		
		// InfluxDB 키워드 용 메타데이터 목록 조회
		MetadataSearchVo paramVo = new MetadataSearchVo();
		paramVo.setMedataSetId(medataSetId);
		List<InfluxDbKeywordDto> list = metadataMapper.selectMetadataListForInfluxDbKeyword(paramVo);
		int rdbCnt = list != null ? list.size() : 0;
		log.debug("[influxDB에서 정크 키워드 제거] PostgreSQL 현재 건수: {}", rdbCnt); // 원본이라 친다.
		
		// InfluxDB 의 키워드 목록 조회
		List<JSONObject> keywordList = influxDbService.getKeywordDataBySetId(medataSetId, regDt, null);
		int influxDbCnt = keywordList != null ? keywordList.size() : 0;
		log.debug("[influxDB에서 정크 키워드 제거] influxDB 대상 건수: {}", influxDbCnt);

		try {
			int delCnt = 0;
			if (keywordList != null && influxDbCnt > 0 && rdbCnt < influxDbCnt) {
				if (list == null) {
					// 셋 ID 로 InfluxDB에서 키워드 측정 데이터 삭제
					influxDbService.deleteKeywordDataBySetId(medataSetId, logRegrId, regDt, null);
					delCnt = influxDbCnt;
					
				} else {
					for (JSONObject json : keywordList) {
						String id      = String.valueOf(json.getOrDefault("id", ""));
						String word    = String.valueOf(json.getOrDefault("word", ""));
						String prptyId = String.valueOf(json.getOrDefault("prptyId", ""));
						String lang    = String.valueOf(json.getOrDefault("lang", ""));
						
						// 동일 값을 현재 RDB에서 찾음. null 이면 현재 존재하지 않는 키워드. 정크 데이터.					
						InfluxDbKeywordDto dto = list.stream()
								.filter(x ->    StringUtils.equals(id, KeywordUtil.toInfluxTag(x.getMedataSetId()))
										     && StringUtils.equals(word, KeywordUtil.toInfluxWordTag(x.getKeyword()))
										     && StringUtils.equals(prptyId, KeywordUtil.toInfluxTag(x.getPrptyId()))
										     && StringUtils.equals(lang, KeywordUtil.toInfluxTag(x.getLangMtcd())))
								.findFirst()
								.orElse(null);
						
						if (dto == null) {
							// 정크 데이터 삭제
							InfluxDbKeywordVo delVo = new InfluxDbKeywordVo();
							delVo.setId(id);
							delVo.setWord(word);
							delVo.setPrptyId(prptyId);
							delVo.setLang(lang);
							influxDbService.deleteKeywordData(delVo, regDt, null);
							delCnt++;
						}
					}
				}		
			}
			log.debug("[influxDB에서 정크 키워드 제거] 삭제 건수: {}", delCnt);
			
		} catch (IllegalArgumentException e) {
			log.error("[influxDB에서 정크 키워드 제거] 실패/오류 (SKIP) : {}", medataSetId, e.getMessage());
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.error("[influxDB에서 정크 키워드 제거] 실패/오류 (SKIP) : {} - {}", medataSetId, e.getReason());
		} catch (Exception e) {
			log.error("[influxDB에서 정크 키워드 제거] 실패/오류 (SKIP) : {}", medataSetId, e);
		}
	}
}
