package kr.co.n2m.platform.admin.feature.platform.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.admin.feature.platform.entity.Platform;
import kr.co.n2m.platform.admin.feature.platform.query.PlatformQuery;
import kr.co.n2m.platform.admin.feature.platform.query.PlatformRepository;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlatformService {
	
	private final PlatformQuery query;
	private final PlatformRepository platformRepository;
	
	public Map<String, Object> getPlatformListByPaging(Platform searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = query.getPlatformListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Platform> list = this.getPlatformList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	/** 플랫폼 목록 조회. */
	public List<Platform> getPlatformList(Platform searchVo) {
		return query.getPlatformList(searchVo);
	}
	
	/** 플랫폼 목록 상세 조회. */
	public Platform getPlatformDetail(String pltfrmId) {
		return query.getPlatformDetail(pltfrmId);
	}
	
	/** 플랫폼 생성 */
	@Transactional
	public String createPlatform(Platform platformVo) {
		String pltfrmId = platformVo.getPltfrmId();
		String findPltfrmId = query.getPltfrmId(pltfrmId);
		
		if(pltfrmId.equals(findPltfrmId)) {
			return null;
		}

		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			platformVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			platformVo.setRegrNm(userNm);
		}
		
		platformVo.setPltfrmId(pltfrmId);
		platformVo.setRegDt(LocalDateTime.now());
		
		platformRepository.save(platformVo);
		
		return pltfrmId;
	}
	
	/** 플랫폼 수정 */
	public String modifyPlatform(Platform platformVo) {
		String pltfrmId = platformVo.getPltfrmId();
		String findPltfrmId = query.getPltfrmId(pltfrmId);
		
		if(! StringUtil.isEmpty(findPltfrmId)) {
			if(pltfrmId.equals(findPltfrmId)) {
				platformVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					platformVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					platformVo.setAmdrNm(userNm);
				}
				
				platformRepository.save(platformVo);
				
				return pltfrmId;			
			}
		}
		return null;		
	}
	
	/** 플랫폼 삭제 */
	@Transactional
	public void removePlatform(String pltfrmId) {
		query.removePlatform(pltfrmId);
	}
	

}

