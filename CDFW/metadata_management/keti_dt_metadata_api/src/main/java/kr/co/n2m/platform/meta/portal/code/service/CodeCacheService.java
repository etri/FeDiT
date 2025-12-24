package kr.co.n2m.platform.meta.portal.code.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import kr.co.n2m.platform.meta.portal.code.domain.CodeGroupDto;
import kr.co.n2m.platform.meta.portal.code.domain.CodeGroupVo;
import kr.co.n2m.platform.meta.portal.code.domain.CodeSearchVo;
import kr.co.n2m.platform.meta.portal.code.domain.CodeVo;
import kr.co.n2m.platform.meta.portal.code.mapper.CodeGroupMapper;
import kr.co.n2m.platform.meta.portal.code.mapper.CodeMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CodeCacheService {
	
	@Autowired
	private CodeGroupMapper codeGroupMapper;
	
	@Autowired
	private CodeMapper codeMapper;
	
	/**
	 * 그룹ID 로 코드 그룹 정보와 코드 목록을 Cache에서 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 28.
	 * @param mtcdGrpId
	 * @return
	 */
	@Cacheable(cacheNames="codeGroupDto", key="#mtcdGrpId", unless="#result == null")
	public CodeGroupDto getCodeGroupDtoByGrpId(String mtcdGrpId) {
		long startMillis = System.currentTimeMillis();	
		log.debug(">>>>>>>>>> Call getCodeGroupDtoByGrpId : " + mtcdGrpId);
		CodeGroupDto codeGroupDto = null;
		
		try {
			// 1. 코드 그룹 정보 조회
			CodeGroupVo paramVo1 = new CodeGroupVo();
			paramVo1.setMtcdGrpId(mtcdGrpId);
			codeGroupDto = codeGroupMapper.selectCodeGroup(paramVo1);			
			
			if (codeGroupDto != null) {
				// 2. 그룹 ID 로 코드 목록 조회 (사용여부는 이 메소드를 사용하는 쪽에서 다시 필터링 할 것!)
				CodeSearchVo paramVo2 = new CodeSearchVo();
				paramVo2.setIsPaging(false);
				paramVo2.setMtcdGrpId(mtcdGrpId);
				List<CodeVo> codeList = codeMapper.selectCodeList(paramVo2);
				codeGroupDto.setCodeList(codeList);
			}
			
		} catch (Exception e) {
			log.error("getCodeGroupDtoByGrpId DB 조회 실패! : " + mtcdGrpId, e);
			throw e;
		}
		
		log.info(">>>>>>>>>> getCodeGroupDtoByGrpId : " + mtcdGrpId);
		log.info(">>>>>>>>>> Time : " + (System.currentTimeMillis() - startMillis)  + "ms");
		return codeGroupDto;
	}

    /**
	 * 그룹ID의 코드 그룹 정보와 코드 목록을 Cache에서 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 06. 28.
     * @param mtcdGrpId
     */
    @CacheEvict(cacheNames="codeGroupDto", key="#mtcdGrpId", beforeInvocation=false)
    public void removeCodeGroupDtoByGrpId(String mtcdGrpId) {    
		log.info("Remove Cache CodeGroupDto ByGrpId. : " + mtcdGrpId);
	}	

    /**
     * Cache에 저장된 코드 그룹 정보와 코드 목록을 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 06. 28.
     */
	@CacheEvict(cacheNames="codeGroupDto", beforeInvocation=false, allEntries=true)
	public void removeCodeGroupDtoAll() {
		log.info("Remove All CodeGroupDto.");
	}
	
}
