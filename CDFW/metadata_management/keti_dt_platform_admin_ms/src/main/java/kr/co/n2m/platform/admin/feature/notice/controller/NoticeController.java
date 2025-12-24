package kr.co.n2m.platform.admin.feature.notice.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.attachfile.controller.AttachFileController;
import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.admin.feature.notice.entity.Notice;
import kr.co.n2m.platform.admin.feature.notice.service.NoticeService;

@RestController
@Api(tags = "공지사항")
@ApiResponses({
		@ApiResponse(code = 404, message = "Not Found"),
		@ApiResponse(code = 500, message = "Internal Server Errpor") 
}) 
public class NoticeController {

	@Autowired
	private NoticeService noticeService;
	
	@Autowired
	private AttachFileController attachFileController;
	
	/** 공지사항 페이징 목록 조회. */
	@ApiOperation(value = "공지사항 목록 조회(페이징 처리)", notes = "<strong>공지사항 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value="/noticePaging")
	public ResponseEntity<Map<String, Object>> getNoticeListByPaging(Notice noticeVo, AttachFile fileVo) {
		Map<String, Object> resultList = noticeService.getNoticeListByPaging(noticeVo, fileVo);
		return new ResponseEntity<Map<String,Object>>(resultList, HttpStatus.OK);
	}
	
	/** 공지사항 전체 목록 조회. */
	@ApiOperation(value = "공지사항 전체 목록 조회", notes = "<strong>공지사항 전체 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value = "/notice")
	public ResponseEntity<List<Notice>> getNoticeList(Notice noticeVo, AttachFile fileVo) {
		List<Notice> noticeList = noticeService.getNoticeList(noticeVo, fileVo);
		return new ResponseEntity<List<Notice>>(noticeList, null, HttpStatus.OK);
	}
	
	/** 공지사항 목록 상세 조회. */
	@ApiOperation(value = "공지사항 목록 상세 조회", notes = "<strong>공지사항 상세 페이지를 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value= "/notice/{ntfOid}")
	public ResponseEntity<Notice> getNoticeDetail(@PathVariable(name="ntfOid", required = true) String ntfOid) {
		Notice noticeVo = noticeService.getNoticeDetail(ntfOid);
		return new ResponseEntity<Notice>(noticeVo, HttpStatus.OK);
	}
	
	/** 공지사항 생성 (디테일 + 첨부파일 + DB저장). */
	@ApiOperation(value = "공지사항 등록", notes = "<strong>공지사항을 등록합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PostMapping(value = "/notice", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, 
												MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<Object> createNotices(@RequestPart(value = "info", required = false) Notice info,
    		@RequestPart(value = "fileList", required = false) MultipartFile[] fileList) throws URISyntaxException {			
		String ntfOid = noticeService.createNotices(info);		
		
		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/notice/" + ntfOid));		
			
		if(fileList != null) {			
			for(MultipartFile multipartFile : fileList) {
				String restoNm = noticeService.createNoticeAttachFile(ntfOid, multipartFile);			
				attachFileController.uploadFile(multipartFile, restoNm);
			}
		}		
		return new ResponseEntity<Object>(responseHeaders, HttpStatus.CREATED);
	} 
	
	/** 공자사항 수정(디테일 + 첨부파일 + DB저장 + 기존 첨부파일 삭제). */
	@ApiOperation(value = "공지사항 수정", notes = "<strong>공지사항을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PutMapping(value = "/notice/{ntfOid}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, 
														MediaType.APPLICATION_JSON_VALUE})
	public ResponseEntity<Object> modifyNotice(@PathVariable("ntfOid") String ntfOid,
			@RequestPart(value = "info", required = false) Notice info,
			@RequestPart(value = "fileList", required = false) MultipartFile[] fileList,
			@RequestPart(value = "deleteFileList", required = false) List<AttachFile> deleteFileList) throws URISyntaxException {		
		String noticeoid = noticeService.modifyNotice(info);
	
		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/notice/" + noticeoid));
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				noticeService.removeNoticeAttachFile(attachFile.getFileRestoNm());				
				attachFileController.removeFile(attachFile);			
			}
		}
		if(fileList != null)
			for(MultipartFile multipartFile : fileList) {
				String restoNm = noticeService.createNoticeAttachFile(ntfOid, multipartFile);
				attachFileController.uploadFile(multipartFile, restoNm);		
			}
					
		return new ResponseEntity<Object>(responseHeaders, HttpStatus.OK);
	}
	
	/** 공자사항 삭제(디테일 삭제 + 기존 첨부파일 삭제). */
	@ApiOperation(value = "공지사항 삭제", notes = "<strong>공지사항을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 204, message = "삭제 성공")})
	@DeleteMapping(value = "/notice/{ntfOid}")
	public ResponseEntity<Object> removeNotice(@PathVariable(name="ntfOid") String ntfOid,
			@RequestBody List<AttachFile> deleteFileList) {
		noticeService.removeNotice(ntfOid);
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				noticeService.removeNoticeAttachFile(attachFile.getFileRestoNm());
				attachFileController.removeFile(attachFile);			
			}
		}
		
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	/** 공자사항 조회 수 증가. */
	@ApiOperation(value = "공자사항 조회 수 증가", notes = "<strong>공지사항 조회 수를 증가합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PatchMapping(value = "/notice/{ntfOid}/hit")
	public ResponseEntity<Object> patchNoticeHit(@PathVariable(name = "ntfOid") String ntfOid) {
		noticeService.patchNoticeHit(ntfOid);
		return new ResponseEntity<Object>(null, null, HttpStatus.OK);
	}	
	
	/** 플랫폼 아이디 별 공자사항 리스트 조회 */
	@ApiOperation(value = "플랫폼 아이디 별 공자사항 리스트 조회", notes = "<strong>플랫폼 아이디 별 공자사항 리스트 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@GetMapping(value = "/notice/{pltfrmId}/popup")
	public ResponseEntity<Object> hasPopupNoticeByPltfrm(@PathVariable(name = "pltfrmId") String pltfrmId) {
		List<Notice> noticeList = noticeService.hasPopupNoticeByPltfrm(pltfrmId);
		
		return new ResponseEntity<Object>(noticeList, null, HttpStatus.OK);
	}	
	
	/********************** 공지사항 첨부파일. **********************/
	
		
	/** 공지사항 첨부파일 목록 조회. */
	@ApiOperation(value = "공지사항 첨부파일 목록 조회", notes = "<strong>공지사항 첨부파일 목록을 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value = "/notice/{ntfOid}/attachFiles") 
	public ResponseEntity<List<AttachFile>> getNoticeAttachFileList(@PathVariable(name = "ntfOid") String ntfOid, AttachFile fileVo) { 
		List<AttachFile> listNoticeAttachFile = noticeService.getNoticeAttachFileList(ntfOid, fileVo); 
		return new ResponseEntity<List<AttachFile>>(listNoticeAttachFile, null, HttpStatus.OK);
	}
}

