package kr.co.n2m.platform.meta.rdf.namespace.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.mapping.service.RdfMappingCacheService;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceSearchVo;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import kr.co.n2m.platform.meta.rdf.namespace.mapper.RdfNamespaceMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class RdfNamespaceService {
	
    @Autowired
    private RdfMappingCacheService cacheService;
	
	@Autowired
	private RdfNamespaceMapper rdfNamespaceMapper;
	
	private final String CREATE_MODE = "Create";
	private final String UPDATE_MODE = "Update";
	
	/**
	 * RDF 네임스페이스 목록 조회
	 * @Author      : solee
	 * @Date        : 2023. 05. 15.
	 * @param rdfNamespaceSearchVo
	 * @return
	 */	
	public SearchResultListVo getNamespaceList(RdfNamespaceSearchVo searchVo) {
		log.debug("[RDF 네임스페이스 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			
			int totalListSize = rdfNamespaceMapper.selectRdfNamespaceCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<RdfNamespaceVo> list = rdfNamespaceMapper.selectRdfNamespaceList(searchVo);
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (Exception e) {
			log.error("[RDF 네임스페이스 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);				
		}
		
		log.debug("[RDF 네임스페이스 목록 조회] 서비스 종료");
		return listVo;		
	}
	
	/**
	 * RDF 네임스페이스 상세 조회
	 * @Author      : solee
	 * @Date        : 2023. 05. 15.
	 * @param rdfNamespaceSearchVo
	 * @return
	 */		
	public RdfNamespaceVo getRdfNamespace(RdfNamespaceVo rdfNamespaceVo) {
		log.debug("[RDF 네임스페이스 상세 조회] 서비스 시작");		
		RdfNamespaceVo vo = null;
		
		try {
			vo = rdfNamespaceMapper.selectRdfNamespace(rdfNamespaceVo);			
		} catch (Exception e) {
			log.error("[RDF 네임스페이스 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		
		log.debug("[RDF 네임스페이스 상세 조회] 서비스 종료");	
		return vo;
	}
	
	/**
	 * RDF 네임스페이스 등록
	 * @Author      : solee
	 * @Date        : 2023. 05. 15.
	 * @param rdfNamespaceVo
	 * @return
	 */		
	public String createNamespace(RdfNamespaceVo rdfNamespaceVo) {
		log.debug("[RDF 네임스페이스 등록] 서비스 시작");
		try {
			
			namespaceFormValidation(rdfNamespaceVo, CREATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();			
			rdfNamespaceVo.setRdfNmspRegrId(loginUserVo.getUserId());
			rdfNamespaceVo.setRdfNmspRegrNm(loginUserVo.getUserNm());
			rdfNamespaceVo.setRdfNmspAmdrId(loginUserVo.getUserId());
			rdfNamespaceVo.setRdfNmspAmdrNm(loginUserVo.getUserNm());
			rdfNamespaceMapper.insertRdfNamespace(rdfNamespaceVo);
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[RDF 네임스페이스 등록] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[RDF 네임스페이스 등록] 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}

		log.debug("[RDF 네임스페이스 등록] 서비스 종료");
		return rdfNamespaceVo.getRdfNmspId();
	}
	
	/**
	 * RDF 네임스페이스 수정
	 * @Author      : solee
	 * @Date        : 2023. 05. 15.
	 * @param rdfNamespaceVo
	 * @return
	 */		
	public void modifyNamespace(RdfNamespaceVo rdfNamespaceVo) {
		log.debug("[RDF 네임스페이스 수정] 서비스 시작");
		try {
			
			namespaceFormValidation(rdfNamespaceVo, UPDATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			rdfNamespaceVo.setRdfNmspAmdrId(loginUserVo.getUserId());
			rdfNamespaceVo.setRdfNmspAmdrNm(loginUserVo.getUserNm());
			rdfNamespaceMapper.updateRdfNamespace(rdfNamespaceVo);
			
			// clear cache
			this.clearAllRdfMappingCache();
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[RDF 네임스페이스 수정] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;					
		} catch (Exception e) {
			log.error("[RDF 네임스페이스 수정] 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		
		log.debug("[RDF 네임스페이스 수정] 서비스 종료");		
	}
	
	/**
	 * RDF 네임스페이스 삭제
	 * @Author      : solee
	 * @Date        : 2023. 05. 15.
	 * @param nmspUri
	 * @return
	 */	
	public void deleteNamespace(String rdfNmspId) {
		log.debug("[RDF 네임스페이스 삭제] 서비스 시작");
		try {
			
			StringBuffer sb = new StringBuffer();
			
			//필수 check
			if (StringUtils.isBlank(rdfNmspId)) { sb.append("rdfNmspId").append(ValueUtil.required()).append("\n"); }
			
			if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
		
			//data check
			RdfNamespaceVo paramVo = new RdfNamespaceVo();
			paramVo.setRdfNmspId(rdfNmspId);
			
			RdfNamespaceVo delVo = rdfNamespaceMapper.selectRdfNamespace(paramVo);
			if (delVo == null) throw new ResBizInfoException("RDF 네임스페이스 데이터가 존재하지 않습니다.");
			
			//delete or exception
			boolean isNamespaceExistInRdfClass = rdfNamespaceMapper.isNamespaceExistInRdfClass(delVo);
			boolean isNamespaceExistInRdfProperty = rdfNamespaceMapper.isNamespaceExistInRdfProperty(delVo);
			
			if (isNamespaceExistInRdfClass || isNamespaceExistInRdfProperty) {
				throw new ResBizInfoException("RDF Class 혹은 RDF Property에 네임스페이스가 존재하므로, RDF 네임스페이스 데이터를 삭제할 수 없습니다.");
			}
			
			rdfNamespaceMapper.deleteRdfNamespace(delVo);
			
			// clear cache
            this.clearAllRdfMappingCache();
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[RDF 네임스페이스 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;							
		} catch (Exception e) {
			log.error("[RDF 네임스페이스 삭제] 실패/오류", e);			
		}
	}
	
	
	/**
	 * RDF 네임스페이스 URI 중복체크
	 * @Author      : solee
	 * @Date        : 2023. 06. 20.
	 * @param nmspUri
	 * @return
	 */	
	public Map<String, Boolean> checkNamespaceUri(RdfNamespaceVo rdfNamespaceVo) {
		log.debug("[RDF 네임스페이스 URI 중복조회] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		
		try {
			boolean isDuplicatedNamespaceUri = rdfNamespaceMapper.isDuplicatedNamespaceUri(rdfNamespaceVo);
			resMap.put("duplicated", isDuplicatedNamespaceUri);
			log.debug("[RDF 네임스페이스 URI 중복조회] 성공");
		} catch (Exception e) {
			log.error("[RDF 네임스페이스 URI 중복조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 네임스페이스 URI 중복조회] 서비스 종료");
		return resMap;
	}
	
	/**
	 * RDF 네임스페이스 Prefix 중복체크
	 * @Author      : solee
	 * @Date        : 2023. 06. 20.
	 * @param nmspUri
	 * @return
	 */	
	public Map<String, Boolean> checkNamespacePrefix(RdfNamespaceVo rdfNamespaceVo) {
		log.debug("[RDF 네임스페이스 Prefix 중복조회] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		
		try {
			boolean isDuplicatedNamespacePfix = rdfNamespaceMapper.isDuplicatedNamespacePfix(rdfNamespaceVo);
			resMap.put("duplicated", isDuplicatedNamespacePfix);
			log.debug("[RDF 네임스페이스 Prefix 중복조회] 성공");
		} catch (Exception e) {
			log.error("[RDF 네임스페이스 Prefix 중복조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		log.debug("[RDF 네임스페이스 Prefix 중복조회] 서비스 종료");
		return resMap;
	}	
	
	/**
	 * RDF 네임스페이스 VO validation
	 * */
	private void namespaceFormValidation(RdfNamespaceVo rdfNamespaceVo, String modeType) {
		
		StringBuffer sb = new StringBuffer();
		
		//필수 check
		if (StringUtils.isBlank(rdfNamespaceVo.getRdfNmspUri())) { sb.append("rdfNmspUri").append(ValueUtil.required()).append("\n"); }
		if (StringUtils.isBlank(rdfNamespaceVo.getRdfNmspPfix())) { sb.append("rdfNmspPfix").append(ValueUtil.required()).append("\n"); }		
		
		if (UPDATE_MODE.equals(modeType)) {
			if (StringUtils.isBlank(rdfNamespaceVo.getRdfNmspId())) { sb.append("rdfNmspId").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(rdfNamespaceVo.getChangedRdfNmspUri())) { sb.append("changedNmspUri").append(ValueUtil.required()).append("\n"); }
			if (StringUtils.isBlank(rdfNamespaceVo.getChangedRdfNmspPfix())) { sb.append("changedNmspPfix").append(ValueUtil.required()).append("\n"); }
			
			rdfNamespaceVo.setRdfNmspUri ( rdfNamespaceVo.getChangedRdfNmspUri() );
			rdfNamespaceVo.setRdfNmspPfix( rdfNamespaceVo.getChangedRdfNmspPfix() );
		}
		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
				
		// 중복 check
		boolean isDuplicatedNamespacePfix = rdfNamespaceMapper.isDuplicatedNamespacePfix(rdfNamespaceVo);
		if (isDuplicatedNamespacePfix) {
			throw new ResBizInfoException("이미 등록된 Prefix 입니다.");
		}
		boolean isDuplicatedNamespaceUri = rdfNamespaceMapper.isDuplicatedNamespaceUri(rdfNamespaceVo);
		if (isDuplicatedNamespaceUri) {
			throw new ResBizInfoException("이미 등록된 URI 입니다.");
		}
	}
	
	private void clearAllRdfMappingCache() {
		cacheService.removeAllRdfNamespaceList();
		cacheService.removeAllRdfMapping();
		cacheService.removeAllRdfMappingBySearching();
		cacheService.removeAllRdfMappingModelList();
		cacheService.removeAllRdfMappingRuleList();
	}
}
