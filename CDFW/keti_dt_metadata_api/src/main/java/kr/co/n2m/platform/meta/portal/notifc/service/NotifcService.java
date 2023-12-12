package kr.co.n2m.platform.meta.portal.notifc.service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchResultListVo;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.architecture.exception.ResNotFoundException;
import kr.co.n2m.platform.meta.architecture.util.ValueUtil;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonSearchVo;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonUserDto;
import kr.co.n2m.platform.meta.portal.commondata.service.CommonDataService;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcDto;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcMySearchVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSendDto;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSettingDto;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcSettingVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTargetVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcTypeVo;
import kr.co.n2m.platform.meta.portal.notifc.domain.NotifcVo;
import kr.co.n2m.platform.meta.portal.notifc.mapper.NotifcMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class NotifcService {

	@Autowired
	private NotifcMapper notifcMapper;
	
	@Autowired
	NotifcTargetService notifcTargetService;
	
	@Autowired
	CommonDataService commonDataService;
	
	@Autowired
    private SimpMessageSendingOperations messagingTemplate;	
	
	private NotifcTypeService notifcTypeService; // 순환참조 오류 방지
	
	public void setNotifcTypeService(NotifcTypeService notifcTypeService) { // 순환참조 오류 방지
		this.notifcTypeService = notifcTypeService;
	}
	
	/**
	 * 내 알림 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public SearchResultListVo getMyNotifcList(NotifcMySearchVo notifcMySearchVo) {
		log.debug("[내 알림 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = notifcMapper.selectMyNotifcCount(notifcMySearchVo);
			notifcMySearchVo.setTotalListSize(totalListSize);
			
			List<NotifcDto> list = notifcMapper.selectMyNotifcList(notifcMySearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(notifcMySearchVo));
			
		} catch (Exception e) {
			log.error("[내 알림 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[내 알림 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 내 확인된 알림 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public SearchResultListVo getMyNotifcConfirmedList(NotifcMySearchVo notifcMySearchVo) {
		log.debug("[내 확인된 알림 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = notifcMapper.selectMyNotifcConfirmedCount(notifcMySearchVo);
			notifcMySearchVo.setTotalListSize(totalListSize);
			
			List<NotifcDto> list = notifcMapper.selectMyNotifcConfirmedList(notifcMySearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(notifcMySearchVo));
			
		} catch (Exception e) {
			log.error("[내 확인된 알림 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[내 확인된 알림 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 내 알림 확인
	 * @Author      : heenim
	 * @Date        : 2023. 08. 22.
	 * @param notifcIdList
	 */
	public void saveMyConfirmedNotifc(List<String> notifcIdList) {
		log.debug("[내 알림 확인] 서비스 시작");
		
		try {
			if (notifcIdList == null || notifcIdList.size() == 0) return;

			NotifcVo notifcVo = new NotifcVo();
			for (String id : notifcIdList) {
				// 알림확인 등록
				notifcVo.setNotifcId(id);
				notifcMapper.insertNotifcConfirmedBySelectingById(notifcVo);
				// 알림 삭제
				notifcMapper.deleteNotifc(notifcVo);
			}
			
		} catch (Exception e) {
			log.error("[내 알림 확인] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[내 알림 확인] 서비스 종료");		
	}
	
	/**
	 * 알림 발송
	 * @Author      : heenim
	 * @Date        : 2023. 08. 23.
	 * @param notifcSendDto
	 * @return
	 */
	public int sendNotifc(NotifcSendDto notifcSendDto) {
		log.debug("[알림 발송] 서비스 시작 - {}", notifcSendDto.getNotifcTypeId());
		int cnt = 0;
		
		// TODO 여러 서버인 경우 아키텍처 변경이 필요할 수 있음
		// TODO 큐, 스레드가 필요할 수 있음
    	
		try {		
	    	String notifcTypeId = notifcSendDto.getNotifcTypeId();
	    	
	    	// 알림 유형 확인
	    	NotifcTypeVo notifcTypeVo = notifcTypeService.getNotifcTypeDetail(notifcTypeId);
	    	if (notifcTypeVo == null || StringUtils.isBlank(notifcTypeVo.getNotifcMsgTmplt())) {
	    		throw new ResBizInfoException("[" + notifcTypeId + "] 알림 유형이 없거나 메시지 템플릿 값이 없습니다.");
	    	}
	    	
	    	// 알림 대상자 조회
	    	List<NotifcTargetVo> targetList = notifcTargetService.getNotifcTargetIdsByTypeId(notifcTypeId);
	    	if (targetList == null || targetList.size() == 0) {
	    		log.info("{} : 알림 대상자가 없습니다.", notifcSendDto.getNotifcTypeId());
	    		return cnt; // 알림 발송 종료
	    	}
	    	
	    	// 알림 메시지 작성	    	
	    	String tmplt   = notifcTypeVo.getNotifcMsgTmplt();
	    	String linkUrl = notifcTypeVo.getNotifcLinkTmpltUrl();
	    	if (notifcSendDto.getNotifcParams() != null && !notifcSendDto.getNotifcParams().isEmpty()) {
	    		for (Map.Entry<String, Object> tMap :notifcSendDto.getNotifcParams().entrySet()) {
	    			String key = "#" + tMap.getKey() + "#";
	    			String val = tMap.getValue() == null ? "" : String.valueOf(tMap.getValue());
	    			tmplt = tmplt.replaceAll(key, val);
	    			
	    			if (StringUtils.isNotBlank(linkUrl)) {
	    				linkUrl = linkUrl.replaceAll(key, val);
	    			}
	    		}
	    	}
	    	
	    	NotifcVo notifcVo = new NotifcVo();
	    	notifcVo.setNotifcMsg(tmplt);
	    	notifcVo.setNotifcLinkUrl(linkUrl);
	    	notifcVo.setNotifcTypeId(notifcTypeId);

	    	// 알림 대상자 설정
	    	Set<String> userIdSet = new HashSet<>();	    	

	    	for (NotifcTargetVo notifcTargetVo : targetList) {
	    		if ("tkcgr".equals(notifcTargetVo.getNotifcTgtTypeMtcd()) && "auth".equals(notifcTargetVo.getNotifcTgtDivMtcd())) {
	    			// 1) 알림 대상자 - 담당자 권한들의 사용자 조회
		    		if (StringUtils.isNotBlank(notifcTargetVo.getNotifcTgtrIds())) {
		    			List<String> autOidList = Arrays.asList(notifcTargetVo.getNotifcTgtrIds().split(","));
		    			
		    			CommonSearchVo commonSearchVo = new CommonSearchVo();
		    			commonSearchVo.setAutOidList(autOidList);
		    			List<CommonUserDto> userDtoList = commonDataService.getDistinctAuthUserListWithoutPaging(commonSearchVo);
		    			if (userDtoList != null && userDtoList.size() > 0) {
		    				List<String> userIdList = userDtoList.stream().map(x -> x.getUserId()).collect(Collectors.toList());
		    				userIdSet.addAll(userIdList);
		    			}
		    		}
		    		
	    		} else if ("tkcgr".equals(notifcTargetVo.getNotifcTgtTypeMtcd()) && "user".equals(notifcTargetVo.getNotifcTgtDivMtcd())) {
	    			// 2) 알림 대상자 - 담당자 사용자들 조회
		    		if (StringUtils.isNotBlank(notifcTargetVo.getNotifcTgtrIds())) {
		    			List<String> userIdList = Arrays.asList(notifcTargetVo.getNotifcTgtrIds().split(","));
		    			userIdSet.addAll(userIdList);
		    		}
	    			
	    		} else if ("rqtr".equals(notifcTargetVo.getNotifcTgtTypeMtcd())) {
	    			// 3) 알림 대상자 - 요청자 조회 (권한이든 사용자든 1건으로 가정)
	    			
	    	    	notifcVo.setNotifcRqtrDivMtcd(notifcSendDto.getNotifcRqtrDivMtcd());
	    	    	notifcVo.setNotifcRqtrId(notifcSendDto.getNotifcRqtrId());
	    	    	notifcVo.setNotifcRqtrNm(notifcSendDto.getNotifcRqtrNm());
	    	    	
	    	    	if (StringUtils.isNoneBlank(notifcSendDto.getNotifcRqtrId())) {
		    			if ("auth".equals(notifcSendDto.getNotifcRqtrDivMtcd())) {
		    				List<String> autOidList = Stream.of(notifcSendDto.getNotifcRqtrId()).collect(Collectors.toList());
		    				
			    			CommonSearchVo commonSearchVo = new CommonSearchVo();
			    			commonSearchVo.setAutOidList(autOidList);
			    			List<CommonUserDto> userDtoList = commonDataService.getDistinctAuthUserListWithoutPaging(commonSearchVo);
			    			if (userDtoList != null && userDtoList.size() > 0) {
			    				List<String> userIdList = userDtoList.stream().map(x -> x.getUserId()).collect(Collectors.toList());
			    				userIdSet.addAll(userIdList);
			    			}	    				
		    			} else {
		    				userIdSet.add(notifcSendDto.getNotifcRqtrId());
		    			}
	    	    	}
	    			
	    		} else {
	    			// 이 경우는 에러임
	    			log.warn("{} : 알림 대상자 오류 - 발생하지 않는 경우임", notifcSendDto.getNotifcTypeId());
	    		}
	    	}
	    	
	    	// 알림 등록 및 메시지 발신
	    	for (String userId : userIdSet) {
	    		
	    		// 알림 등록
	    		notifcVo.setUserId(userId);
	    		cnt += this.createNotifc(notifcVo);
	    		
	    		// 사용자별 알림
	    		messagingTemplate.convertAndSend("/sub/notifc/user/" + userId, notifcVo);	    		
	    	}
	    	log.debug("{} : {}건 알림 발신", notifcTypeId, userIdSet.size());
		
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[알림 발송] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[알림 발송] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}	
    	
		log.debug("[알림 발송] 서비스 종료 - {}", notifcSendDto.getNotifcTypeId());
		return cnt;
	}
	
	private int createNotifc(NotifcVo notifcVo) {
    	StringBuffer sb = new StringBuffer();
    	
    	// 필수 체크
    	if (notifcVo == null) throw new ResBadRequestException("notifcVo 값이 null 입니다.");
    	if (StringUtils.isBlank(notifcVo.getUserId())) { sb.append("userId").append(ValueUtil.required()).append("\n"); } 	
    	if (StringUtils.isBlank(notifcVo.getNotifcMsg())) { sb.append("notifcMsg").append(ValueUtil.required()).append("\n"); } 
    	
    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
    	
    	// ID
    	String newId = ValueUtil.generateLogKey("NFC");
    	notifcVo.setNotifcId(newId);

		// 등록
		return notifcMapper.insertNotifc(notifcVo);
	}	
	
	/**
	 * 내 알림 설정 목록 조회
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcMySearchVo
	 * @return
	 */
	public SearchResultListVo getMyNotifcSettingList(NotifcMySearchVo notifcMySearchVo) {
		log.debug("[내 알림 설정 목록 조회] 서비스 시작");
		SearchResultListVo listVo = new SearchResultListVo();
		
		try {
			int totalListSize = notifcMapper.selectMyNotifcSettingCount(notifcMySearchVo);
			notifcMySearchVo.setTotalListSize(totalListSize);
			
			List<NotifcSettingDto> list = notifcMapper.selectMyNotifcSettingList(notifcMySearchVo);
			
			listVo.setList(list);
			listVo.setPage(new PageVo(notifcMySearchVo));
			
		} catch (Exception e) {
			log.error("[내 알림 설정 목록 조회] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}
		
		log.debug("[내 알림 설정 목록 조회] 서비스 종료");
		return listVo;
	}
	
	/**
	 * 알림 설정 등록
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcSettingVo
	 * @return
	 */
	public String createNotifcSetting(NotifcSettingVo notifcSettingVo) {
		log.debug("[알림 설정 등록] 서비스 시작");
		String notifcSetupId = "";
    	StringBuilder sb = new StringBuilder();
    	
		try {
	    	// 필수 체크
	    	if (notifcSettingVo == null) throw new ResBadRequestException("notifcSettingVo 값이 null 입니다.");
	    	if (StringUtils.isBlank(notifcSettingVo.getNotifcTypeId())) { sb.append("notifcTypeId").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(notifcSettingVo.getUserId())) { sb.append("userId").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(notifcSettingVo.getNotifcRcvYn())) { sb.append("notifcRcvYn").append(ValueUtil.required()).append("\n"); }
	    	if (!StringUtils.equalsAny(notifcSettingVo.getNotifcRcvYn(), "Y", "N")) { sb.append("notifcRcvYn").append(ValueUtil.invalid()).append("\n"); }
	    	
	    	if (StringUtils.isBlank(notifcSettingVo.getNotifcPopupYn())) { notifcSettingVo.setNotifcPopupYn("Y"); }
	    	if (!StringUtils.equalsAny(notifcSettingVo.getNotifcPopupYn(), "Y", "N")) { sb.append("notifcPopupYn").append(ValueUtil.invalid()).append("\n"); }
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());

	    	// 등록
	    	notifcMapper.insertNotifcSettingAutoKey(notifcSettingVo);
	    	notifcSetupId = notifcSettingVo.getNotifcSetupId();
			
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[알림 설정 등록] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[알림 설정 등록] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
		
		log.debug("[알림 설정 등록] 서비스 종료");
		return notifcSetupId;
	}	

	/**
	 * 알림 설정 수정
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcSettingVo
	 * @return
	 */
	public int modifyNotifcSetting(NotifcSettingVo notifcSettingVo) {	
		log.debug("[알림 설정 수정] 서비스 시작");
		int cnt = 0;
    	StringBuilder sb = new StringBuilder();
    	
		try {
	    	// 필수 체크
	    	if (notifcSettingVo == null) throw new ResBadRequestException("notifcSettingVo 값이 null 입니다.");
	    	if (StringUtils.isBlank(notifcSettingVo.getNotifcSetupId())) { sb.append("notifcSetupId").append(ValueUtil.required()).append("\n"); }
	    	if (StringUtils.isBlank(notifcSettingVo.getNotifcRcvYn())) { sb.append("notifcRcvYn").append(ValueUtil.required()).append("\n"); }
	    	if (!StringUtils.equalsAny(notifcSettingVo.getNotifcRcvYn(), "Y", "N")) { sb.append("notifcRcvYn").append(ValueUtil.invalid()).append("\n"); }
	    	
	    	if (StringUtils.isBlank(notifcSettingVo.getNotifcPopupYn())) { notifcSettingVo.setNotifcPopupYn("Y"); }
	    	if (!StringUtils.equalsAny(notifcSettingVo.getNotifcPopupYn(), "Y", "N")) { sb.append("notifcPopupYn").append(ValueUtil.invalid()).append("\n"); }
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
	    	
	    	cnt = notifcMapper.updateNotifcSetting(notifcSettingVo);
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[알림 설정 수정] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[알림 설정 수정] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
	
		log.debug("[알림 설정 수정] 서비스 종료");
		return cnt;
	}
	
	/**
	 * 알림 유형 ID 로 알림 설정 전체 삭제
	 * @Author      : heenim
	 * @Date        : 2023. 08. 09.
	 * @param notifcTypeId
	 * @return
	 */
	public int deleteNotifcSettingAllByTypeId(String notifcTypeId) {		
		log.debug("[알림 유형 ID 로 알림 설정 전체 삭제] 서비스 시작");
		int cnt = 0;
    	StringBuilder sb = new StringBuilder();
    	
		try {
	    	// 필수 체크
	    	if (StringUtils.isBlank(notifcTypeId)) { sb.append("notifcTypeId").append(ValueUtil.required()).append("\n"); }
	    	
	    	if (sb.length() > 0) throw new ResBadRequestException(sb.toString());
	    	
	    	NotifcSettingVo delParamVo = new NotifcSettingVo();
	    	delParamVo.setNotifcTypeId(notifcTypeId);
	    	cnt = notifcMapper.deleteNotifcSettingAllByTypeId(delParamVo);
			
		} catch (ResBadRequestException | ResBizInfoException | ResNotFoundException e) {
			log.info("[알림 유형 ID 로 알림 설정 전체 삭제] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[알림 유형 ID 로 알림 설정 전체 삭제] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
	
		log.debug("[알림 유형 ID 로 알림 설정 전체 삭제] 서비스 종료");
		return cnt;
	}
	
}
