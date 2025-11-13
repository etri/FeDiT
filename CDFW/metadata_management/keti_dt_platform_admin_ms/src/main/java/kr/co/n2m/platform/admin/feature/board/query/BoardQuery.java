package kr.co.n2m.platform.admin.feature.board.query;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.board.entity.Board;
import kr.co.n2m.platform.admin.feature.board.entity.QBoard;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BoardQuery {

    private final ApplicationConfig config;
    private final JPAQueryFactory query;
    private final QBoard board= QBoard.board;
    
    public BooleanBuilder predicate(Board searchVo) {
    	BooleanBuilder search = new BooleanBuilder();
    	
		if(StringUtil.isNotEmpty(searchVo.getBbsOid())) {
			search.and(board.bbsOid.contains(searchVo.getBbsOid()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchWord())) {
			search.and(board.bbsNm.contains(searchVo.getSearchWord()))
			.or(board.bbsCd.contains(searchVo.getSearchWord()));
		}

		// 플랫폼 아이디 검색
		if(StringUtil.isNotEmpty(searchVo.getPltfrmId())) {
			search.and(board.pltfrmId.eq(searchVo.getPltfrmId()));
		}
				
		if(StringUtil.equals(searchVo.getUseYn(), "Y")) {
			search.and(board.useYn.eq("Y"));
		}
		if(StringUtil.equals(searchVo.getUseYn(), "N")) {
			search.and(board.useYn.eq("N"));
		}
		
		if(StringUtil.equals(searchVo.getReplUseYn(), "Y")) {
			search.and(board.replUseYn.eq("Y"));
		}
		if(StringUtil.equals(searchVo.getReplUseYn(), "N")) {
			search.and(board.replUseYn.eq("N"));
		}
		
		if(StringUtil.equals(searchVo.getAtcFileUseYn(), "Y")) {
			search.and(board.atcFileUseYn.eq("Y"));
		}
		if(StringUtil.equals(searchVo.getAtcFileUseYn(), "N")) {
			search.and(board.atcFileUseYn.eq("N"));
		}
		
		// 등록일시 검색
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(board.regDt.between(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
					StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt())) {
			search.and(board.regDt.after(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(board.regDt.before(StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
    	return search;
    }
    
	public QBean<Board> projection(){
		
		return Projections.bean(Board.class, 
				board.bbsOid,
				board.bbsNm,
				board.bbsCd,
				board.useYn,
				new CaseBuilder()
				.when(board.useYn.eq(Boolean.toString(true)))
				.then("Y")
				.otherwise("N").as("useYnVal"),
				board.replUseYn,
				new CaseBuilder()
				.when(board.replUseYn.eq(Boolean.toString(true)))
				.then("Y")
				.otherwise("N").as("replUseYnVal"),
				board.atcFileUseYn,
				new CaseBuilder()
				.when(board.atcFileUseYn.eq(Boolean.toString(true)))
				.then("Y")
				.otherwise("N").as("atcFileUseYnVal"),
				board.regDt,
				board.regrId,
				board.regrNm,
				board.amdDt,
				board.amdrId,
				board.amdrNm,
				board.pltfrmId
				
		);
	}
	
	/** 게시판 목록 개수. */
	public long getBoardListCount(Board searchVo) {
		return query.select(board.count())
					.from(board)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** 게시판 목록 조회 */
	public List<Board> getBoardList(Board searchVo) {
		List<Board> list= null;
		int offset= 0;
		int limit= 10;
		
		if(searchVo.isPaging()) {
			offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize();
			limit = searchVo.getPageListSize();
			
			list= query.select(projection())
							 .from(board)
							 .where(predicate(searchVo))
							.orderBy(board.regDt.desc())
							 .offset(offset)
							 .limit(limit)
							 .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				list = query.select(projection())
								  .from(board)
								  .where(predicate(searchVo))
								  .orderBy(board.regDt.desc())
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit= config.getListMaxRowCount();
				
				list = query.select(projection())
								  .from(board)
								  .where(predicate(searchVo))
								  .orderBy(board.regDt.desc())
								  .limit(limit)
								  .fetch(); 
			}
		}
		return list;
	}

	/** 게시판 상세 조회 */
	public Board getBoardDetail(String bbsOid) {
		return query.select(projection())
					.from(board)
					.where(board.bbsOid.eq(bbsOid))
					.fetchOne();
	}

	/** 게시판 OID 조회 */
	public String getBbsOid(String bbsOid) {
		return query.select(board.bbsOid)
					.from(board)
					.where(board.bbsOid.eq(bbsOid))
					.fetchOne();
	}

	/** 게시판 삭제 */
	public void removeBoard(String bbsOid) {
		query.delete(board)
		 	 .where(board.bbsOid.eq(bbsOid)).execute();
	}
}
