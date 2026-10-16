package kr.co.n2m.platform.meta.rdf.mapping.service;

import java.util.List;

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
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingModelVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingTreeSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingTreeVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingVo;
import kr.co.n2m.platform.meta.rdf.mapping.mapper.RdfMappingMapper;
import kr.co.n2m.platform.meta.rdf.mapping.mapper.RdfMappingRuleMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class RdfMappingService {

    @Autowired
    private RdfMappingMapper rdfMappingMapper;

    @Autowired
    private RdfMappingRuleMapper rdfMappingRuleMapper;

    @Autowired
    private RdfMappingCacheService cacheService;

    private boolean editModeYn = false;
    private boolean modifyModeYn = false;

    /**
     * RDF 매핑 등록, 수정 시 유효성 검사
     *
     * @param rdfMappingVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 19.
     */
    private void mappingValidate(RdfMappingVo rdfMappingVo) {
        /***************************************** 유효성 검사 - 등록 or 수정 *****************************************/
        // 1. 필수값
        StringBuffer sb = new StringBuffer();
        if (editModeYn) {
            if (StringUtils.isBlank(rdfMappingVo.getRdfFormMtcd())) {
                sb.append("rdfFormMtcd").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(rdfMappingVo.getTypeModelId())) {
                sb.append("typeModelId").append(ValueUtil.required()).append("\n");
            }
        }
        if (modifyModeYn) {
            if (StringUtils.isBlank(rdfMappingVo.getRdfMappgId())) {
                sb.append("rdfMappgId").append(ValueUtil.required()).append("\n");
            }
        }
        if (StringUtils.isBlank(rdfMappingVo.getRdfMappgNm())) {
            sb.append("rdfMappgNm").append(ValueUtil.required()).append("\n");
        }
        if (sb.length() > 0) throw new ResBadRequestException(sb.toString());

        // 2. 중복
        boolean errorYn = false;
        if (editModeYn) {
            errorYn = rdfMappingMapper.validationDuringMappingEditMode(rdfMappingVo);
        }
        if (errorYn) {
            throw new ResBizInfoException("해당 RDF 매핑 형식, 메타데이터 유형으로 등록된 RDF 매핑이 이미 존재하여 "
                    + "등록할 수 없습니다.");
        }

    }

    /**
     * RDF 매핑 모델 등록, 수정 시 유효성 검사
     *
     * @param rdfMappingModelVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 20.
     */
    private void mappingModelValidate(RdfMappingModelVo rdfMappingModelVo) {
        /***************************************** 유효성 검사 - 등록 or 수정 *****************************************/
        // 1. 필수값
        StringBuffer sb = new StringBuffer();
        if (StringUtils.isBlank(rdfMappingModelVo.getRdfClassId())) {
            sb.append("rdfClassId").append(ValueUtil.required()).append("\n");
        }
        if (StringUtils.isBlank(rdfMappingModelVo.getRdfRepModelYn())) {
            sb.append("rdfRepModelYn").append(ValueUtil.required()).append("\n");
        }
        if ("N".equals(rdfMappingModelVo.getRdfRepModelYn())) {
            if (StringUtils.isBlank(rdfMappingModelVo.getCondModelId())) {
                sb.append("condModelId").append(ValueUtil.required()).append("\n");
            }
        }
        if (modifyModeYn) {
            if (StringUtils.isBlank(rdfMappingModelVo.getRdfMappgModelId())) {
                sb.append("rdfMappgModelId").append(ValueUtil.required()).append("\n");
            }
        }
        if ((Integer) rdfMappingModelVo.getRdfCondOdrg() != null) {
            if (rdfMappingModelVo.getRdfCondOdrg() < 0 || rdfMappingModelVo.getRdfCondOdrg() > 99999) {
                sb.append("rdfCondOdrg").append(ValueUtil.mustBeBetween("0", "99999")).append("\n");
            }
        }

        if (sb.length() > 0) throw new ResBadRequestException(sb.toString());

        // 2. 중복
        boolean errorYn = false;
        if (editModeYn) {
            errorYn = rdfMappingMapper.validationDuringMappingModelEditMode(rdfMappingModelVo);
        }
        if (modifyModeYn) {
            errorYn = rdfMappingMapper.validationDuringMappingModelModifyMode(rdfMappingModelVo);
        }
        if (errorYn) {
            throw new ResBizInfoException("해당 조건 메타데이터 모델로 등록된 RDF 매핑 모델이 이미 존재하여 "
                    + "등록할 수 없습니다.");
        }

        // 3. 기본값 세팅
        if ((Integer) rdfMappingModelVo.getRdfCondOdrg() == null) {
            rdfMappingModelVo.setRdfCondOdrg(0);
        }
    }

    /**
     * RDF 매핑 현황 목록 조회
     *
     * @param rdfMappingSearchVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 05.
     */
    public SearchResultListVo getMappingStatusList(RdfMappingSearchVo searchVo) {
        log.debug("[RDF 매핑 현황 목록 조회] 서비스 시작");
        SearchResultListVo listVo = new SearchResultListVo();

        try {

            int totalListSize = rdfMappingMapper.selectRdfMappingStatusCount(searchVo);
            searchVo.setTotalListSize(totalListSize);

            List<RdfMappingVo> list = rdfMappingMapper.selectRdfMappingStatusList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));

        } catch (Exception e) {
            log.error("[RDF 매핑 현황 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 현황 목록 조회] 서비스 종료");
        return listVo;
    }

    /**
     * RDF 매핑 목록 조회
     *
     * @param rdfMappingSearchVo
     * @return
     * @Author : heenim
     * @Date : 2023. 07. 12.
     */
    public SearchResultListVo getRdfMappingList(RdfMappingSearchVo searchVo) {
        log.debug("[RDF 매핑 목록 조회] 서비스 시작");
        SearchResultListVo listVo = new SearchResultListVo();

        try {

            int totalListSize = rdfMappingMapper.selectRdfMappingCount(searchVo);
            searchVo.setTotalListSize(totalListSize);
            List<RdfMappingVo> list = rdfMappingMapper.selectRdfMappingList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));

        } catch (Exception e) {
            log.error("[RDF 매핑 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 목록 조회] 서비스 종료");
        return listVo;
    }

    /**
     * RDF 매핑 상세 조회
     *
     * @param rdfMappingVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 07.
     */
    public RdfMappingVo getRdfMapping(String rdfMappgId) {
        log.debug("[RDF 매핑 상세 조회] 서비스 시작");
        RdfMappingVo vo = null;

        try {
        	RdfMappingVo rdfMappingVo = new RdfMappingVo();
        	rdfMappingVo.setRdfMappgId(rdfMappgId);
            vo = rdfMappingMapper.selectRdfMapping(rdfMappingVo);

        } catch (Exception e) {
            log.error("[RDF 매핑 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 상세 조회] 서비스 종료");
        return vo;
    }

    /**
     * RDF 매핑 등록
     *
     * @param rdfMappingVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 07.
     */
    public String createMapping(RdfMappingVo rdfMappingVo) {
        log.debug("[RDF 매핑 등록] 서비스 시작");
        try {
            editModeYn = true;
            modifyModeYn = false;
            mappingValidate(rdfMappingVo);
            rdfMappingVo.setRdfMappgDataSttusMtcd("use");
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            rdfMappingVo.setRdfMappgRegrId(loginUserVo.getUserId());
            rdfMappingVo.setRdfMappgRegrNm(loginUserVo.getUserNm());
            rdfMappingVo.setRdfMappgAmdrId(loginUserVo.getUserId());
            rdfMappingVo.setRdfMappgAmdrNm(loginUserVo.getUserNm());
            rdfMappingMapper.insertRdfMapping(rdfMappingVo);

            // clear cache
            cacheService.removeRdfMappingBySearching(cacheService.getRdfMappingKey(rdfMappingVo.getRdfFormMtcd(), rdfMappingVo.getTypeModelId()));

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 매핑 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 매핑 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 등록] 서비스 종료");
        return rdfMappingVo.getRdfMappgId();
    }    

    /**
     * RDF 매핑 수정
     *
     * @param rdfMappingVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 07.
     */
    public void modifyMapping(RdfMappingVo rdfMappingVo) {
        log.debug("[RDF 매핑 수정] 서비스 시작");
        try {
            editModeYn = false;
            modifyModeYn = true;
            mappingValidate(rdfMappingVo);
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            rdfMappingVo.setRdfMappgAmdrId(loginUserVo.getUserId());
            rdfMappingVo.setRdfMappgAmdrNm(loginUserVo.getUserNm());
            rdfMappingMapper.updateRdfMapping(rdfMappingVo);

            // clear cache
            cacheService.removeRdfMapping(rdfMappingVo.getRdfMappgId());
            cacheService.removeRdfMappingBySearching(cacheService.getRdfMappingKey(rdfMappingVo.getRdfFormMtcd(), rdfMappingVo.getTypeModelId()));

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 매핑 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 매핑 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 수정] 서비스 종료");
    }

    /**
     * RDF 매핑 삭제 (상태코드 변경)
     *
     * @param rdfMappingVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 07.
     */
    public void deleteMapping(String rdfMappgId) {
        log.debug("[RDF 매핑 삭제] 서비스 시작");
        try {

            StringBuffer sb = new StringBuffer();

            //필수 check
            if (StringUtils.isBlank(rdfMappgId)) {
                sb.append("rdfMappgId").append(ValueUtil.required()).append("\n");
            }

            if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
            
            RdfMappingVo prevVo = this.getRdfMapping(rdfMappgId);
            List<RdfMappingModelVo> prevModelList = cacheService.getRdfMappingModelList(rdfMappgId);

            RdfMappingVo rdfMappingVo = new RdfMappingVo();
            rdfMappingVo.setRdfMappgId(rdfMappgId);

            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            rdfMappingVo.setRdfMappgAmdrId(loginUserVo.getUserId());
            rdfMappingVo.setRdfMappgAmdrNm(loginUserVo.getUserNm());
            rdfMappingMapper.deleteRdfMapping(rdfMappingVo);

            // clear cache
            cacheService.removeRdfMapping(rdfMappgId);
            cacheService.removeRdfMappingBySearching(cacheService.getRdfMappingKey(prevVo.getRdfFormMtcd(), prevVo.getTypeModelId()));
            if (prevModelList != null && prevModelList.size() > 0) {
            	for (RdfMappingModelVo prevModelVo : prevModelList) {
            		this.clearAllCachesByMappgModelId(prevModelVo.getRdfMappgModelId());
            	}
            }            

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 매핑 삭제] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 매핑 삭제] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 삭제] 서비스 종료");
    }

    /**
     * RDF 매핑 모델 목록 조회
     *
     * @param rdfMappingSearchVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 10.
     */
    public SearchResultListVo getMappingModelList(RdfMappingModelSearchVo searchVo) {
        log.debug("[RDF 매핑 모델 목록 조회] 서비스 시작");
        SearchResultListVo listVo = new SearchResultListVo();

        try {
            List<RdfMappingModelVo> list = rdfMappingMapper.selectRdfMappingModelList(searchVo);
            listVo.setList(list);

        } catch (Exception e) {
            log.error("[RDF 매핑 모델 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 모델 목록 조회] 서비스 종료");
        return listVo;
    }

    /**
     * RDF 매핑 모델 조회
     *
     * @param rdfMappgModelId
     * @return
     * @Author : heenim
     * @Date : 2023. 07. 11.
     */
    public RdfMappingModelVo getRdfMappingModel(String rdfMappgModelId) {
        log.debug("[RDF 매핑 모델 조회] 서비스 시작");
        RdfMappingModelVo vo = null;

        try {
            RdfMappingModelVo paramVo = new RdfMappingModelVo();
            paramVo.setRdfMappgModelId(rdfMappgModelId);
            vo = rdfMappingMapper.selectRdfMappingModel(paramVo);

        } catch (Exception e) {
            log.error("[RDF 매핑 모델 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 모델 조회] 서비스 종료");
        return vo;
    }

    /**
     * RDF 매핑 모델 등록
     *
     * @param rdfMappingModelVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 11.
     */
    public String createMappingModel(RdfMappingModelVo rdfMappingModelVo) {
        log.debug("[RDF 매핑 모델 등록] 서비스 시작");
        try {
            editModeYn = true;
            modifyModeYn = false;
            mappingModelValidate(rdfMappingModelVo);
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            rdfMappingModelVo.setRdfMappgModelRegrId(loginUserVo.getUserId());
            rdfMappingModelVo.setRdfMappgModelRegrNm(loginUserVo.getUserNm());
            rdfMappingModelVo.setRdfMappgModelAmdrId(loginUserVo.getUserId());
            rdfMappingModelVo.setRdfMappgModelAmdrNm(loginUserVo.getUserNm());
            rdfMappingMapper.insertRdfMappingModel(rdfMappingModelVo);

            RdfMappingModelSearchVo searchVo = new RdfMappingModelSearchVo();
            searchVo.setRdfMappgId(rdfMappingModelVo.getRdfMappgId());
            int maxOdrg = rdfMappingMapper.selectRdfMappingModelMaxOdrg(searchVo);

            rdfMappingModelVo.setRdfCondOdrg(maxOdrg + 1);
            rdfMappingMapper.updateRdfMappingModelOdrg(rdfMappingModelVo);

            // clear cache
            cacheService.removeRdfMappingModelList(rdfMappingModelVo.getRdfMappgId());

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 매핑 모델 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 매핑 모델 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 모델 등록] 서비스 종료");
        return rdfMappingModelVo.getRdfMappgModelId();
    }

    /**
     * RDF 매핑 모델 수정
     *
     * @param rdfMappingModelVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 12.
     */
    public void modifyMappingModel(RdfMappingModelVo rdfMappingModelVo) {
        log.debug("[RDF 매핑 모델 수정] 서비스 시작");
        try {
            editModeYn = false;
            modifyModeYn = true;
            mappingModelValidate(rdfMappingModelVo);
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            rdfMappingModelVo.setRdfMappgModelAmdrId(loginUserVo.getUserId());
            rdfMappingModelVo.setRdfMappgModelAmdrNm(loginUserVo.getUserNm());
            rdfMappingMapper.updateRdfMappingModel(rdfMappingModelVo);

            // clear cache
            this.clearAllCachesByMappgModelId(rdfMappingModelVo.getRdfMappgModelId());

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 매핑 모델 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 매핑 모델 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 모델 수정] 서비스 종료");
    }

    /**
     * RDF 매핑 모델 삭제
     *
     * @param rdfMappgModelId
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 18.
     */
    public void deleteMappingModel(String rdfMappgModelId) {
        log.debug("[RDF 매핑 모델 삭제] 서비스 시작");
        try {

            StringBuffer sb = new StringBuffer();

            //필수 check
            if (StringUtils.isBlank(rdfMappgModelId)) {
                sb.append("rdfMappgModelId").append(ValueUtil.required()).append("\n");
            }

            if (sb.length() > 0) throw new ResBadRequestException(sb.toString());

            //data check
            RdfMappingModelVo paramVo = new RdfMappingModelVo();
            paramVo.setRdfMappgModelId(rdfMappgModelId);

            RdfMappingModelVo delVo = rdfMappingMapper.selectRdfMappingModel(paramVo);
            if (delVo == null) throw new ResBizInfoException("RDF 매핑 모델 데이터가 존재하지 않습니다.");

            rdfMappingRuleMapper.deleteRdfMappingRuleByRdfModelId(delVo);
            rdfMappingMapper.deleteRdfMappingModel(delVo);

            // clear cache
            cacheService.removeRdfMappingModelList(delVo.getRdfMappgId());
            this.clearAllCachesByMappgModelId(rdfMappgModelId);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 네임스페이스 삭제] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 네임스페이스 삭제] 실패/오류", e);
        }
    }

    /**
     * RDF 매핑 모델 ID로 RDF 매핑 tree 목록 조회
     *
     * @param rdfMappgModelId
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 10.
     */
    public List<RdfMappingTreeVo> getMappingTreeListByRdfModelId(String rdfMappgModelId) {
        log.debug("[RDF 매핑 모델 ID로 RDF 매핑 tree 목록 조회] 서비스 시작");
        List<RdfMappingTreeVo> list = null;

        try {
            if (StringUtils.isNotBlank(rdfMappgModelId)) {
                RdfMappingTreeSearchVo searchVo = new RdfMappingTreeSearchVo();
                searchVo.setRdfMappgModelId(rdfMappgModelId);
                list = rdfMappingMapper.selectRdfMappingTreeList(searchVo);
            }

        } catch (Exception e) {
            log.error("[RDF 매핑 모델 ID로 RDF 매핑 tree 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 모델 ID로 RDF 매핑 tree 목록 조회] 서비스 종료");
        return list;
    }

    /**
     * RDF 프라퍼티 정의 삭제를 위한 RDF 매핑 체크
     *
     * @param rdfPrptyId
     * @param domnRangeDivMtcd
     * @param rdfClassId
     * @return
     * @Author : heenim
     * @Date : 2023. 07. 25.
     */
    public boolean checkMappingForPrptyDefineDel(String rdfPrptyId, String domnRangeDivMtcd, String rdfClassId) {
        log.debug("[RDF 프라퍼티 정의 삭제를 위한 RDF 매핑 체크] 서비스 시작");
        boolean bCheck = false;
        List<RdfMappingTreeVo> list = null;

        try {
            RdfMappingTreeSearchVo searchVo = new RdfMappingTreeSearchVo();
            if ("domain".equals(domnRangeDivMtcd)) {
                searchVo.setUpNodeDivId(rdfClassId);
                searchVo.setNodeDivId(rdfPrptyId);
                list = rdfMappingMapper.selectRdfMappingTreeList(searchVo);
            } else { // range
                searchVo.setUpNodeDivId(rdfPrptyId);
                searchVo.setNodeDivId(rdfClassId);
                list = rdfMappingMapper.selectRdfMappingTreeList(searchVo);
            }

            if (list == null || list.size() == 0) {
                bCheck = true;
            }

        } catch (Exception e) {
            log.error("[RDF 프라퍼티 정의 삭제를 위한 RDF 매핑 체크] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 프라퍼티 정의 삭제를 위한 RDF 매핑 체크] 서비스 종료");
        return bCheck;
    }

    /**
     * RDF 매핑 모델 ID 로 관련 캐시 클리어
     * @param rdfMappgModelId
     */
    private void clearAllCachesByMappgModelId(String rdfMappgModelId) {
        cacheService.removeRdfMappingRuleList(rdfMappgModelId);
        cacheService.removeRdfNamespaceList(rdfMappgModelId);
        cacheService.removeRdfMapping(rdfMappgModelId);
    }

}
