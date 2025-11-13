package kr.co.n2m.platform.admin.feature.faq.query;

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
import kr.co.n2m.platform.admin.feature.faq.entity.Faq;
import kr.co.n2m.platform.admin.feature.faq.entity.QFaq;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FaqQuery {
	
	private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QFaq faq = QFaq.faq;
	private final QAttachFile file = QAttachFile.attachFile;
	
	public BooleanBuilder predicate(Faq faqVo) {
		
		BooleanBuilder search = new BooleanBuilder();
		
		// 제목 + 작성자 검색
		if(StringUtil.isNotEmpty(faqVo.getSearchWord())) {
			search.and(faq.faqTitle.contains(faqVo.getSearchWord()))
				.or(faq.regrId.contains(faqVo.getSearchWord()));
		}
		
		// Faq OID 검색
		if(StringUtil.isNotEmpty(faqVo.getFaqOid())) {
			search.and(faq.faqOid.eq(faqVo.getFaqOid()));
		}
		
		// Faq 제목 검색
		if(StringUtil.isNotEmpty(faqVo.getFaqTitle())) {
			search.and(faq.faqTitle.contains(faqVo.getFaqTitle()));
		}
		
		// Faq 작성자 검색
		if(StringUtil.isNotEmpty(faqVo.getRegrId())) {
			search.and(faq.regrId.contains(faqVo.getRegrId()));
		}
		
		// 플랫폼 아이디 검색
		if(StringUtil.isNotEmpty(faqVo.getPltfrmId())) {
			search.and(faq.pltfrmId.eq(faqVo.getPltfrmId()));
		}
				
		// Faq 질문 검색
		if(StringUtil.isNotEmpty(faqVo.getFaqQstn())) {
			search.and(faq.faqQstn.contains(faqVo.getFaqQstn()));
		}
		
		// Faq 답변 검색
		if(StringUtil.isNotEmpty(faqVo.getFaqAns())) {
			search.and(faq.faqAns.contains(faqVo.getFaqAns()));
		}
		
		// 등록일시 검색
		if(StringUtil.isNotEmpty(faqVo.getSearchRegSt()) && StringUtil.isNotEmpty(faqVo.getSearchRegEd())) {
			search.and(faq.regDt.between(StringUtil.parseLocalDate(faqVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
					StringUtil.parseLocalDate(faqVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		if(StringUtil.isNotEmpty(faqVo.getSearchRegSt())) {
			search.and(faq.regDt.after(StringUtil.parseLocalDate(faqVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
		}
		
		if(StringUtil.isNotEmpty(faqVo.getSearchRegEd())) {
			search.and(faq.regDt.before(StringUtil.parseLocalDate(faqVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		// 등록일시 검색
		//if(StringUtil.isNotEmpty(faqVo.getSearchRegSt()) && StringUtil.isNotEmpty(faqVo.getSearchRegEd())) {
		//	LocalDateTime parseSt = LocalDateTime.parse(faqVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
		//	LocalDateTime parseEd = LocalDateTime.parse(faqVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
		//	search.and(faq.regDt.between(parseSt, parseEd));
		//}
		
		// 수정일시 검색
		if (StringUtil.isNotEmpty(faqVo.getSearchAmdSt()) && StringUtil.isNotEmpty(faqVo.getSearchAmdEd())) {
			LocalDateTime parseSt = LocalDateTime.parse(faqVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd = LocalDateTime.parse(faqVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(faq.amdDt.between(parseSt, parseEd));
		}
		
		return search;
	}
	
	public QBean<Faq> projection() { 
		
		return Projections.bean(Faq.class,
				faq.faqOid,
				faq.faqTitle,
				faq.faqQstn,
				faq.faqAns,
				faq.pltfrmId,
				faq.retvNum,
				faq.regDt,
				faq.regrId,
				faq.regrNm,
				faq.amdDt,
				faq.amdrId,
				faq.amdrNm,
				ExpressionUtils.as(
						JPAExpressions.select(file.atcOid.count())
									  .from(file)
									  .where(file.contsOid.eq(faq.faqOid)), "fileCount")
				);
		}
	
	/** Faq 목록수. */ 
	public long getFaqListCount(Faq searchVo) {
		return query.select(faq.count())
					.from(faq)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** Faq 목록 조회. */ 
	public List<Faq> getFaqList(Faq searchVo) {
		
		int offset = 0;
		int limit = 10;
		
		List<Faq> resultList = null;
		if (searchVo.isPaging()) {
			offset = (searchVo.getCurPage() - 1) * searchVo.getPageListSize();
			limit  = searchVo.getPageListSize();

			resultList = query.select(projection())
							  .from(faq)
							  .where(predicate(searchVo))
							  .orderBy(faq.regDt.desc())
							  .offset(offset)
							  .limit(limit)
							  .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				resultList = query.select(projection())
								  .from(faq)
								  .where(predicate(searchVo))
								  .orderBy(faq.regDt.desc())
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit = config.getListMaxRowCount();
				
				resultList = query.select(projection())
							   	  .from(faq)
								  .where(predicate(searchVo))
								  .fetch(); 
			}
		}

		return resultList;
	}
	
	/** Faq 목록 상세 조회. */ 
	public Faq getFaqDetail(String faqOid) {
		return query.select(projection())
					.from(faq)
					.where(faq.faqOid.eq(faqOid))
					.fetchOne();
	}
	
	/** Fap - FapOid 생성 조회. */
	public String getFaqOid() {
		return query.select(faq.faqOid.castToNum(Integer.class).max().add(1).stringValue())
				.from(faq)
				.fetchOne();
	}
	
	/** Faq 게시판 고유 번호값 */
	public String setNextBbs(AttachFile fileVo) {
		String nextBbs = query.select(file.bbsOid.substring(4, 10).max().coalesce("0"))
				 .from(file)
				 .where(file.bbsOid.contains("FAQ_"))
				 .fetchOne();
		return nextBbs;
	}
	
	/** Fap - FapOid 조회. */
	public String findFaqOid(String faqOid) {
		return query.select(faq.faqOid)
				.from(faq)
				.where(faq.faqOid.eq(faqOid))
				.fetchOne();
	}
	
	/** Faq 조회 수 증가. */ 
	public void patchFaqHit(String faqOid) {
		query.update(faq)
			 .set(faq.retvNum, faq.retvNum.add(1))
			 .where(faq.faqOid.eq(faqOid))
			 .execute();
	}
	
	/** Faq 삭제 */
	public void removeFaq(String faqOid) {
		query.delete(faq)
			 .where(faq.faqOid.eq(faqOid))
			 .execute();
	}

}
