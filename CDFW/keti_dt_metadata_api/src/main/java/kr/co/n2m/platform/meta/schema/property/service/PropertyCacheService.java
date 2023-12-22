package kr.co.n2m.platform.meta.schema.property.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import kr.co.n2m.platform.meta.schema.property.domain.PropertyDataTypeDto;
import kr.co.n2m.platform.meta.schema.property.domain.PropertySearchVo;
import kr.co.n2m.platform.meta.schema.property.mapper.PropertyMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PropertyCacheService {
	
	@Autowired
	private PropertyMapper propertyMapper;
	
	/**
	 * 사용 상태인 전체 프라퍼티의 데이터 유형 목록을 Cache에서 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 26.
	 * @return
	 */
	@Cacheable(cacheNames="prptyDataTypeList", unless="#result == null")
	public List<PropertyDataTypeDto> getPrptyDataTypeList() {
		long startMillis = System.currentTimeMillis();	
		log.debug(">>>>>>>>>> Call prptyDataTypeList");
		List<PropertyDataTypeDto> list = null;
		
		try {
			PropertySearchVo searchVo = new PropertySearchVo();
			searchVo.setIsPaging(false); // TODO: LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 함
			list = propertyMapper.selectPropertyDataTypeList(searchVo);	
			
		} catch (Exception e) {
			log.error("prptyDataTypeList DB 조회 실패!", e);
			throw e;
		}
	
		log.info(">>>>>>>>>> prptyDataTypeList");
		log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis)  + "ms");
		return list;
	}
	
    /**
     * Cache에 저장된 프라퍼티의 데이터 유형 목록 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 06. 26.
     */
	@CacheEvict(cacheNames="prptyDataTypeList", beforeInvocation=false, allEntries=true)
	public void removePrptyDataTypeListAll() {
		log.info("Remove All Property DataType List.");
	}	

}
