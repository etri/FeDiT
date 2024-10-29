package kr.co.n2m.platform.meta.collection.service;

import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.collection.domain.CollectionLogDto;
import kr.co.n2m.platform.meta.collection.domain.CollectionLogVo;
import kr.co.n2m.platform.meta.collection.domain.CollectionSearchVo;
import kr.co.n2m.platform.meta.collection.mapper.CollectionLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "rdbTransactionManager")
public class CollectionLogService {

    private final CollectionLogMapper collectionLogMapper;

    /**
     * 수집 로그 목록 조회
     * @Author      : Ran
     * @Date        : 2023. 10. 25.
     * @param searchVo
     * @return
     */
    public SearchResultListVo getLogList(CollectionSearchVo searchVo){
        log.debug("[수집 로그 목록 조회] 서비스 시작");
        SearchResultListVo listVo = new SearchResultListVo();
        try {
            int totalListSize = collectionLogMapper.selectCollectionLogCount(searchVo);
            searchVo.setTotalListSize(totalListSize);
            List<CollectionLogDto> list = collectionLogMapper.selectCollectionLogList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));
        }catch (Exception e){
            log.error("[수집 로그 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[수집 로그  목록 조회] 서비스 종료");
        return listVo;
    }

    /**
     * 수집 로그 상세 조회
     * @Author      : Ran
     * @Date        : 2023. 10. 25.
     * @param colecLogId
     * @return
     */
    public CollectionLogDto getLog(String colecLogId){
        log.debug("[수집 로그 상세 조회] 서비스 시작");
        CollectionLogDto collectionLogDto = null;
        CollectionSearchVo searchVo= CollectionSearchVo.builder()
                .colecLogId(colecLogId)
                .build();
        try {
            searchVo.setColecLogId(colecLogId);
            collectionLogDto = collectionLogMapper.selectCollectionLog(searchVo);
        }catch (Exception e){
            log.error("[수집 로그 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[수집 로그 상세 조회] 서비스 종료");
        return collectionLogDto;
    }

    /**
     * 수집 로그 등록
     * @Author      : Ran
     * @Date        : 2023. 10. 25.
     * @param logVo
     * @return
     */
    public String createLog(CollectionLogVo logVo){
        log.debug("[수집 로그 등록] 서비스 시작");
        try{
            // TODO json 형식 확인
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            logVo.setColecLogRegrId(loginUserVo.getUserId());
            logVo.setColecLogRegrNm(loginUserVo.getUserNm());
            String key = ValueUtil.generateLogKey("CLG");
            logVo.setColecLogId(key);
            collectionLogMapper.insertCollectionLog(logVo);
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[수집 로그 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[수집 로그 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[수집 로그 등록] 서비스 종료");
        return logVo.getColecLogId();
    }
}