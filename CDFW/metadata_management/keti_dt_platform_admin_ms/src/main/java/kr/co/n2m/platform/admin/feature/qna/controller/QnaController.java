package kr.co.n2m.platform.admin.feature.qna.controller;

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
import kr.co.n2m.platform.admin.feature.qna.entity.Qna;
import kr.co.n2m.platform.admin.feature.qna.service.QnaService;
import kr.co.n2m.platform.common.utils.ConvertUtil;

@RestController
@Api(tags = "QNA")
@ApiResponses({
	@ApiResponse(code = 404, message = "Not Found"),
	@ApiResponse(code = 500, message = "Internal Server Errpor") 
}) 
public class QnaController {
	
	@Autowired
	private QnaService qnaService;
	
	@Autowired
	private AttachFileController attachFileController;
	
	/** QNA 페이징 목록 조회. */
	@ApiOperation(value = "QNA 목록 조회(페이징 처리)", notes = "<strong>QNA 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value="/qnaPaging")
	public ResponseEntity<Map<String, Object>> getQnaListByPaging(Qna qnaVo) {
		Map<String, Object> resultList = qnaService.getQnaListByPaging(qnaVo);
		return new ResponseEntity<Map<String,Object>>(resultList, HttpStatus.OK);
	}
	
	/** QNA 전체 목록 조회. */
	@ApiOperation(value = "QNA 전체 목록 조회", notes = "<strong>QNA 전체 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value = "/qna")
	public ResponseEntity<List<Qna>> getQnaList(Qna qnaVo) {
		List<Qna> qnaList = qnaService.getQnaList(qnaVo);
		return new ResponseEntity<List<Qna>>(qnaList, null, HttpStatus.OK);
	}
	
	/** QNA 목록 상세 조회. */
	@ApiOperation(value = "QNA 목록 상세 조회", notes = "<strong>QNA 상세 페이지를 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value= "/qna/{qnaOid}")
	public ResponseEntity<Qna> getQnaDetail(@PathVariable(name="qnaOid", required = true) String qnaOid) {
		Qna qnaVo = qnaService.getQnaDetail(qnaOid);
		return new ResponseEntity<Qna>(qnaVo, HttpStatus.OK);
	}
	
	/** QNA 생성(디테일 + 첨부파일 + DB저장). */
	@ApiOperation(value = "QNA 등록", notes = "<strong>QNA을 등록합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PostMapping(value = "/qna", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, 
											 MediaType.APPLICATION_JSON_VALUE})
	public ResponseEntity<Qna> createQna(@RequestPart(value = "info", required = false) Qna info,
			@RequestPart(value = "fileList", required = false) MultipartFile[] fileList) throws URISyntaxException {
		String qnaOid = qnaService.createQna(info);
		
		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/qna/" + qnaOid));
		
		if(fileList != null) {
			for(MultipartFile multipartFile : fileList) {
				String restoNm = qnaService.createQnaAttachFile(qnaOid, multipartFile);
				attachFileController.uploadFile(multipartFile, restoNm);
			}
		}

		return new ResponseEntity<Qna>(responseHeaders, HttpStatus.CREATED);	
	}
	
	/** QNA 수정(디테일 + 첨부파일 + DB저장 + 기존 첨부파일 삭제). */
	@ApiOperation(value = "QNA 수정", notes = "<strong>QNA을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PutMapping(value = "/qna/{qnaOid}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, 
													 MediaType.APPLICATION_JSON_VALUE})
	public ResponseEntity<Object> modifyQna(@PathVariable("qnaOid") String qnaOid,
			@RequestPart(value = "info", required = false) Qna info,
			@RequestPart(value = "fileList", required = false) MultipartFile[] fileList,
			@RequestPart(value = "deleteFileList", required = false) List<AttachFile> deleteFileList) throws URISyntaxException {
		String qnaoid = qnaService.modifyQna(info);
		
		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/notice/" + qnaoid));
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				qnaService.removeQnaAttachFile(attachFile.getFileRestoNm());				
				attachFileController.removeFile(attachFile);			
			}
		}
		if(fileList != null)
			for(MultipartFile multipartFile : fileList) {
				String restoNm = qnaService.createQnaAttachFile(qnaOid, multipartFile);
				attachFileController.uploadFile(multipartFile, restoNm);		
			}
		
		return new ResponseEntity<Object>(responseHeaders, HttpStatus.OK);
	}
	
	/** QNA 조회 수 증가. */
	@ApiOperation(value = "QNA 조회 수 증가", notes = "<strong>QNA 조회 수를 증가합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PatchMapping(value = "/qna/{qnaOid}/hit")
	public ResponseEntity<Object> patchQnaHit(@PathVariable(name = "qnaOid") String qnaOid) {
		qnaService.patchQnaHit(qnaOid);
		return new ResponseEntity<Object>(null, null, HttpStatus.OK);
	}

	/** QNA 답변 등록. */
	@ApiOperation(value = "QNA 답변 등록", notes = "<strong>QNA 답변을 등록합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@PatchMapping(value = "/qna/{qnaOid}/answer")
	public ResponseEntity<Object> modifyQnaAnswer(@PathVariable(name = "qnaOid") String qnaOid, @RequestBody(required = true) Qna qnaVo) {
//		Qna qnaVo = ConvertUtil.convertMapToBean(params, Qna.class);
		qnaService.modifyQnaAnswer(qnaVo);
		return new ResponseEntity<Object>(null, null, HttpStatus.OK);
	}
	
	/** QNA 삭제*/
	@ApiOperation(value = "QNA 삭제", notes = "<strong>QNA을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 204, message = "삭제 성공")})
	@DeleteMapping(value = "/qna/{qnaOid}")
	public ResponseEntity<Object> removeQna(@PathVariable(name="qnaOid") String qnaOid,
			@RequestBody List<AttachFile> deleteFileList) {
		qnaService.removeQna(qnaOid);
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				qnaService.removeQnaAttachFile(attachFile.getFileRestoNm());
				attachFileController.removeFile(attachFile);
			}
		}
		
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	
	/********************** QNA 첨부파일. **********************/
	
	
	/** QNA 첨부파일 목록 조회. */
	@ApiOperation(value = "QNA 첨부파일 목록 조회", notes = "<strong>QNA 첨부파일 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 200, message = "OK")})
	@GetMapping(value = "/qna/{qnaOid}/attachFiles")
	public ResponseEntity<List<AttachFile>> getQnaAttachFileList(@PathVariable(name = "qnaOid") String qnaOid, AttachFile fileVo) {
		List<AttachFile> listAttachFile = qnaService.getQnaAttachFileList(qnaOid, fileVo);
		return new ResponseEntity<List<AttachFile>>(listAttachFile, null, HttpStatus.OK);
	}
	
	/** QNA 첨부파일 삭제. */
	@ApiOperation(value = "QNA 첨부파일 삭제", notes = "<strong>QNA 첨부파일을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 204, message = "삭제 성공")})
	@DeleteMapping(value = "/qna/{qnaOid}/attachFiles")
	public ResponseEntity<Object> removeQnaAttachFiles(@PathVariable(name="qnaOid") String qnaOid) {
		qnaService.removeQnaAttachFiles(qnaOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	@ApiOperation(value = "QNA 첨부파일 삭제", notes = "<strong>QNA 첨부파일을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 204, message = "삭제 성공")})
	@DeleteMapping(value = "/qna/{qnaOid}/attachFile/{contsOid}")
	public ResponseEntity<Object> removeQnaAttachFile(@PathVariable(name="qnaOid") String qnaOid, @PathVariable(name="contsOid") String contsOid) {
		qnaService.removeQnaAttachFile(contsOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
}


