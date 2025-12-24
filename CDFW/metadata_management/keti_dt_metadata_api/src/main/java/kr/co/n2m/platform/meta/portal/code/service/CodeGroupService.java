package kr.co.n2m.platform.meta.portal.code.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
import kr.co.n2m.platform.meta.architecture.exception.ResForbiddenException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.portal.code.domain.CodeGroupDto;
import kr.co.n2m.platform.meta.portal.code.domain.CodeGroupVo;
import kr.co.n2m.platform.meta.portal.code.domain.CodeSearchVo;
import kr.co.n2m.platform.meta.portal.code.domain.CodeVo;
import kr.co.n2m.platform.meta.portal.code.mapper.CodeGroupMapper;
import kr.co.n2m.platform.meta.portal.code.mapper.CodeMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class CodeGroupService {
	
	@Autowired
	private CodeGroupMapper codeGroupMapper;
	@Autowired
	private CodeMapper codeMapper;
	
	@Autowired
	private CodeCacheService codeCacheService;
	
	private final String CREATE_MODE = "Create";
	private final String UPDATE_MODE = "Update";
	
	/**
	 * 메타데이터 코드그룹 목록 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 18.
	 * @param codeSearchVo
	 * @return
	 */
	public SearchResultListVo getCodeGroupList(CodeSearchVo searchVo) {
		log.debug("[메타데이터 코드 그룹 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			
			int totalListSize = codeGroupMapper.selectCodeGroupCount(searchVo);
			searchVo.setTotalListSize(totalListSize);
			
			List<CodeGroupVo> list = codeGroupMapper.selectCodeGroupList(searchVo);			
			listVo.setList(list);
			listVo.setPage(new PageVo(searchVo));
			
		} catch (Exception e) {
			log.error("[메타데이터 코드 그룹 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 코드 그룹 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 메타데이터 코드그룹 상세 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 18.
	 * @param codeSearchVo
	 * @return
	 */
	public CodeGroupVo getCodeGroup(String codeGroupId) {
		log.debug("[메타데이터 코드 그룹 상세 조회] 서비스 시작");
		CodeGroupVo vo = null;
		
		try {
			
			CodeGroupVo paramVo = new CodeGroupVo();
			paramVo.setMtcdGrpId(codeGroupId);
			vo = codeGroupMapper.selectCodeGroup(paramVo);

		} catch (Exception e) {
			log.error("[메타데이터 코드 그룹 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 코드 그룹 상세 조회] 서비스 종료");
		return vo;
	}
	
	/**
	 * 메타데이터 코드그룹 등록
	 * @Author      : solee
	 * @Date        : 2023. 04. 19.
	 * @param codeSearchVo
	 * @return
	 */
	public String createCodeGroup(CodeGroupVo codeGroupVo) {
		log.debug("[메타데이터 코드그룹 등록] 서비스 시작");
		
		try {

			codeGroupFormValidation(codeGroupVo, CREATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			codeGroupVo.setMtcdGrpRegrId(loginUserVo.getUserId());
			codeGroupVo.setMtcdGrpRegrNm(loginUserVo.getUserNm());
			codeGroupVo.setMtcdGrpAmdrId(loginUserVo.getUserId());
			codeGroupVo.setMtcdGrpAmdrNm(loginUserVo.getUserNm());			
			
			if (codeGroupVo.getMtcdGrpId() == null || "".equals(codeGroupVo.getMtcdGrpId())) {
				
				//코드그룹 data 존재여부 확인 후, default value set
				boolean isCodeGroupExists = codeGroupMapper.selectCodeGroupExistence();
				if (!isCodeGroupExists) {
					codeGroupVo.setMtcdGrpId("MCG00001"); //초기 default value set
				}				
				codeGroupMapper.insertCodeGroupAutoKey(codeGroupVo);
			} else {
				codeGroupMapper.insertCodeGroup(codeGroupVo);	
			}

		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 코드그룹 등록] 코드그룹 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[메타데이터 코드그룹 등록] 코드그룹 등록 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 코드그룹 등록] 서비스 종료");
		return codeGroupVo.getMtcdGrpId();
	}
	
	/**
	 * 메타데이터 코드그룹 수정
	 * @Author      : solee
	 * @Date        : 2023. 04. 19.
	 * @param codeSearchVo
	 * @return
	 */
	public void modifyCodeGroup(CodeGroupVo codeGroupVo) throws ResForbiddenException {
		log.debug("[메타데이터 코드그룹 수정] 서비스 시작");
		
		try {
			//기존 value = Y 일 시, system admin check
			CodeGroupVo beforeUpdatedCodeGroup = codeGroupMapper.selectCodeGroup(codeGroupVo);
			if ("Y".equals(beforeUpdatedCodeGroup.getMtcdGrpSysUsgYn()) && !AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("메타데이터 코드그룹을 수정할 수 있는 권한이 없습니다.");
			}
			
			codeGroupFormValidation(codeGroupVo, UPDATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			codeGroupVo.setMtcdGrpAmdrId(loginUserVo.getUserId());
			codeGroupVo.setMtcdGrpAmdrNm(loginUserVo.getUserNm());			
		
			codeGroupMapper.updateCodeGroup(codeGroupVo);	
			
			codeCacheService.removeCodeGroupDtoByGrpId(codeGroupVo.getMtcdGrpId()); // 코드 그룹 Dto 캐시 클리어
			
		} catch (ResBadRequestException | ResBizInfoException | ResForbiddenException e) {
			log.info("[메타데이터 코드그룹 수정] 코드그룹 수정 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[메타데이터 코드그룹 수정] 코드그룹 수정 실패/오류", e);
			throw new ResBaseRuntimeException();
		}
		log.debug("[메타데이터 코드그룹 수정] 서비스 종료");
	}
	
	/**
	 * 메타데이터 코드목록 조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 19.
	 * @param codeSearchVo
	 * @return
	 */
	public SearchResultListVo getCodeList(CodeSearchVo codeSearchVo) {
		log.debug("[메타데이터 코드목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			
			int totalListSize = codeMapper.selectCodeCount(codeSearchVo);
			codeSearchVo.setTotalListSize(totalListSize);
			
			List<CodeVo> list = codeMapper.selectCodeList(codeSearchVo);			
			listVo.setList(list);
			listVo.setPage(new PageVo(codeSearchVo));
			
		} catch (Exception e) {
			log.error("[메타데이터 코드 그룹 상세 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);			
		}
		
		log.debug("[메타데이터 코드 그룹 상세 조회] 서비스 종료");
		return listVo;		
	}
	
	/**
	 * 메타데이터 코드 상세조회
	 * @Author      : solee
	 * @Date        : 2023. 04. 19.
	 * @param codeSearchVo
	 * @return
	 */
	public CodeVo getCode(CodeVo codeVo) {
		log.debug("[메타데이터 코드 상세조회] 서비스 시작");
		CodeVo vo = null;
		
		try {
			
			vo = codeMapper.selectCode(codeVo);			
		} catch (Exception e) {
			log.error("[메타데이터 코드 상세조회] 코드상세조회 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}

		log.debug("[메타데이터 코드 상세조회] 서비스 종료");
		return vo;
	}
	
	/**
	 * 메타데이터 코드 등록
	 * @Author      : solee
	 * @Date        : 2023. 04. 19.
	 * @param codeVo
	 * @return
	 */
	public String createCode(CodeVo codeVo) {
		log.debug("[메타데이터 코드 등록] 서비스 시작");
		
		try {
			
			codeFormValidation(codeVo, CREATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			codeVo.setMtcdRegrId(loginUserVo.getUserId());
			codeVo.setMtcdRegrNm(loginUserVo.getUserNm());
			codeVo.setMtcdAmdrId(loginUserVo.getUserId());
			codeVo.setMtcdAmdrNm(loginUserVo.getUserNm());			
			
			codeMapper.insertCode(codeVo);
			
			codeCacheService.removeCodeGroupDtoByGrpId(codeVo.getMtcdGrpId()); // 코드 그룹 Dto 캐시 클리어
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 코드 등록] 코드 등록 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[메타데이터 코드 등록] 코드 등록 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 코드 등록] 서비스 종료");
		return codeVo.getMtcd();
	}

	/**
	 * 메타데이터 코드 수정
	 * @Author      : solee
	 * @Date        : 2023. 04. 19.
	 * @param codeVo
	 * @return
	 */
	public void modifyCode(CodeVo codeVo) {
		log.debug("[메타데이터 코드 수정] 서비스 시작");
		
		try {
			//코드가 속한 코드그룹 data의 기존 value = Y 일 시, system admin check
			CodeGroupVo paramVo = new CodeGroupVo();
			paramVo.setMtcdGrpId(codeVo.getMtcdGrpId());
			CodeGroupVo beforeUpdatedCodeGroup = codeGroupMapper.selectCodeGroup(paramVo);
			if ("Y".equals(beforeUpdatedCodeGroup.getMtcdGrpSysUsgYn()) && !AuthUtil.isSystemAdmin()) {
				throw new ResForbiddenException("메타데이터 코드를 수정할 수 있는 권한이 없습니다.");
			}			
			
			codeFormValidation(codeVo, UPDATE_MODE);
			
			LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
			codeVo.setMtcdAmdrId(loginUserVo.getUserId());
			codeVo.setMtcdAmdrNm(loginUserVo.getUserNm());			
			
			codeMapper.updateCode(codeVo);
			
			codeCacheService.removeCodeGroupDtoByGrpId(codeVo.getMtcdGrpId()); // 코드 그룹 Dto 캐시 클리어
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[메타데이터 코드 수정] 코드 수정 실패/오류 (정보성) : {}", e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[메타데이터 코드 수정] 코드 수정 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 코드 수정] 서비스 종료");
	}
	
	/**
	 * 메타데이터 코드그룹 ID 중복체크
	 * @Author      : solee
	 * @Date        : 2023. 04. 20.
	 * @param codeGroupVo
	 * @return
	 */
	public Map<String, Boolean> checkCodeGroupId(CodeGroupVo codeGroupVo) {
		log.debug("[메타데이터 코드그룹ID 중복조회] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		
		try {
			
			log.debug("[메타데이터 코드그룹ID 중복조회] 코드그룹 중복조회");
			boolean isDuplicateCodeGroupId = codeGroupMapper.selectCodeGroupById(codeGroupVo);
			resMap.put("duplicated", isDuplicateCodeGroupId);
			log.debug("[메타데이터 코드그룹ID 중복조회] 코드그룹 중복조회 성공");			
		} catch (Exception e) {
			log.error("[메타데이터 코드그룹ID 중복조회] 코드그룹 중복조회 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 코드그룹ID 중복조회] 서비스 종료");
		return resMap;
	}
	
	/**
	 * 메타데이터 코드ID 중복체크
	 * @Author      : solee
	 * @Date        : 2023. 04. 20.
	 * @param codeVo
	 * @return
	 */
	public Map<String, Boolean> checkCodeId(CodeVo codeVo) {
		log.debug("[메타데이터 코드ID 중복조회] 서비스 시작");
		Map<String, Boolean> resMap = new HashMap<>();
		
		try {
			
			boolean isDuplicateCodeId = codeMapper.selectCodeById(codeVo);
			resMap.put("duplicated", isDuplicateCodeId);
		} catch (Exception e) {
			log.error("[메타데이터 코드ID 중복조회] 코드ID 중복조회 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[메타데이터 코드ID 중복조회] 서비스 종료");
		return resMap;
	}
	
	/**
	 * 코드그룹 VO validation
	 * */
	private void codeGroupFormValidation(CodeGroupVo codeGroupVo, String modeType) {
		
		StringBuffer sb = new StringBuffer();
		
		//필수 check
		if (StringUtils.isBlank(codeGroupVo.getMtcdGrpNm())) { sb.append("mtcdGrpNm").append(ValueUtil.required()).append("\n"); }
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(codeGroupVo.getMtcdGrpId())) {
			sb.append("mtcdGrpId").append(ValueUtil.required()).append("\n");		
		}
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(codeGroupVo.getMtcdGrpUseYn())) {
			sb.append("mtcdGrpUseYn").append(ValueUtil.required()).append("\n");
		}
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(codeGroupVo.getMtcdGrpSysUsgYn())) {
			sb.append("mtcdGrpSysUsgYn").append(ValueUtil.required()).append("\n");
		}
		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
		
		//PK 중복 check
		if (CREATE_MODE.equals(modeType)) {
			boolean isDuplicatedId = codeGroupMapper.selectCodeGroupById(codeGroupVo);
			if (isDuplicatedId) {
				throw new ResBizInfoException("이미 등록된 코드그룹입니다.");
			}		
		}
					
		//default value set
		if ("n".equals(codeGroupVo.getMtcdGrpUseYn())) {
			codeGroupVo.setMtcdGrpUseYn("N");
		} else if (!"N".equals(codeGroupVo.getMtcdGrpUseYn())) {
			codeGroupVo.setMtcdGrpUseYn("Y");
		}
		
		if (StringUtils.isBlank(codeGroupVo.getMtcdGrpSysUsgYn())) {
			codeGroupVo.setMtcdGrpSysUsgYn("N");
		} else if ("n".equals(codeGroupVo.getMtcdGrpSysUsgYn())) {
			codeGroupVo.setMtcdGrpSysUsgYn("N");
		} else if (!"Y".equals(codeGroupVo.getMtcdGrpSysUsgYn())) {
			codeGroupVo.setMtcdGrpSysUsgYn("N");
		}
		//상위 메타그룹코드: 빈값은 null로 update되어야 함 (23.05.12)
		if (StringUtils.isBlank(codeGroupVo.getUpMtcdGrpId())) {
			codeGroupVo.setUpMtcdGrpId(null);
		}	
	}
	
	/**
	 * 코드 VO validation
	 * */
	private void codeFormValidation(CodeVo codeVo, String modeType) {
		
		StringBuffer sb = new StringBuffer();
		
		//필수 check
		if (StringUtils.isBlank(codeVo.getMtcd())) { sb.append("mtcd").append(ValueUtil.required()).append("\n"); }
		if (StringUtils.isBlank(codeVo.getMtcdNm())) { sb.append("mtcdNm").append(ValueUtil.required()).append("\n"); }
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(codeVo.getMtcdGrpId())) {
			sb.append("mtcdGrpId").append(ValueUtil.required()).append("\n");		
		}
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(codeVo.getMtcd())) {
			sb.append("mtcd").append(ValueUtil.required()).append("\n");		
		}
		if (UPDATE_MODE.equals(modeType) && StringUtils.isBlank(codeVo.getMtcdUseYn())) {
			sb.append("mtcdUseYn").append(ValueUtil.required()).append("\n");
		}
		if((Integer)codeVo.getMtcdSortOdrg() != null) {
			if (codeVo.getMtcdSortOdrg() < 0 || codeVo.getMtcdSortOdrg() > 99999) { sb.append("mtcdSortOdrg").append(ValueUtil.mustBeBetween("0","99999")).append("\n"); }
		}
		
		if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
		
		//PK 중복 check
		if (CREATE_MODE.equals(modeType)) {
			boolean isDuplicateId = codeMapper.selectCodeById(codeVo);
			if (isDuplicateId) {
				throw new ResBizInfoException("이미 등록된 메타코드입니다.");
			}				
		}
		
		//코드그룹 ID check
		CodeGroupVo codeGroupVo = new CodeGroupVo();
		codeGroupVo.setMtcdGrpId(codeVo.getMtcdGrpId());
		boolean isValidCodeGroupId = codeGroupMapper.selectCodeGroupById(codeGroupVo);
		if (!isValidCodeGroupId) {
			throw new ResBizInfoException("존재하지 않는 코드그룹입니다.");
		}
		
		//default value set
		if ("n".equals(codeVo.getMtcdUseYn())) {
			codeVo.setMtcdUseYn("N");
		} else if (!"N".equals(codeVo.getMtcdUseYn())) {
			codeVo.setMtcdUseYn("Y");
		}
		if((Integer)codeVo.getMtcdSortOdrg() == null) {
			codeVo.setMtcdSortOdrg(0);
		}
		
		//상위 메타코드ID: 빈값은 null로 update되어야 함 (23.05.12)
		if (StringUtils.isBlank(codeVo.getUpMtcd())) {
			codeVo.setUpMtcd(null);
		}		
	}
	
	/**
	 * Cache 에서 코드명 조회
	 * @Author      : heenim
	 * @Date        : 2023. 05. 12.
	 * @param mtcdGrpId
	 * @param mtcd
	 * @return nullable
	 */
	public String getCodeNameFromCache(String mtcdGrpId, String mtcd) {
		if (StringUtils.isBlank(mtcdGrpId) || StringUtils.isBlank(mtcd)) return null;
		CodeGroupDto codeGroupDto = codeCacheService.getCodeGroupDtoByGrpId(mtcdGrpId);
		List<CodeVo> codeList = codeGroupDto == null ? null : codeGroupDto.getCodeList();
		if (codeList != null && codeList.size() > 0) {
			CodeVo codeVo = codeList.stream()
					.filter(x -> StringUtils.equals(mtcd, x.getMtcd()))
					.findFirst()
					.orElse(null);	
			
			if (codeVo != null) {
				return codeVo.getMtcdNm();
			}		
		}
		return null;
	}
	
	/**
	 * Cache 에서 그룹 ID 로 유효한 (사용중인) 코드 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 06. 28.
	 * @param mtcdGrpId
	 * @return nullable
	 */
	public List<CodeVo> getValidCodeListFromCache(String mtcdGrpId) {
		List<CodeVo> codeList = null;		
		CodeGroupDto codeGroupDto = codeCacheService.getCodeGroupDtoByGrpId(mtcdGrpId);
		if (codeGroupDto != null && StringUtils.equals("Y", codeGroupDto.getMtcdGrpUseYn())) {
			if (codeGroupDto.getCodeList() != null && codeGroupDto.getCodeList().size() > 0) {
				codeList = codeGroupDto.getCodeList().stream()
						.filter(x -> StringUtils.equals("Y", x.getMtcdUseYn()))
						.collect(Collectors.toList());
			}
		}
		return codeList;
	}
	
}
