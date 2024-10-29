package kr.co.n2m.platform.admin.feature.faq.service;

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
import kr.co.n2m.platform.admin.feature.faq.entity.Faq;
import kr.co.n2m.platform.admin.feature.faq.query.FaqAttachFileQuery;
import kr.co.n2m.platform.admin.feature.faq.query.FaqAttachFileRepository;
import kr.co.n2m.platform.admin.feature.faq.query.FaqQuery;
import kr.co.n2m.platform.admin.feature.faq.query.FaqRepository;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.FileProperty;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FaqService {
	
	private final FaqQuery query;
	private final FaqRepository faqRepository;
	private final FaqAttachFileQuery filequery;
	private final FaqAttachFileRepository fileRepository;
	private final FileProperty prop;
	
	public Map<String, Object> getFaqListByPaging(Faq searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = query.getFaqListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Faq> list = this.getFaqList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	/** FAQ 전체 목록 조회. */
	public List<Faq> getFaqList(Faq searchVo) {
		return query.getFaqList(searchVo);
	}
	
	
	/** FAQ 목록 상세 조회. */
	public Faq getFaqDetail(String faqOid) {
		return query.getFaqDetail(faqOid);
	}
	
	/** FAQ 생성.*/
	@Transactional
	public String createFaq(Faq faqVo) {
		String faqOid = query.getFaqOid();
		
		if(StringUtil.isEmpty(faqOid)) {
			faqOid = "1";
		}
		
		if(faqVo.getRetvNum() == null) {
			faqVo.setRetvNum(0);
		}
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			faqVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			faqVo.setRegrNm(userNm);
		}
		
		faqVo.setFaqOid(faqOid);
		faqVo.setRegDt(LocalDateTime.now());
		faqRepository.save(faqVo);

		return faqOid;
	}
	
	/** FAQ 수정.*/
	@Transactional
	public String modifyFaq(Faq faqVo) {
		String faqOid = faqVo.getFaqOid();
		String findFaqOid = query.findFaqOid(faqOid);
		
		if(! StringUtil.isEmpty(findFaqOid)) {
			if(faqOid.equals(findFaqOid)) {			
				faqVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					faqVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					faqVo.setAmdrNm(userNm);
				}
				
				faqRepository.save(faqVo);
				
				return faqOid;
			}
		}
		return null;		
	}
	
	/** FAQ 조회 수 증가.*/
	@Transactional
	public void patchFaqHit(String faqOid) {
		query.patchFaqHit(faqOid);
	}

	/** FAQ 삭제. */
	@Transactional
	public void removeFaq(String faqOid) {
		query.removeFaq(faqOid);
	}
	
	
	/********************** FAQ 첨부파일. **********************/
	
	
	/** FAQ 첨부파일 목록 조회. */
	public List<AttachFile> getFaqAttachFileList(String faqOid, AttachFile fileVo) { 
		return filequery.getFaqAttachFileList(faqOid, fileVo);
	}
	 
	/** FAQ 첨부파일 등록. */
	@Transactional
	public String createFaqAttachFile(String faqOid, MultipartFile multipartFile) {
		AttachFile attachFile = new AttachFile();
		String nextBbs = query.setNextBbs(attachFile);
		
		attachFile.setAtcOid(StringUtil.getOid());			
		attachFile.setContsOid(faqOid);
		attachFile.setFileOriginNm(StringUtils.cleanPath(multipartFile.getOriginalFilename()));
		attachFile.setFileRestoNm("" + System.currentTimeMillis());
		attachFile.setFileRestoPath(prop.getUploadUrl() + attachFile.getFileRestoNm());
		attachFile.setFileSize(multipartFile.getSize());
		attachFile.setBbsOid(String.format("FAQ_%06d", Integer.parseInt(nextBbs) + 1));
		
		fileRepository.save(attachFile);

		return attachFile.getFileRestoNm();
	}
	
	/** FAQ 첨부파일 삭제. */
	@Transactional
	public void removeFaqAttachFiles(String faqOid) {
		filequery.removeFaqAttachFiles(faqOid);
	}

	/** FAQ 첨부파일 삭제. */
	@Transactional
	public void removeFaqAttachFile(String fileRestoNm) {
		filequery.removeFaqAttachFile(fileRestoNm);
	}
	
}
