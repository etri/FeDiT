package kr.co.n2m.platform.admin.feature.board.query;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.board.entity.BoardComment;
import kr.co.n2m.platform.admin.feature.board.entity.QBoard;
import kr.co.n2m.platform.admin.feature.board.entity.QBoardComment;
import kr.co.n2m.platform.admin.feature.board.entity.QBoardPosting;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BoardCommentQuery {

    private final JPAQueryFactory query;
    private final QBoard board= QBoard.board;
    private final QBoardPosting post= QBoardPosting.boardPosting;
    private final QBoardComment comment= QBoardComment.boardComment;
    
    public BooleanBuilder predicate(BoardComment searchVo) {
    	BooleanBuilder search = new BooleanBuilder();
    	
		if(StringUtil.isNotEmpty(searchVo.getCmmtOid())) {
			search.and(comment.cmmtOid.eq(searchVo.getCmmtOid()));
		}
		if(StringUtil.isNotEmpty(searchVo.getPstngOid())) {
			search.and(comment.pstngOid.eq(searchVo.getPstngOid()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(comment.regDt.between(parseSt, parseEd));
		}
		if(StringUtil.isNotEmpty(searchVo.getSearchAmdSt()) && StringUtil.isNotEmpty(searchVo.getSearchAmdEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(comment.amdDt.between(parseSt, parseEd));
		}
		
    	return search;
    }
    
	public QBean<BoardComment> projection(){
		
		return Projections.bean(BoardComment.class, 
				comment.cmmtOid,
				comment.pstngOid,
				comment.cmmtSbst,
				comment.regDt,
				comment.regrId,
				comment.regrNm,
				comment.amdDt,
				comment.amdrId,
				comment.amdrNm
		);
	}
	
	/** 댓글 목록 조회 */
	public List<BoardComment> getBoardPostCommentList(String pstngOid, BoardComment commentVo ) {
		return query.select(projection())
					.from(comment)
					.where(predicate(commentVo))
					.orderBy(comment.regDt.desc())
					.fetch();
	}
	
	/** 게시글 OID 조회 */
	public String getPstngOid(String cmmtOid) {
		return query.select(comment.pstngOid)
					.from(comment)
					.leftJoin(post)
					.on(comment.pstngOid.eq(post.pstngOid))
					.where(comment.cmmtOid.eq(cmmtOid))
					.fetchOne();
	}
	
	/** 댓글 OID 생성 */
	public String createCmmtOid(String cmmtOid) {
		return query.select(comment.cmmtOid.castToNum(Integer.class).max().add(1).stringValue())
				.from(comment)
				.fetchOne();
	}

	/** 게시판 OID 생성 */
	public String createBbsOid(String pstngOid) {
		return query.select(post.bbsOid)
				 .from(post)
				 .leftJoin(board)
				 .on(post.bbsOid.eq(board.bbsOid))
				 .where(post.pstngOid.eq(pstngOid))
				 .fetchOne();
	}
	
	/** 댓글 삭제 */
	public void removeBoardPostComment(String pstngOid, String cmmtOid) {
		query.delete(comment)
		 	 .where(comment.pstngOid.eq(pstngOid), comment.cmmtOid.eq(cmmtOid))
		 	 .execute();
	}
	
}
