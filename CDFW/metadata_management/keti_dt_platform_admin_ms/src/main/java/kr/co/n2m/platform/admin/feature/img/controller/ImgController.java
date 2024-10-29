package kr.co.n2m.platform.admin.feature.img.controller;

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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.attachfile.controller.AttachFileController;
import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.admin.feature.img.entity.Img;
import kr.co.n2m.platform.admin.feature.img.service.ImgService;

@RestController
@Api(tags="이미지 관리")
@ApiResponses({
    @ApiResponse(code= 404, message= "페이지를 찾을 수 없습니다."),
    @ApiResponse(code= 500, message= "내부 서버 오류가 발생하였습니다.")
})
public class ImgController {

	@Autowired
	private ImgService imgservice;
	
	@Autowired
	private AttachFileController fileCon;
	

	/** 이미지 페이징 목록 조회 */
	@GetMapping(value = "/imgPaging")
	@ApiOperation(value = "이미지 페이징 목록 조회", notes = "<strong>이미지 페이징 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	public ResponseEntity<Map<String, Object>> getImgListByPaging(Img searchVo) {
		Map<String, Object> listResult = imgservice.getImgListByPaging(searchVo);
		return new ResponseEntity<Map<String, Object>>(listResult, HttpStatus.OK);
	}
	
	/** 이미지 목록 조회*/
	@GetMapping(value="/img")
	@ApiOperation(value="이미지 목록 조회", notes="<strong>이미지 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParam(name = "imgOid", value="이미지 OID" ,required = false)
	public ResponseEntity<List<Img>> getImgList(Img searchVo){
		List<Img> list=imgservice.getImgList(searchVo);
		return new ResponseEntity<List<Img>>(list, null, HttpStatus.OK);
	}
	
	/** 이미지 상세 조회*/
	@GetMapping(value="/img/{imgOid}")
	@ApiOperation(value="이미지 상세 조회", notes="<strong>이미지 상세 페이지를 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "imgOid", value="이미지 OID" ,required = true)})
	public ResponseEntity<Object> getImgDetail(@PathVariable(name="imgOid") String imgOid) {
		Img imgVo=imgservice.getImgDetail(imgOid);
		return new ResponseEntity<Object>(imgVo, null, HttpStatus.OK);
	}

	/** 이미지 생성*/
	@PostMapping(value = "/img", consumes = { MediaType.APPLICATION_JSON_VALUE,
			MediaType.MULTIPART_FORM_DATA_VALUE})
	@ApiOperation(value = "이미지 생성", notes = "<strong>이미지을 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공"), @ApiResponse(code = 409, message = "ID 중복") })
	public ResponseEntity<Object> createImg(@RequestPart(value="info", required=false) Img info,
			@RequestPart(value="fileList", required=false) MultipartFile[] fileList) throws URISyntaxException {
		String imgOid = imgservice.createImg(info);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/img/" + imgOid));
		
		if(fileList != null) {
			for(MultipartFile multipartFile : fileList) {
				String restoNm = imgservice.createImgAttachFile(imgOid, multipartFile);
				fileCon.uploadFile(multipartFile,restoNm);
			}
		}
		
		if (imgOid != null) {
			return new ResponseEntity<Object>(responseHeaders, HttpStatus.OK);
		} else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}

	/** 이미지 수정*/
	@PutMapping(value="/img/{imgOid}", consumes = { MediaType.APPLICATION_JSON_VALUE,
			MediaType.MULTIPART_FORM_DATA_VALUE})
	@ApiOperation(value="이미지 수정", notes="<strong>이미지을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공"), @ApiResponse(code = 409, message = "ID 중복")})
	public ResponseEntity<Object> modifyImg(@RequestPart(value="info", required=false) Img info,
			@RequestPart(value="fileList", required=false) MultipartFile[] fileList,
			@RequestPart(value="deleteFileList", required=false) List<AttachFile> deleteFileList) throws URISyntaxException {
		String imgOid= imgservice.modifyImg(info);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/img/" + imgOid));
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				imgservice.removeImgAttachFile(attachFile.getFileRestoNm());
				fileCon.removeFile(attachFile);
			}
		}
		if(fileList != null) {
			imgservice.removeImgAttachFile(imgOid);

			for(MultipartFile multipartFile : fileList) {
				String restoNm = imgservice.createImgAttachFile(imgOid, multipartFile);
				fileCon.uploadFile(multipartFile,restoNm);
			}
		}
		
		if(imgOid != null) {
			return new ResponseEntity<Object>(HttpStatus.OK);
    	}else {
    		return new ResponseEntity<Object>(HttpStatus.CONFLICT);
    	}
	}
	
	/**이미지 삭제*/
	@DeleteMapping(value="/img/{imgOid}")
	@ApiOperation(value="이미지 삭제", notes="<strong>이미지를 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@ApiImplicitParam(name = "imgOid", value="이미지 OID" ,required = true)
	public ResponseEntity<Object> removeImg(@PathVariable(name="imgOid") String imgOid, @RequestBody List<AttachFile> deleteFileList) {
		imgservice.removeImg(imgOid);
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				imgservice.removeImgAttachFile(attachFile.getFileRestoNm());
				fileCon.removeFile(attachFile);
			}
		}
		
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}

	
	/************************ 첨부파일 **************************/
	
	
	/** 첨부 파일 조회 */
	@GetMapping(value = "/img/{imgOid}/attachFiles")
	@ApiOperation(value="첨부 파일 조회", notes="<strong>첨부 파일을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "imgOid", value="이미지 OID" ,required = true)})
	public ResponseEntity<Object> getImgAttachFileList(@PathVariable(name = "imgOid") String imgOid, AttachFile fileVo) {
		List<AttachFile> list= imgservice.getImgAttachFileList(imgOid, fileVo);
		return new ResponseEntity<Object>(list, null, HttpStatus.OK);
	}
	
}
