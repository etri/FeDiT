package kr.co.n2m.platform.admin.feature.img.service;

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
import kr.co.n2m.platform.admin.feature.img.entity.Img;
import kr.co.n2m.platform.admin.feature.img.query.ImgAttachFileQuery;
import kr.co.n2m.platform.admin.feature.img.query.ImgAttachFileRepository;
import kr.co.n2m.platform.admin.feature.img.query.ImgQuery;
import kr.co.n2m.platform.admin.feature.img.query.ImgRepository;
import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.FileProperty;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ImgService {

	private final ImgQuery imgQuery;
	private final ImgAttachFileQuery fileQuery;
	private final ImgRepository imgRepository;
	private final ImgAttachFileRepository fileRepository;
	private final FileProperty prop;
	
	/** 이미지 페이징 목록 조회 */
	public Map<String, Object> getImgListByPaging(Img searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = imgQuery.getImgListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Img> list = imgQuery.getImgList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	/** 이미지 목록 조회 */
	public List<Img> getImgList(Img searchVo) {
		return imgQuery.getImgList(searchVo);
	}

	/** 이미지 상세 조회 */
	public Img getImgDetail(String imgOid) {
		return imgQuery.getImgDetail(imgOid);
	}

	/** 이미지 생성 */
	@Transactional
	public String createImg(Img imgVo) {
		String imgOid= imgQuery.createImgOid();
		
		if(StringUtil.isEmpty(imgOid)) {
			imgOid = "1";
		}
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			imgVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			imgVo.setRegrNm(userNm);
		}

		imgVo.setImgOid(imgOid);
		imgVo.setRegDt(LocalDateTime.now());
		imgRepository.save(imgVo);
		
		return imgOid;
	}

	/** 이미지 수정 */
	@Transactional
	public String modifyImg(Img imgVo) {
		String imgOid= imgVo.getImgOid();
		String findImgOid= imgQuery.getImgOid(imgOid);

		if(! StringUtil.isEmpty(findImgOid)) {
			if(imgOid.equals(findImgOid)) {
				imgVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					imgVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					imgVo.setAmdrNm(userNm);
				}
				
				imgRepository.save(imgVo);
				
				return imgOid;
			}
		}
		return null;
	}

	/** 이미지 삭제 */
	@Transactional
	public void removeImg(String imgOid) {
		imgQuery.removeImg(imgOid);
	}


	//==================================ImgAttachFile===========================================
	
	
	/** 첨부 파일 조회 */
	public List<AttachFile> getImgAttachFileList(String imgOid, AttachFile fileVo){
		return fileQuery.getImgAttachFileList(imgOid, fileVo);
	}
	
	/** 첨부 파일 생성 */
	@Transactional
	public String createImgAttachFile(String imgOid, MultipartFile file) {
		AttachFile fileVo = new AttachFile();
		String atcOid = String.valueOf(StringUtil.getOid());
		String bbsOid= fileQuery.createBbsOid();

		fileVo.setAtcOid(atcOid);
		fileVo.setContsOid(imgOid);
		fileVo.setFileOriginNm(StringUtils.cleanPath(file.getOriginalFilename()));
		fileVo.setFileRestoNm("" + System.currentTimeMillis());
		fileVo.setFileRestoPath(prop.getUploadUrl()+fileVo.getFileRestoNm());
		fileVo.setFileSize(file.getSize());
		fileVo.setBbsOid(String.format("IMG_%06d", Integer.parseInt(bbsOid)+1));
		
		fileRepository.save(fileVo);
		return fileVo.getFileRestoNm();
		
	}
	
	/** 첨부 파일 삭제 */
	@Transactional
	public void removeImgAttachFile(String fileRestoNm) {
		fileQuery.removeImgAttachFile(fileRestoNm);
	}

}
