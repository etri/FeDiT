package kr.co.n2m.platform.admin.feature.qna.query;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.admin.feature.attachfile.entity.QAttachFile;
import kr.co.n2m.platform.admin.feature.codegroup.entity.QCode;
import kr.co.n2m.platform.admin.feature.qna.entity.QQna;
import kr.co.n2m.platform.admin.feature.qna.entity.Qna;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class QnaQuery {
	
	private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QQna qna = QQna.qna;
	private final QCode code = QCode.code;
	private final QAttachFile file = QAttachFile.attachFile;
	
	public BooleanBuilder predicate(Qna qnaVo) {
		
		BooleanBuilder search = new BooleanBuilder();	
		
		// 제목 + 작성자 검색
		if(StringUtil.isNotEmpty(qnaVo.getSearchWord())) {
			search.and(qna.qnaTitle.contains(qnaVo.getSearchWord()))
				.or(qna.regrId.eq(qnaVo.getSearchWord()));
		}
		
		// QNA OID 검색
		if(StringUtil.isNotEmpty(qnaVo.getQnaOid())) {
			search.and(qna.qnaOid.eq(qnaVo.getQnaOid()));
		}
		
		// 등록자 검색
		if(StringUtil.isNotEmpty(qnaVo.getRegrId())) {
			search.and(qna.regrId.eq(qnaVo.getRegrId()));
		}
		
		// QNA 제목 검색
		if(StringUtil.isNotEmpty(qnaVo.getQnaTitle())) {
			search.and(qna.qnaTitle.contains(qnaVo.getQnaTitle()));
		}
		
		// QNA 질문 검색
		if(StringUtil.isNotEmpty(qnaVo.getQnaQstn())) {
			search.and(qna.qnaQstn.contains(qnaVo.getQnaQstn()));
		}
		
		// QNA 답변 검색
		if(StringUtil.isNotEmpty(qnaVo.getQnaAns())) {
			search.and(qna.qnaAns.contains(qnaVo.getQnaAns()));
		}
		
		// 플랫폼 아이디 검색
		if(StringUtil.isNotEmpty(qnaVo.getPltfrmId())) {
			search.and(qna.pltfrmId.eq(qnaVo.getPltfrmId()));
		}
		
		// QNA 상태코드 검색
		if(StringUtil.isNotEmpty(qnaVo.getSttusCd())) {
			search.and(qna.sttusCd.contains(qnaVo.getSttusCd()));
		}
		
		// 공개 여부 검색
		if(StringUtil.equals(qnaVo.getOttpYn(), "Y")) {
			search.and(qna.ottpYn.eq("Y"));
		}
		
		if(StringUtil.equals(qnaVo.getOttpYn(), "N")) {
			search.and(qna.ottpYn.eq("N"));
		}	
		
		// 등록일시 검색
		if(StringUtil.isNotEmpty(qnaVo.getSearchRegSt()) && StringUtil.isNotEmpty(qnaVo.getSearchRegEd())) {
			search.and(qna.regDt.between(StringUtil.parseLocalDate(qnaVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
					StringUtil.parseLocalDate(qnaVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		if(StringUtil.isNotEmpty(qnaVo.getSearchRegSt())) {
			search.and(qna.regDt.after(StringUtil.parseLocalDate(qnaVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
		}
		
		if(StringUtil.isNotEmpty(qnaVo.getSearchRegEd())) {
			search.and(qna.regDt.before(StringUtil.parseLocalDate(qnaVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		// 등록일시 검색
		//if(StringUtil.isNotEmpty(qnaVo.getSearchRegSt()) && StringUtil.isNotEmpty(qnaVo.getSearchRegEd())) {
		//	LocalDateTime parseSt= LocalDateTime.parse(qnaVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
		//	LocalDateTime parseEd= LocalDateTime.parse(qnaVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
		//	search.and(qna.regDt.between(parseSt, parseEd));
		//}
		
		// 수정일시 검색
		if(StringUtil.isNotEmpty(qnaVo.getSearchAmdSt()) && StringUtil.isNotEmpty(qnaVo.getSearchAmdEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(qnaVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(qnaVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(qna.amdDt.between(parseSt, parseEd));
		}
		
		return search;
	}
	
	public QBean<Qna> projection() {
		
		return Projections.bean(Qna.class,
				qna.qnaOid,
				qna.qnaTitle,
				qna.qnaQstn,
				qna.qnaAns,
				qna.ottpYn,
				qna.sttusCd,
				qna.retvNum,
				qna.regDt,
				qna.regrId,
				qna.regrNm,
				qna.amdDt,
				qna.amdrId,
				qna.amdrNm,
				qna.regDt2,
				qna.regr2Id,
				qna.regr2Nm,
				qna.pltfrmId,
				code.cdNm,
				code.cdNm.as("qnaStatusName"),
				ExpressionUtils.as(
						JPAExpressions.select(file.atcOid.count())
									  .from(file)
									  .where(file.contsOid.eq(qna.qnaOid)),"fileCount")				
				);
		}
	
	/** QNA 목록수. */ 
	public long getQnaListCount(Qna searchVo) {
		return query.select(qna.count())
					.from(qna)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** QNA 목록 조회. */ 
	public List<Qna> getQnaList(Qna searchVo) {
		
		int offset = 0;
		int limit = 10;
		
		List<Qna> resultList = null;
		if (searchVo.isPaging()) {
			offset = (searchVo.getCurPage() - 1) * searchVo.getPageListSize();
			limit  = searchVo.getPageListSize();

			resultList = query.select(projection())
							  .from(qna)
							  .leftJoin(code)
							  .on(qna.sttusCd.eq(code.cdId))
							  .where(predicate(searchVo))
							  .orderBy(qna.regDt.desc())
							  .offset(offset)
							  .limit(limit)
							  .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				resultList = query.select(projection())
								  .from(qna)
								  .leftJoin(code)
								  .on(qna.sttusCd.eq(code.cdId))
								  .where(predicate(searchVo))
								  .orderBy(qna.regDt.desc())
								  .offset(offset)
								  .limit(limit)
								  .fetch();
			}
			else {
				limit = config.getListMaxRowCount();
				
				resultList = query.select(projection())
							   	  .from(qna)
								  .where(predicate(searchVo))
								  .fetch(); 
			}
		}

		return resultList;
	}
	
	/** QNA 목록 상세 조회. */ 
	public Qna getQnaDetail(String qnaOid) {
		return query.select(projection())
					.from(qna)
					.leftJoin(code)
					.on(qna.sttusCd.eq(code.cdId))
					.where(qna.qnaOid.eq(qnaOid))
					.fetchOne();
	}
	
	/** QNA - QnaOid 조회. */ 
	public String findQnaOid(String qnaOid) {
		return query.select(qna.qnaOid)
					.from(qna)
					.where(qna.qnaOid.eq(qnaOid))
					.fetchOne();
	}
	
	/** QNA - QnaOid 생성 조회. */ 
	public String getQnaOid() {
		return query.select(qna.qnaOid.castToNum(Integer.class).max().add(1).stringValue())
					.from(qna)
					.fetchOne();
	}
	
	/** Qna 게시판 고유 번호값 */
	public String setNextBbs(AttachFile fileVo) {
		String nextBbs = query.select(file.bbsOid.substring(4, 10).max().coalesce("0"))
				 .from(file)
				 .where(file.bbsOid.contains("QNA_"))
				 .fetchOne();
		return nextBbs;
	}
	
	/** QNA 조회 수 증가. */ 
	public void patchQnaHit(String qnaOid) {
		query.update(qna)
			 .set(qna.retvNum, qna.retvNum.add(1))
			 .where(qna.qnaOid.eq(qnaOid))
			 .execute();
	}
	
	/** QNA 삭제 */
	public void removeQna(String qnaOid) {
		query.delete(qna)
			 .where(qna.qnaOid.eq(qnaOid))
			 .execute();
	}
}
