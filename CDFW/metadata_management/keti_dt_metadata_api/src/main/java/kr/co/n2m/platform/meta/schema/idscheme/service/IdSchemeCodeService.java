package kr.co.n2m.platform.meta.schema.idscheme.service;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeCodeDto;
import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeCodeVo;
import kr.co.n2m.platform.meta.schema.idscheme.domain.IdSchemeSearchVo;
import kr.co.n2m.platform.meta.schema.idscheme.mapper.IdSchemeCodeMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class IdSchemeCodeService {
	
	@Autowired 
	IdSchemeCodeMapper idSchemeCodeMapper;
	
	private boolean editModeYn = false;
    private boolean modifyModeYn = false;

    /**
     * 식별체계 등록, 수정 시 유효성 검사
     *
     * @param idSchemeCodeVo
     * @return
     * @Author : tklee
     * @Date : 2024. 03. 05.
     */
    private void idSchemeCodeValidate(IdSchemeCodeVo idSchemeCodeVo) {
        /***************************************** 유효성 검사 - 등록 or 수정 *****************************************/
        // 1. 필수값
        StringBuffer sb = new StringBuffer();
        if (StringUtils.isBlank(idSchemeCodeVo.getIdSchmCd())) {
        	sb.append("idSchmCd").append(ValueUtil.required()).append("\n");
        }
        if (editModeYn) {
            if (StringUtils.isBlank(idSchemeCodeVo.getCdSizeDivMtcd())) {
                sb.append("cdSizeDivMtcd").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(idSchemeCodeVo.getLctgExtrCd())) {
            	sb.append("lctgExtrCd").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(idSchemeCodeVo.getOriginExtrCd())) {
            	sb.append("originExtrCd").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(idSchemeCodeVo.getIdSchmCdNm())) {
            	sb.append("idSchmCdNm").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(idSchemeCodeVo.getUseYn())) {
            	sb.append("useYn").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(idSchemeCodeVo.getIdfyUseYn())) {
            	sb.append("idfyUseYn").append(ValueUtil.required()).append("\n");
            }
        }
        if (modifyModeYn) {
        	if (StringUtils.isBlank(idSchemeCodeVo.getIdSchmCdNm())) {
            	sb.append("idSchmCdNm").append(ValueUtil.required()).append("\n");
            }
        	if (StringUtils.isBlank(idSchemeCodeVo.getUseYn())) {
            	sb.append("useYn").append(ValueUtil.required()).append("\n");
            }
        }
        
        if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
    }

	
	/**
     * 식별체계 - 표준산업분류체계 코드 목록 조회
     *
     * @param IdSchemeSearchVo
     * @return SearchResultListVo
     * @Author : tklee
     * @Date : 2024. 02. 21.
     */
	public SearchResultListVo getIdSchemeStdIndCodeList(IdSchemeSearchVo searchVo) {
		log.debug("[식별체계 - 표준산업분류체계 코드 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();

        try {

            int totalListSize = idSchemeCodeMapper.selectIdSchemeStdIndCount(searchVo);
            searchVo.setTotalListSize(totalListSize);

            List<IdSchemeCodeDto> list = idSchemeCodeMapper.selectIdSchemeStdIndList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));

        } catch (Exception e) {
            log.error("[식별체계 - 표준산업분류체계 코드 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 표준산업분류체계 코드 목록 조회] 서비스 종료");
        return listVo;
	}
	
	/**
     * 식별체계 - 표준산업분류체계 코드 대분류 외부 코드 목록 조회
     *
     * @return List<IdSchemeCodeDto>
     * @Author : tklee
     * @Date : 2024. 02. 21.
     */
	public List<IdSchemeCodeDto> getIdSchemeStdIndLctgCodeList() {
		log.debug("[식별체계 - 표준산업분류체계 코드 대분류 외부 코드 목록 조회] 서비스 시작");
		List<IdSchemeCodeDto> list = new ArrayList<IdSchemeCodeDto>();

        try {

        	list = idSchemeCodeMapper.selectIdSchemeStdIndLctgCodeList();

        } catch (Exception e) {
            log.error("[식별체계 - 표준산업분류체계 코드 대분류 외부 코드 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 표준산업분류체계 코드 대분류 외부 코드 목록 조회] 서비스 종료");
        return list;
	}
	
	/**
     * 식별체계 - 표준산업분류체계 코드 상세 조회
     *
     * @param idSchmCd
     * @return IdSchemeCodeDto
     * @Author : tklee
     * @Date : 2024. 02. 22.
     */
    public IdSchemeCodeDto getIdSchemeStdIndCode(String idSchmCd) {
        log.debug("[식별체계 - 표준산업분류체계 코드 상세 조회] 서비스 시작");
        IdSchemeCodeDto dto = null;

        try {
        	IdSchemeCodeVo idSchemeCodeVo = new IdSchemeCodeVo();
        	idSchemeCodeVo.setIdSchmCd(idSchmCd);
        	dto = idSchemeCodeMapper.selectIdSchemeStdInd(idSchemeCodeVo);

        } catch (Exception e) {
            log.error("[식별체계 - 표준산업분류체계 코드 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 표준산업분류체계 코드 상세 조회] 서비스 종료");
        return dto;
    }
	
	/**
     * 식별체계 - 표준산업분류체계 코드 등록
     *
     * @param IdSchemeCodeVo
     * @return idSchmCd
     * @Author : tklee
     * @Date : 2024. 02. 22.
     */
	public String createIdSchemeStdIndCode(IdSchemeCodeVo idSchemeCodeVo) {
        log.debug("[식별체계 - 표준산업분류체계 코드 등록] 서비스 시작");
        try {
        	
        	// 1. 유효성
        	editModeYn = true;
        	modifyModeYn = false;
        	if("l".equals(idSchemeCodeVo.getCdSizeDivMtcd())) {
        		idSchemeCodeVo.setOriginExtrCd(idSchemeCodeVo.getLctgExtrCd());
        	}
        	idSchemeCodeValidate(idSchemeCodeVo);
        	
        	// 2. 식별체계 코드 체크
        	String extyCd = "";
        	if("l".equals(idSchemeCodeVo.getCdSizeDivMtcd())) {
        		extyCd = idSchemeCodeVo.getLctgExtrCd();
        	}
        	else {
        		extyCd = idSchemeCodeVo.getLctgExtrCd() + idSchemeCodeVo.getOriginExtrCd();
        	}
        	if(!StringUtils.equals(extyCd, idSchemeCodeVo.getIdSchmCd())) {
        		throw new ResBizInfoException("입력한 외부코드와 식별체계 코드가 일치하지 않습니다.");
        	}
        	
        	// 3. 중복체크
            if (editModeYn) {
            	int totalListSize = 0;
            	IdSchemeSearchVo searchVo = new IdSchemeSearchVo();
            	searchVo.setIdSchmCd(idSchemeCodeVo.getIdSchmCd());
            	totalListSize = idSchemeCodeMapper.selectIdSchemeStdIndCount(searchVo);
            	if (totalListSize > 0) {
            		throw new ResBizInfoException("이미 존재하는 식별체계 코드입니다.");
            	}
            }
        	
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            idSchemeCodeVo.setIdSchmCdRegrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdRegrNm(loginUserVo.getUserNm());
            idSchemeCodeVo.setIdSchmCdAmdrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdAmdrNm(loginUserVo.getUserNm());
            idSchemeCodeMapper.insertIdSchemeStdInd(idSchemeCodeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[식별체계 - 표준산업분류체계 코드 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[식별체계 - 표준산업분류체계 코드 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 표준산업분류체계 코드 등록] 서비스 종료");
		return idSchemeCodeVo.getIdSchmCd();
	}
	
	/**
     * 식별체계 - 표준산업분류체계 코드 수정
     *
     * @param IdSchemeCodeVo
     * @return
     * @Author : tklee
     * @Date : 2024. 02. 22.
     */
	public void modifyIdSchemeStdIndCode(IdSchemeCodeVo idSchemeCodeVo) {	
        log.debug("[식별체계 - 표준산업분류체계 코드 수정] 서비스 시작");
        try {
        	
        	// 1.유효성
        	editModeYn = false;
        	modifyModeYn = true;
        	idSchemeCodeValidate(idSchemeCodeVo);
        	
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            idSchemeCodeVo.setIdSchmCdAmdrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdAmdrNm(loginUserVo.getUserNm());
            idSchemeCodeMapper.updateIdSchemeStdInd(idSchemeCodeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[식별체계 - 표준산업분류체계 코드 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[식별체계 - 표준산업분류체계 코드 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 표준산업분류체계 코드 수정] 서비스 종료");
    }
	
	
	
	/**
     * 식별체계 - 공공자원분류체계 코드 목록 조회
     *
     * @param IdSchemeSearchVo
     * @return SearchResultListVo
     * @Author : tklee
     * @Date : 2024. 02. 22.
     */
	public SearchResultListVo getIdSchemePubRiCodeList(IdSchemeSearchVo searchVo) {
		log.debug("[식별체계 - 공공자원분류체계 코드 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();

        try {

            int totalListSize = idSchemeCodeMapper.selectIdSchemePubRiCount(searchVo);
            searchVo.setTotalListSize(totalListSize);

            List<IdSchemeCodeDto> list = idSchemeCodeMapper.selectIdSchemePubRiList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));

        } catch (Exception e) {
            log.error("[식별체계 - 공공자원분류체계 코드 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 공공자원분류체계 코드 목록 조회] 서비스 종료");
        return listVo;
	}
	
	/**
     * 식별체계 - 공공자원분류체계 코드 대분류 외부 코드 목록 조회
     *
     * @return List<IdSchemeCodeDto>
     * @Author : tklee
     * @Date : 2024. 02. 22.
     */
	public List<IdSchemeCodeDto> getIdSchemePubRiLctgCodeList() {
		log.debug("[식별체계 - 공공자원분류체계 코드 대분류 외부 코드 목록 조회] 서비스 시작");
		List<IdSchemeCodeDto> list = new ArrayList<IdSchemeCodeDto>();

        try {

        	list = idSchemeCodeMapper.selectIdSchemePubRiLctgCodeList();

        } catch (Exception e) {
            log.error("[식별체계 - 공공자원분류체계 코드 대분류 외부 코드 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 공공자원분류체계 코드 대분류 외부 코드 목록 조회] 서비스 종료");
        return list;
	}
	
	/**
     * 식별체계 - 공공자원분류체계 코드 상세 조회
     *
     * @param idSchmCd
     * @return IdSchemeCodeDto
     * @Author : tklee
     * @Date : 2024. 02. 29.
     */
	public IdSchemeCodeDto getIdSchemePubRiCode(String idSchmCd) {
        log.debug("[식별체계 - 공공자원분류체계 코드 상세 조회] 서비스 시작");
        IdSchemeCodeDto dto = null;

        try {
        	IdSchemeCodeVo idSchemeCodeVo = new IdSchemeCodeVo();
        	idSchemeCodeVo.setIdSchmCd(idSchmCd);
        	dto = idSchemeCodeMapper.selectIdSchemePubRi(idSchemeCodeVo);

        } catch (Exception e) {
            log.error("[식별체계 - 공공자원분류체계 코드 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 공공자원분류체계 코드 상세 조회] 서비스 종료");
        return dto;
	}
	
	/**
     * 식별체계 - 공공자원분류체계 코드 등록
     *
     * @param IdSchemeCodeVo
     * @return idSchmCd
     * @Author : tklee
     * @Date : 2024. 02. 23.
     */
	public String createIdSchemePubRiCode(IdSchemeCodeVo idSchemeCodeVo) {
        log.debug("[식별체계 - 공공자원분류체계 코드 등록] 서비스 시작");
        try {
        	
        	// 1. 유효성
        	editModeYn = true;
        	modifyModeYn = false;
        	if("l".equals(idSchemeCodeVo.getCdSizeDivMtcd())) {
        		idSchemeCodeVo.setOriginExtrCd(idSchemeCodeVo.getLctgExtrCd());
        	}
        	idSchemeCodeValidate(idSchemeCodeVo);
        	
        	// 2. 식별체계 코드 체크
        	String extyCd = "";
        	if("l".equals(idSchemeCodeVo.getCdSizeDivMtcd())) {
        		extyCd = idSchemeCodeVo.getLctgExtrCd();
        	}
        	else {
        		extyCd = idSchemeCodeVo.getLctgExtrCd() + idSchemeCodeVo.getOriginExtrCd();
        	}
        	if(!StringUtils.equals(extyCd, idSchemeCodeVo.getIdSchmCd())) {
        		throw new ResBizInfoException("입력한 외부코드와 식별체계 코드가 일치하지 않습니다.");
        	}
        	
        	// 3. 중복체크
            if (editModeYn) {
            	int totalListSize = 0;
            	IdSchemeSearchVo searchVo = new IdSchemeSearchVo();
            	searchVo.setIdSchmCd(idSchemeCodeVo.getIdSchmCd());
            	totalListSize = idSchemeCodeMapper.selectIdSchemePubRiCount(searchVo);
            	if (totalListSize > 0) {
            		throw new ResBizInfoException("이미 존재하는 식별체계 코드입니다.");
            	}
            }
            
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            idSchemeCodeVo.setIdSchmCdRegrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdRegrNm(loginUserVo.getUserNm());
            idSchemeCodeVo.setIdSchmCdAmdrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdAmdrNm(loginUserVo.getUserNm());
            idSchemeCodeMapper.insertIdSchemePubRi(idSchemeCodeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[식별체계 - 공공자원분류체계 코드 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[식별체계 - 공공자원분류체계 코드 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 공공자원분류체계 코드 등록] 서비스 종료");
		return idSchemeCodeVo.getIdSchmCd();
	}
	
	/**
     * 식별체계 - 공공자원분류체계 코드 수정
     *
     * @param IdSchemeCodeVo
     * @return
     * @Author : tklee
     * @Date : 2024. 03. 05.
     */
	public void modifyIdSchemePubRiCode(IdSchemeCodeVo idSchemeCodeVo) {		
        log.debug("[식별체계 - 공공자원분류체계 코드 수정] 서비스 시작");
        try {
        	editModeYn = false;
        	modifyModeYn = true;
        	idSchemeCodeValidate(idSchemeCodeVo);
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            idSchemeCodeVo.setIdSchmCdAmdrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdAmdrNm(loginUserVo.getUserNm());
            idSchemeCodeMapper.updateIdSchemePubRi(idSchemeCodeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[식별체계 - 공공자원분류체계 코드 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[식별체계 - 공공자원분류체계 코드 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 공공자원분류체계 코드 수정] 서비스 종료");
    }
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	/**
     * 식별체계 - 객체 - 물품 코드 목록 조회
     *
     * @param searchVo
     * @return SearchResultListVo
     * @Author : tklee
     * @Date : 2024. 02. 29.
     */
	public SearchResultListVo getIdSchemeProductCodeList(IdSchemeSearchVo searchVo) {
		log.debug("[ 식별체계 - 객체 - 물품 코드 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();

        try {

            int totalListSize = idSchemeCodeMapper.selectIdSchemeProductCount(searchVo);
            searchVo.setTotalListSize(totalListSize);

            List<IdSchemeCodeDto> list = idSchemeCodeMapper.selectIdSchemeProductList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));

        } catch (Exception e) {
            log.error("[ 식별체계 - 객체 - 물품 코드 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[ 식별체계 - 객체 - 물품 코드 목록 조회] 서비스 종료");
        return listVo;
	}
	
	/**
     * 식별체계 - 객체 - 물품 코드 상세 조회
     *
     * @param idSchmCd
     * @return IdSchemeCodeDto
     * @Author : tklee
     * @Date : 2024. 02. 29.
     */
	public IdSchemeCodeDto getIdSchemeProductCode(String idSchmCd) {
        log.debug("[식별체계 - 객체 - 물품 코드 상세 조회] 서비스 시작");
        IdSchemeCodeDto dto = null;

        try {
        	IdSchemeCodeVo idSchemeCodeVo = new IdSchemeCodeVo();
        	idSchemeCodeVo.setIdSchmCd(idSchmCd);
        	dto = idSchemeCodeMapper.selectIdSchemeProduct(idSchemeCodeVo);

        } catch (Exception e) {
            log.error("[식별체계 - 객체 - 물품 코드 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 객체 - 물품 코드 상세 조회] 서비스 종료");
        return dto;
	}
	
	/**
     * 식별체계 - 객체 - 물품 코드 등록
     *
     * @param IdSchemeCodeVo
     * @return idSchmCd
     * @Author : tklee
     * @Date : 2024. 03. 05.
     */
	public String createIdSchemeProductCode(IdSchemeCodeVo idSchemeCodeVo) {
        log.debug("[식별체계 - 객체 - 물품 코드 등록] 서비스 시작");
        try {
        	
        	// 물품 코드 고정값
        	idSchemeCodeVo.setCdSizeDivMtcd("m");
        	idSchemeCodeVo.setLctgExtrCd("1");
        	
        	// 1. 유효성
        	editModeYn = true;
        	modifyModeYn = false;
        	idSchemeCodeValidate(idSchemeCodeVo);
        	
        	// 2. 식별체계 코드 체크
        	if(!StringUtils.equals(idSchemeCodeVo.getOriginExtrCd(), idSchemeCodeVo.getIdSchmCd())) {
        		throw new ResBizInfoException("입력한 외부코드와 식별체계 코드가 일치하지 않습니다.");
        	}
        	
        	// 3. 중복체크
            if (editModeYn) {
            	int totalListSize = 0;
            	IdSchemeSearchVo searchVo = new IdSchemeSearchVo();
            	searchVo.setIdSchmCd(idSchemeCodeVo.getIdSchmCd());
            	totalListSize = idSchemeCodeMapper.selectIdSchemeProductCount(searchVo);
            	if (totalListSize > 0) {
            		throw new ResBizInfoException("이미 존재하는 식별체계 코드입니다.");
            	}
            }
            
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            idSchemeCodeVo.setIdSchmCdRegrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdRegrNm(loginUserVo.getUserNm());
            idSchemeCodeVo.setIdSchmCdAmdrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdAmdrNm(loginUserVo.getUserNm());
            idSchemeCodeMapper.insertIdSchemeProduct(idSchemeCodeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[식별체계 - 객체 - 물품 코드 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[식별체계 - 객체 - 물품 코드 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 객체 - 물품 코드 등록] 서비스 종료");
		return idSchemeCodeVo.getIdSchmCd();
	}
	
	/**
     * 식별체계 - 객체 - 물품 코드 수정
     *
     * @param IdSchemeCodeVo
     * @return
     * @Author : tklee
     * @Date : 2024. 03. 05.
     */
	public void modifyIdSchemeProductCode(IdSchemeCodeVo idSchemeCodeVo) {
        log.debug("[식별체계 - 객체 - 물품 코드 수정] 서비스 시작");
        try {
        	
        	// 1.유효성
        	editModeYn = false;
        	modifyModeYn = true;
        	idSchemeCodeValidate(idSchemeCodeVo);
        	
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            idSchemeCodeVo.setIdSchmCdAmdrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdAmdrNm(loginUserVo.getUserNm());
            idSchemeCodeMapper.updateIdSchemeProduct(idSchemeCodeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[식별체계 - 객체 - 물품 코드 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[식별체계 - 객체 - 물품 코드 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 객체 - 물품 코드 수정] 서비스 종료");
    }
	
	
	/**
     * 식별체계 - 객체 - 시설 코드 목록 조회
     *
     * @param searchVo
     * @return SearchResultListVo
     * @Author : tklee
     * @Date : 2024. 02. 29.
     */
	public SearchResultListVo getIdSchemeFacilityCodeList(IdSchemeSearchVo searchVo) {
		log.debug("[식별체계 - 객체 - 시설 코드 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();

        try {

            int totalListSize = idSchemeCodeMapper.selectIdSchemeFacilityCount(searchVo);
            searchVo.setTotalListSize(totalListSize);

            List<IdSchemeCodeDto> list = idSchemeCodeMapper.selectIdSchemeFacilityList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));

        } catch (Exception e) {
            log.error("[식별체계 - 객체 - 시설 코드 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 객체 - 시설 코드 목록 조회] 서비스 종료");
        return listVo;
	}	
	
	/**
     * 식별체계 - 객체 - 시설 코드 상세 조회
     *
     * @param idSchmCd
     * @return IdSchemeCodeDto
     * @Author : tklee
     * @Date : 2024. 02. 29.
     */
	public IdSchemeCodeDto getIdSchemeFacilityCode(String idSchmCd) {
        log.debug("[식별체계 - 객체 - 시설 코드 상세 조회] 서비스 시작");
        IdSchemeCodeDto dto = null;

        try {
        	IdSchemeCodeVo idSchemeCodeVo = new IdSchemeCodeVo();
        	idSchemeCodeVo.setIdSchmCd(idSchmCd);
        	dto = idSchemeCodeMapper.selectIdSchemeFacility(idSchemeCodeVo);

        } catch (Exception e) {
            log.error("[식별체계 - 객체 - 시설 코드 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 객체 - 시설 코드 상세 조회] 서비스 종료");
        return dto;
	}
	
	/**
     * 식별체계 - 객체 - 시설 코드 등록
     *
     * @param IdSchemeCodeVo
     * @return idSchmCd
     * @Author : tklee
     * @Date : 2024. 03. 05.
     */
	public String createIdSchemeFacilityCode(IdSchemeCodeVo idSchemeCodeVo) {
        log.debug("[식별체계 - 객체 - 시설 코드 등록] 서비스 시작");
        try {
        	
        	// 시설 코드 고정값
        	idSchemeCodeVo.setCdSizeDivMtcd("m");
        	idSchemeCodeVo.setLctgExtrCd("2");
        	
        	// 1. 유효성
        	editModeYn = true;
        	modifyModeYn = false;
        	idSchemeCodeValidate(idSchemeCodeVo);
        	
        	// 2. 식별체계 코드 체크
        	if(!StringUtils.equals(idSchemeCodeVo.getOriginExtrCd(), idSchemeCodeVo.getIdSchmCd())) {
        		throw new ResBizInfoException("입력한 외부코드와 식별체계 코드가 일치하지 않습니다.");
        	}
        	
        	// 3. 중복체크
            if (editModeYn) {
            	int totalListSize = 0;
            	IdSchemeSearchVo searchVo = new IdSchemeSearchVo();
            	searchVo.setIdSchmCd(idSchemeCodeVo.getIdSchmCd());
            	totalListSize = idSchemeCodeMapper.selectIdSchemeProductCount(searchVo);
            	if (totalListSize > 0) {
            		throw new ResBizInfoException("이미 존재하는 식별체계 코드입니다.");
            	}
            }
            
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            idSchemeCodeVo.setIdSchmCdRegrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdRegrNm(loginUserVo.getUserNm());
            idSchemeCodeVo.setIdSchmCdAmdrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdAmdrNm(loginUserVo.getUserNm());
            idSchemeCodeMapper.insertIdSchemeFacility(idSchemeCodeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[식별체계 - 객체 - 시설 코드 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[식별체계 - 객체 - 시설 코드 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 객체 - 시설 코드 등록] 서비스 종료");
		return idSchemeCodeVo.getIdSchmCd();
	}
	
	/**
     * 식별체계 - 객체 - 시설 코드 수정
     *
     * @param IdSchemeCodeVo
     * @return
     * @Author : tklee
     * @Date : 2024. 03. 05.
     */
	public void modifyIdSchemeFacilityCode(IdSchemeCodeVo idSchemeCodeVo) {

        log.debug("[식별체계 - 객체 - 시설 코드 수정] 서비스 시작");
        try {
        	editModeYn = false;
        	modifyModeYn = true;
        	idSchemeCodeValidate(idSchemeCodeVo);
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            idSchemeCodeVo.setIdSchmCdAmdrId(loginUserVo.getUserId());
            idSchemeCodeVo.setIdSchmCdAmdrNm(loginUserVo.getUserNm());
            idSchemeCodeMapper.updateIdSchemeFacility(idSchemeCodeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[식별체계 - 객체 - 시설 코드 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[식별체계 - 객체 - 시설 코드 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[식별체계 - 객체 - 시설 코드 수정] 서비스 종료");
    }
	
	
	

	public IdSchemeCodeDto getIdSchemeCode(String idSchmDiv, String idSchmType, String idSchmCd) {
		if (StringUtils.equals(Constant.ID_SCHM_DT, idSchmDiv)) {
			if (StringUtils.equals(Constant.ID_SCHM_TYPE_KSIC, idSchmType)) {
				return this.getIdSchemeStdIndCode(idSchmCd);
			} else if (StringUtils.equals(Constant.ID_SCHM_TYPE_PBRC, idSchmType)) {
				return this.getIdSchemePubRiCode(idSchmCd);
			}
		}
		else if (StringUtils.equals(Constant.ID_SCHM_OBJECT, idSchmDiv)) {
			if (StringUtils.equals(Constant.ID_SCHM_TYPE_PRODUCT, idSchmType)) {
				return this.getIdSchemeProductCode(idSchmCd);
			} else if (StringUtils.equals(Constant.ID_SCHM_TYPE_FACILITY, idSchmType)) {
				return this.getIdSchemeFacilityCode(idSchmCd);
			}
		}
		
		return null;
	}
}
