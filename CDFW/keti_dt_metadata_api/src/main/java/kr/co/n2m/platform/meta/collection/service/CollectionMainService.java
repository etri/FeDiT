package kr.co.n2m.platform.meta.collection.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.collection.domain.CollectionInputDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionMappingDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionPropertyDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionWorkVo;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataSetVo;
import kr.co.n2m.platform.meta.resource.metadata.service.MetadataSetService;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class CollectionMainService {
	
	@Autowired
	private ModelService modelService;
	
	@Autowired
	private MetadataSetService metadataSetService;
	
	public void validate(String colecLogId, CollectionInputDto collectionInputDto) {
		log.debug("[메타데이터 수집 유효성 체크] 서비스 시작 - {}", colecLogId);
		StringBuilder sb = new StringBuilder();
		
		if (collectionInputDto.getMapping() == null) { sb.append("mapping").append(ValueUtil.required()).append("\n"); }
		if (collectionInputDto.getData() == null || collectionInputDto.getData().isEmpty()) { sb.append("data").append(ValueUtil.required()).append("\n"); }
		
		CollectionMappingDto rootMapDto = collectionInputDto.getMapping();
		try {
			this.validateMapping(rootMapDto);
			
			// FIXME 하위 매핑 유효성 체크는 작업 처리 하면서 하자.
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			sb.append(e.getReason());
		} catch (Exception e) {
			log.error("[메타데이터 수집 유효성 체크] 에러 : {}", e.getMessage());
			throw new ResBaseRuntimeException(e);
		}
		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
		
		log.debug("메타데이터 수집 유효성 체크] 서비스 종료 - {}", colecLogId);
	}
	
	private void validateMapping(CollectionMappingDto collectionMappingDto) {
		StringBuilder sb = new StringBuilder();
		
		// metaModel 필수, key 선택, properties 1건 이상
		if (StringUtils.isBlank(collectionMappingDto.getMetaModel())) { sb.append("metaModel").append(ValueUtil.required()).append("\n"); }
		if (collectionMappingDto.getProperties() == null || collectionMappingDto.getProperties().size() == 0) { sb.append("properties").append(ValueUtil.required()).append("\n"); }
		
		// 메타데이터 모델명 으로 메타데이터 모델 정보 조회
		ModelInfoDto modelInfoDto = modelService.getModelInfoByNameFromCache(collectionMappingDto.getMetaModel());
		if (modelInfoDto == null) { sb.append("[").append(collectionMappingDto.getMetaModel()).append("] 모델이 존재하지 않거나 사용할 수 없는 모델입니다."); }			
		
		// keyProperty 가 있다면 properties 에 있는지 확인
		if (StringUtils.isNotBlank(collectionMappingDto.getKeyProperty())) {
			if (!collectionMappingDto.getProperties().containsKey(collectionMappingDto.getKeyProperty())) {
				sb.append("key 프라퍼티 [").append(collectionMappingDto.getKeyProperty()).append("] 가 properties 에 포함되어 있지 않습니다.");
			}
		}
		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());		
	}
	
	public void collectAndCreateMetadataSet(CollectionWorkVo workVo, CollectionInputDto collectionInputDto, LoginUserVo loginUserVo) {
		log.debug("[메타데이터 수집] 서비스 시작 - {}", workVo.getColecWrkId());
		Set<String> newSetIdSet = new HashSet<>();
		Map<String, Map<String, String>> typeKeyMap = new HashMap<>();
		
		try {			
			// root
			CollectionMappingDto mappingDto = collectionInputDto.getMapping();
			List<Object> dataValList = collectionInputDto.getData();
			List<String> topIdList = new ArrayList<>();
			
			for (Object dataValObj : dataValList) {
				String medataSetId = this.createMetadataSet(newSetIdSet, typeKeyMap, mappingDto, dataValObj, loginUserVo);
				topIdList.add(medataSetId);			
			}
			
			// 활성화 처리 (사용 상태로 변경)
			MetadataSetVo changeSetVo = new MetadataSetVo();
			changeSetVo.setMedataSetSttusMtcd(Constant.SET_STATUS_USE);
			for (String medataSetId : topIdList) {
				changeSetVo.setMedataSetId(medataSetId);
				changeSetVo.setAsyncUserVo(loginUserVo);
				metadataSetService.modifyMetadataSetStatusFromSetVo(changeSetVo, null, false);
			}
			
			// 수집 작업 내용 설정
			workVo.setRootMedataSetId(topIdList.get(0));
			workVo.makeCretMedataSetIdList(newSetIdSet);
			workVo.setColecWrkMsg(newSetIdSet.size() + "건 등록 성공.");
		
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[메타데이터 수집] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[메타데이터 수집] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 수집] 서비스 종료 - {}", workVo.getColecWrkId());
	}
	
	@SuppressWarnings("unchecked")
	private String createMetadataSet(Set<String> newSetIdSet, Map<String, Map<String, String>> typeKeyMap, CollectionMappingDto mappingDto, Object dataValObj, LoginUserVo loginUserVo) {
		ModelInfoDto modelInfoDto = modelService.getModelInfoByNameFromCache(mappingDto.getMetaModel());
		if (modelInfoDto == null) new ResBadRequestException("[" + mappingDto.getMetaModel() + "] 모델이 존재하지 않거나 사용할 수 없는 모델입니다.");
		StringBuilder sb = new StringBuilder();
		
		Map<String, CollectionPropertyDto> propMap = mappingDto.getProperties();
		Map<String, Object> dataValMap = JsonUtil.toMap(JsonUtil.toJson(dataValObj));
		
		// data for db			
		String medataSetId = null;
		ListOrderedMap<String, Object> dataMap = new ListOrderedMap<>();
		dataMap.put(Constant.KEYWORD_META_MODEL, mappingDto.getMetaModel());
		dataMap.put(Constant.LOGIN_USER_VO, loginUserVo); // 비동기 처리 사용자 정보		
		
		try {
			
			// 메타데이터 셋 만들 때 key 참고해서 여러개 만들지 않도록 주의!
			// key 프라퍼티
			String keyVal = null;
			if (StringUtils.isNotBlank(mappingDto.getKeyProperty())) {
				Object keyValObj = dataValMap.get(mappingDto.getKeyProperty());
				if (keyValObj != null) {
					keyVal = String.valueOf(keyValObj);
					
					// key 값으로 이미 등록된 메타데이터 셋이 있는지 확인
					medataSetId = this.findMedataSetId(typeKeyMap, modelInfoDto.getTypeModelId(), keyVal);
					if (medataSetId != null) {
						log.debug("{} - {} : {}  이미 생성된 데이터임.", modelInfoDto.getTypeModelId(), keyVal, medataSetId);
						return medataSetId;
					}
				}
			}
			
			for (Map.Entry<String, CollectionPropertyDto> pMap : propMap.entrySet()) {
				String propNm                 = pMap.getKey();			// 원본 프라퍼티 명
				CollectionPropertyDto propDto = pMap.getValue();		// 매핑 프라퍼티 정보
				
				if (propDto == null || StringUtils.isBlank(propDto.getName())) {
					continue; // 무시
				}
				
				String prptyNm                = propDto.getName();		// 매핑 프라퍼티 명 (메타데이터 프라퍼티 명)
				Object valObj                 = dataValMap.get(propNm); // 실 데이터
				
				ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(prptyNm);
				// if (pDto == null) throw new ResBizInfoException("[" + prptyNm + "] 프라퍼티가 존재하지 않거나 사용할 수 없는 프라퍼티입니다.");
				if (pDto == null) {
					continue; // 무시
				}
				
				// 원래 배열 프라퍼티 경우 체크
				if ("Y".equals(pDto.getDataArrayYn())) {
					if (!"Y".equals(propDto.getArrayYn())) throw new ResBizInfoException("[" + prptyNm + "] 프라퍼티에 해당하는 원본 프라퍼티 [" + propNm + "] 정보가 배열이 아닙니다. (arrayYn != \"Y\")" );
					if (!ValueUtil.isList(valObj) && !ValueUtil.isArray(valObj)) throw new ResBizInfoException("[" + prptyNm + "] 프라퍼티에 해당하는 값이 배열이 아닙니다." );
				}				
				
				// 메핑 정보 없음 -> 리터럴 데이터로 간주.
				if (propDto.getMapping() == null) {
					dataMap.put(prptyNm, valObj); 	// 나머지 유효성 검사는 메타데이터 등록시 체크됨.
					
				// 매핑 정보 있으나 메타데이터 프라퍼티의 범위가 유형 모델이 아닌 경우 -> 리터럴 데이터로 간주.
				} else if (!"object_type".equals(pDto.getRangeModelTypeMtcd())) {
					dataMap.put(prptyNm, valObj); 	// 나머지 유효성 검사는 메타데이터 등록시 체크됨.
				
				// 매핑 정보 있고 범위가 유형 모델인 경우 -> 객체 데이터. 별도 메타데이터 셋 만들고 연결.
				} else {
					
					CollectionMappingDto subMappingDto = propDto.getMapping();
					this.validateMapping(subMappingDto);
					
					if ("Y".equals(pDto.getDataArrayYn())) {
						
						Set<String> subIdSet = new HashSet<>();					
						if (ValueUtil.isList(valObj)) { // List 데이터
							List<Object> subValList = (List<Object>) valObj;
							
							for (Object subValObj : subValList) {
								// recursive
								String subMedataSetId = this.createMetadataSet(newSetIdSet, typeKeyMap, subMappingDto, subValObj, loginUserVo);
								subIdSet.add(subMedataSetId);
							}					
							
						} else if (ValueUtil.isArray(valObj)) { // 배열 데이터
							Object[] subValArr = (Object[]) valObj;
							
							for (Object subValObj : subValArr) {
								// recursive
								String subMedataSetId = this.createMetadataSet(newSetIdSet, typeKeyMap, subMappingDto, subValObj, loginUserVo);
								subIdSet.add(subMedataSetId);
							}					
							
						} else {
							log.debug("위에서 한번 체크 하므로 여기에 올 경우는 없음");
						}
						
						dataMap.put(prptyNm, subIdSet.toArray());
						
					} else {
						
						// recursive
						String subMedataSetId = this.createMetadataSet(newSetIdSet, typeKeyMap, subMappingDto, valObj, loginUserVo);
						dataMap.put(prptyNm, subMedataSetId);
						
					}
				}
			}
			
			// 메타데이터 셋 DB 저장
			medataSetId = metadataSetService.createMetadataSetFromDataMap(dataMap, null, false);
			newSetIdSet.add(medataSetId);
			
			// key 프라퍼티가 있다면 key 값과 메타데이터 셋 ID 메모리 저장
			if (StringUtils.isNotBlank(mappingDto.getKeyProperty())) {
				this.putToTypeKeyMap(typeKeyMap, modelInfoDto.getTypeModelId(), keyVal, medataSetId);
			}
		
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 수집 메타데이터 생성] 실패/오류 (정보성) : 모델[{}] 등록 실패 : {}", mappingDto.getMetaModel(), e.getReason());
			sb.append("모델[").append(mappingDto.getMetaModel()).append("] : ").append(e.getReason());
			throw new ResBadRequestException(sb.toString());
		}
		
		return medataSetId;
	}
	
	private void putToTypeKeyMap(Map<String, Map<String, String>> typeKeyMap, String typeModelId, String keyVal, String medataSetId) {
		Map<String, String> keyMap = typeKeyMap.get(typeModelId);
		if (keyMap == null) {
			keyMap = new HashMap<>();
		}
		keyMap.put(keyVal, medataSetId);
		typeKeyMap.put(typeModelId, keyMap);
		log.debug("{}", typeKeyMap);
	}
	
	private String findMedataSetId(Map<String, Map<String, String>> typeKeyMap, String typeModelId, String keyVal) {
		Map<String, String> keyMap = typeKeyMap.get(typeModelId);
		if (keyMap == null) return null;
		return keyMap.containsKey(keyVal) ? keyMap.get(keyVal) : null;
	}

}
