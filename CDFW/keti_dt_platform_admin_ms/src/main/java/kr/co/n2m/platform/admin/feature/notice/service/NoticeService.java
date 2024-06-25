package kr.co.n2m.platform.admin.feature.notice.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.admin.feature.notice.entity.Notice;
import kr.co.n2m.platform.admin.feature.notice.query.NoticeAttachFileQuery;
import kr.co.n2m.platform.admin.feature.notice.query.NoticeAttachFileRepository;
import kr.co.n2m.platform.admin.feature.notice.query.NoticeQuery;
import kr.co.n2m.platform.admin.feature.notice.query.NoticeRepository;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.FileProperty;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeService {
	
	private final NoticeQuery query;
	private final NoticeAttachFileQuery filequery;
	private final NoticeRepository noticeRepository;
	private final NoticeAttachFileRepository fileRepository;
	private final FileProperty prop;
	
	public Map<String, Object> getNoticeListByPaging(Notice searchVo, AttachFile fileVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = query.getNoticeListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Notice> list = this.getNoticeList(searchVo, fileVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	/** 공지사항 전체 목록 조회. */
	public List<Notice> getNoticeList(Notice searchVo, AttachFile fileVo) {
		return query.getNoticeList(searchVo, fileVo);
	}
	
	
	/** 공지사항 목록 상세 조회. */
	public Notice getNoticeDetail(String ntfOid) {
		return query.getNoticeDetail(ntfOid);
	}
	
	/** 공지사항 조회 수 증가.*/
	@Transactional
	public void patchNoticeHit(String ntfOid) {
		query.patchNoticeHit(ntfOid);
	}

	/** 공지사항 삭제. */
	@Transactional
	public void removeNotice(String ntfOid) {
		query.removeNotice(ntfOid);
	}
	
	
	/********************** 공지사항 첨부파일. **********************/
	

	/** 공지사항 첨부파일 목록 조회. */
	public List<AttachFile> getNoticeAttachFileList(String ntfOid, AttachFile fileVo) { 
		return filequery.getNoticeAttachFileList(ntfOid, fileVo); 
	}
	 
	 
	/** 공지사항 첨부파일 등록. */
	@Transactional
	public String createNoticeAttachFile(String ntfOid, MultipartFile multipartFile) {
		AttachFile attachFile = new AttachFile();
		String nextBbs = query.setNextBbs(attachFile);
		
		attachFile.setAtcOid(StringUtil.getOid());			
		attachFile.setContsOid(ntfOid);
		attachFile.setFileOriginNm(StringUtils.cleanPath(multipartFile.getOriginalFilename()));
		attachFile.setFileRestoNm("" + System.currentTimeMillis());
		attachFile.setFileRestoPath(prop.getUploadUrl() + attachFile.getFileRestoNm());
		attachFile.setFileSize(multipartFile.getSize());
		attachFile.setBbsOid(String.format("NTF_%06d", Integer.parseInt(nextBbs) + 1));
		
		fileRepository.save(attachFile);

		return attachFile.getFileRestoNm();
	}
	
	/** 공지사항 첨부파일 등록 시 리스트  */
	public void createNoticeFileLists(String ntfOid, MultipartFile[] fileList) {
		try {
			for(MultipartFile multipartFile : fileList) {
				createNoticeAttachFile(ntfOid, multipartFile);
			}				
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	/** 공지사항 첨부파일 삭제. */
	@Transactional
	public void removeNoticeAttachFile(String fileRestoNm) {
		filequery.removeNoticeAttachFile(fileRestoNm);
	}
	
	@Transactional
	public void removeNoticeAttachFiles(String contsOid, AttachFile fileVo) {
		filequery.removeNoticeAttachFiles(contsOid);
	}

	
	/********************** 공지사항 생성 (디테일 + 첨부파일 + DB저장). **********************/	
    public String createNotices(Notice noticeVo) {
    	String ntfOid  = query.getNtfOid();
    	LocalDateTime popupStDt = noticeVo.getPopupStDt();
		LocalDateTime popupFnsDt = noticeVo.getPopupFnsDt();
		
		if(StringUtil.isEmpty(ntfOid)) {
			ntfOid = "1";
		}
		
		if(noticeVo.getRetvNum() == null) {
			noticeVo.setRetvNum(0);
		}
		
		if(popupStDt != null && popupFnsDt != null) {
			noticeVo.setPopupStDt(popupStDt);
			noticeVo.setPopupFnsDt(popupFnsDt);			
		}
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			noticeVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			noticeVo.setRegrNm(userNm);
		}
		
		
		noticeVo.setNtfOid(ntfOid);
		noticeVo.setRegDt(LocalDateTime.now());		
		noticeRepository.save(noticeVo);
				
		return ntfOid;

	}  
	
    /********************** 공지사항 수정 (디테일 + 첨부파일 + DB저장 + 기존 첨부파일 삭제). **********************/
	public String modifyNotice(Notice noticeVo) {
		String ntfOid = noticeVo.getNtfOid(); 
		String findNtfOid = query.findNtfOid(ntfOid);
		LocalDateTime popupStDt = noticeVo.getPopupStDt();
		LocalDateTime popupFnsDt = noticeVo.getPopupFnsDt();
		
		if(! StringUtil.isEmpty(findNtfOid)) {			
			if(ntfOid.equals(findNtfOid)) {
				
				noticeVo.setPopupStDt(popupStDt);
				noticeVo.setPopupFnsDt(popupFnsDt);
				noticeVo.setAmdDt(LocalDateTime.now());		
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					noticeVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					noticeVo.setAmdrNm(userNm);
				}
				
				noticeRepository.save(noticeVo);
				
				return ntfOid;
			}
		}		
		return null;
	}

	public List<Notice> hasPopupNoticeByPltfrm(String pltfrmId) {
	
		return query.findByPltfrmId(pltfrmId);
	}
	
}

