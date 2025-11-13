package kr.co.n2m.platform.admin.feature.faq.controller;

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
import kr.co.n2m.platform.admin.feature.faq.entity.Faq;
import kr.co.n2m.platform.admin.feature.faq.service.FaqService;

@RestController
@Api(tags = "FAQ")
@ApiResponses({
	@ApiResponse(code = 404, message = "Not Found"),
	@ApiResponse(code = 500, message = "Internal Server Errpor") 
}) 
public class FaqController {

	@Autowired
	private FaqService faqService;
	
	@Autowired
	private AttachFileController attachFileController;
	
	/** FAQ 페이징 목록 조회. */
	@ApiOperation(value = "FAQ 목록 조회(페이징 처리)", notes = "<strong>FAQ 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value="/faqPaging")
	public ResponseEntity<Map<String, Object>> getFaqListByPaging(Faq noticeVo) {
		Map<String, Object> resultList = faqService.getFaqListByPaging(noticeVo);
		return new ResponseEntity<Map<String,Object>>(resultList, HttpStatus.OK);
	}
	
	/** FAQ 전체 목록 조회. */
	@ApiOperation(value = "FAQ 전체 목록 조회", notes = "<strong>FAQ 전체 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value = "/faq")
	public ResponseEntity<List<Faq>> getFaqList(Faq faqVo) {
		List<Faq> faqList = faqService.getFaqList(faqVo);
		return new ResponseEntity<List<Faq>>(faqList, null, HttpStatus.OK);
	}
	
	/** FAQ 목록 상세 조회. */
	@ApiOperation(value = "FAQ 목록 상세 조회", notes = "<strong>FAQ 상세 페이지를 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value= "/faq/{faqOid}")
	public ResponseEntity<Faq> getFaqDetail(@PathVariable(name="faqOid", required = true) String faqOid) {
		Faq faqVo = faqService.getFaqDetail(faqOid);
		return new ResponseEntity<Faq>(faqVo, HttpStatus.OK);
	}
	
	/** FAQ 생성(디테일 + 첨부파일 + DB저장). */
	@ApiOperation(value = "FAQ 등록", notes = "<strong>FAQ을 등록합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PostMapping(value = "/faq", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, 
											 MediaType.APPLICATION_JSON_VALUE})
	public ResponseEntity<Faq> createFaq(@RequestPart(value = "info", required = false) Faq info,
			@RequestPart(value = "fileList", required = false) MultipartFile[] fileList) throws URISyntaxException {
		String faqOid = faqService.createFaq(info);
		
		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/faq/" + faqOid));
		
		if(fileList != null) {
			for(MultipartFile multipartFile : fileList) {
				String restoNm = faqService.createFaqAttachFile(faqOid, multipartFile);			
				attachFileController.uploadFile(multipartFile, restoNm);
			}
		}
		
		return new ResponseEntity<Faq>(responseHeaders, HttpStatus.CREATED);		
	}
	
	/** FAQ 수정(디테일 + 첨부파일 + DB저장 + 기본 첨부파일 삭제). */
	@ApiOperation(value = "FAQ 수정", notes = "<strong>FAQ을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PutMapping(value = "/faq/{faqOid}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, 
													 MediaType.APPLICATION_JSON_VALUE})
	public ResponseEntity<Object> modifyFaq(@PathVariable("faqOid") String faqOid,
			@RequestPart(value = "info", required = false) Faq info,
			@RequestPart(value = "fileList", required = false) MultipartFile[] fileList,
			@RequestPart(value = "deleteFileList", required = false) List<AttachFile> deleteFileList) throws URISyntaxException {
		String oid = faqService.modifyFaq(info);
		
		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/faq/" + oid));
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				faqService.removeFaqAttachFile(attachFile.getFileRestoNm());				
				attachFileController.removeFile(attachFile);			
			}
		}
		if(fileList != null)
			for(MultipartFile multipartFile : fileList) {
				String restoNm = faqService.createFaqAttachFile(faqOid, multipartFile);
				attachFileController.uploadFile(multipartFile, restoNm);		
			}
		
		return new ResponseEntity<Object>(HttpStatus.OK);
	}
	
	/** FAQ 조회 수 증가. */
	@ApiOperation(value = "FAQ 조회 수 증가", notes = "<strong>FAQ 조회 수를 증가합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PatchMapping(value = "/faq/{faqOid}/hit")
	public ResponseEntity<Object> patchFaqHit(@PathVariable(name = "faqOid") String faqOid) {
		faqService.patchFaqHit(faqOid);
		return new ResponseEntity<Object>(null, null, HttpStatus.OK);
	}
	
	/** FAQ 삭제(디테일 삭제  + 기존 첨부파일 삭제).*/
	@ApiOperation(value = "FAQ 삭제", notes = "<strong>FAQ을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 204, message = "삭제 성공")})
	@DeleteMapping(value = "/faq/{faqOid}")
	public ResponseEntity<Object> removeFaq(@PathVariable(name="faqOid") String faqOid,
			@RequestBody List<AttachFile> deleteFileList) {
		faqService.removeFaq(faqOid);
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				faqService.removeFaqAttachFile(attachFile.getFileRestoNm());
				attachFileController.removeFile(attachFile);			
			}
		}
		
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	
	/********************** FAQ 첨부파일. **********************/
	
	
	/** FAQ 첨부파일 목록 조회. */
	@ApiOperation(value = "FAQ 첨부파일 목록 조회", notes = "<strong>FAQ 첨부파일 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value = "/faq/{faqOid}/attachFiles") 
	public ResponseEntity<List<AttachFile>> getFaqAttachFileList(@PathVariable(name = "faqOid") String faqOid, AttachFile fileVo) { 
		List<AttachFile> listFaqAttachFile = faqService.getFaqAttachFileList(faqOid, fileVo); 
		return new ResponseEntity<List<AttachFile>>(listFaqAttachFile, null, HttpStatus.OK);
	  }
	
	/** FAQ 첨부파일 삭제. */
	@ApiOperation(value = "FAQ 첨부파일 삭제", notes = "<strong>FAQ 첨부파일을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 204, message = "삭제 성공")})
	@DeleteMapping(value = "/faq/{faqOid}/attachFiles")
	public ResponseEntity<Object> removeNoticeAttachFiles(@PathVariable(name="faqOid") String faqOid) {
		faqService.removeFaqAttachFiles(faqOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	@ApiOperation(value = "FAQ 첨부파일 삭제", notes = "<strong>FAQ 첨부파일을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 204, message = "삭제 성공")})
	@DeleteMapping(value = "/faq/{faqOid}/attachFile/{contsOid}")
	public ResponseEntity<Object> removeNoticeAttachFile(@PathVariable(name="faqOid") String faqOid, @PathVariable(name="contsOid") String contsOid) {
		faqService.removeFaqAttachFile(contsOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
}