package kr.co.n2m.platform.meta.rdf.rdfclass.service;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.property.DtmetaProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassDto;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassSearchVo;
import kr.co.n2m.platform.meta.rdf.rdfclass.domain.RdfClassVo;
import kr.co.n2m.platform.meta.rdf.rdfclass.mapper.RdfClassMapper;
import kr.co.n2m.platform.meta.rdf.virtuoso.service.VirtuosoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "rdbTransactionManager")
public class RdfClassService {

    private final RdfClassMapper rdfClassMapper;
    
    private final DtmetaProperty dtmetaProperty;
    
	private VirtuosoService virtuosoService; // 순환참조 오류 방지
	
	public void setVirtuosoService(VirtuosoService virtuosoService) { // 순환참조 오류 방지
		this.virtuosoService = virtuosoService;
	}
    
    /**
     * RDF 클래스 등록, 수정, 삭제 시 유효성 검사
     *
     * @param rdfClassVo
     * @return
     * @Author : Ran
     * @Date : 2023. 07. 06.
     */
    private void validate(RdfClassVo rdfClassVo, boolean editModeYn, boolean deleteModeYn) {
        /***************************************** 유효성 검사 - 삭제 *****************************************/
        if (deleteModeYn) {
            boolean errorYn = rdfClassMapper.validationDuringDeleteMode(rdfClassVo.getRdfClassId());
            if (errorYn) {
                throw new ResBizInfoException("RDF 프라퍼티 정의, RDF 매핑모델, RDF 매핑규칙에 사용중이어서 RDF 클래스를 삭제할 수 없습니다.");
            }
            return;
        }
        /***************************************** 유효성 검사 - 등록 or 수정 *****************************************/
        // 1. Null
        StringBuffer sb = new StringBuffer();
        if (StringUtils.isBlank(rdfClassVo.getRdfClassNm())) {
            sb.append("rdfClassNm").append(ValueUtil.required()).append("\n");
        }
        if (StringUtils.isBlank(rdfClassVo.getRdfNmspId())) {
            sb.append("rdfNmspId").append(ValueUtil.required()).append("\n");
        }
        if (sb.length() > 0) throw new ResBadRequestException(sb.toString());

        // 2. RDF 네임스페이스
        boolean rdfNmspIdExistYn = rdfClassMapper.isRdfNmspIdExist(rdfClassVo.getRdfNmspId());
        if (!rdfNmspIdExistYn) {
            throw new ResBizInfoException("존재하는 RDF 네임스페이스 ID(" + rdfClassVo.getRdfNmspId() + ")가 아닙니다.");
        }
        // 3. 중복
        boolean errorYn = editModeYn == true ?
                rdfClassMapper.validationDuringEditMode(rdfClassVo) :
                rdfClassMapper.validationDuringModifyMode(rdfClassVo);
        if (errorYn) {
            throw new ResBizInfoException("RDF 클래스명(" + rdfClassVo.getRdfClassNm()
                    + ")과 RDF 네임스페이스 ID(" + rdfClassVo.getRdfNmspId() + ") 가 동일한 RDF 클래스가 존재하여 저장할 수 없습니다.");
        }
    }

    /**
     * RDF 클래스 목록 조회
     *
     * @param rdfClassSearchVo
     * @return
     * @Author : Ran
     * @Date : 2023. 07. 04.
     */
    public SearchResultListVo getRdfClassList(RdfClassSearchVo rdfClassSearchVo) {
        log.debug("[RDF 클래스 목록 조회] 서비스 시작");
        SearchResultListVo listVo = new SearchResultListVo();
        try {
        	int totalListSize = 0;
            List<RdfClassDto> list;
	    	if ("range".equals(rdfClassSearchVo.getSearchMode())) {
	    		totalListSize = rdfClassMapper.selectRangeRdfClassCount(rdfClassSearchVo);
	    		rdfClassSearchVo.setTotalListSize(totalListSize);
	    		list = rdfClassMapper.selectRangeRdfClassList(rdfClassSearchVo);
	    	} else {
	    		totalListSize = rdfClassMapper.selectRdfClassCount(rdfClassSearchVo);
	    		rdfClassSearchVo.setTotalListSize(totalListSize);
	    		list = rdfClassMapper.selectRdfClassList(rdfClassSearchVo);
	    	}
            listVo.setList(list);
            listVo.setPage(new PageVo(rdfClassSearchVo));
        } catch (Exception e) {
            log.error("[RDF 클래스 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[RDF 클래스 목록 조회] 서비스 종료");
        return listVo;
    }

    /**
     * RDF 클래스 상세 조회
     *
     * @param rdfClassId
     * @return
     * @Author : Ran
     * @Date : 2023. 07. 04.
     */
    public RdfClassDto getRdfClassDetail(String rdfClassId) {
        log.debug("[RDF 클래스 상세 조회] 서비스 시작");
        RdfClassDto rdfClass = null;
        try {
        	RdfClassVo rdfClassSearchVo = new RdfClassVo();
            rdfClassSearchVo.setRdfClassId(rdfClassId);
            rdfClass = rdfClassMapper.selectRdfClass(rdfClassSearchVo);
        }catch (Exception e) {
            log.error("[RDF 클래스 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[RDF 클래스 상세 조회] 서비스 종료");
        return rdfClass;
    }

    /**
     * RDF 클래스 등록
     *
     * @param rdfClassVo
     * @return
     * @Author : Ran
     * @Date : 2023. 07. 04.
     */
    public String createRdfClass(RdfClassVo rdfClassVo) {
        log.debug("[RDF 클래스 등록] 서비스 시작");
        try {
        	LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            rdfClassVo.setRdfClassRegrId(loginUserVo.getUserId());
            rdfClassVo.setRdfClassRegrNm(loginUserVo.getUserNm());
            rdfClassVo.setRdfClassAmdrId(loginUserVo.getUserId());
            rdfClassVo.setRdfClassAmdrNm(loginUserVo.getUserNm());
            
            validate(rdfClassVo, true, false);
            
            // 1. 등록
            rdfClassMapper.insertRdfClass(rdfClassVo);
            
            // 2. 디지털트윈 네임스페이스 경우 버투소 등록
            this.saveToVirtuoso(rdfClassVo.getRdfClassId(), loginUserVo.getUserId());
            
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 클래스 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 클래스 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[RDF 클래스 등록] 서비스 종료");
        return rdfClassVo.getRdfClassId();
    }

    /**
     * RDF 클래스 수정
     *
     * @param rdfClassVo
     * @return
     * @Author : Ran
     * @Date : 2023. 07. 05.
     */
    public String modifyRdfClass(RdfClassVo rdfClassVo) {
        log.debug("[RDF 클래스 수정] 서비스 시작");
        LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
        
        try {
            rdfClassVo.setRdfClassAmdrId(loginUserVo.getUserId());
            rdfClassVo.setRdfClassAmdrNm(loginUserVo.getUserNm());
            
        	validate(rdfClassVo, false, false);
        	
        	// 1. 수정 전 디지털트윈 네임스페이스 경우 버투소에서 삭제
        	RdfClassDto prevRdfClassDto = rdfClassMapper.selectRdfClass(rdfClassVo);
        	if (prevRdfClassDto != null 
        		&& (!StringUtils.equals(prevRdfClassDto.getRdfNmspId(), rdfClassVo.getRdfNmspId()) || !StringUtils.equals(prevRdfClassDto.getRdfClassNm(), rdfClassVo.getRdfClassNm()))) {
        		this.deleteFromVirtuoso(prevRdfClassDto, loginUserVo.getUserId()); // 실행 후 아래에서 오류발생시 롤백되는 것 확인함!
        	}
        	
        	// 2. 수정
            rdfClassMapper.updateRdfClass(rdfClassVo);
            
            // 3. 수정 후 디지털트윈 네임스페이스 경우 버투소 저장
            this.saveToVirtuoso(rdfClassVo.getRdfClassId(), loginUserVo.getUserId());
            
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 클래스 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 클래스 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[RDF 클래스 수정] 서비스 종료");
        return rdfClassVo.getRdfClassId();
    }

    /**
     * RDF 클래스 삭제
     *
     * @param rdfClassId
     * @return
     * @Author : Ran
     * @Date : 2023. 07. 05.
     */
    public void deleteRdfClass(String rdfClassId) {
        log.debug("[RDF 클래스 삭제] 서비스 시작");
        LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
        
        try {
        	RdfClassDto rdfClassDto = getRdfClassDetail(rdfClassId);
            if (rdfClassDto == null) throw new ResNotFoundException("RDF 클래스가 존재하지 않습니다.");
            
            validate(rdfClassDto, false, true);
            
            // 1. 디지털트윈 네임스페이스 경우 버투소에서 삭제
            this.deleteFromVirtuoso(rdfClassDto, loginUserVo.getUserId());
            
            // 2. 삭제
            rdfClassMapper.deleteRdfClass(rdfClassId);
            
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 클래스 삭제] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 클래스 삭제] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[RDF 클래스 삭제] 서비스 종료");
    }
    
    /**
     * RDF 클래스 정보를 버투소 그래프 DB에서 삭제 (시스템 정의 RDF 스키마일 경우만)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
     * @param rdfClassDto
     * @param logRegrId
     * @return
     */
    private boolean deleteFromVirtuoso(RdfClassDto rdfClassDto, String logRegrId) {
    	boolean bDeleted = false;
		try {
			if (rdfClassDto != null && StringUtils.startsWith(rdfClassDto.getRdfClassIri(), dtmetaProperty.getRdfSchemaBaseUrl())) {
				virtuosoService.deleteRdfNsToGraphByUriForUse(rdfClassDto.getRdfClassIri(), logRegrId);
				bDeleted = true;
			}
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.error("[RDF 클래스 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) : {} - {}", rdfClassDto.getRdfClassIri(), e.getReason());
		} catch (Exception e) {
			log.error("[RDF 클래스 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) - {}", rdfClassDto.getRdfClassIri(), e);
		}
		return bDeleted;
    }

    /**
     * RDF 클래스 정보를 버투소 그래프 DB에 반영 (시스템 정의 RDF 스키마일 경우만)
	 * @Author      : heenim
	 * @Date        : 2023. 11. 10.
     * @param rdfClassId
     * @param logRegrId
     */
    private void saveToVirtuoso(String rdfClassId, String logRegrId) {
    	String logIri = rdfClassId;
		try {
			RdfClassDto rdfClassDto = this.getRdfClassDetail(rdfClassId);
			if (rdfClassDto != null && StringUtils.startsWith(rdfClassDto.getRdfClassIri(), dtmetaProperty.getRdfSchemaBaseUrl())) {
				logIri = rdfClassDto.getRdfClassIri();
				virtuosoService.saveRdfNsToGraphByUriForUse(rdfClassDto.getRdfClassIri(), logRegrId);
			}
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.error("[RDF 클래스 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) : {} - {}", logIri, e.getReason());
		} catch (Exception e) {
			log.error("[RDF 클래스 정보를 버투소 그래프 DB에 반영] 실패/오류 (SKIP) - {}", logIri, e);
		}
    }
    
}