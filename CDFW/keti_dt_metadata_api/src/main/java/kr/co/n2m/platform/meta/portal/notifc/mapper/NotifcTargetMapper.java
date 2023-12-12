package kr.co.n2m.platform.meta.portal.notifc.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTargetVo;

@Mapper
public interface NotifcTargetMapper {

    /** 알림 대상 목록 건수 조회 */
    int selectNotifcTargetCount(NotifcSearchVo searchVo);

    /** 알림 대상 목록 조회 */
    List<NotifcTargetVo> selectNotifcTargetList(NotifcSearchVo searchVo);

    /** 알림 대상 상세 조회 */
    NotifcTargetVo selectNotifcTarget(NotifcSearchVo searchVo);

    /** 알림 대상 등록 */
    void insertNotifcTarget(NotifcTargetVo notificTargetVo);

    /** 알림 대상 수정 */
    void updateNotifcTarget(NotifcTargetVo notificTargetVo);

    /** 알림 대상 존재 확인 */
    boolean isNotifcTgtIdExist(String notifcTgtId);

    /** 알림 대상 삭제 */
    void deleteNotifcTarget(String notifcTgtId);
        
    /**
     * 알림 유형 ID 로 대상자 ID들 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 24.
     * @param notifcSearchVo
     * @return
     */
    List<NotifcTargetVo> selectNotifcTargetIdsByTypeId(NotifcSearchVo notifcSearchVo);

}