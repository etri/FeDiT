package kr.co.n2m.platform.meta.schema.property.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.code.MetadataEnum;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.DerivedDataTypeMtcd;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.MetadataSetRangeModelId;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.PropertyRequired;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.schema.model.service.ModelService;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertySearchVo;
import kr.co.n2m.platform.meta.schema.modelproperty.mapper.ModelPropertyMapper;
import kr.co.n2m.platform.meta.schema.property.domain.PropertyDataTypeDto;
import kr.co.n2m.platform.meta.schema.property.domain.PropertySearchVo;
import kr.co.n2m.platform.meta.schema.property.domain.PropertyVo;
import kr.co.n2m.platform.meta.schema.property.mapper.PropertyMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class PropertyService {
	
	@Autowired
	private PropertyMapper propertyMapper;
	
	@Autowired
	private ModelPropertyMapper modelPropertyMapper;
	
	@Autowired
	private ModelService modelService;
	
	@Autowired
	private PropertyCacheService propertyCacheService;
	
	
	
	public SearchResultListVo getPropertyList(PropertySearchVo searchVo) {
		log.debug("[프라퍼티 검색] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			int totalListSize = propertyMapper.selectPropertyCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<CamelCaseMap> list = propertyMapper.selectPropertyList(searchVo);
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (Exception e) {
			log.debug("[프라퍼티 검색] 서비스 시작");
			throw new ResBaseRuntimeException(e); 
		}
		log.debug("[프라퍼티 검색] 서비스 시작");
		return listVo;
	}
	
	public SearchResultListVo getTypePropertyList(ModelPropertySearchVo searchVo) {
		log.debug("[유형 프라퍼티 검색] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		try {
			
			List<CamelCaseMap> list = propertyMapper.selectTypePropertyList(searchVo);
			for(CamelCaseMap map : list) {
				String dataType = map.get("dataTypeMtcd") == null ? null : String.valueOf(map.get("dataTypeMtcd"));
				for(MetadataSetRangeModelId rangeModelId : MetadataSetRangeModelId.values()) {
					if (StringUtils.equals(dataType, rangeModelId.code())) {
						map.put("model_prpty_mand_mtcd", rangeModelId.getPrptyMandMtcd());
						break;
					}
				}
				DerivedDataTypeMtcd derivedDataType = MetadataEnum.getValue(dataType, DerivedDataTypeMtcd.class);
				if (derivedDataType != null) map.put("model_prpty_mand_mtcd", PropertyRequired.readonly.code());
				if (StringUtils.equals("Y", String.valueOf(map.get("cntPrptyYn")))) map.put("model_prpty_mand_mtcd", PropertyRequired.readonly.code());
				if (map.get("modelPrptyMandMtcd") == null) map.put("model_prpty_mand_mtcd", PropertyRequired.optional.code());
			}
			
			PageVo vo = new PageVo();
			vo.setIsPaging(false);
			listVo.setList(list);
			listVo.setPage(vo);
			
		} catch (Exception e) {
			log.debug("[유형 프라퍼티 검색] 서비스 시작");
			throw new ResBaseRuntimeException(e); 
		}
		log.debug("[유형 프라퍼티 검색] 서비스 시작");
		return listVo;
	}
	
	
	
	public PropertyVo getProperty(String prptyId) {
		PropertyVo vo = new PropertyVo();
		try {
			PropertyVo paramVo = new PropertyVo();
			paramVo.setPrptyId(prptyId);
			vo = propertyMapper.selectProperty(paramVo);
			vo.setPrptyDefChgList(propertyMapper.selectPropertyDefineChgList(paramVo));
		} catch (Exception e) {
			throw new ResBaseRuntimeException(e);
		}
		return vo;
	}
	
	public String createProperty(PropertyVo propertyVo) {
    	StringBuffer sb = new StringBuffer();		
		LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
		
		propertyVo.setPrptyRegrId(loginUserVo.getUserId());
		propertyVo.setPrptyRegrNm(loginUserVo.getUserNm());
		propertyVo.setPrptyAmdrId(loginUserVo.getUserId());
		propertyVo.setPrptyAmdrNm(loginUserVo.getUserNm());
		
		int checkCnt = 0;
		try {
	    	// 필수 체크
	    	if (StringUtils.isBlank(propertyVo.getPrptyNm())) { sb.append("prptyNm").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(propertyVo.getCntPrptyYn())) { sb.append("cntPrptyYn").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(propertyVo.getDataArrayYn())) { sb.append("dataArrayYn").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(propertyVo.getPrptyScrnIndcYn())) { sb.append("prptyScrnIndcYn").append(ValueUtil.required()).append("\n"); }
	    	if((Integer)propertyVo.getPrptySortOdrg() != null) {
				if (propertyVo.getPrptySortOdrg() < 0 || propertyVo.getPrptySortOdrg() > 99999) { sb.append("prptySortOdrg").append(ValueUtil.mustBeBetween("0","99999")).append("\n"); }
			}
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());			
			
			checkCnt = propertyMapper.selectPropertyNameCheck(propertyVo.getPrptyNm());
			if(checkCnt > 0) throw new ResBizInfoException("[" + propertyVo.getPrptyNm() + "]" + "는(은) 이미 등록되어 있습니다.");
			
			checkCnt = propertyMapper.selectPropertyIdCheck(propertyVo.getPrptyId());
			if(checkCnt > 0) throw new ResBizInfoException("[" + propertyVo.getPrptyId() + "]" + "는(은) 이미 등록되어 있습니다.");
			
			//default value set
			if(StringUtils.isBlank( propertyVo.getPrptyId() )) {
				propertyVo.setPrptyId(propertyVo.getPrptyNm());
			}
			if(StringUtils.isBlank( propertyVo.getPrptyDataSttusMtcd() )) {
				propertyVo.setPrptyDataSttusMtcd("use");
			}
			if(StringUtils.isBlank( propertyVo.getUpPrptyId() )) {
				propertyVo.setUpPrptyId(null);
			}

			propertyMapper.insertProperty(propertyVo);
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[프라퍼티 등록] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[프라퍼티 등록] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
				
		propertyVo.setPrptyDefRegrId(loginUserVo.getUserId());
		propertyVo.setPrptyDefRegrNm(loginUserVo.getUserNm());
		propertyVo.setPrptyDefAmdrId(loginUserVo.getUserId());
		propertyVo.setPrptyDefAmdrNm(loginUserVo.getUserNm());
		
		try {
	    	// 필수 체크
	    	if (StringUtils.isBlank(propertyVo.getDomnModelId())) { sb.append("domnModelId").append(ValueUtil.required()).append("\n"); }
	    	else if (StringUtils.isBlank(modelService.getModelNameFromCache(propertyVo.getDomnModelId()))) {
	    		sb.append(propertyVo.getDomnModelId()).append(" 모델은 존재하지 않거나 사용할 수 없습니다.").append("\n");
	    	}
	    	if (StringUtils.isBlank(propertyVo.getRangeModelId())) { sb.append("rangeModelId").append(ValueUtil.required()).append("\n"); }
	    	else if (StringUtils.isBlank(modelService.getModelNameFromCache(propertyVo.getRangeModelId()))) {
	    		sb.append(propertyVo.getRangeModelId()).append(" 모델은 존재하지 않거나 사용할 수 없습니다.").append("\n");
	    	}	
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());		
	    	
	    	// 신규 프라퍼티 무조건 N
	    	propertyVo.setPrptyDefChgYn("N");
	    	
			if(StringUtils.isBlank( propertyVo.getRangeMtcdGrpId() )) {
				propertyVo.setRangeMtcdGrpId(null);
			}
			if(StringUtils.isBlank( propertyVo.getRefPrptyId() )) {
				propertyVo.setRefPrptyId(null);
			}			
			
			propertyMapper.insertPropertyDefine(propertyVo);
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[프라퍼티 정의 등록] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[프라퍼티 정의 등록] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		this.clearAllPropertyCache(); // clear 캐시
		
		return propertyVo.getPrptyId();
	}
	
	public void modifyProperty(PropertyVo propertyVo) {
    	StringBuffer sb = new StringBuffer();			
		try {
			// 프라퍼티 명, 데이터 배열 여부 수정 불가
			
	    	// 필수 체크
	    	if (StringUtils.isBlank(propertyVo.getPrptyId())) { sb.append("prptyId").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(propertyVo.getPrptyDataSttusMtcd())) { sb.append("prptyDataSttusMtcd").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(propertyVo.getCntPrptyYn())) { sb.append("cntPrptyYn").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(propertyVo.getPrptyScrnIndcYn())) { sb.append("prptyScrnIndcYn").append(ValueUtil.required()).append("\n"); }
	    	if((Integer)propertyVo.getPrptySortOdrg() != null) {
				if (propertyVo.getPrptySortOdrg() < 0 || propertyVo.getPrptySortOdrg() > 99999) { sb.append("prptySortOdrg").append(ValueUtil.mustBeBetween("0","99999")).append("\n"); }
			}
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
	    	
	    	
			if(StringUtils.isBlank( propertyVo.getUpPrptyId() )) {
				propertyVo.setUpPrptyId(null);
			}
	    	
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			propertyVo.setPrptyAmdrId(loginUserVo.getUserId());
			propertyVo.setPrptyAmdrNm(loginUserVo.getUserNm());
			
			propertyMapper.updateProperty(propertyVo);
			
			this.clearAllPropertyCache(); // clear 캐시
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[프라퍼티 수정] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[프라퍼티 수정] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
	}
	
	public void modifyPropertyDefine(PropertyVo propertyVo) {
    	StringBuffer sb = new StringBuffer();		
		try {
			//프라퍼티id가 meta_data에 있으면 기존것 변경여부Y로 바꾸고 새로운데이터를 insert 
			
	    	// 필수 체크
	    	if (StringUtils.isBlank(propertyVo.getPrptyId())) { sb.append("prptyId").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(propertyVo.getDomnModelId())) { sb.append("domnModelId").append(ValueUtil.required()).append("\n"); }
	    	else if (StringUtils.isBlank(modelService.getModelNameFromCache(propertyVo.getDomnModelId()))) {
	    		sb.append(propertyVo.getDomnModelId()).append(" 모델은 존재하지 않거나 사용할 수 없습니다.").append("\n");
	    	}
	    	if (StringUtils.isBlank(propertyVo.getRangeModelId())) { sb.append("rangeModelId").append(ValueUtil.required()).append("\n"); }
	    	else if (StringUtils.isBlank(modelService.getModelNameFromCache(propertyVo.getRangeModelId()))) {
	    		sb.append(propertyVo.getRangeModelId()).append(" 모델은 존재하지 않거나 사용할 수 없습니다.").append("\n");
	    	}	    	
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());	    	
	    	
			if(StringUtils.isBlank( propertyVo.getPrptyDefChgYn() )) {
				propertyVo.setPrptyDefChgYn("N");
			}
			if(StringUtils.isBlank( propertyVo.getRangeMtcdGrpId() )) {
				propertyVo.setRangeMtcdGrpId(null);
			}
			if(StringUtils.isBlank( propertyVo.getRefPrptyId() )) {
				propertyVo.setRefPrptyId(null);
			}
			if(StringUtils.isBlank( propertyVo.getPrptyDefChgDt() )) {
				propertyVo.setPrptyDefChgDt(null);
			}			
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			
			int checkCnt = 0;
			checkCnt = modelPropertyMapper.selectMetaDataCheckByProperty(propertyVo.getPrptyId());
			
			if(checkCnt == 0) {
				propertyVo.setPrptyDefAmdrId(loginUserVo.getUserId());
				propertyVo.setPrptyDefAmdrNm(loginUserVo.getUserNm());
				propertyMapper.updatePropertyDefine(propertyVo);
			} else {
				PropertyVo updateVo = null;
				updateVo = propertyMapper.selectPropertyDefine(propertyVo);
				updateVo.setPrptyDefChgYn("Y");
				updateVo.setPrptyDefChgrId(loginUserVo.getUserId());
				updateVo.setPrptyDefChgrNm(loginUserVo.getUserNm());
				
				propertyMapper.updatePropertyDefine(updateVo);
				
				propertyVo.setPrptyDefRegrId(loginUserVo.getUserId());
				propertyVo.setPrptyDefRegrNm(loginUserVo.getUserNm());
				propertyVo.setPrptyDefAmdrId(loginUserVo.getUserId());
				propertyVo.setPrptyDefAmdrNm(loginUserVo.getUserNm());				
				propertyMapper.insertPropertyDefine(propertyVo);
			}
			
			this.clearAllPropertyCache(); // clear 캐시
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[프라퍼티 정의 수정] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[프라퍼티 정의 수정] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
	}
	
	public Map<String, Boolean> getPropertyNameCheck(String prptyNm) {
		log.debug("[프라퍼티명 중복체크] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		try {
			int cnt = propertyMapper.selectPropertyNameCheck(prptyNm);
			boolean check = cnt > 0 ? true : false;  
			resMap.put("duplicated", check);			  
		} catch (Exception e) {
			log.error("[프라퍼티명 중복체크] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[프라퍼티명 중복체크] 서비스 종료");
		return resMap;
	}
	
	/**
	 * 모든 프라퍼티 Cache 재조회를 위한 clear
	 * @Author      : heenim
	 * @Date        : 2023. 06. 26.
	 */
	public void clearAllPropertyCache() {
		log.debug("[모든 프라퍼티 Cache 재조회를 위한 clear] 서비스 시작");
		propertyCacheService.removePrptyDataTypeListAll();
		propertyCacheService.removePrptyDataTypeListForMetadataJsonMapAll();
		log.debug("[모든 프라퍼티 Cache 재조회를 위한 clear] 서비스 종료");
	}	

	/**
	 * 캐시에서 프라퍼티 명 으로 프라퍼티 데이터 유형 정보 DTO 가져오기.
	 * @Author      : heenim
	 * @Date        : 2023. 06. 26.
	 * @param prptyNm
	 * @return
	 */
	public PropertyDataTypeDto getPropertyDataTypeDtoFromCache(String prptyNm) {
		List<PropertyDataTypeDto> list = propertyCacheService.getPrptyDataTypeList();
		if (list != null && !list.isEmpty()) {
			for (PropertyDataTypeDto tDto : list) {
				if (StringUtils.equals(prptyNm, tDto.getPrptyNm())) {
					return tDto;
				}
			}
		}
		return null;
	}
	
}
