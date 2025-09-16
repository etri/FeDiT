package kr.co.n2m.platform.meta.resource.metadata.service;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.DtmetaProperty;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiInnerSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataApiSetPropertySearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataJsonMap;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSearchVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetDto;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetVo;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataApiMapper;
import kr.co.n2m.platform.meta.resource.metadata.mapper.MetadataMapper;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.service.ModelCacheService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class MetadataApiService {
	
	@Autowired
	private DtmetaProperty dtmetaProperty;
	
	@Autowired
	private MetadataApiMapper metadataApiMapper;
	
	@Autowired
	MetadataSetService metadataSetService;
	
	@Autowired
	private ModelCacheService modelCacheService;
	
	@Autowired
	private ApiQueryParser apiQueryParser;
	
	@Autowired
	private MetadataMapper metadataMapper;
	
	
	/**
	 * 메타데이터 셋 IRI
	 * ex) http://digitaltwin.keti.re.kr/meta/resource/page/~vCG3-AUuGrk-H_7hP-G1RItJ   페이지
	 * @Author      : heenim
	 * @Date        : 2023. 07. 27.
	 * @param medataSetId
	 * @return
	 */
	public String getMetadataSetIri(String medataSetId) {
		Assert.hasLength(medataSetId, "medataSetId must not be empty.");		
		return dtmetaProperty.getResourceBaseUrl() + (StringUtils.endsWithAny(dtmetaProperty.getResourceBaseUrl(), "/", "#") ? "" : "/") + medataSetId; // TODO URL, IRI 가 정해진 후 수정 작업 필요
	}
	
	/**
	 * 카테고리 개념 SKOS IRI
	 * ex) http://vocab.keti.re.kr/meta/skos/digitaltwin#digitalTwin
	 * @Author      : heenim
	 * @Date        : 2023. 11. 08.
	 * @param categoryConcept
	 * @return
	 */
	public String getSkosIri(String categoryConcept) {
		Assert.hasLength(categoryConcept, "categoryConcept must not be empty.");
		return dtmetaProperty.getRdfSchemaSkosUrl() + (StringUtils.endsWithAny(dtmetaProperty.getRdfSchemaSkosUrl(), "/", "#") ? "" : "/") + categoryConcept; // TODO URL, IRI 가 정해진 후 수정 작업 필요
	}
	
	/**
	 * dataUri : dts -> /dts
	 * @Author      : heenim
	 * @Date        : 2023. 05. 31.
	 * @param dataUri
	 * @return
	 */
	private String getDataUri(String dataUri) {
		if (!StringUtils.startsWith(dataUri, "/")) { dataUri = "/" + dataUri; }
		return dataUri;
	}
	
	/**
	 * dataUri 로 유형 모델 체크 후 가져오기
	 * @Author      : heenim
	 * @Date        : 2023. 05. 31.
	 * @param dataUri
	 * @return
	 */
	private ModelVo checkDataUriAndGetTypeModelVo(String dataUri) {
		if (StringUtils.isBlank(dataUri)) throw new ResBadRequestException("URI가 없습니다.");
		ModelVo typeModelVo = modelCacheService.getTypeModelByDataUri(this.getDataUri(dataUri));
		if (typeModelVo == null) throw new ResBizInfoException("유형 모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
		return typeModelVo;
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 22.
	 * @param dataUri
	 * @param metadataApiSearchVo
	 * @return
	 */
	public SearchResultListVo getDataMapListByDataUri(String dataUri, MetadataApiSearchVo metadataApiSearchVo) {
		log.debug("[유형 모델별 메타데이터 셋 목록 조회] 서비스 시작 - {}", dataUri);
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);
			
			// FIXME 2023-07-27 정형모델 사용안함 - 비정형 모델만 구현 if (StringUtils.equals("Y", typeModelVo.getStructdModelYn())) { 
			
			MetadataApiInnerSearchVo searchVo = new MetadataApiInnerSearchVo(metadataApiSearchVo);
			
			// 비정형모델
			searchVo.setTypeModelId(typeModelVo.getModelId());
			
			// 모델조건.
			String metaModel = metadataApiSearchVo.getMetaModel(); // nullable
			if (StringUtils.isNotBlank(metaModel)) {
				ModelInfoDto modelInfoDto = modelCacheService.getModelInfoByName(metaModel);
				if (modelInfoDto != null) {
					searchVo.setModelId(modelInfoDto.getModelId());
				} else {
					searchVo.setModelNm(metaModel); // 잘못된 조건으로 결과물이 안나오는 게 맞음.
				}
			}
			
			// 검색조건. filter
			String sql = apiQueryParser.getQuerySql(searchVo.getQuery());
			log.debug(sql);
			searchVo.setQuerySql(sql);
			
			// TODO GeoJson 은 별도 쿼리가 필요할 수 있음
			
			int totalListSize = metadataApiMapper.selectMetadataSetCountByTypeModel(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<MetadataJsonMap> list = metadataApiMapper.selectMetadataSetListToJsonStrByTypeModel(searchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 셋 목록 조회] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 셋 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[유형 모델별 메타데이터 셋 목록 조회] 서비스 종료 - {}", dataUri);
		return listVo;
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 16.
	 * @param dataUri
	 * @param medataSetId
	 * @param arrayDataLimitYn
	 * @param arrayDataLimit
	 * @return
	 */
	public ListOrderedMap<String, Object> getDataMapByDataUri(String dataUri, String medataSetId, String arrayDataLimitYn, Integer arrayDataLimit) {
		log.debug("[유형 모델별 메타데이터 셋 조회] 서비스 시작 - {}", medataSetId);
		ListOrderedMap<String, Object> dataMap = null;
		
		try {
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);
			
			// FIXME 2023-07-27 정형모델 사용안함 - 비정형 모델만 구현 if (StringUtils.equals("Y", typeModelVo.getStructdModelYn())) { 

			// 비정형모델		
			dataMap = this.getDataMapFromMetadataSet(medataSetId, typeModelVo, true, arrayDataLimitYn, arrayDataLimit);
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 셋 조회] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 셋 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		 
		log.debug("[유형 모델별 메타데이터 셋 조회] 서비스 종료 - {}", dataUri);
		return dataMap;
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 조회 (full objects data)
	 * @Author      : tklee
	 * @Date        : 2024. 04. 26.
	 * @param dataUri
	 * @param medataSetId
	 * @param arrayDataLimitYn
	 * @param arrayDataLimit
	 * @return
	 */
	public ListOrderedMap<String, Object> getFullDataMapByDataUri(String dataUri, String medataSetId, String arrayDataLimitYn, Integer arrayDataLimit) {
		log.debug("[유형 모델별 메타데이터 셋 조회 (full objects data)] 서비스 시작 - {}", medataSetId);
		ListOrderedMap<String, Object> dataMap = null;
		
		try {
			dataMap = this.getDataMapByDataUri(dataUri, medataSetId, arrayDataLimitYn, arrayDataLimit);
			
			String digitalObjectType     = "DigitalObject"; 	// 유형 모델 ID 하드코딩
//			String digitalObjectDataType = "DigitalObjectData"; // 유형 모델 ID 하드코딩
			ModelInfoDto modelInfoDto = modelCacheService.getModelInfoByName(digitalObjectType);
			if (modelInfoDto == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
//			ModelInfoDto modelInfoDto2 = modelCacheService.getModelInfoByName(digitalObjectDataType);
//			if (modelInfoDto2 == null) throw new ResBizInfoException("모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
			
			String objectdataPrptyId = "digitalTwinObjectData"; //  프라퍼티ID 하드코딩 TODO Range 모델 타입 이 DigitalObjectData 인 것 찾기.... 배열일 경우도 고려... 여기서는 아니지만..
						
//			String subDataUri = modelInfoDto2.getModelDataUri();
			
			String medataVal = (String) dataMap.get(objectdataPrptyId);
			if (medataVal != null) {
				// 너무 긴 JSON 시간이 오래 걸려서 이렇게 안함. 아래와 같이 사용. dataMap.put(objectdataPrptyId, this.getDataMapByDataUri(subDataUri, medataVal, "N", 0));
				
				ListOrderedMap<String, Object> objectFulldataMap = new ListOrderedMap<String, Object>();
				MetadataSearchVo metadataSearchVo = new MetadataSearchVo();
				metadataSearchVo.setMedataSetId((String) dataMap.get(objectdataPrptyId));
				List<CamelCaseMap> list = metadataMapper.selectMetadataList(metadataSearchVo);
				for(int i=0; i<list.size(); i++) {
					objectFulldataMap.put((String) list.get(i).get("prptyId"), list.get(i).get("medataVal"));
				}
				
				if(!objectFulldataMap.isEmpty()) {
					dataMap.replace(objectdataPrptyId, dataMap.get(objectdataPrptyId), objectFulldataMap);
				}				
			}			
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 셋 조회 (full objects data)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 셋 조회 (full objects data)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		 
		log.debug("[유형 모델별 메타데이터 셋 조회 (full objects data)] 서비스 종료 - {}", dataUri);
		return dataMap;
	}
	
	/**
	 * 비정형 메타데이터 셋 조회 (to dataMap)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 15.
	 * @param medataSetId
	 * @param typeModelVo
	 * @param checkTypeModel
	 * @param arrayDataLimitYn
	 * @param arrayDataLimit
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public ListOrderedMap<String, Object> getDataMapFromMetadataSet(String medataSetId, ModelVo typeModelVo, boolean checkTypeModel, String arrayDataLimitYn, Integer arrayDataLimit) {
		log.debug("[비정형 메타데이터 셋 조회 (to dataMap)] 서비스 시작 - {}", medataSetId);
		if (StringUtils.isBlank(medataSetId)) return null; 
		ListOrderedMap<String, Object> dataMap = null;
		
		try {
			MetadataSetDto setDto = metadataSetService.getMetadataSet(medataSetId);
			if (setDto != null) {
				setDto.setArrayDataLimitYn(arrayDataLimitYn);
				setDto.setArrayDataLimit(arrayDataLimit);
				
				if (checkTypeModel) { 
					// 유형과 맞을 경우만 조회
					if (typeModelVo != null && StringUtils.equals(typeModelVo.getModelId(), setDto.getTypeModelId())) {
						dataMap = metadataApiMapper.selectMetadataToJsonStrBySetId(setDto);
					}
				} else {
					dataMap = metadataApiMapper.selectMetadataToJsonStrBySetId(setDto);
				}
			}
			
		} catch (Exception e) {
			log.error("[비정형 메타데이터 셋 조회 (to dataMap)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[비정형 메타데이터 셋 조회 (to dataMap)] 서비스 종료 - {}", medataSetId);
		return dataMap;
	}
	
	public ListOrderedMap<String, Object> getDataMapFromMetadataSet(String medataSetId, ModelVo typeModelVo, boolean checkTypeModel) {
		return this.getDataMapFromMetadataSet(medataSetId, typeModelVo, checkTypeModel, null, null);
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 생성 (Multi)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 09.
	 * @param dataUri
	 * @param dataList
	 * @return
	 */
	// 전체 트랜잭션 - 1건이라도 실패시 바로 Exception
	public List<String> createMetadataSetByDataUri(String dataUri, List<ListOrderedMap<String, Object>> dataList) {
		log.debug("[유형 모델별 메타데이터 셋 생성 (Multi)] 서비스 시작 - {}", dataUri);
		int cnt = 0;
		StringBuffer sb = new StringBuffer();
		List<String> idList = new ArrayList<>();
		
		try {
			if (dataList == null || dataList.isEmpty()) throw new ResBadRequestException("메타데이터 정보가 없습니다.");			
			
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);		
			
			for (int i = 0; i < dataList.size(); i++) {
				ListOrderedMap<String, Object> dataMap = dataList.get(i);
				String modelNm = (String) dataMap.get(Constant.KEYWORD_META_MODEL);
				if (StringUtils.isEmpty(modelNm)) modelNm = typeModelVo.getModelNm(); // 지정 모델명이 없으면 유형 모델로 설정.
				
				try {
					String medataSetId = metadataSetService.createMetadataSetFromDataMap(dataMap, typeModelVo, true, true);
					idList.add(medataSetId);
					cnt++;
					
				} catch (ResBadRequestException | ResBizInfoException e) {
					log.info("[유형 모델별 메타데이터 셋 생성 (Multi)] 실패/오류 (정보성) : {} 모델[{}] 등록 실패 : {}", i, modelNm, e.getReason());
					sb.append(i).append("번째 데이터의 모델[").append(modelNm).append("] 등록 실패 : ").append(e.getReason());
					throw new ResBadRequestException(sb.toString());
				}
			}
			
			log.debug("[유형 모델별 메타데이터 셋 생성 (Multi)] 총 {}건 중 등록 성공 : {}건", dataList.size(), cnt);	
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 셋 생성 (Multi)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 셋 생성 (Multi)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
		
		log.debug("[유형 모델별 메타데이터 셋 생성 (Multi)] 서비스 종료 - {}", dataUri);
		return idList;		
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 수정
	 * @Author      : heenim
	 * @Date        : 2023. 09. 05.
	 * @param dataUri
	 * @param medataSetId
	 * @param dataMap
	 */
	public void modifyMetadataSetByDataUri(String dataUri, String medataSetId, ListOrderedMap<String, Object> dataMap) {
		log.debug("[유형 모델별 메타데이터 셋 수정] 서비스 시작 - {}", dataUri);
		
		try {
			if (dataMap == null || dataMap.isEmpty()) throw new ResBadRequestException("메타데이터 정보가 없습니다.");
			
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);

			metadataSetService.modifyMetadataSetFromDataMap(medataSetId, dataMap, typeModelVo, true);
		
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 셋 수정] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 셋 수정] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}	
		
		log.debug("[유형 모델별 메타데이터 셋 수정] 서비스 종료 - {}", dataUri);
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 06. 02.
	 * @param dataUri
	 * @param medataSetId
	 * @return
	 */
	public int deleteMetadataSetByDataUri(String dataUri, String medataSetId) {
		log.debug("[유형 모델별 메타데이터 셋 삭제] 서비스 시작 - {}", medataSetId);
		int cnt = 0;
		
		try {
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);
			
			// FIXME 2023-07-27 정형모델 사용안함 - 비정형 모델만 구현 if (StringUtils.equals("Y", typeModelVo.getStructdModelYn())) { 

			// 비정형모델		
			cnt = metadataSetService.deleteMetadataSetAndMetadataBySetId(medataSetId, typeModelVo, true);
		
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 셋 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 셋 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		 
		log.debug("[유형 모델별 메타데이터 셋 삭제] 서비스 종료 - {}", dataUri);
		return cnt;
	}
	
	/**
	 * 유형 모델별 메타데이터 프라퍼티 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 01.
	 * @param dataUri
	 * @param medataSetId
	 * @param prptyNm
	 * @return
	 */
	public SearchResultListVo getPropertyValueListByDataUri(String dataUri, String medataSetId, String prptyNm, PageVo pageVo) {
		log.debug("[유형 모델별 메타데이터 프라퍼티 조회] 서비스 시작 - {}", dataUri);
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);
			
			// FIXME 2023-07-27 정형모델 사용안함 - 비정형 모델만 구현 if (StringUtils.equals("Y", typeModelVo.getStructdModelYn())) { 
			
			String resourceUrl = dtmetaProperty.getResourceBaseUrl() + (StringUtils.endsWithAny(dtmetaProperty.getResourceBaseUrl(), "/", "#") ? "" : "/"); // TODO 리소스 URL, IRI 가 정해진 후 수정 작업 필요
			
			// 비정형모델
			MetadataApiSetPropertySearchVo searchVo = new MetadataApiSetPropertySearchVo(pageVo);
			searchVo.setTypeModelId(typeModelVo.getModelId());
			searchVo.setMedataSetId(medataSetId);
			searchVo.setPrptyNm(prptyNm);
			searchVo.setResourceUrl(resourceUrl);
			
			int totalListSize = metadataApiMapper.selectMetadataCountBySetPropertyNm(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<MetadataJsonMap> list = metadataApiMapper.selectMetadataListBySetPropertyNm(searchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 프라퍼티 조회] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 프라퍼티 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[유형 모델별 메타데이터 프라퍼티 조회] 서비스 종료 - {}", dataUri);
		return listVo;
	}
	
	/**
	 * 유형 모델별 메타데이터 프라퍼티 저장 (Multi) - upsert
	 * @Author      : heenim
	 * @Date        : 2023. 06. 02.
	 * @param dataUri
	 * @param medataSetId
	 * @param dataValList
	 * @return
	 */
	public int savePropertyValueListByDataUri(String dataUri, String medataSetId, String prptyNm, List<Object> dataValList) {
		log.debug("[유형 모델별 메타데이터 프라퍼티 저장 (Multi)] 서비스 시작 - {}", medataSetId);
		int cnt = 0;
		
		try {
			if (dataValList == null || dataValList.isEmpty()) throw new ResBadRequestException("메타데이터 정보가 없습니다.");
			
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);
			
			// FIXME 2023-07-27 정형모델 사용안함 - 비정형 모델만 구현 if (StringUtils.equals("Y", typeModelVo.getStructdModelYn())) {
			
			// 비정형모델		
			cnt = metadataSetService.saveMetadataListByPropertyNm(medataSetId, prptyNm, dataValList, typeModelVo, true);
			
			log.debug("[유형 모델별 메타데이터 프라퍼티 저장 (Multi)] 총 {}건 중 저장 성공 : {}건", dataValList.size(), cnt);
		
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 프라퍼티 저장 (Multi)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 프라퍼티 저장 (Multi)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		 
		log.debug("[유형 모델별 메타데이터 프라퍼티 저장 (Multi)] 서비스 종료 - {}", dataUri);
		return cnt;
	}
	
	/**
	 * 유형 모델별 메타데이터 프라퍼티 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 06. 07.
	 * @param dataUri
	 * @param medataSetId
	 * @param prptyNm
	 * @param deleteValList
	 * @return
	 */
	public int deletePropertyValueListByDataUri(String dataUri, String medataSetId, String prptyNm, List<Object> deleteValList) {
		log.debug("[유형 모델별 메타데이터 프라퍼티 삭제] 서비스 시작 - {}", medataSetId);
		int cnt = 0;
		
		try {
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);
			
			// FIXME 2023-07-27 정형모델 사용안함 - 비정형 모델만 구현 if (StringUtils.equals("Y", typeModelVo.getStructdModelYn())) {
			
			// 비정형모델		
			cnt = metadataSetService.deleteMetadataListByPropertyNm(medataSetId, prptyNm, deleteValList, typeModelVo, true);
			
			log.debug("[유형 모델별 메타데이터 프라퍼티 삭제] 삭제 성공 : {}건", cnt);
		
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 프라퍼티 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 프라퍼티 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		 
		log.debug("[유형 모델별 메타데이터 프라퍼티 삭제] 서비스 종료 - {}", dataUri);
		return cnt;
	}
	
	/**
	 * 유형 모델별 메타데이터 셋 상태 변경
	 * @Author      : heenim
	 * @Date        : 2023. 06. 22.
	 * @param dataUri
	 * @param medataSetId
	 * @param medataSetSttusMtcd
	 * @return
	 */
	public int changeMetadataSetStatusByDataUri(String dataUri, String medataSetId, MetadataSetVo metadataSetVo) {
		log.debug("[유형 모델별 메타데이터 셋 상태 변경] 서비스 시작 - {}", medataSetId);
		int cnt = 0;
		
		try {
			ModelVo typeModelVo = this.checkDataUriAndGetTypeModelVo(dataUri);
			
			// FIXME 2023-07-27 정형모델 사용안함 - 비정형 모델만 구현 if (StringUtils.equals("Y", typeModelVo.getStructdModelYn())) {
			
			// 비정형모델		
			cnt = metadataSetService.modifyMetadataSetStatusFromSetVo(metadataSetVo, typeModelVo, true);
			
			log.debug("[유형 모델별 메타데이터 셋 상태 변경] 삭제 성공 : {}건", cnt);
		
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[유형 모델별 메타데이터 셋 상태 변경] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[유형 모델별 메타데이터 셋 상태 변경] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		 
		log.debug("[유형 모델별 메타데이터 셋 상태 변경] 서비스 종료 - {}", dataUri);
		return cnt;
	}
	
}
