package kr.co.n2m.platform.meta.portal.notifc.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTypeDto;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTypeVo;
import kr.co.n2m.platform.meta.portal.notifc.mapper.NotifcTypeMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class NotifcTypeService {

	@Autowired
    private NotifcTypeMapper notifcTypeMapper;

	@Autowired
    private NotifcService notifcService;
	
	@PostConstruct
	public void init() {
		notifcService.setNotifcTypeService(this); // 순환참조 오류 방지
	}	

    /**
     * 알림 유형 목록 조회
     *
     * @param searchVo
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 08.
     */
    public SearchResultListVo getNotifcTypeList(NotifcSearchVo searchVo) {
        log.debug("[알림 유형 목록 조회] 서비스 시작");
        SearchResultListVo listVo = new SearchResultListVo();
        try {
            int totalListSize = notifcTypeMapper.selectNotifcTypeCount(searchVo);
            searchVo.setTotalListSize(totalListSize);
            List<NotifcTypeDto> list = notifcTypeMapper.selectNotifcTypeList(searchVo);
            listVo.setList(list);
            listVo.setPage(new PageVo(searchVo));
        } catch (Exception e) {
            log.error("[알림 유형 목록 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 유형 목록 조회] 서비스 종료");
        return listVo;
    }

    /**
     * 알림 유형 상세 조회
     *
     * @param notifcTypeId
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public NotifcTypeVo getNotifcTypeDetail(String notifcTypeId) {
        log.debug("[알림 유형 상세 조회] 서비스 시작");
        NotifcTypeVo notifcTypeVo = null;
        try {
            NotifcSearchVo searchVo =  NotifcSearchVo.builder()
                    .notifcTypeId(notifcTypeId)
                    .build();
            notifcTypeVo = notifcTypeMapper.selectNotifcType(searchVo);
        }catch (Exception e) {
            log.error("[알림 유형 상세 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 유형 상세 조회] 서비스 종료");
        return notifcTypeVo;
    }

    /**
     * 알림 유형 ID 중복 조회
     *
     * @param notifcTypeId
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public Map<String, Boolean> isNotifcTypeIdExist(String notifcTypeId) {
        log.debug("[알림 유형 ID 중복 조회] 서비스 시작");
        Map<String, Boolean> resMap = new HashMap<>();
        try {
            boolean isIdDuplicated = notifcTypeMapper.isNotifcTypeIdExist(notifcTypeId);
            resMap.put("duplicated", isIdDuplicated);
        } catch (Exception e) {
            log.error("[알림 유형 ID 중복 조회] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 유형 ID 중복 조회] 서비스 종료");
        return resMap;
    }

    /**
     * 알림 유형 등록
     *
     * @param notifcTypeVo
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 08.
     */
    public String createNotifcType(NotifcTypeVo notifcTypeVo) {
        log.debug("[알림 유형 등록] 서비스 시작");
        try {
            boolean existYn = notifcTypeMapper.isNotifcTypeIdExist(notifcTypeVo.getNotifcTypeId());
            if(existYn){
                throw new ResBadRequestException("중복된 notifcTypeId(" + notifcTypeVo.getNotifcTypeId() + ")가 존재합니다.");
            }
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            notifcTypeVo.setNotifcTypeRegrId(loginUserVo.getUserId());
            notifcTypeVo.setNotifcTypeRegrNm(loginUserVo.getUserNm());
            notifcTypeVo.setNotifcTypeAmdrId(loginUserVo.getUserId());
            notifcTypeVo.setNotifcTypeAmdrNm(loginUserVo.getUserNm());
            notifcTypeMapper.insertNotifcType(notifcTypeVo);
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[알림 유형 등록] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[알림 유형 등록] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 유형 등록] 서비스 종료");
        return notifcTypeVo.getNotifcTypeId();
    }

    /**
     * 알림 유형 수정
     *
     * @param notifcTypeVo
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public String modifyNotifcType(NotifcTypeVo notifcTypeVo) {
        log.debug("[알림 유형 수정] 서비스 시작");
        try {
            boolean existYn = notifcTypeMapper.isNotifcTypeIdExist(notifcTypeVo.getNotifcTypeId());
            if(!existYn){
                throw new ResBadRequestException("notifcTypeId(" + notifcTypeVo.getNotifcTypeId() + ")가 존재하지 않습니다.");
            }
            LoginUserVo loginUserVo = AuthUtil.getLoginUserVoFromRequest();
            notifcTypeVo.setNotifcTypeAmdrId(loginUserVo.getUserId());
            notifcTypeVo.setNotifcTypeAmdrNm(loginUserVo.getUserNm());
            notifcTypeMapper.updateNotifcType(notifcTypeVo);

        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[알림 유형 수정] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[알림 유형 수정] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 유형 수정] 서비스 종료");
        return notifcTypeVo.getNotifcTypeId();
    }

    /**
     * 알림 유형 삭제
     *
     * @param notifcTypeId
     * @return
     * @Author : Ran
     * @Date : 2023. 08. 09.
     */
    public void deleteNotifcType(String notifcTypeId) {
        log.debug("[알림 유형 삭제] 서비스 시작");
        try {
            boolean existYn = notifcTypeMapper.isNotifcTypeIdExist(notifcTypeId);
            if(!existYn){
                throw new ResNotFoundException("notifcTypeId(" + notifcTypeId + ")가 존재하지 않습니다.");
            }
            boolean existYnInTarget = notifcTypeMapper.isNotifcTypeIdExistInTarget(notifcTypeId);
            if(existYnInTarget){
                throw new ResBadRequestException("notifcTypeId(" + notifcTypeId + ")가 알림 대상에 존재합니다. 관련된 알림 대상을 모두 삭제하신 후, 삭제 가능합니다. ");
            }
            
            // 알림 유형 관련 설정 전체 삭제
            notifcService.deleteNotifcSettingAllByTypeId(notifcTypeId);
            
            // 삭제
            notifcTypeMapper.deleteNotifcType(notifcTypeId);
            
        } catch (ResBadRequestException | ResBizInfoException e) {
            log.info("[알림 유형 삭제] 실패/오류 (정보성) : {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[알림 유형 삭제] 실패/오류", e);
            throw new ResBaseRuntimeException(e);
        }
        log.debug("[알림 유형 삭제] 서비스 종료");
    }
}