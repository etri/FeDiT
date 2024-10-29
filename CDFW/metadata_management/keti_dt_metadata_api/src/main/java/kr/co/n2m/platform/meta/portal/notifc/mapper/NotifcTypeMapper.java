package kr.co.n2m.platform.meta.portal.notifc.mapper;

import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTypeDto;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTypeVo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface NotifcTypeMapper {

	/** 알림 유형 목록 건수 조회 */
	int selectNotifcTypeCount(NotifcSearchVo searchVo);

	/** 알림 유형 목록 조회 */
	List<NotifcTypeDto> selectNotifcTypeList(NotifcSearchVo searchVo);

	/** 알림 유형 상세 조회 */
	NotifcTypeVo selectNotifcType(NotifcSearchVo searchVo);

	/** 알림 유형 등록 */
	void insertNotifcType(NotifcTypeVo notifcTypeVo);

	/** 알림 타입 ID 중복 확인 - 등록 유효성 검사 */
	boolean isNotifcTypeIdExist(String notifcTypeId);

	/** 알림 유형 수정 */
	void updateNotifcType(NotifcTypeVo notifcTypeVo);

	/** 알림 유형 삭제 */
	void deleteNotifcType(String notifcTypeId);

	/** 알림 대상 테이블에 알림 유형 존재 확인 - 삭제 유효성 검사 */
	boolean isNotifcTypeIdExistInTarget(String notifcTypeId);
}