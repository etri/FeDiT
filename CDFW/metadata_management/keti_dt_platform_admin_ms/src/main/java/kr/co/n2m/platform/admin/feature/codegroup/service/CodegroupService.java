package kr.co.n2m.platform.admin.feature.codegroup.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.admin.feature.codegroup.entity.Code;
import kr.co.n2m.platform.admin.feature.codegroup.entity.Codegroup;
import kr.co.n2m.platform.admin.feature.codegroup.query.CodeQuery;
import kr.co.n2m.platform.admin.feature.codegroup.query.CodeRepository;
import kr.co.n2m.platform.admin.feature.codegroup.query.CodegroupQuery;
import kr.co.n2m.platform.admin.feature.codegroup.query.CodegroupRepository;
import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;


@RequiredArgsConstructor
@Service
public class CodegroupService {

	private final CodeQuery codeQuery;
	private final CodegroupQuery codegroupQuery;
	private final CodeRepository codeRepository;
	private final CodegroupRepository codegroupRepository;

	/** 코드 그룹 페이징 목록 조회 */
	public Map<String, Object> getCodegroupListByPaging(Codegroup searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = codegroupQuery.getCodegroupListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Codegroup> list = codegroupQuery.getCodegroupList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}

	/** 코드 그룹 목록 조회 */
	public List<Codegroup> getCodegroupList(Codegroup searchVo) {
		return codegroupQuery.getCodegroupList(searchVo);
	}

	/** 코드 그룹 상세 조회 */
	public Codegroup getCodegroupDetail(String grpId) {
		return codegroupQuery.getCodegroupDetail(grpId);
	}

	/** 코드 그룹 생성 */
	@Transactional
	public String createCodegroup(Codegroup codegroupVo) {
		String grpId= codegroupVo.getGrpId();
		String maxValue= codegroupQuery.getGrpId(codegroupVo);
		
		if(! StringUtil.isEmpty(grpId)) {
			String findGrpId= codegroupQuery.findGrpId(grpId);
			if(grpId.equals(findGrpId)) {
				return null;
			}
		}
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			codegroupVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			codegroupVo.setRegrNm(userNm);
		}
		codegroupVo.setGrpId(String.format("CGR%05d", Integer.parseInt(maxValue) + 1));
		codegroupVo.setRegDt(LocalDateTime.now());
		codegroupRepository.save(codegroupVo);
		
		return codegroupVo.getGrpId();
	}

	/** 코드 그룹 수정 */
	@Transactional
	public String modifyCodegroup(Codegroup codegroupVo) {
		String grpId= codegroupVo.getGrpId();
		String findGrpId= codegroupQuery.findGrpId(grpId);

		if(! StringUtil.isEmpty(findGrpId)) {
			if(grpId.equals(findGrpId)) {
				codegroupVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					codegroupVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					codegroupVo.setAmdrNm(userNm);
				}
				
				codegroupRepository.save(codegroupVo);
				
				return grpId;
			}
		}
		return null;
	}

	/** 코드 그룹 삭제 */
	@Transactional
	public void removeCodegroup(String grpId) {
		codegroupQuery.removeCodegroup(grpId);
	}

	/** 코드 그룹 + 코드 삭제 */
	@Transactional
	public void removeCodegroupAllData(String grpId) throws RuntimeException{
		try {
			codegroupQuery.removeCodegroup(grpId);
			codeQuery.removeCodeByCodegroupOid(grpId);
		} catch (RuntimeException e) {
			e.printStackTrace();
			throw e;
		}
		
	}
	
	
	//==================================code===========================================
	
	
	/** 코드 목록 조회 */
	public List<Code> getCodeList(Code searchVo) {
		return codeQuery.getCodeList(searchVo);
	}
	
	/** 워크플로우 코드 목록 조회 */
	public List<Map<String, Object>> getWflowCodeList(List<String> grpIds, Code searchVo) {
		List<Map<String, Object>> listMap = new ArrayList<Map<String, Object>>();

		Map<String, Object> resultMap = null;
		List<Code> list = null;

		for(String grpId : grpIds) {
			searchVo.setGrpId(grpId);
			list = codeQuery.getWflowCodeList(searchVo);

			resultMap = new HashMap<>();
			resultMap.put("key", grpId);
			resultMap.put("data", list);
			listMap.add(resultMap);
		}
		return listMap;
	}

	/** 코드 상세 조회 */
	public Code getCodeDetail(String codeId) {
		return codeQuery.getCodeDetail(codeId);
	}

	/** 코드 생성 */
	@Transactional
	public String createCode(String grpId, Code codeVo) {
		String cdId= codeVo.getCdId(); 
		String maxVal= codeQuery.getCdId(codeVo);

		if(! StringUtil.isEmpty(cdId)) {
			String findCdId= codeQuery.findCdId(cdId);
			if(cdId.equals(findCdId)) {
				return null;
			}
		}
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			codeVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			codeVo.setRegrNm(userNm);
		}
		
		codeVo.setGrpId(grpId);
		codeVo.setCdId(String.format("COD_%05d", Integer.parseInt(maxVal) + 1));
		codeVo.setRegDt(LocalDateTime.now());

		if (codeVo.getOdrg() == null || codeVo.getOdrg() == 0) {
			int maxValue = codeQuery.getOdrg(grpId, codeVo);
			codeVo.setOdrg(maxValue + 1);
		}
		
		codeRepository.save(codeVo);
		return codeVo.getGrpId();
	}

	/** 코드 수정 */
	@Transactional
	public String modifyCode(String grpId, Code codeVo) {
		String cdId= codeVo.getCdId();
		String getgrpId= codeQuery.getCodeGroupId(cdId);
		
		if(! StringUtil.isEmpty(getgrpId)) {
			if(getgrpId.equals(grpId)) {
				codeVo.setGrpId(grpId);
				codeVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					codeVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					codeVo.setAmdrNm(userNm);
				}
				
				codeRepository.save(codeVo);
				
				return cdId;
			}
		}
		return null;
	}

	/** 코드 삭제 */
	@Transactional
	public void removeCode(String grpId, String codeId) {
		codeQuery.removeCode(grpId, codeId);
	}

	/** 코드 전체 삭제 */
	@Transactional
	public void removeCodeByCodegroupOid(String codegroupId) {
		codeQuery.removeCodeByCodegroupOid(codegroupId);
	}

	
}
