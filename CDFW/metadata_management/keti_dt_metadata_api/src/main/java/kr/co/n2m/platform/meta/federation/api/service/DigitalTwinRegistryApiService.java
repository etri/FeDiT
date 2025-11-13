package kr.co.n2m.platform.meta.federation.api.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.kafka.KafkaConst;
import kr.co.n2m.platform.meta.architecture.util.MapperUtil;
import kr.co.n2m.platform.meta.federation.api.domain.ApiDigitalTwinDto;
import kr.co.n2m.platform.meta.federation.api.domain.ApiDigitalTwinType;
import kr.co.n2m.platform.meta.federation.api.domain.ApiListParamDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiInnerSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataJsonMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataVo;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataApiMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataMapper;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.service.ModelCacheService;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class DigitalTwinRegistryApiService {
	
	@Autowired
	private ModelCacheService modelCacheService;
	
	@Autowired
	private MetadataSetService metadataSetService;
	
	@Autowired
	private MetadataApiMapper metadataApiMapper;
	
	@Autowired
	private MetadataMapper metadataMapper;
	
	@Autowired
	DigitalTwinRegistryApiQueryParser apiQueryParser;
	
	public final String DTW_OBJS_ATTR   = "dTw_objs_attr"; // 디지털트윈의 object_type 프라퍼티나 json 형식 프라퍼티만.
    public final String DTW_ATTR_PREFIX = "dTw_attr_";	   // 디지털트윈의 data_type 프라퍼티. (현재는 json 형식은 포함하지 않지만 막지도 않음)
    public final String OBJ_ATTR_PREFIX = "obj_attr_";	   // dTw_objs_attr 여기에 속하는 object가 가질수 있는 프라퍼티.
	
	// dTw_attr_ 검색조건 하드코딩
    // "creationTimeAfter","creationTimeBefore","modifyTimeAfter","modifyTimeBefore" 이 부분은 검색조건 특유의 것인가 봄.
    // "countryCode", "classificationTypeCode", "classificationCode" 는 현재 문서에 없지만 추가.
    public final Set<String> ALLOWED_DTW_ATTR = Set.of(
	        "dtid","type","name","description","owner","contactPoint","creator",
	        "creationTimeAfter","creationTimeBefore","modifyTimeAfter","modifyTimeBefore",
	        "subjects","keywords", "pointOfAccess",
	        "countryCode", "classificationTypeCode", "classificationCode",
	        "location" // JSON type 그냥 검색할수도 있으니 넣어 놓자
	    );
    
    // 2025-08-12 시간 하드코딩 필요할 듯.
    public final Set<String> DEFAULT_TIME_ATTR = Set.of("creationTimeAfter","creationTimeBefore","modifyTimeAfter","modifyTimeBefore");
    
    // dTw_objs_attr 검색조건 하드코딩
    // 2025-08-12 내가 보기에 "subjects","keywords","pointOfAccess" 은 여기가 아닌거 같아서 뺌.
    // "digitalTwins", "federatedDigitalTwinObjects" 는 현재 문서에 없지만 추가.
    public final Set<String> ALLOWED_DTW_OBJS_ATTR = Set.of(
        "location","digitalTwinObjects","services",
        "subscriptions","simulations","sensors","controllers","visualModels","behaviorModels",
        "digitalTwins", "federatedDigitalTwinObjects",
        "relationships","validationModels","fidelityModels"
    );
    
    public final Set<String> JSON_DATA_TYPE = Set.of("json", "address", "dataInfo");
    
    private String getFirstOrNull(List<String> values) {
        return (values == null || values.isEmpty()) ? null : values.get(0);
    }
    
    /**
	 * 디지털트윈 검색
	 * @Author      : heenim
	 * @Date        : 2025. 08. 13.
     */
	public SearchResultListVo searchDigitalTwinList(ApiListParamDto apiListParamDto, MultiValueMap<String, String> params) throws Exception {
		log.debug("[디지털트윈 검색] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
			
		try {
	        Map<String, String> dtwAttrFilters = new LinkedHashMap<>();
	        Map<String, String> objAttrFilters = new LinkedHashMap<>();
			
			ModelInfoDto modelInfoDto = modelCacheService.getModelInfoByName(Constant.DIGITAL_TWIN_MODEL_NM);
			if (modelInfoDto == null) throw new ResBizInfoException(5000, "[" + Constant.DIGITAL_TWIN_MODEL_NM + "] 모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
		    // dTw_objs_attr(선택 컬렉션) - 1건만 들어온다고 가정.
			String dtwObjsAttr = this.getFirstOrNull(params.get(DTW_OBJS_ATTR));
			ModelInfoDto objModelInfoDto = null;
			if (dtwObjsAttr != null) {
				if (!ALLOWED_DTW_OBJS_ATTR.contains(dtwObjsAttr) || !modelInfoDto.getPropertyMap().containsKey(dtwObjsAttr)) {
					throw new ResBizInfoException(4000, "[" + dtwObjsAttr + "] 해당 속성은 존재하지 않습니다.");
				}
				ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(dtwObjsAttr);
				if (!"object_type".equals(pDto.getRangeModelTypeMtcd()) && !JSON_DATA_TYPE.contains(pDto.getRangeDataTypeMtcd())) {
					throw new ResBizInfoException(4000, "[" + dtwObjsAttr + "] 해당 속성은 json:object 데이터 타입이 아닙니다.");
				}
				if ("object_type".equals(pDto.getRangeModelTypeMtcd())) {
					objModelInfoDto = modelCacheService.getModelInfoByName(pDto.getRangeModelNm());
					if (objModelInfoDto == null) throw new ResBizInfoException(5000, "[" + pDto.getRangeModelNm() + "] 모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
				} else { // JSON_DATA_TYPE
					dtwAttrFilters.put(dtwObjsAttr, dtwObjsAttr);
				}
			}
			params.remove(DTW_OBJS_ATTR);
			
			// 접두어별 필터 파싱
	        for (String k : params.keySet()) {
	        	if (k.startsWith(DTW_ATTR_PREFIX)) {
	                String dtwAttr = k.substring(DTW_ATTR_PREFIX.length());
	                if (!ALLOWED_DTW_ATTR.contains(dtwAttr) || (!modelInfoDto.getPropertyMap().containsKey(dtwAttr) && !DEFAULT_TIME_ATTR.contains(dtwAttr))) {
	                	throw new ResBizInfoException(4000, "[" + dtwAttr + "] 해당 속성은 존재하지 않습니다.");
	                }
	                dtwAttrFilters.put(dtwAttr, this.getFirstOrNull(params.get(k)));
	                
	            } else if (dtwObjsAttr != null && k.startsWith(OBJ_ATTR_PREFIX)) {
	                String objAttr = k.substring(OBJ_ATTR_PREFIX.length());
	                if (objModelInfoDto != null && (!objModelInfoDto.getPropertyMap().containsKey(objAttr) && !DEFAULT_TIME_ATTR.contains(objAttr))) {
	    				throw new ResBizInfoException(4000, "[" + objAttr + "] 해당 속성은 존재하지 않습니다.");
	                }
	                objAttrFilters.put(objAttr, this.getFirstOrNull(params.get(k)));
	            }
	        }
			
			// 검색
			MetadataApiInnerSearchVo searchVo = new MetadataApiInnerSearchVo();
			BeanUtils.copyProperties(apiListParamDto, searchVo);
			searchVo.setTypeModelId(Constant.DIGITAL_TWIN_MODEL_NM);
			
			searchVo.setDtwObjsAttr(dtwObjsAttr);
			
			// 검색조건 filter
			String mainSql = apiQueryParser.getDigitalTwinQuerySql(dtwAttrFilters, dtwObjsAttr, objAttrFilters);
			log.debug("mainSql: {}", mainSql);
			searchVo.setQuerySql(mainSql);
			
			// 하위 obj 검색조건 filter
			if (objModelInfoDto != null) {
				String refObjSql = apiQueryParser.getRefObjectQuerySql(objAttrFilters);
				log.debug("refObjSql: {}", refObjSql);
				searchVo.setRefObjFilterQuerySql(refObjSql);
			}
			
			int totalListSize = metadataApiMapper.selectMetadataSetCountForApi(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<MetadataJsonMap> list = metadataApiMapper.selectMetadataSetListForApiWithChildren(searchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (ResBaseRuntimeException e) {
			log.error("[디지털트윈 검색] 실패/오류 : {}", e.getReason());
			throw e;
		} catch (Exception e) {
			log.error("[디지털트윈 검색] 실패/오류", e);
			throw e;
		}
		
		log.debug("[디지털트윈 검색] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 디지털트윈 목록 조회
	 * @Author      : heenim
	 * @Date        : 2025. 08. 11.
	 */
	public SearchResultListVo getDigitalTwinList(ApiListParamDto apiListParamDto) throws Exception {
		log.debug("[디지털트윈 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			MetadataApiInnerSearchVo searchVo = new MetadataApiInnerSearchVo();
			BeanUtils.copyProperties(apiListParamDto, searchVo);
			searchVo.setTypeModelId(Constant.DIGITAL_TWIN_MODEL_NM);
			
			// TODO 앞으로 검색조건이 추가 된다면??
			
			int totalListSize = metadataApiMapper.selectMetadataSetCountForApi(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<MetadataJsonMap> list = metadataApiMapper.selectMetadataSetListForApiWithChildren(searchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (ResBaseRuntimeException e) {
			log.error("[디지털트윈 목록 조회] 실패/오류 : {}", e.getReason());
			throw e;
		} catch (Exception e) {
			log.error("[디지털트윈 목록 조회] 실패/오류", e);
			throw e;
		}		
		
		log.debug("[디지털트윈 목록 조회] 서비스 종료");
		return listVo;
	}

	/**
	 * 디지털트윈 등록
	 * @Author      : heenim
	 * @Date        : 2025. 08. 11.
	 */
	public String createDigitalTwin(ApiDigitalTwinDto digitalTwinDto) throws Exception {
		log.debug("[디지털트윈 등록] 서비스 시작 - type: {}", digitalTwinDto.getType());
		String dtid = null;
		LinkedHashMap<String, MetadataSetDto> outNewSetIdMap = new LinkedHashMap<>(); // 신규 메타데이터 셋 ID 와 유형 모델 정보. 카프카(+저장소) 용
		Map<String, Object> outPrptySubIdMap = new HashMap<>(); // DT 하위 프라퍼티별 json:object 들의 ID // TODO issue-post1 새로 생성한 ID 들만 넣어야 할까.. 아니면 String ID 값으로 넘어온게 있다면 넣어야 할까?
		
		try {
			String modelNm = ApiDigitalTwinType.SINGLE.modelId(); // modelId = modelNm
			
			// type 으로 디지털트윈 표준 모델 ID 결정
			String typeVal = digitalTwinDto.getType();
			try {
				ApiDigitalTwinType enumType = ApiDigitalTwinType.fromKrCode(typeVal);
				modelNm = enumType.modelId();
			} catch (IllegalArgumentException e) {
				throw new ResBizInfoException(4000, "type 값이 존재하지 않습니다.");
			}
					
			// 전체 데이터 Map
			Map<String, Object> dtAllMap = MapperUtil.dtoToMap(digitalTwinDto);
	        ListOrderedMap<String, Object> dataMap = ListOrderedMap.listOrderedMap(new java.util.LinkedHashMap<>());
	        dataMap.putAll(dtAllMap);
					
			// 1. 하위 데이터 부터 먼저 생성 후 디지털트윈 생성
	        dtid = this.createMetadataSet(modelNm, dataMap, 0, outNewSetIdMap, outPrptySubIdMap);
	        
	        // 2. 성공하면 전체 생성 ID에 대해서 카프카(+저장소) 전송
	        
	        // 디지털트윈 셋 먼저 전송 (하위의 upSetList 가 조회되도록)
	        metadataSetService.sendMetadataViaKafka(KafkaConst.ACTION_CREATE, outNewSetIdMap.get(dtid), null, null);
	        outNewSetIdMap.remove(dtid);
	        
	        // 하위 전송
	        for (MetadataSetDto setDto : outNewSetIdMap.values()) {
	        	metadataSetService.sendMetadataViaKafka(KafkaConst.ACTION_CREATE, setDto, null, null);
	        }
	        
	        // 3. etcInfo 설정
	        digitalTwinDto.setEtcInfoOutputData(Map.of("relatedIds", outPrptySubIdMap));
	        
		} catch (ResBaseRuntimeException e) {
			log.error("[디지털트윈 등록] 실패/오류 : {}", e.getReason());
			throw e;
		} catch (Exception e) {
			log.error("[디지털트윈 등록] 실패/오류", e);
			throw e;
		}
	
		log.debug("[디지털트윈 등록] 서비스 종료 - type: {}, new id: {}", digitalTwinDto.getType(), dtid);
		return dtid;
	}
	
	@SuppressWarnings("unchecked")
	private String createMetadataSet(String modelNm, ListOrderedMap<String, Object> dataMap, int depth, Map<String, MetadataSetDto> outNewSetIdMap, Map<String, Object> outPrptySubIdMap) {
		String medataSetId = null;
		ListOrderedMap<String, Object> newDataMap = new ListOrderedMap<>();
		newDataMap.put(Constant.KEYWORD_META_MODEL, modelNm);
		
		ModelInfoDto modelInfoDto = modelCacheService.getModelInfoByName(modelNm);
		if (modelInfoDto == null) throw new ResBizInfoException(5000, "[" + modelNm + "] 모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
		
		// 하위 object_type 데이터 부터 먼저 생성 (recursive)
		for (ModelPropertyInfoDto pDto : modelInfoDto.getPropertyMap().valueList()) {
			String prptyNm = pDto.getPrptyNm();
			Object valObj = dataMap.get(prptyNm);
			
			if (valObj == null) {
				newDataMap.put(prptyNm, valObj);
				continue;
			}
			
			if ("object_type".equals(pDto.getRangeModelTypeMtcd())) {
				if (valObj instanceof List) {
					List<?> list = (List<?>) valObj;
				    if (list.isEmpty()) {
						newDataMap.put(prptyNm, valObj);
						continue;
				    }
				    if (!(list.get(0) instanceof Map)) { // List<String> 같은 경우
				    	// TODO 이미 저장된(존재하는) 식별자(ID) 인지 체크를 해야 할까?
						newDataMap.put(prptyNm, valObj); // TODO issue-post1
						continue;
				    }
				    
				    // Map(object) 인 경우만
				    List<String> subIdList = new ArrayList<>();
				    for (Map<String, Object> aMap : (List<Map<String, Object>>) list) {
				        ListOrderedMap<String, Object> subDataMap = ListOrderedMap.listOrderedMap(new java.util.LinkedHashMap<>());
				        subDataMap.putAll(aMap);
				        
				        // 표준모델명이 있으면 표준모델명, 아니면 유형모델명
				        String subModelNm = StringUtils.defaultString(pDto.getStdModelNm(), pDto.getRangeModelNm());
				        subDataMap.put(Constant.KEYWORD_META_MODEL, subModelNm);
			    		
				        // 하위(sub) 메타데이터 데이터 셋 생성
				        String subMedataSetId = this.createMetadataSet(subModelNm, subDataMap, depth + 1, outNewSetIdMap, outPrptySubIdMap);
				        subIdList.add(subMedataSetId);
			    	}
				    newDataMap.put(prptyNm, subIdList);
				    if (depth == 0) outPrptySubIdMap.put(prptyNm, subIdList); // TODO issue-post1
				    
				} else if (valObj instanceof Map) {
					// Map(object) 인 경우만
					Map<String, Object> aMap = (Map<String, Object>) valObj;
			        ListOrderedMap<String, Object> subDataMap = ListOrderedMap.listOrderedMap(new java.util.LinkedHashMap<>());
			        subDataMap.putAll(aMap);
			        
			        // 표준모델명이 있으면 표준모델명, 아니면 유형모델명
			        String subModelNm = StringUtils.defaultString(pDto.getStdModelNm(), pDto.getRangeModelNm());
			        subDataMap.put(Constant.KEYWORD_META_MODEL, subModelNm);
		    		
			        // 하위(sub) 메타데이터 데이터 셋 생성
			        String subMedataSetId = this.createMetadataSet(subModelNm, subDataMap, depth + 1, outNewSetIdMap, outPrptySubIdMap);
			        newDataMap.put(prptyNm, subMedataSetId);
			        if (depth == 0) outPrptySubIdMap.put(prptyNm, subMedataSetId); // TODO issue-post1
			        
				} else {
					// TODO 이미 저장된(존재하는) 식별자(ID) 인지 체크를 해야 할까?
					newDataMap.put(prptyNm, valObj); // TODO issue-post1
				}
				
			} else { // data_type
				newDataMap.put(prptyNm, valObj);
			}
		}
		
		// 메타데이터 셋 DB 저장
		medataSetId = metadataSetService.createMetadataSetFromDataMap(newDataMap, null, false, false);
		// 신규 셋 ID 별도 저장
		MetadataSetDto setDto = new MetadataSetDto();
		setDto.setMedataSetId(medataSetId);
		setDto.setTypeModelId(modelInfoDto.getTypeModelId());
		setDto.setModelId(modelInfoDto.getModelId());
		outNewSetIdMap.put(medataSetId, setDto);
		log.debug("{} {} new medataSetId : {} {}", depth, modelNm, medataSetId, StringUtils.defaultString((String) dataMap.get("name")));
		return medataSetId;
	}
	
	/**
	 * 디지털트윈 수정
	 * @Author      : heenim
	 * @Date        : 2025. 08. 21.
	 */
	@SuppressWarnings("unchecked")
	public void putDigitalTwin(ApiDigitalTwinDto digitalTwinDto) throws Exception {
		log.debug("[디지털트윈 수정] 서비스 시작 - {}", digitalTwinDto.getDtid());

		String dtid = digitalTwinDto.getDtid();
		LinkedHashMap<String, MetadataSetDto> outNewSetIdMap = new LinkedHashMap<>(); // 신규 메타데이터 셋 ID 와 유형 모델 정보. 카프카(+저장소) 용
		Map<String, Object> outPrptySubIdMap = new HashMap<>(); // DT 하위 프라퍼티별 json:object 들의 ID // TODO issue-put1 새로 생성한 ID 들만 넣어야 할까.. 수정용 ID도 넣어야 할까? 아니면 String ID 값으로 넘어온게 있다면 넣어야 할까?
		
		try {		
			// 기존 디지털트윈 조회
			MetadataSetDto prevSetDto = metadataSetService.getMetadataSet(dtid);
			if (prevSetDto == null) throw new ResNotFoundException(4040, "데이터가 존재하지 않습니다.");
			
			// 전체 데이터 Map
			Map<String, Object> dtAllMap = MapperUtil.dtoToMap(digitalTwinDto);
	        ListOrderedMap<String, Object> dataMap = ListOrderedMap.listOrderedMap(new java.util.LinkedHashMap<>());
	        dataMap.putAll(dtAllMap);
	        log.debug("원본 데이터 Map : {}", dataMap);
	        
	        if (dataMap.isEmpty()) throw new ResBaseRuntimeException(4000, "수정할 데이터가 존재하지 않습니다.");
	        
			ModelInfoDto modelInfoDto = modelCacheService.getModelInfoByName(prevSetDto.getModelNm());
			if (modelInfoDto == null) throw new ResBizInfoException(5000, "[" + prevSetDto.getModelNm() + "] 모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			ListOrderedMap<String, Object> newDataMap = new ListOrderedMap<>();
			newDataMap.put(Constant.KEYWORD_META_MODEL, prevSetDto.getModelNm());
			
			// 디지털트윈의 하위 1depth 만 object 형식의 JSON 으로 들어온다고 하자. 나머지는 무조건 문자열로 처리.
			// 하위 object_type 데이터로 들어온 것 중에서 ID 문자열이 아닌 JSON object 문자열로 들어온 것들 처리
			
			// 1. 하위 셋 생성 데이터(A), 하위 셋 일부 수정 데이터(B), 디지털트윈 셋 일부 수정 데이터(C) 구분 하면서,
			// 하위(sub) 메타데이터 데이터 셋 생성
			// 하위(sub) 메타데이터 데이터 셋 일부 수정 + 카프카(+저장소) 전송
			for (ModelPropertyInfoDto pDto : modelInfoDto.getPropertyMap().valueList()) {
				String prptyNm = pDto.getPrptyNm();
				
				// 데이터가 있을 경우만
				Object valObj = dataMap.get(prptyNm);
				if (valObj == null) continue;
				
				log.debug("{} = {}", prptyNm, valObj); // TODO 나중에 주석처리
								
				if ("object_type".equals(pDto.getRangeModelTypeMtcd())) {
					
					// 기존 object_type ID
			        MetadataSearchVo paramVo = new MetadataSearchVo();
			        paramVo.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
			        paramVo.setMedataSetId(dtid);
			        paramVo.setPrptyId(pDto.getPrptyId());
			        List<MetadataVo> prevMetaList = metadataMapper.selectMetadataSimpleListBySetId(paramVo);
			        Set<String> subIdSet = Optional.ofNullable(prevMetaList)
			        	    .orElseGet(Collections::emptyList)
			        	    .stream()
			        	    .map(MetadataVo::getMedataVal)
			        	    .filter(Objects::nonNull)
			        	    .filter(s -> !s.isBlank())
			        	    .collect(Collectors.toCollection(LinkedHashSet::new));
					
					if (valObj instanceof List) {
						List<?> list = (List<?>) valObj;
					    if (list.isEmpty()) {
					    	log.debug("{} - {} 빈 배열이 설정됨.", dtid, prptyNm);
							newDataMap.put(prptyNm, valObj); // 주의!! 빈 목록 값이 넘어올 경우 기존 object_type 과의 연결이 다 제거됨!!
							continue;
					    }
					    if (!(list.get(0) instanceof Map)) { // List<String> 같은 경우
//					    	// TODO 이미 저장된(존재하는) 식별자(ID) 인지 체크를 해야 할까?
//							newDataMap.put(prptyNm, valObj); // TODO issue-put1 
							// TODO issue-put1-1 : 여기 들어올수 있는 값을 기껏해야 다른 식별자ID 값의 문자열이어야 한다. 아닐 경우 지금은 에러 처리!
							if (list.get(0) instanceof String) {
							    // 기존 ID 들과 합침. 안그러면 기존 것이 삭제됨.
							    subIdSet.addAll((List<String>) list);
							    newDataMap.put(prptyNm, new ArrayList<>(subIdSet));
							} else {
								throw new ResBadRequestException(4004, prptyNm + " 값이 올바르지 않습니다.");
							}					    	
							continue;
					    }
					    
					    // Map(object) 인 경우만
					    List<String> subIdList = new ArrayList<>();
					    for (Map<String, Object> aMap : (List<Map<String, Object>>) list) {
					        ListOrderedMap<String, Object> subDataMap = ListOrderedMap.listOrderedMap(new java.util.LinkedHashMap<>());
					        subDataMap.putAll(aMap);
					        
					        // 표준모델명이 있으면 표준모델명, 아니면 유형모델명
					        String subModelNm = StringUtils.defaultString(pDto.getStdModelNm(), pDto.getRangeModelNm());
					        subDataMap.put(Constant.KEYWORD_META_MODEL, subModelNm);
					        
					        ModelInfoDto subModelInfoDto = modelCacheService.getModelInfoByName(subModelNm);
					        if (subModelInfoDto == null) throw new ResBizInfoException(5000, "[" + subModelNm + "] 모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
					        String subMedataSetId = (String) subDataMap.get(subModelInfoDto.getSetIdPropertyNm());
					        if (StringUtils.isBlank(subMedataSetId)) {
						        // 하위(sub) 메타데이터 데이터 셋 생성
						        subMedataSetId = this.createMetadataSet(subModelNm, subDataMap, 1, outNewSetIdMap, outPrptySubIdMap);
						        subIdList.add(subMedataSetId);
					        } else {
					        	// 하위(sub) 메타데이터 데이터 셋 수정 + 카프카(+저장소) 전송
					        	metadataSetService.savePartialMetadataSetFromDataMap(subMedataSetId, subDataMap);
						        subIdList.add(subMedataSetId);
					        }
				    	}
					    // 기존 ID 들과 합침. 안그러면 기존 것이 삭제됨.
					    subIdSet.addAll(subIdList);
					    newDataMap.put(prptyNm, new ArrayList<>(subIdSet));
					    outPrptySubIdMap.put(prptyNm, subIdList); // TODO issue-put1 
					    
					} else if (valObj instanceof Map) {
						// Map(object) 인 경우만
						Map<String, Object> aMap = (Map<String, Object>) valObj;
				        ListOrderedMap<String, Object> subDataMap = ListOrderedMap.listOrderedMap(new java.util.LinkedHashMap<>());
				        subDataMap.putAll(aMap);
				        
				        // 표준모델명이 있으면 표준모델명, 아니면 유형모델명
				        String subModelNm = StringUtils.defaultString(pDto.getStdModelNm(), pDto.getRangeModelNm());
				        subDataMap.put(Constant.KEYWORD_META_MODEL, subModelNm);
				        
				        ModelInfoDto subModelInfoDto = modelCacheService.getModelInfoByName(subModelNm);
				        if (subModelInfoDto == null) throw new ResBizInfoException(5000, "[" + subModelNm + "] 모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
				        String subMedataSetId = (String) subDataMap.get(subModelInfoDto.getSetIdPropertyNm());
			    		
				        if (StringUtils.isBlank(subMedataSetId)) {
					        // 하위(sub) 메타데이터 데이터 셋 생성
					        subMedataSetId = this.createMetadataSet(subModelNm, subDataMap, 1, outNewSetIdMap, outPrptySubIdMap);
				        } else {
				        	// 하위(sub) 메타데이터 데이터 셋 일부 수정 + 카프카(+저장소) 전송
				        	metadataSetService.savePartialMetadataSetFromDataMap(subMedataSetId, subDataMap);
				        }
					    // 기존 ID 들과 합침. 안그러면 기존 것이 삭제됨.
					    subIdSet.add(subMedataSetId);
					    newDataMap.put(prptyNm, new ArrayList<>(subIdSet));
				        outPrptySubIdMap.put(prptyNm, subMedataSetId); // TODO issue-put1 
				        
					} else {
//						// TODO 이미 저장된(존재하는) 식별자(ID) 인지 체크를 해야 할까?
//						newDataMap.put(prptyNm, valObj); // TODO issue-put1 
						// TODO issue-put1-1 : 여기 들어올수 있는 값을 기껏해야 다른 식별자ID 값의 문자열이어야 한다. 아닐 경우 지금은 에러 처리!
						if (valObj instanceof String) {
						    // 기존 ID 들과 합침. 안그러면 기존 것이 삭제됨.
						    subIdSet.add((String) valObj);
						    newDataMap.put(prptyNm, new ArrayList<>(subIdSet));
						} else {
							throw new ResBadRequestException(4004, prptyNm + " 값이 올바르지 않습니다.");
						}
					}
					
				} else { // data_type
					newDataMap.put(prptyNm, valObj);
				}
			}
			
			// 2. 디지털트윈 셋 일부 수정 + 카프카(+저장소) 전송
			metadataSetService.savePartialMetadataSetFromDataMap(dtid, newDataMap);
			
			// 3. 하위 생성 ID에 대해서 카프카(+저장소) 전송
	        for (MetadataSetDto setDto : outNewSetIdMap.values()) {
	        	metadataSetService.sendMetadataViaKafka(KafkaConst.ACTION_CREATE, setDto, null, null);
	        }
	        
	        // 4. etcInfo 설정
	        digitalTwinDto.setEtcInfoOutputData(Map.of("relatedIds", outPrptySubIdMap));
	        
		} catch (ResBaseRuntimeException e) {
			log.error("[디지털트윈 수정] 실패/오류 - {} : {}", dtid, e.getReason());
			throw e;
		} catch (Exception e) {
			log.error("[디지털트윈 수정] 실패/오류 - {}", dtid, e);
			throw e;
		}
		
		log.debug("[디지털트윈 수정] 서비스 종료 - {}", dtid);
	}
	
	/**
	 * 디지털트윈 삭제
	 * @Author      : heenim
	 * @Date        : 2025. 08. 19.
	 */
	public void deleteDigitalTwin(String dtid) throws Exception {
		log.debug("[디지털트윈 삭제] 서비스 시작 - {}", dtid);
		
		try {
			
			// metadataSetService.deleteMetadataSetAndMetadataBySetId 서비스의 로직이 
			// 파라미터 셋 ID 의 (상위)연결을 끊고 관련 업데이트를 수행 후 해당 셋을 삭제하기 때문에
			// 상위인 dtid 디지털트윈 셋을 먼저 삭제 한 후 하위 셋을 삭제하면 공수가 덜 듬.
		
			// 1. 하위 object_type 먼저 조회해 놓음 (1 depth 만)
			MetadataSearchVo paramVo = new MetadataSearchVo();
			paramVo.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
			paramVo.setMedataSetId(dtid);
			paramVo.setOnlyObjectTypeYn("Y");
			List<MetadataVo> metaList = metadataMapper.selectMetadataSimpleListBySetId(paramVo);
			
			// 2. 디지털트윈 셋 삭제
			metadataSetService.deleteMetadataSetAndMetadataBySetId(dtid, null, false);
			
			// 3. 하위 셋 삭제. 다른 곳에 연결되어 있거나 사용 상태로 바뀌어서 에러가 난 경우 SKIP.
			if (metaList != null && metaList.size() > 0) {
				for (MetadataVo mVo : metaList) {
					try {
						metadataSetService.deleteMetadataSetAndMetadataBySetId(mVo.getMedataVal(), null, false);
					} catch (ResBaseRuntimeException e) {
						log.info("{} 하위 셋 ID 삭제 중 오류 - {} : {}", dtid, mVo.getMedataVal(), e.getReason());
						// SKIP
					} catch (Exception e) {
						log.info("{} 하위 셋 ID 삭제 중 오류 - {}", dtid, mVo.getMedataVal(), e);
						// SKIP
					}
				}
			}
			
		} catch (ResBaseRuntimeException e) {
			log.error("[디지털트윈 삭제] 실패/오류 - {} : {}", dtid, e.getReason());
			throw e;
		} catch (Exception e) {
			log.error("[디지털트윈 삭제] 실패/오류 - {}", dtid, e);
			throw e;
		}		
		
		log.debug("[디지털트윈 삭제] 서비스 종료 - {}", dtid);
	}
	
}
