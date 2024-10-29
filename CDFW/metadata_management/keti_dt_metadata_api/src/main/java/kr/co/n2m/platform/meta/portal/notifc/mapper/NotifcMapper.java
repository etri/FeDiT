package kr.co.n2m.platform.meta.portal.notifc.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcDto;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcMySearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSettingDto;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSettingVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcVo;

@Mapper
public interface NotifcMapper {

	/**
	 * 내 알림 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public int selectMyNotifcCount(NotifcMySearchVo notifcMySearchVo);
	
	/**
	 * 내 알림 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public List<NotifcDto> selectMyNotifcList(NotifcMySearchVo notifcMySearchVo);

	/**
	 * 알림 등록 (사용자별 알림)
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcVo
	 * @return
	 */
	public int insertNotifc(NotifcVo notifcVo);
	
	/**
	 * 알림 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcVo
	 * @return
	 */
	public int deleteNotifc(NotifcVo notifcVo);
	
	/**
	 * 내 확인된 알림 목록 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public int selectMyNotifcConfirmedCount(NotifcMySearchVo notifcMySearchVo);
	
	/**
	 * 내 확인된 알림 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public List<NotifcDto> selectMyNotifcConfirmedList(NotifcMySearchVo notifcMySearchVo);
	
	/**
	 * 알림 확인 등록 (사용자별 알림확인)
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcVo
	 * @return
	 */
	public int insertNotifcConfirmedBySelectingById(NotifcVo notifcVo);
	
	/**
	 * 내 알림 설정 카운트 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public int selectMyNotifcSettingCount(NotifcMySearchVo notifcMySearchVo);	
	
	/**
	 * 내 알림 설정 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public List<NotifcSettingDto> selectMyNotifcSettingList(NotifcMySearchVo notifcMySearchVo);
	
	/**
	 * 내 알림 설정 등록 (사용자별 알림설정)
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcSettingVo
	 * @return
	 */
	public int insertNotifcSettingAutoKey(NotifcSettingVo notifcSettingVo);
	
	/**
	 * 내 알림 설정 수정
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcSettingVo
	 * @return
	 */
	public int updateNotifcSetting(NotifcSettingVo notifcSettingVo);
	
	/**
	 * 알림 유형 ID 로 알림 설정 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcSettingVo
	 * @return
	 */
	public int deleteNotifcSettingAllByTypeId(NotifcSettingVo notifcSettingVo);
	
}
