package kr.co.n2m.platform.meta.rdf.mapping.service;

import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleDto;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleSearchVo;
import kr.co.n2m.platform.meta.rdf.mapping.domain.RdfMappingRuleVo;
import kr.co.n2m.platform.meta.rdf.mapping.mapper.RdfMappingRuleMapper;
import kr.co.n2m.platform.meta.rdf.namespace.domain.RdfNamespaceVo;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class RdfMappingRuleService {

    @Autowired
    RdfMappingRuleMapper rdfMappingRuleMapper;

    @Autowired
    private RdfMappingCacheService cacheService;

    private boolean editModeYn = false;
    private boolean modifyModeYn = false;

    /**
     * RDF 매핑 규칙 등록, 수정 시 유효성 검사
     *
     * @param rdfMappingVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 19.
     */
    private void mappingRuleValidate(RdfMappingRuleVo rdfMappingRuleVo) {
        /***************************************** 유효성 검사 - 등록 or 수정 *****************************************/
        // 1. Null
        StringBuffer sb = new StringBuffer();
        if (editModeYn) {
            if (StringUtils.isBlank(rdfMappingRuleVo.getRdfMappgModelId())) {
                sb.append("rdfMappgModelId").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(rdfMappingRuleVo.getUpRdfMappgRuleId())) {
                sb.append("upRdfMappgRuleId").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(rdfMappingRuleVo.getRdfPrptyId())) {
                sb.append("rdfPrptyId").append(ValueUtil.required()).append("\n");
            }
        }
        if (modifyModeYn) {
            if (StringUtils.isBlank(rdfMappingRuleVo.getRdfMappgRuleId())) {
                sb.append("rdfMappgRuleId").append(ValueUtil.required()).append("\n");
            }
            if (StringUtils.isBlank(rdfMappingRuleVo.getObjtDataMappgYn())) {
                sb.append("objtDataMappgYn").append(ValueUtil.required()).append("\n");
            }
        }
        if (sb.length() > 0) throw new ResBadRequestException(sb.toString());

    }

    /**
     * RDF 모델 ID 로 RDF 매핑 규칙 목록 조회
     *
     * @param rdfMappingRuleSearchVo
     * @return
     * @Author : heenim
     * @Date : 2023. 07. 07.
     */
    public List<RdfMappingRuleDto> getRdfMappingRuleListByRdfModelId(RdfMappingRuleSearchVo rdfMappingRuleSearchVo) {
        log.debug("[RDF 모델 ID 로 RDF 매핑 규칙 목록 조회] 서비스 시작");
        List<RdfMappingRuleDto> list = null;

        try {
			list = rdfMappingRuleMapper.selectRdfMappingRuleListByRdfModelId(rdfMappingRuleSearchVo);
        } catch (Exception e) {
            log.error("[RDF 모델 ID 로 RDF 매핑 규칙 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 모델 ID 로 RDF 매핑 규칙 목록 조회] 서비스 종료");
        return list;
    }

    /**
     * RDF 모델 ID 로 RDF 네임스페이스 목록 조회
     *
     * @param rdfMappingRuleSearchVo
     * @return
     * @Author : heenim
     * @Date : 2023. 07. 11.
     */
    public List<RdfNamespaceVo> getRdfNamespaceListByRdfModelId(RdfMappingRuleSearchVo rdfMappingRuleSearchVo) {
        log.debug("[RDF 모델 ID 로 RDF 네임스페이스 목록 조회] 서비스 시작");
        List<RdfNamespaceVo> list = null;

        try {
 			list = rdfMappingRuleMapper.selectRdfNamespaceListByRdfModelId(rdfMappingRuleSearchVo);
        } catch (Exception e) {
            log.error("[RDF 모델 ID 로 RDF 네임스페이스 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 모델 ID 로 RDF 네임스페이스 목록 조회] 서비스 종료");
        return list;
    }

    /**
     * RDF 매핑 규칙 생성
     *
     * @param rdfMappingRuleVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 13.
     */
    public void createMappingrule(RdfMappingRuleVo rdfMappingRuleVo) {
        log.debug("[RDF 매핑 규칙 생성] 서비스 시작");
        try {
            editModeYn = true;
            modifyModeYn = false;
            mappingRuleValidate(rdfMappingRuleVo);
            int rdfMappgRuleOdrg = rdfMappingRuleMapper.selectRdfMappingRuleMaxOdrg(rdfMappingRuleVo);
            rdfMappingRuleVo.setRdfMappgRuleOdrg(rdfMappgRuleOdrg);
            rdfMappingRuleMapper.insertRdfMappingRule(rdfMappingRuleVo);

            // clear cache
            cacheService.removeRdfMappingRuleList(rdfMappingRuleVo.getRdfMappgModelId());
            cacheService.removeRdfNamespaceList(rdfMappingRuleVo.getRdfMappgModelId());

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 매핑 규칙 생성] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 매핑 규칙 생성] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 규칙 생성] 서비스 종료");
    }

    /**
     * RDF 매핑 규칙 수정
     *
     * @param rdfMappingRuleVo
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 12.
     */
    public void modifyMappingrule(RdfMappingRuleDto rdfMappingRuleDto) {
        log.debug("[RDF 매핑 규칙 수정] 서비스 시작");
        try {
            editModeYn = false;
            modifyModeYn = true;
            mappingRuleValidate(rdfMappingRuleDto);

            if ("N".equals(rdfMappingRuleDto.getObjtLiteralYn())) {
                String objtRdfMappgId = rdfMappingRuleMapper.selectRdfMappingIdByObjtPrptyId(rdfMappingRuleDto);
                rdfMappingRuleDto.setObjtRdfMappgId(objtRdfMappgId);
            }

            rdfMappingRuleMapper.updateRdfMappingrule(rdfMappingRuleDto);

            if ("N".equals(rdfMappingRuleDto.getObjtDataMappgYn())) {
                int objtPrptyIdExist = rdfMappingRuleMapper.selectRdfMappingRuleObjtPrptyIdExist(rdfMappingRuleDto);

                if (objtPrptyIdExist > 0) {
                    RdfMappingRuleVo ruleVo = new RdfMappingRuleVo();
                    ruleVo.setRdfMappgRuleId(rdfMappingRuleDto.getRdfMappgRuleId());
                    ruleVo.setObjtDataMappgYn("Y");
                    rdfMappingRuleMapper.updateRdfMappingrule(ruleVo);
                }
            }
	            
            // clear cache
            cacheService.removeRdfMappingRuleList(rdfMappingRuleDto.getRdfMappgModelId());
            cacheService.removeRdfNamespaceList(rdfMappingRuleDto.getRdfMappgModelId());

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 매핑 규칙 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 매핑 규칙 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 규칙 수정] 서비스 종료");
    }

    /**
     * RDF 매핑 규칙 삭제
     *
     * @param rdfMappgRuleId
     * @return
     * @Author : tklee
     * @Date : 2023. 07. 18.
     */
    public void deleteMappingrule(String rdfMappgRuleId) {
        log.debug("[RDF 매핑 규칙 삭제] 서비스 시작");
        try {

            StringBuffer sb = new StringBuffer();

            //필수 check
            if (StringUtils.isBlank(rdfMappgRuleId)) {
                sb.append("rdfMappgRuleId").append(ValueUtil.required()).append("\n");
            }

            if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
            
            RdfMappingRuleVo searchVo = new RdfMappingRuleVo();
            searchVo.setRdfMappgRuleId(rdfMappgRuleId);
            RdfMappingRuleVo rdfMappingRuleVo = rdfMappingRuleMapper.selectRdfMappingRule(searchVo);
            if (rdfMappingRuleVo == null) throw new ResBizInfoException("삭제할 데이터가 없습니다.");
            
            rdfMappingRuleMapper.deleteMappingrule(rdfMappingRuleVo);

            // clear cache
            cacheService.removeRdfMappingRuleList(rdfMappingRuleVo.getRdfMappgModelId());
            cacheService.removeRdfNamespaceList(rdfMappingRuleVo.getRdfMappgModelId());

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[RDF 매핑 규칙 삭제] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[RDF 매핑 규칙 삭제] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }

        log.debug("[RDF 매핑 규칙 삭제] 서비스 종료");
    }

}
