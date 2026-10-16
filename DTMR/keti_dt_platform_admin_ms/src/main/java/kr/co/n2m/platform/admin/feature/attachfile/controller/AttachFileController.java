package kr.co.n2m.platform.admin.feature.attachfile.controller;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.admin.feature.attachfile.service.AttachFileService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@Api(tags="첨부 파일 관리")
@ApiResponses({
    @ApiResponse(code= 404, message= "페이지를 찾을 수 없습니다."),
    @ApiResponse(code= 500, message= "내부 서버 오류가 발생하였습니다.")
})
public class AttachFileController {

	@Autowired
	private AttachFileService attachFileService;

	/** 첨부 파일 업로드 */
	@PostMapping("/uploadFile")
    @ApiOperation(value="첨부 파일 업로드", notes="<strong>첨부 파일을 업로드 합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 201, message= "업로드 성공")})
	public AttachFile uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("restoNm") String restoNm) {
		Path fileFullPath = attachFileService.uploadFile(file, restoNm);

		String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
				.path("/downloadFile/")
				.path(fileFullPath.getFileName().toString())
				.toUriString();

		return new AttachFile(file.getOriginalFilename(), fileFullPath.getFileName().toString(), fileDownloadUri, file.getSize());
	}

	/** 첨부 파일 멀티 업로드 */
	@PostMapping("/uploadMultipleFiles")
    @ApiOperation(value="첨부 파일 멀티 업로드", notes="<strong>첨부 파일을 멀티 업로드 합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 201, message= "업로드 성공")})
	public List<AttachFile> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files, @RequestParam("restoNm") String restoNm) {
		return Arrays.asList(files).stream().map(file -> this.uploadFile(file,restoNm)).collect(Collectors.toList());
	}

	/** 첨부 파일 삭제 */
	@DeleteMapping("/removeFile")
	@ApiOperation(value="첨부 파일 삭제", notes="<strong>첨부 파일을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	public ResponseEntity<String> removeFile(@RequestBody AttachFile attachFileVO) {
		attachFileService.removeFile(attachFileVO.getFileRestoNm());
		return new ResponseEntity<String>(HttpStatus.NO_CONTENT);
	}
	
	/** 첨부 파일 멀티 삭제 */
	@DeleteMapping("/removeMultipleFiles")
	@ApiOperation(value="첨부 파일 멀티 삭제", notes="<strong>첨부 파일을 멀티 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	public ResponseEntity<Object> removeMultipleFiles(@RequestBody List<AttachFile> attachFileVO) {
		attachFileService.removeMultipleFiles(attachFileVO);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	/** 첨부 파일 다운로드 */
	@GetMapping("/downloadFile")
    @ApiOperation(value="첨부 파일 다운로드", notes="<strong>첨부 파일을 다운로드 합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 200, message= "다운로드 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "fileRestoNm", value="파일명" ,required = true),
		@ApiImplicitParam(name = "fileOriginNm", value="파일 원본 명" ,required = true)
	})
	public ResponseEntity<Resource> downloadFile(@RequestParam(required = true, value="fileRestoNm") String fileRestoNm,
			@RequestParam(required = true, value="fileOriginNm") String fileOriginNm, HttpServletRequest request) throws UnsupportedEncodingException {
		Resource resource = attachFileService.downloadFile(fileRestoNm);
		String contentType = null;

		try {
			contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
		} catch (IOException ex) {
			log.info("Could not determine file type.");
		}

		if (contentType == null) {
			contentType = "application/octet-stream";
		}
		
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(contentType))
				// .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + URLEncoder.encode(fileOriginNm, "UTF-8") + "\"")
				.body(resource);
	}

}
