package kr.co.n2m.platform.meta.collection.service;


import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.collection.domain.CollectionSearchVo;
import kr.co.n2m.platform.meta.collection.domain.CollectionWorkDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionWorkVo;
import kr.co.n2m.platform.meta.collection.mapper.CollectionLogMapper;
import kr.co.n2m.platform.meta.collection.mapper.CollectionWorkMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "rdbTransactionManager")
public class CollectionWorkService {

    private final CollectionWorkMapper collectionWorkMapper;

    private final CollectionLogMapper collectionLogMapper;

    private final String STATUS_MTCD_PROCESSING = "proc";

    /**
     * 수집 작업 목록 조회
     *
     * @param searchVo
     * @return
     * @Author : Ran
     * @Date : 2023. 10. 25.
     */
    public SearchResultListVo getWorkList(CollectionSearchVo searchVo) {
        log.debug("[수집 작업 목록 조회] 서비스 시작");
        SearchResultListVo listVo = new SearchResultListVo();
        try {
            int totalListSize = collectionWorkMapper.selectCollectionWorkCount(searchVo);
            searchVo.setTotalListSize(totalListSize);
            List<CollectionWorkDto> list = collectionWorkMapper.selectCollectionWorkList(searchVo);

            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));
        } catch (Exception e) {
            log.error("[수집 작업 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[수집 작업  목록 조회] 서비스 종료");
        return listVo;
    }

    /**
     * 수집 작업 상세 조회
     *
     * @param colecWrkId
     * @return
     * @Author : Ran
     * @Date : 2023. 10. 25.
     */
    public CollectionWorkDto getWork(String colecWrkId) {
        log.debug("[수집 작업 상세 조회] 서비스 시작");
        CollectionWorkDto collectionWorkDto = null;
        CollectionSearchVo searchVo = CollectionSearchVo.builder().colecWrkId(colecWrkId).build();
        try {
            collectionWorkDto = collectionWorkMapper.selectCollectionWork(searchVo);
        } catch (Exception e) {
            log.error("[수집 작업 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[수집 작업 상세 조회] 서비스 종료");
        return collectionWorkDto;
    }

    /**
     * 수집 작업 등록, 수정 시 유효성 검사
     *
     * @param workVo
     * @return
     * @Author : Ran
     * @Date : 2023. 10. 31.
     */
    private void validate(CollectionWorkVo workVo) {
        if (StringUtils.isBlank(workVo.getColecWrkSttusMtcd())) {
            throw new ResBizInfoException("colecWrkSttusMtcd는 필수로 입력하셔야 합니다.");
        }
        if (StringUtils.isBlank(workVo.getColecLogId())) {
            throw new ResBizInfoException("colecLogId는 필수로 입력하셔야 합니다.");
        }
        boolean logExistYn = collectionLogMapper.isLogExist(workVo.getColecLogId());
        if (logExistYn == false) {
            throw new ResBizInfoException("colecLogId(" + workVo.getColecLogId() + ")는 존재하지 않습니다.");
        }
    }

    /**
     * 수집 작업 등록
     *
     * @param workVo
     * @return
     * @Author : Ran
     * @Date : 2023. 10. 25.
     */
    public String createWork(CollectionWorkVo workVo) {
        log.debug("[수집 작업 등록] 서비스 시작");
        try {
            workVo.setColecWrkSttusMtcd(STATUS_MTCD_PROCESSING);
            validate(workVo);
            String key = ValueUtil.generateLogKey("CWK");
            workVo.setColecWrkId(key);
            collectionWorkMapper.insertCollectionWork(workVo);
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[수집 작업 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[수집 작업 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[수집 작업 등록] 서비스 종료");
        return workVo.getColecWrkId();
    }

    /**
     * 수집 작업 수정
     *
     * @param workVo
     * @return
     * @Author : Ran
     * @Date : 2023. 10. 25.
     */
    public void modifyWork(CollectionWorkVo workVo) {
        log.debug("[수집 작업 수정] 서비스 시작");
        try {
            validate(workVo);
            collectionWorkMapper.updateCollectionWork(workVo);
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[수집 작업 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[수집 작업 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[수집 작업 수정] 서비스 종료");
    }

}
