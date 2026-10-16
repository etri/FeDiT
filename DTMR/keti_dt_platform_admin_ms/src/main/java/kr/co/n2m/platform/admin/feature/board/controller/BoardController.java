package kr.co.n2m.platform.admin.feature.board.controller;

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
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import kr.co.n2m.platform.admin.feature.attachfile.controller.AttachFileController;
import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.admin.feature.board.entity.Board;
import kr.co.n2m.platform.admin.feature.board.entity.BoardPosting;
import kr.co.n2m.platform.admin.feature.board.entity.BoardComment;
import kr.co.n2m.platform.admin.feature.board.service.BoardService;

@RestController
@Api(tags="게시판 관리")
@ApiResponses({
    @ApiResponse(code= 404, message= "페이지를 찾을 수 없습니다."),
    @ApiResponse(code= 500, message= "내부 서버 오류가 발생하였습니다.")
})
public class BoardController {

	@Autowired
	private BoardService boardservice;
	
	@Autowired
	private AttachFileController fileCon;
	
	/** 게시판 페이징 목록 조회 */
	@GetMapping(value = "/boardPaging")
	@ApiOperation(value = "게시판 페이징 목록 조회", notes = "<strong>게시판 페이징 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	public ResponseEntity<Map<String, Object>> getBoardListByPaging(Board searchVo) {
		Map<String, Object> listResult = boardservice.getBoardListByPaging(searchVo);
		return new ResponseEntity<Map<String, Object>>(listResult, HttpStatus.OK);
	}
	
	/** 게시판 목록 조회*/
	@GetMapping(value="/board")
    @ApiOperation(value="게시판 목록 조회", notes="<strong>게시판 목록을 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	public ResponseEntity<List<Board>> getBoardList(Board searchVo) {
		List<Board> listCodegroup=boardservice.getBoardList(searchVo);
		return new ResponseEntity<List<Board>>(listCodegroup, null, HttpStatus.OK);
	}
	
	/** 게시판 상세 조회*/
	@GetMapping(value="/board/{bbsOid}")
	@ApiOperation(value="게시판 상세 조회", notes="<strong>게시판 상세 페이지를 조회합니다.</strong>")
    @ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true)
	public ResponseEntity<Object> getBoardDetail(@PathVariable(name="bbsOid") String bbsOid) {
		Board boardVo=boardservice.getBoardDetail(bbsOid);
		return new ResponseEntity<Object>(boardVo, null, HttpStatus.OK);
	}
	
	/** 게시판 생성*/
	@PostMapping(value="/board", consumes= MediaType.APPLICATION_JSON_VALUE)
	@ApiOperation(value="게시판 생성", notes="<strong>게시판을 생성합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공"), @ApiResponse(code = 409, message = "ID 중복")})
	public ResponseEntity<Board> createBoard(@RequestBody Board boardVo) throws URISyntaxException {
		String bbsOid=boardservice.createBoard(boardVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/board/" + bbsOid));
		
		if(bbsOid != null) {
			return new ResponseEntity<Board>(responseHeaders, HttpStatus.CREATED);
		}else {
			return new ResponseEntity<Board>(HttpStatus.CONFLICT);
		}
	}
	
	/** 게시판 수정*/
	@PutMapping(value="/board/{bbsOid}", consumes= MediaType.APPLICATION_JSON_VALUE)
	@ApiOperation(value="게시판 수정", notes="<strong>게시판을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공"), @ApiResponse(code = 409, message = "ID 중복")})
	public ResponseEntity<Object> modifyBoard(@RequestBody Board boardVo) throws URISyntaxException {
		String bbsOid=boardservice.modifyBoard(boardVo);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/board/" + bbsOid));
		
		if(boardVo.getBbsOid().equals(bbsOid)) {
			return new ResponseEntity<Object>(HttpStatus.OK);
		}else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}
	
	/** 게시판 삭제*/
	@DeleteMapping(value="/board/{bbsOid}")
	@ApiOperation(value="게시판 삭제", notes="<strong>게시판을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true)
	public ResponseEntity<Object> removeBoard(@PathVariable(name="bbsOid") String bbsOid) {
		boardservice.removeBoard(bbsOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	
	/************************ 게시글 관리 **************************/
	
	
	/** 게시글 페이징 목록 조회 */
	@ApiOperation(value = "게시글 페이징 목록 조회", notes = "<strong>게시글 페이징 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@GetMapping(value = "/boardPostPaging")
	public ResponseEntity<Map<String, Object>> getBoardPostListByPaging(BoardPosting searchVo) {
		Map<String, Object> listResult = boardservice.getBoardPostListByPaging(searchVo);
		return new ResponseEntity<Map<String, Object>>(listResult, HttpStatus.OK);
	}
	
	/** 게시글 목록 조회*/
	@GetMapping(value="/board/{bbsOid}/post")
	@ApiOperation(value="게시글 목록 조회", notes="<strong>게시글 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true)
	public ResponseEntity<List<BoardPosting>> getBoardPostList(@PathVariable(name="bbsOid") String bbsOid, BoardPosting searchVo){
		List<BoardPosting> list=boardservice.getBoardPostList(searchVo);
		return new ResponseEntity<List<BoardPosting>>(list, null, HttpStatus.OK);
	}
	
	/** 게시글 상세 조회*/
	@GetMapping(value="/board/{bbsOid}/post/{pstngOid}")
	@ApiOperation(value="게시글 상세 조회", notes="<strong>게시글 상세 페이지를 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true),
		@ApiImplicitParam(name = "pstngOid", value="게시 OID" ,required = true),
	})
	public ResponseEntity<Object> getBoardPostDetail(@PathVariable(name="bbsOid") String bbsOid, @PathVariable(name="pstngOid") String pstngOid) {
		BoardPosting postVo=boardservice.getBoardPostDetail(pstngOid);
		return new ResponseEntity<Object>(postVo, null, HttpStatus.OK);
	}

	/** 게시글 생성*/
	@PostMapping(value = "/board/{bbsOid}/post", consumes = { MediaType.APPLICATION_JSON_VALUE,
			MediaType.MULTIPART_FORM_DATA_VALUE})
	@ApiOperation(value = "게시글 생성", notes = "<strong>게시글을 생성합니다.</strong>")
	@ApiResponses({ @ApiResponse(code = 201, message = "요청 성공"), @ApiResponse(code = 409, message = "ID 중복") })
	@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true)
	public ResponseEntity<Object> createBoardPost(@PathVariable(name="bbsOid") String bbsOid,
			@RequestPart(value="info", required=false) BoardPosting info,
			@RequestPart(value="fileList", required=false) MultipartFile[] fileList) throws URISyntaxException {
		String pstngOid = boardservice.createBoardPost(bbsOid, info);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/board/" + bbsOid + "/post/" + pstngOid));
		
		if(fileList != null) {
			for(MultipartFile multipartFile : fileList) {
				String restoNm = boardservice.createBoardPostAttachFile(pstngOid, multipartFile);
				fileCon.uploadFile(multipartFile,restoNm);
			}
		}
		
		if (pstngOid != null) {
			return new ResponseEntity<Object>(responseHeaders, HttpStatus.OK);
		}else {
			return new ResponseEntity<Object>(HttpStatus.CONFLICT);
		}
	}

	/** 게시글 수정*/
	@PutMapping(value="/board/{bbsOid}/post/{pstngOid}", consumes = { MediaType.APPLICATION_JSON_VALUE,
			MediaType.MULTIPART_FORM_DATA_VALUE})
	@ApiOperation(value="게시글 수정", notes="<strong>게시글을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공"), @ApiResponse(code = 409, message = "ID 중복")})
	@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true)
	public ResponseEntity<Object> modifyBoardPost(@PathVariable(name="bbsOid") String bbsOid,
			@RequestPart(value="info", required=false) BoardPosting info,
			@RequestPart(value="fileList", required=false) MultipartFile[] fileList,
			@RequestPart(value="deleteFileList", required=false) List<AttachFile> deleteFileList) throws URISyntaxException {
		String pstngOid= boardservice.modifyBoardPost(bbsOid, info);
		
		HttpHeaders responseHeaders=new HttpHeaders();
		responseHeaders.setLocation(new URI("/board/" + bbsOid + "/post/" + pstngOid));
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				boardservice.removeBoardAttachFile(attachFile.getFileRestoNm());
				fileCon.removeFile(attachFile);
			}
		}
		if(fileList != null) {
			for(MultipartFile multipartFile : fileList) {
				String restoNm = boardservice.createBoardPostAttachFile(pstngOid, multipartFile);
				fileCon.uploadFile(multipartFile,restoNm);
			}
		}
		
		if(pstngOid != null) {
			return new ResponseEntity<Object>(HttpStatus.OK);
    	}else {
    		return new ResponseEntity<Object>(HttpStatus.CONFLICT);
    	}
	}
	
	/** 게시글 삭제*/
	@DeleteMapping(value="/board/{bbsOid}/post/{pstngOid}")
	@ApiOperation(value="게시글 삭제", notes="<strong>게시글을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true),
		@ApiImplicitParam(name = "pstngOid", value="게시 OID" ,required = true),
	})
	public ResponseEntity<Object> removeBoardPost(@PathVariable(name="bbsOid") String bbsOid, @PathVariable(name="pstngOid") String pstngOid,
			@RequestBody List<AttachFile> deleteFileList) {
		boardservice.removeBoardPost(bbsOid, pstngOid);
		
		if(deleteFileList != null) {
			for(AttachFile attachFile : deleteFileList) {
				boardservice.removeBoardAttachFile(attachFile.getFileRestoNm());
				fileCon.removeFile(attachFile);
			}
		}
		
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	/** 게시글 조회수 */
	//조회수 : retv_num
	@PatchMapping(value = "/board/{bbsOid}/post/{pstngOid}/hit")
	@ApiOperation(value="조회수 증가", notes="<strong>조회수 증가 메소드</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "조회수 증가")})
	@ApiImplicitParams({@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true),
		@ApiImplicitParam(name = "pstngOid", value="게시 OID" ,required = true),
	})
	public ResponseEntity<Object> getBoardPostHit(@PathVariable(name = "bbsOid") String bbsOid, @PathVariable(name = "pstngOid") String pstngOid) {
		boardservice.getBoardPostHit(pstngOid);
		return new ResponseEntity<Object>(HttpStatus.OK);
	}
	
	/**게시글 전체 삭제*/
//	@DeleteMapping(value="/board/{bbsOid}/post")
//	@ApiOperation(value="게시글 전체 삭제", notes="<strong>게시글을 전체 삭제합니다.</strong>")
//	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
//	@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true)
//	public ResponseEntity<Object> removeBoardPosts(@PathVariable(name="bbsOid") String bbsOid) {
//		boardservice.removeBoardPosts(bbsOid);
//		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
//	}
	
	
	/************************ 게시글 댓글 관리 **************************/
	
	
	/** 댓글 목록 조회 */
	@GetMapping(value = "/board/{bbsOid}/post/{pstngOid}/comments")
	@ApiOperation(value="댓글 목록 조회", notes="<strong>댓글 목록을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true),
		@ApiImplicitParam(name = "pstngOid", value="게시 OID" ,required = true),
	})
	public ResponseEntity<Object> getBoardPostCommentList(@PathVariable(name = "bbsOid") String bbsOid, @PathVariable(name = "pstngOid") String pstngOid, BoardComment commentVo) {
		List<BoardComment> list= boardservice.getBoardPostCommentList(pstngOid, commentVo);
		return new ResponseEntity<Object>(list, null, HttpStatus.OK);
	}

	/** 댓글 생성 */
	@PostMapping(value = "/board/{bbsOid}/post/{pstngOid}/comments", consumes = MediaType.APPLICATION_JSON_VALUE)
	@ApiOperation(value = "댓글 생성", notes = "<strong>댓글을 생성합니다.</strong>")
	@ApiResponses({@ApiResponse(code = 201, message = "요청 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true),
		@ApiImplicitParam(name = "pstngOid", value="게시 OID" ,required = true),
	})
	public ResponseEntity<Object> createBoardPostComment(@PathVariable(name = "bbsOid") String bbsOid,
			@PathVariable(name = "pstngOid") String pstngOid, @RequestBody BoardComment commentVo) throws URISyntaxException {
		String cmmtOid = boardservice.createBoardPostComment(pstngOid, commentVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/board/" + bbsOid + "/post/" + pstngOid + "/comments/" + cmmtOid));

		return new ResponseEntity<Object>(responseHeaders, HttpStatus.CREATED);
	}

	/** 댓글 수정 */
	@PutMapping(value = "/board/{bbsOid}/post/{pstngOid}/comments/{cmmtOid}", consumes= MediaType.APPLICATION_JSON_VALUE)
	@ApiOperation(value="댓글 수정", notes="<strong>댓글을 수정합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 201, message= "요청 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true),
		@ApiImplicitParam(name = "pstngOid", value="게시 OID" ,required = true),
	})
	public ResponseEntity<Object> modifyBoardPostComment(@PathVariable(name = "bbsOid") String bbsOid,
			@PathVariable(name = "pstngOid") String pstngOid, @RequestBody BoardComment commentVo) throws URISyntaxException {
		String cmmtOid = boardservice.modifyBoardPostComment(pstngOid, commentVo);

		HttpHeaders responseHeaders = new HttpHeaders();
		responseHeaders.setLocation(new URI("/board/" + bbsOid + "/post/" + pstngOid + "/comments/" + cmmtOid));
		
		return new ResponseEntity<Object>(HttpStatus.OK);
	}

	/** 댓글 삭제 */
	@DeleteMapping(value = "/board/{bbsOid}/post/{pstngOid}/comments/{cmmtOid}")
	@ApiOperation(value="댓글 삭제", notes="<strong>댓글을 삭제합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 204, message= "삭제 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true),
		@ApiImplicitParam(name = "pstngOid", value="게시 OID" ,required = true),
		@ApiImplicitParam(name = "cmmtOid", value="댓글 OID" ,required = true)
	})
	public ResponseEntity<Object> removeBoardPostComment(@PathVariable(name = "bbsOid") String bbsOid,
			@PathVariable(name = "pstngOid") String pstngOid, @PathVariable(name = "cmmtOid") String cmmtOid) {
		boardservice.removeBoardPostComment(pstngOid, cmmtOid);
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	
	/************************ 첨부파일 **************************/
	
	
	/** 첨부 파일 조회 */
	@GetMapping(value = "/board/{bbsOid}/post/{pstngOid}/attachFiles")
	@ApiOperation(value="첨부 파일 조회", notes="<strong>첨부 파일을 조회합니다.</strong>")
	@ApiResponses({@ApiResponse(code= 200, message= "조회 성공")})
	@ApiImplicitParams({@ApiImplicitParam(name = "bbsOid", value="게시판 OID" ,required = true),
		@ApiImplicitParam(name = "pstngOid", value="게시 OID" ,required = true),
	})
	public ResponseEntity<Object> getBoardPostAttachFileList(@PathVariable(name = "bbsOid") String bbsOid, @PathVariable(name = "pstngOid") String pstngOid, AttachFile fileVo) {
		List<AttachFile> list= boardservice.getBoardPostAttachFileList(pstngOid, fileVo);
		return new ResponseEntity<Object>(list, null, HttpStatus.OK);
	}
	
}
