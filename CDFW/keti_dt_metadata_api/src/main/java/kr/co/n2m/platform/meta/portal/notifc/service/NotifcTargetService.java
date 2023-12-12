package kr.co.n2m.platform.meta.portal.notifc.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTargetVo;
import kr.co.n2m.platform.meta.portal.notifc.mapper.NotifcTargetMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "rdbTransactionManager")
public class NotifcTargetService {

    private final NotifcTargetMapper notifcTargetMapper;

    /**
     * 알림 대상 목록 조회
     *
     * @param searchVo
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public SearchResultListVo getNotifcTargetList(NotifcSearchVo searchVo) {
        log.debug("[알림 대상 목록 조회] 서비스 시작");
        SearchResultListVo listVo = new SearchResultListVo();
        try {
            int totalListSize = notifcTargetMapper.selectNotifcTargetCount(searchVo);
            searchVo.setTotalListSize(totalListSize);
            List<NotifcTargetVo> list = notifcTargetMapper.selectNotifcTargetList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));
        } catch (Exception e) {
            log.error("[알림 대상 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 대상 목록 조회] 서비스 종료");
        return listVo;
    }

    /**
     * 알림 대상 상세 조회
     *
     * @param notifcTgtId
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public NotifcTargetVo getNotifcTargetDetail(String notifcTgtId) {
        log.debug("[알림 대상 상세 조회] 서비스 시작");
        NotifcTargetVo notifcTargetVo = null;
        try {
            NotifcSearchVo searchVo =  NotifcSearchVo.builder()
                    .notifcTgtId(notifcTgtId)
                    .build();
            notifcTargetVo = notifcTargetMapper.selectNotifcTarget(searchVo);
        }catch (Exception e) {
            log.error("[알림 대상 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 대상 상세 조회] 서비스 종료");
        return notifcTargetVo;
    }

    /**
     * 알림 대상 등록
     *
     * @param notifcTargetVo
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public String createNotifcTarget(NotifcTargetVo notifcTargetVo) {
        log.debug("[알림 대상 등록] 서비스 시작");
        try {
            // validate()
            notifcTargetMapper.insertNotifcTarget(notifcTargetVo);
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[알림 대상 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[알림 대상 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 대상 등록] 서비스 종료");
        return notifcTargetVo.getNotifcTypeId();
    }

    /**
     * 알림 대상 수정
     *
     * @param notifcTargetVo
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public String modifyNotifcTarget(NotifcTargetVo notifcTargetVo) {
        log.debug("[알림 대상 수정] 서비스 시작");
        try {
            // validate
            boolean existYn = notifcTargetMapper.isNotifcTgtIdExist(notifcTargetVo.getNotifcTgtId());
            if(!existYn){
                throw new ResBadRequestException("notifcTgtId(" + notifcTargetVo.getNotifcTgtId() + ")가 존재하지 않습니다.");
            }
            notifcTargetMapper.updateNotifcTarget(notifcTargetVo);
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[알림 대상 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[알림 대상 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 대상 수정] 서비스 종료");
        return notifcTargetVo.getNotifcTypeId();
    }

    /**
     * 알림 대상 삭제
     *
     * @param notifcTgtId
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public void deleteNotifcTarget(String notifcTgtId) {
        log.debug("[알림 대상 삭제] 서비스 시작");
        try {
            boolean existYn = notifcTargetMapper.isNotifcTgtIdExist(notifcTgtId);
            if(!existYn){
                throw new ResBadRequestException("notifcTgtId(" + notifcTgtId + ")가 존재하지 않습니다.");
            }
            notifcTargetMapper.deleteNotifcTarget(notifcTgtId);
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[알림 대상 삭제] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[알림 대상 삭제] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 대상 삭제] 서비스 종료");
    }
    
	/**
	 * 알림 유형 ID 로 대상자 ID들 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 24.
	 * @param notifcTypeId
	 * @return
	 */
	public List<NotifcTargetVo> getNotifcTargetIdsByTypeId(String notifcTypeId) {
		log.debug("[알림 유형 ID 로 대상자 ID들 조회] 서비스 시작");
		List<NotifcTargetVo> list = null;
		
		try {
			NotifcSearchVo notifcSearchVo = new NotifcSearchVo();
			notifcSearchVo.setNotifcTypeId(notifcTypeId);
			list = notifcTargetMapper.selectNotifcTargetIdsByTypeId(notifcSearchVo);
			
		} catch (Exception e) {
			log.error("알림 유형 ID 로 대상자 ID들 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[알림 유형 ID 로 대상자 ID들 조회] 서비스 종료");
		return list;
	}
	
}