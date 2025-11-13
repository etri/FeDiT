package kr.co.n2m.platform.admin.feature.board.service;

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
import kr.co.n2m.platform.admin.feature.board.entity.Board;
import kr.co.n2m.platform.admin.feature.board.entity.BoardComment;
import kr.co.n2m.platform.admin.feature.board.entity.BoardPosting;
import kr.co.n2m.platform.admin.feature.board.query.BoardAttachFileQuery;
import kr.co.n2m.platform.admin.feature.board.query.BoardAttachFileRepository;
import kr.co.n2m.platform.admin.feature.board.query.BoardCommentQuery;
import kr.co.n2m.platform.admin.feature.board.query.BoardCommentRepository;
import kr.co.n2m.platform.admin.feature.board.query.BoardPostingQuery;
import kr.co.n2m.platform.admin.feature.board.query.BoardPostingRepository;
import kr.co.n2m.platform.admin.feature.board.query.BoardQuery;
import kr.co.n2m.platform.admin.feature.board.query.BoardRepository;
import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.FileProperty;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BoardService {

	private final BoardQuery boardQuery;
	private final BoardPostingQuery postQuery;
	private final BoardCommentQuery commentQuery;
	private final BoardAttachFileQuery fileQuery;
	private final BoardRepository boardRepository;
	private final BoardPostingRepository postRepository;
	private final BoardCommentRepository commentRepository;
	private final BoardAttachFileRepository fileRepository;
	private final FileProperty prop;
	
	/** 게시판 페이징 목록 조회 */
	public Map<String, Object> getBoardListByPaging(Board searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = boardQuery.getBoardListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Board> list = boardQuery.getBoardList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	/** 게시판 목록 조회 */
	public List<Board> getBoardList(Board searchVo) {
		return boardQuery.getBoardList(searchVo);
	}

	/** 게시판 상세 조회 */
	public Board getBoardDetail(String bbsOid) {
		return boardQuery.getBoardDetail(bbsOid);
	}

	/** 게시판 생성 */
	@Transactional
	public String createBoard(Board boardVo) {
		String bbsOid= String.valueOf(StringUtil.getOid());
		
		if(! StringUtil.isEmpty(bbsOid)) {
			String findBbsOid= boardQuery.getBbsOid(bbsOid);
			if(bbsOid.equals(findBbsOid)) {
				return null;
			}
		}

		boardVo.setBbsOid(bbsOid);
		boardVo.setRegDt(LocalDateTime.now());
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			boardVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			boardVo.setRegrNm(userNm);
		}
		
		boardRepository.save(boardVo);
		
		return boardVo.getBbsOid();
	}

	/** 게시판 수정 */
	@Transactional
	public String modifyBoard(Board boardVo) {
		String bbsOid= boardVo.getBbsOid();
		String findBbsOid= boardQuery.getBbsOid(bbsOid);

		if(!StringUtil.isEmpty(findBbsOid)) {
			if(bbsOid.equals(findBbsOid)) {
				boardVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					boardVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					boardVo.setAmdrNm(userNm);
				}
				
				boardRepository.save(boardVo);
				
				return bbsOid;
			}
		}
		return null;
	}

	/** 게시판 삭제 */
	@Transactional
	public void removeBoard(String bbsOid) {
		boardQuery.removeBoard(bbsOid);
	}

	
	//==================================boardPost===========================================
	
	
	/** 게시글 페이징 목록 조회 */
	public Map<String, Object> getBoardPostListByPaging(BoardPosting searchVo) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = postQuery.getBoardPostListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<BoardPosting> list = postQuery.getBoardPostList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}
	
	/** 게시글 목록 조회 */
	public List<BoardPosting> getBoardPostList(BoardPosting postVo) {
		return postQuery.getBoardPostList(postVo);
	}

	/** 게시글 상세 조회 */
	public BoardPosting getBoardPostDetail(String pstngOid) {
		return postQuery.getBoardPostDetail(pstngOid);
	}

	/** 게시글 생성 */
	@Transactional
	public String createBoardPost(String bbsOid, BoardPosting postVo) {
		String pstngOid = postQuery.createPstngOid();

		if(StringUtil.isEmpty(pstngOid)) {
			pstngOid = "1";
		}
		
		if(postVo.getRetvNum() == null) {
			postVo.setRetvNum(0);
		}
		
		postVo.setPstngOid(pstngOid);
		postVo.setBbsOid(bbsOid);
		postVo.setRegDt(LocalDateTime.now());
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			postVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			postVo.setRegrNm(userNm);
		}
		
		postRepository.save(postVo);
		
		return pstngOid;
	}

	/** 게시글 수정 */
	@Transactional
	public String modifyBoardPost(String bbsOid, BoardPosting postVo) {
		String pstngOid= postVo.getPstngOid();
		String findBbsOid= postQuery.getBbsOid(pstngOid);
		
		if(! StringUtil.isEmpty(pstngOid)) {
			if(findBbsOid.equals(bbsOid)) {
				postVo.setBbsOid(bbsOid);
				postVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					postVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					postVo.setAmdrNm(userNm);
				}
				
				postRepository.save(postVo);
				
				return pstngOid;
			}
		}
		return null;
	}
	
	/** 게시글 전체 삭제 */
	@Transactional
	public void removeBoardPosts(String bbsOid) {
		postQuery.removeBoardPosts(bbsOid);
	}

	/** 게시글 삭제 */
	@Transactional
	public void removeBoardPost(String bbsOid, String pstngOid) {
		postQuery.removeBoardPost(bbsOid, pstngOid);
	}
	
	/** 게시글 조회수 */
	//조회수 : retv_num
	@Transactional
	public void getBoardPostHit(String pstngOid) {
		postQuery.getBoardPostHit(pstngOid);
	}
	
	
	//==================================boardComment===========================================
	
	
	/** 댓글 목록 조회 */
	public List<BoardComment> getBoardPostCommentList(String pstngOid, BoardComment commentVo) {
		return commentQuery.getBoardPostCommentList(pstngOid, commentVo);
	}
	
	/** 댓글 생성 */
	@Transactional
	public String createBoardPostComment(String pstngOid, BoardComment commentVo) {
		String cmmtOid = commentQuery.createCmmtOid(commentVo.getCmmtOid());
		String bbsOid = commentQuery.createBbsOid(pstngOid);
		
		if(cmmtOid == null) {
			cmmtOid = "1";
		}

		commentVo.setPstngOid(pstngOid);
		commentVo.setCmmtOid(cmmtOid);
		commentVo.setBbsOid(bbsOid);
		commentVo.setRegDt(LocalDateTime.now());
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			commentVo.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			commentVo.setRegrNm(userNm);
		}
		
		commentRepository.save(commentVo);
		
		return cmmtOid;
	}

	/** 댓글 수정 */
	@Transactional
	public String modifyBoardPostComment(String pstngOid, BoardComment commentVo) {
		String cmmtOid= commentVo.getCmmtOid();
		String findPstngOid= commentQuery.getPstngOid(cmmtOid);
		
		if(! StringUtil.isEmpty(findPstngOid)) {
			if(pstngOid.equals(findPstngOid)) {
				commentVo.setPstngOid(pstngOid);
				commentVo.setAmdDt(LocalDateTime.now());
				
				String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(userId != null) {
					commentVo.setAmdrId(userId);
				}
				
				String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
				if(userNm != null) {
					commentVo.setAmdrNm(userNm);
				}
				
				commentRepository.save(commentVo);
				
				return cmmtOid;
			}
		}
		return null;
	}

	/** 댓글 삭제 */
	@Transactional
	public void removeBoardPostComment(String pstngOid, String cmmtOid) {
		commentQuery.removeBoardPostComment(pstngOid, cmmtOid);
	}
	
	
	//==================================첨부 파일===========================================
	
	
	/** 첨부 파일 조회 */
	public List<AttachFile> getBoardPostAttachFileList(String pstngOid, AttachFile fileVo){
		return fileQuery.getBoardPostAttachFileList(pstngOid, fileVo);
	}
	
	/** 첨부 파일 생성 */
	@Transactional
	public String createBoardPostAttachFile(String pstngOid, MultipartFile file) {
		AttachFile fileVo = new AttachFile();
		String atcOid = String.valueOf(StringUtil.getOid());
		String bbsOid= fileQuery.createBbsOid();

		fileVo.setAtcOid(atcOid);
		fileVo.setContsOid(pstngOid);
		fileVo.setFileOriginNm(StringUtils.cleanPath(file.getOriginalFilename()));
		fileVo.setFileRestoNm("" + System.currentTimeMillis());
		fileVo.setFileRestoPath(prop.getUploadUrl()+fileVo.getFileRestoNm());
		fileVo.setFileSize(file.getSize());
		fileVo.setBbsOid(String.format("BBS_%06d", Integer.parseInt(bbsOid)+1));
		
		fileRepository.save(fileVo);
		return fileVo.getFileRestoNm();
	}
	
	/** 첨부 파일 삭제 */
	@Transactional
	public void removeBoardAttachFile(String fileRestoNm) {
		fileQuery.removeBoardPostAttachFile(fileRestoNm);
	}
	
}
