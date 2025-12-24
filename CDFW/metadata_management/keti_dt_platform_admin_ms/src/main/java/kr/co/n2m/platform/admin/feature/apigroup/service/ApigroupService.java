package kr.co.n2m.platform.admin.feature.apigroup.service;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import kr.co.n2m.platform.admin.feature.apigroup.entity.Api;
import kr.co.n2m.platform.admin.feature.apigroup.entity.Apigroup;
import kr.co.n2m.platform.admin.feature.apigroup.query.ApiQuery;
import kr.co.n2m.platform.admin.feature.apigroup.query.ApiRepository;
import kr.co.n2m.platform.admin.feature.apigroup.query.ApigroupQuery;
import kr.co.n2m.platform.admin.feature.apigroup.query.ApigroupRepository;
import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.keygen.UniqueKeyGenerator;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class ApigroupService {
	

	private final ApiQuery apiQuery;
	private final ApigroupQuery apigroupQuery;
	private final ApigroupRepository apigroupRepository;
	private final ApiRepository apiRespoitory;
	
	/** The unique key generator. */
	@Resource(name = "timeBaseUniqueKeyGenerator")
	private UniqueKeyGenerator uniqueKeyGenerator;
	
	public Map<String, Object> getApigroupListByPaging(Apigroup searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = apigroupQuery.getApigroupListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Apigroup> list = this.getApigroupList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	/** API 그룹 목록 조회. */ 
	public List<Apigroup> getApigroupList(Apigroup searchVo) {
		return apigroupQuery.getApigroupList(searchVo);
	}
	
	
	/** API 그룹 목록 상세 조회. */ 
	public Apigroup getApigroupDetail(String grpOid) {
		return apigroupQuery.getApigroupDetail(grpOid);
	}
		
	/** API 그룹 생성. */ 
	@Transactional
	public String createApigroup(Apigroup apigroupVo) {
		String apigroupOid = uniqueKeyGenerator.getUniqueKey(null);

		apigroupVo.setGrpOid(apigroupOid);
		apigroupVo.setRegDt(LocalDateTime.now());

		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			apigroupVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			apigroupVo.setRegrNm(userNm);
		}
		
		apigroupRepository.save(apigroupVo);
		
		return apigroupOid;
	}
	
	/** API 그룹 수정. */ 
	@Transactional
	public String modifyApigroup(Apigroup apigroupVo) {
		String grpOid = apigroupVo.getGrpOid();
		String findgrpOid = apigroupQuery.getGrpOid(grpOid);
		
		if(grpOid.equals(findgrpOid)) {
			apigroupVo.setAmdDt(LocalDateTime.now());
			
			String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
			if(userId != null) {
				apigroupVo.setAmdrId(userId);
			}
			
			String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
			if(userNm != null) {
				apigroupVo.setAmdrNm(userNm);
			}
			
			apigroupRepository.save(apigroupVo);
			
			return grpOid;				
		}
		return null;
	}
			
	/** API 그룹 + API 삭제. */ 
	@Transactional
	public void removeApigroup(String grpOid) {
		try {
			apigroupQuery.removeApigroup(grpOid);
			apiQuery.removeApiList(grpOid);
		}catch(RuntimeException e) {
			e.printStackTrace();
			throw e;
		}
		
	}
	
	
	/******************************************** API*********************************************/ 
	
	
	public Map<String, Object> getApiListByPaging(Api searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = apiQuery.getApiListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Api> list = this.getApiList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	
	/** API 목록 조회. */
	public List<Api> getApiList(Api searchVo) {
		return apiQuery.getApiList(searchVo);
	}
	
	/** API 목록 상세 조회. */
	public Api getApiDetail(Api apiVo) {
		return apiQuery.getApiDetail(apiVo);
	}

	/** API 생성. */
	@Transactional
	public String createApi(String grpOid, Api apiVo) {
		String apiOid = uniqueKeyGenerator.getUniqueKey(null);
		String findApiOid = apiQuery.getApiOid(apiOid);
		
		if(apiOid.equals(findApiOid)) {
			return null;
		}
		
		apiVo.setApiOid(apiOid);
		apiVo.setGrpOid(grpOid);
		apiVo.setRegDt(LocalDateTime.now());
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			apiVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			apiVo.setRegrNm(userNm);
		}
		
		
		apiRespoitory.save(apiVo);

		return apiOid;
	}
	
	/** API 수정. */
	@Transactional
	public String modifyApi(String grpOid, Api apiVo) {
		String findGrpOid = apiQuery.getGrpOid(grpOid, apiVo.getApiOid());
		
		if(grpOid.equals(findGrpOid)) {
			apiVo.setAmdDt(LocalDateTime.now());
			
			String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
			if(userId != null) {
				apiVo.setAmdrId(userId);
			}
			
			String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
			if(userNm != null) {
				apiVo.setAmdrNm(userNm);
			}
			
			apiRespoitory.save(apiVo);
			
			return apiVo.getApiOid();
		}
		
		
		return null;
	}
	

	/** API 삭제. */
	@Transactional
	public void removeApigroupOid(String grpOid) {
		apigroupQuery.removeApigroupOid(grpOid);
	}

	@Transactional
	public void removeApi(String apiOid) {
		apiQuery.removeApi(apiOid);
	}
}
