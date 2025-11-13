package kr.co.n2m.platform.admin.feature.board.query;

import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.board.entity.BoardPosting;
import kr.co.n2m.platform.admin.feature.board.entity.QBoard;
import kr.co.n2m.platform.admin.feature.board.entity.QBoardPosting;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BoardPostingQuery {

    private final ApplicationConfig config;
    private final JPAQueryFactory query;
    private final QBoard board= QBoard.board;
    private final QBoardPosting post= QBoardPosting.boardPosting;
    
    public BooleanBuilder predicate(BoardPosting searchVo) {
    	BooleanBuilder search = new BooleanBuilder();
    	
		if(StringUtil.isNotEmpty(searchVo.getPstngOid())) {
			search.and(post.pstngOid.eq(searchVo.getPstngOid()));
		}
		if(StringUtil.isNotEmpty(searchVo.getBbsOid())) {
			search.and(post.bbsOid.eq(searchVo.getBbsOid()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getRegrId())) {
			search.and(post.regrId.contains(searchVo.getRegrId()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchWord())) {
			search.and(post.pstngTitle.contains(searchVo.getSearchWord()))
				.or(post.pstngSbst.contains(searchVo.getSearchWord()));
		}
		if(StringUtil.isNotEmpty(searchVo.getPstngTitle())) {
			search.and(post.pstngTitle.contains(searchVo.getPstngTitle()));
		}
		if(StringUtil.isNotEmpty(searchVo.getPstngSbst())) {
			search.and(post.pstngSbst.contains(searchVo.getPstngSbst()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getPltfrmId())) {
			search.and(post.pltfrmId.eq(searchVo.getPltfrmId()));
		}

		if(StringUtil.equals(searchVo.getPrevPstngYn(), "Y")) {
			search.and(post.prevPstngYn.eq("Y"));
		}
		if(StringUtil.equals(searchVo.getPrevPstngYn(), "N")) {
			search.and(post.prevPstngYn.eq("N"));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(post.regDt.between(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
					StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt())) {
			search.and(post.regDt.after(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
		}
		if(StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(post.regDt.before(StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		//if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
		//	LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
		//	LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
		//	search.and(post.regDt.between(parseSt, parseEd));
		//}
		//if(StringUtil.isNotEmpty(searchVo.getSearchAmdSt()) && StringUtil.isNotEmpty(searchVo.getSearchAmdEd())) {
		//	LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
		//	LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
		//	search.and(post.amdDt.between(parseSt, parseEd));
		//}
		
    	return search;
    }
    
	public QBean<BoardPosting> projection(){
		
		return Projections.bean(BoardPosting.class, 
				post.pstngOid,
				post.bbsOid,
				post.pstngTitle,
				post.pstngSbst,
				post.retvNum,
				post.prevPstngYn,
				new CaseBuilder()
				.when(post.prevPstngYn.eq(Boolean.toString(true)))
				.then("Y")
				.otherwise("N").as("prevPstngYnVal"),
				post.regDt,
				post.regrId,
				post.regrNm,
				post.amdDt,
				post.amdrId,
				post.amdrNm,
				post.pltfrmId
		);
	}
	
	/** 게시글 목록 개수. */
	public long getBoardPostListCount(BoardPosting searchVo) {
		return query.select(post.count())
					.from(post)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** 게시글 목록 조회 */
	public List<BoardPosting> getBoardPostList(BoardPosting searchVo) {
		List<BoardPosting> list= null;
		int offset= 0;
		int limit= 10;
		
		if(searchVo.isPaging()) {
			offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize();
			limit = searchVo.getPageListSize();
			
			list= query.select(projection())
					   .from(post)
					   .leftJoin(board)
					   .on(post.bbsOid.eq(board.bbsOid))
					   .where(predicate(searchVo))
						.orderBy(post.regDt.desc())
					   .offset(offset)
					   .limit(limit)
					   .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				list = query.select(projection())
						   	.from(post)
						   	.leftJoin(board)
						   	.on(post.bbsOid.eq(board.bbsOid))
						   	.where(predicate(searchVo))
							.orderBy(post.regDt.desc())
						   	.offset(offset)
						   	.limit(limit)
						   	.fetch();
			}
			else {
				limit= config.getListMaxRowCount();
				
				list = query.select(projection())
							.from(post)
							.leftJoin(board)
							.on(post.bbsOid.eq(board.bbsOid))
							.orderBy(post.regDt.desc())
							.where(predicate(searchVo))
							.limit(limit)
							.fetch();
			}
		}
		return list;
	}

	/** 게시글 상세 조회 */
	public BoardPosting getBoardPostDetail(String pstngOid) {
		return query.select(projection())
					.from(post)
					.leftJoin(board)
					.on(post.bbsOid.eq(board.bbsOid))
					.where(post.pstngOid.eq(pstngOid))
					.fetchOne();
	}
	
	/** 게시판 OID 조회 */
	public String getBbsOid(String pstngOid) {
		return query.select(post.bbsOid)
					.from(post)
					.leftJoin(board)
					.on(post.bbsOid.eq(board.bbsOid))
					.where(post.pstngOid.eq(pstngOid))
					.fetchOne();
	}
	
	/** 게시글 OID 조회 */
	public String getPstngOid(String pstngOid) {
		return query.select(post.pstngOid)
					.from(post)
					.leftJoin(board)
					.on(post.bbsOid.eq(board.bbsOid))
					.where(post.pstngOid.eq(pstngOid))
					.fetchOne();
	}
	
	/** 게시글 OID 생성 */
	public String createPstngOid() {
		return query.select(post.pstngOid.castToNum(Integer.class).max().add(1).stringValue())
				.from(post)
				.fetchOne();
	}
	
	/** 게시글 전체 삭제 */
	public void removeBoardPosts(String bbsOid) {
		query.delete(post)
			 .where(post.bbsOid.eq(bbsOid)).execute();
	}

	/** 게시글 삭제 */
	public void removeBoardPost(String bbsOid, String pstngOid) {
		query.delete(post)
		 	 .where(post.bbsOid.eq(bbsOid), post.pstngOid.eq(pstngOid))
		 	 .execute();
	}
	
	/** 게시글 조회수 */
	public void getBoardPostHit(String pstngOid) {
		query.update(post)
			 .set(post.retvNum, post.retvNum.add(1))
			 .where(post.pstngOid.eq(pstngOid))
			 .execute();
	}
	
}
