package kr.co.n2m.platform.meta.schema.model.service;

import java.util.List;

import org.apache.commons.collections4.map.ListOrderedMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelListDto;
import kr.co.n2m.platform.meta.schema.model.domain.ModelSearchVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelVo;
import kr.co.n2m.platform.meta.schema.model.mapper.ModelMapper;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import kr.co.n2m.platform.meta.schema.modelproperty.mapper.ModelPropertyMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ModelCacheService {
	
	@Autowired
	private ModelMapper modelMapper;
	
	@Autowired
	private ModelPropertyMapper modelPropertyMapper;
	
	/**
	 * 사용 상태인 전체 모델 목록을 Cache에서 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
	 * @return
	 */
	@Cacheable(cacheNames="modelList", unless="#result == null")
	public List<ModelListDto> getModelList() {
		long startMillis = System.currentTimeMillis();	
		log.debug(">>>>>>>>>> Call modelList");
		List<ModelListDto> list = null;
		
		try {
			ModelSearchVo searchVo = new ModelSearchVo();
			searchVo.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
			searchVo.setModelDataSttusMtcd("use");
			list = modelMapper.selectModelList(searchVo);	
			
		} catch (Exception e) {
			log.error("modelList DB 조회 실패!", e);
			throw e;
		}
	
		log.info(">>>>>>>>>> modelList");
		log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis)  + "ms");
		return list;
	}
	
    /**
     * Cache에 저장된 모델 목록 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 18.
     */
	@CacheEvict(cacheNames="modelList", beforeInvocation=false, allEntries=true)
	public void removeModelListAll() {
		log.info("Remove All Model List.");
	}
	
	/**
	 * URI 로 유형 모델 정보를 Cache에서 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 15.
	 * @param dataUri
	 * @return
	 */
	@Cacheable(cacheNames="typeModelByUri", key="#dataUri", unless="#result == null")
	public ModelVo getTypeModelByDataUri(String dataUri) {
		long startMillis = System.currentTimeMillis();	
		log.debug(">>>>>>>>>> Call getTypeModelByDataUri : " + dataUri);
		ModelVo typeModelVo = null;
		
		try {
			ModelVo paramVo = new ModelVo();
			paramVo.setModelDataUri(dataUri);
			typeModelVo = modelMapper.selectTypeModelByDataUri(paramVo);
			
		} catch (Exception e) {
			log.error("getTypeModelByDataUri DB 조회 실패! : " + dataUri, e);
			throw e;
		}
	
		log.info(">>>>>>>>>> getTypeModelByDataUri : " + dataUri);
		log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis)  + "ms");
		return typeModelVo;
	}
	
    /**
	 * URI 로 유형 모델 정보를 Cache에서 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 15.
     * @param dataUri
     */
    @CacheEvict(cacheNames="typeModelByUri", key="#dataUri", beforeInvocation=false)
    public void removeTypeModelByDataUri(String dataUri) {    
		log.info("Remove Cache TypeModel ByUri. : " + dataUri);
	}
	
    /**
     * Cache에 저장된 유형 모델 정보 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 15.
     */
	@CacheEvict(cacheNames="typeModelByUri", beforeInvocation=false, allEntries=true)
	public void removeTypeModelAllByDataUri() {
		log.info("Remove All TypeModel ByUri.");
	}
	
	/**
	 * 모델 정보를 Cache에서 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 10.
	 * @param modelNm
	 * @return
	 */
	@Cacheable(cacheNames="modelInfo", key="#modelNm", unless="#result == null")
	public ModelInfoDto getModelInfoByName(String modelNm) {
		long startMillis = System.currentTimeMillis();	
		log.debug(">>>>>>>>>> Call getModelInfoByName : " + modelNm);
		ModelInfoDto infoDto = null;
		
		try {
			// 1. 모델명으로 모델 정보 조회
			ModelVo paramVo = new ModelVo();
			paramVo.setModelNm(modelNm);
			paramVo.setModelDataSttusMtcd("use");
			ModelVo modelVo = modelMapper.selectModelByName(paramVo);
			if (modelVo != null) {
			
				// 2. 모델 프라퍼티 정보 조회		
				paramVo.setModelId(modelVo.getModelId());
				List<ModelPropertyInfoDto> propertyList = modelPropertyMapper.selectModelPropertyInfoListByModelId(paramVo);
				if (propertyList != null && !propertyList.isEmpty()) {
					
					ListOrderedMap<String, ModelPropertyInfoDto> propertyMap = new ListOrderedMap<>();
					for (ModelPropertyInfoDto pDto : propertyList) {
						propertyMap.put(pDto.getPrptyNm(), pDto);
					}
					
					infoDto = new ModelInfoDto(modelVo);
					infoDto.setPropertyMap(propertyMap);
				}
			}
			
		} catch (Exception e) {
			log.error("getModelInfoByName DB 조회 실패! : " + modelNm, e);
			throw e;
		}
		
		log.info(">>>>>>>>>> getModelInfoByName : " + modelNm);
		log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis)  + "ms");
		return infoDto;
	}

    /**
	 * 모델 정보를 Cache에서 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 10.
     * @param modelNm
     */
    @CacheEvict(cacheNames="modelInfo", key="#modelNm", beforeInvocation=false)
    public void removeModelInfoByName(String modelNm) {    
		log.info("Remove Cache ModelInfo ByName. : " + modelNm);
	}
	
    /**
     * Cache에 저장된 모델 정보 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 05. 10.
     */
	@CacheEvict(cacheNames="modelInfo", beforeInvocation=false, allEntries=true)
	public void removeModelInfoAll() {
		log.info("Remove All ModelInfo.");
	}
	
}
