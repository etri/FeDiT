package kr.co.n2m.platform.admin.feature.qna.service;

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
import kr.co.n2m.platform.admin.feature.qna.entity.Qna;
import kr.co.n2m.platform.admin.feature.qna.query.QnaAttachFileQuery;
import kr.co.n2m.platform.admin.feature.qna.query.QnaAttachFileRepository;
import kr.co.n2m.platform.admin.feature.qna.query.QnaQuery;
import kr.co.n2m.platform.admin.feature.qna.query.QnaRepository;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.FileProperty;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QnaService {
	
	private final QnaQuery query;
	private final QnaAttachFileQuery filequery;
	private final QnaRepository qnaRepository;
	private final QnaAttachFileRepository fileRepository;
	private final FileProperty prop;
	
	public Map<String, Object> getQnaListByPaging(Qna searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = query.getQnaListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Qna> list = this.getQnaList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	/** QNA 전체 목록 조회. */
	public List<Qna> getQnaList(Qna searchVo) {
		return query.getQnaList(searchVo);
	}
	
	
	/** QNA 목록 상세 조회. */
	public Qna getQnaDetail(String qnaOid) {
		return query.getQnaDetail(qnaOid);
	}

	/** QNA 생성.*/
	@Transactional
	public String createQna(Qna qnaVo) {
		String qnaOid = query.getQnaOid();
		
		if(StringUtil.isEmpty(qnaOid)) {
			qnaOid = "1";
		}

		if(qnaVo.getRetvNum() == null) {
			qnaVo.setRetvNum(0);
		}
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			qnaVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			qnaVo.setRegrNm(userNm);
		}
		
		if(qnaVo.getQnaAns() == null) {
			qnaVo.setSttusCd("COD_02828");
		}else qnaVo.setSttusCd("COD_02829");
			
		qnaVo.setQnaOid(qnaOid); 		
		qnaVo.setRegDt(LocalDateTime.now());
		qnaRepository.save(qnaVo);

		return qnaOid;
	}
	
	/** QNA 수정.*/
	@Transactional
	public String modifyQna(Qna qnaVo) {
		String qnaOid = qnaVo.getQnaOid();
		String findQnaOid = query.findQnaOid(qnaOid);
		
		if(! StringUtil.isEmpty(findQnaOid)) {
			if(qnaOid.equals(findQnaOid)) {
				qnaVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					qnaVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					qnaVo.setAmdrNm(userNm);
				}
				
				qnaRepository.save(qnaVo);
							
				return qnaOid;
			}
		}
		return null;		
	}
	
	/** QNA 조회 수 증가.*/
	@Transactional
	public void patchQnaHit(String qnaOid) {
		query.patchQnaHit(qnaOid);
	}
	
	/** QNA 답변 등록.*/
	@Transactional
	public void modifyQnaAnswer(Qna qnaVo) {	
		
		qnaVo.setRegDt2(LocalDateTime.now());
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			qnaVo.setRegr2Id(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			qnaVo.setRegr2Nm(userNm);
		}
		
		if(qnaVo.getQnaAns() == null) {
			qnaVo.setSttusCd("COD_02828");
		}else qnaVo.setSttusCd("COD_02829");
		
		
		qnaRepository.save(qnaVo);
	}

	/** QNA 삭제. */
	@Transactional
	public void removeQna(String qnaOid) {
		query.removeQna(qnaOid);
	}
	
	
	/********************** QNA 첨부파일. **********************/

	
	/** QNA 첨부파일 목록 조회. */
	public List<AttachFile> getQnaAttachFileList(String qnaOid, AttachFile fileVo) { 
		return filequery.getQnaAttachFileList(qnaOid, fileVo);
	}
	 
	/** QNA 첨부파일 등록. */
	@Transactional
	public String createQnaAttachFile(String qnaOid, MultipartFile multipartFile) {
		AttachFile attachFile = new AttachFile();
		String nextBbs = query.setNextBbs(attachFile);
		
		attachFile.setAtcOid(StringUtil.getOid());			
		attachFile.setContsOid(qnaOid);
		attachFile.setFileOriginNm(StringUtils.cleanPath(multipartFile.getOriginalFilename()));
		attachFile.setFileRestoNm("" + System.currentTimeMillis());
		attachFile.setFileRestoPath(prop.getUploadUrl() + attachFile.getFileRestoNm());
		attachFile.setFileSize(multipartFile.getSize());
		attachFile.setBbsOid(String.format("QNA_%06d", Integer.parseInt(nextBbs) + 1));
		
		fileRepository.save(attachFile);

		return attachFile.getFileRestoNm();
	}
		
	/** QNA 첨부파일 삭제. */
	@Transactional
	public void removeQnaAttachFiles(String qnaOid) {
		filequery.removeQnaAttachFiles(qnaOid);
	}

	@Transactional
	public void removeQnaAttachFile(String fileRestoNm) {
		filequery.removeQnaAttachFile(fileRestoNm);
	}

}










