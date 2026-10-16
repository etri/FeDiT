package kr.co.n2m.platform.admin.feature.notice.query;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.admin.feature.attachfile.entity.QAttachFile;
import kr.co.n2m.platform.admin.feature.notice.entity.Notice;
import kr.co.n2m.platform.admin.feature.notice.entity.QNotice;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class NoticeQuery {

	private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QNotice notice = QNotice.notice;
	private final QAttachFile file= QAttachFile.attachFile;
	
	
	public BooleanBuilder predicate(Notice noticeVo) {
		
		BooleanBuilder search = new BooleanBuilder();
		
		// 제목 + 작성자 검색
		if(StringUtil.isNotEmpty(noticeVo.getSearchWord())) {
			search.and(notice.ntfTitle.contains(noticeVo.getSearchWord()))
				.or(notice.regrId.contains(noticeVo.getSearchWord()));
		}
		
		// 공지사항 제목 검색
		if(StringUtil.isNotEmpty(noticeVo.getNtfTitle())) {
			search.and(notice.ntfTitle.contains(noticeVo.getNtfTitle()));
		}
		
		// 등록자 검색
		if(StringUtil.isNotEmpty(noticeVo.getRegrId())) {
			search.and(notice.regrId.contains(noticeVo.getRegrId()));
		}
		
		// 공지사항 OID 검색
		if(StringUtil.isNotEmpty(noticeVo.getNtfOid())) {
			search.and(notice.ntfOid.eq(noticeVo.getNtfOid()));
		}
			
		// 플랫폼 아이디 검색
		if(StringUtil.isNotEmpty(noticeVo.getPltfrmId())) {
			search.and(notice.pltfrmId.eq(noticeVo.getPltfrmId()));
		}
					
		// 공지사항 내용 검색
		if(StringUtil.isNotEmpty(noticeVo.getNtfSbst())) {
			search.and(notice.ntfSbst.contains(noticeVo.getNtfSbst()));
		}
				
		// 선 공지 여부 검색
		if(StringUtil.equals(noticeVo.getPrevNtfYn(), "Y")) {
			search.and(notice.prevNtfYn.eq("Y"));
		}
		
		if(StringUtil.equals(noticeVo.getPrevNtfYn(), "N")) {
			search.and(notice.prevNtfYn.eq("N"));
		}
		
		// 등록일시 검색
		if(StringUtil.isNotEmpty(noticeVo.getSearchRegSt()) && StringUtil.isNotEmpty(noticeVo.getSearchRegEd())) {
			search.and(notice.regDt.between(StringUtil.parseLocalDate(noticeVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
					StringUtil.parseLocalDate(noticeVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		if(StringUtil.isNotEmpty(noticeVo.getSearchRegSt())) {
			search.and(notice.regDt.after(StringUtil.parseLocalDate(noticeVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
		}
		
		if(StringUtil.isNotEmpty(noticeVo.getSearchRegEd())) {
			search.and(notice.regDt.before(StringUtil.parseLocalDate(noticeVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		
		//if(StringUtil.isNotEmpty(noticeVo.getSearchRegSt()) && StringUtil.isNotEmpty(noticeVo.getSearchRegEd())) {
		//	LocalDateTime parseSt = LocalDateTime.parse(noticeVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));			
		//	LocalDateTime parseEd = LocalDateTime.parse(noticeVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
		//	search.and(notice.regDt.between(parseSt, parseEd));
			
		//} else if(StringUtil.isNotEmpty(noticeVo.getSearchRegSt())) {
		//	LocalDateTime parseSt = LocalDateTime.parse(noticeVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
		//	search.and(notice.regDt.after(parseSt));
			
		//} else if(StringUtil.isNotEmpty(noticeVo.getSearchRegEd())) {
		//	LocalDateTime parseEd = LocalDateTime.parse(noticeVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
		//	search.and(notice.regDt.before(parseEd));
		//}
		
		// 수정일시 검색
		if (StringUtil.isNotEmpty(noticeVo.getSearchAmdSt()) && StringUtil.isNotEmpty(noticeVo.getSearchAmdEd())) {
			LocalDateTime parseSt = LocalDateTime.parse(noticeVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd = LocalDateTime.parse(noticeVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(notice.amdDt.between(parseSt, parseEd));
		}
		
		return search;
	}
	
	public QBean<AttachFile> fileprojection() {
			
			return Projections.bean(AttachFile.class,
					file.atcOid,
					file.contsOid,
					file.fileOriginNm,
					file.fileRestoNm,
					file.fileRestoPath,
					file.fileSize				
					);
			}
	
	public QBean<Notice> projection() {
		
		return Projections.bean(Notice.class,
				notice.ntfOid,
				notice.ntfTitle,
				notice.ntfSbst,
				notice.retvNum,
				notice.admPrsnNtfYn,
				new CaseBuilder()
					.when(notice.admPrsnNtfYn.eq(Boolean.toString(true)))
					.then("운영자포탈")
					.otherwise("사용자포탈").as("admPrsnNtfYnName"),
				notice.prevNtfYn,
				new CaseBuilder()
					.when(notice.prevNtfYn.eq(Boolean.toString(true)))
					.then("예")
					.otherwise("아니오").as("prevNtfYnName"),
				notice.mainPopupYn,
				notice.popupStDt,
				notice.popupFnsDt,
				notice.popupWdth,
				notice.popupHght,
				notice.clsButtIndcYn,
				notice.todayPopupIndcYn,
				notice.pltfrmId,
				notice.regDt,
				notice.regrId,
				notice.regrNm,
				notice.amdDt,
				notice.amdrId,
				notice.amdrNm,
				ExpressionUtils.as(
						JPAExpressions.select(file.atcOid.count())
									  .from(file)
									  .where(file.contsOid.eq(notice.ntfOid).and(file.bbsOid.contains("NTF"))),"fileCount")				
				);
		}
	
	/** 공지사항 목록수. */ 
	public long getNoticeListCount(Notice searchVo) {
		return query.select(notice.count())
					.from(notice)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** 공지사항 목록 조회. */ 
	public List<Notice> getNoticeList(Notice searchVo, AttachFile fileVo) {
		
		int offset = 0;
		int limit = 10;
		
		List<Notice> resultList = null;
		if (searchVo.isPaging()) {
			offset = (searchVo.getCurPage() - 1) * searchVo.getPageListSize();
			limit  = searchVo.getPageListSize();

			resultList = query.select(projection())
							  .from(notice)
							  .where(predicate(searchVo))
							  .orderBy(notice.prevNtfYn.desc(), notice.regDt.desc())
							  .offset(offset)
							  .limit(limit)
							  .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				resultList = query.select(projection())
								  .from(notice)
								  .where(predicate(searchVo))
								  .orderBy(notice.prevNtfYn.desc(), notice.regDt.desc())
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit = config.getListMaxRowCount();
				
				resultList = query.select(projection())
							   	  .from(notice)
								  .where(predicate(searchVo))
								  .fetch(); 
			}
		}

		return resultList;
	}
	
	/** 공지사항 목록 상세 조회. */ 
	public Notice getNoticeDetail(String ntfOid) {
		return query.select(projection())
					.from(notice) 
					.where(notice.ntfOid.eq(ntfOid))
					.fetchOne();
	}
	
	/** 공지사항 조회 수 증가. */ 
	public void patchNoticeHit(String ntfOid) {
		query.update(notice)
			 .set(notice.retvNum, notice.retvNum.add(1))
			 .where(notice.ntfOid.eq(ntfOid))
			 .execute();
	}
	
	/** 공지사항 삭제 */
	public void removeNotice(String ntfOid) {
		query.delete(notice)
			 .where(notice.ntfOid.eq(ntfOid))
			 .execute();
	}
	
	/** Notice - NtfOid 조회 */
	public String findNtfOid(String ntfOid) {
		return query.select(notice.ntfOid)
				.from(notice)
				.where(notice.ntfOid.eq(ntfOid))
				.fetchOne();
	}
	
	/** Notice - NtfOid 생성 조회 */
	public String getNtfOid() {
		return query.select(notice.ntfOid.castToNum(Integer.class).max().add(1).stringValue())
				.from(notice)
				.fetchOne();
	}

	/** Notice 게시판 고유 번호값 */
	public String setNextBbs(AttachFile fileVo) {
		String nextBbs = query.select(file.bbsOid.substring(4, 10).max().coalesce("0"))
				 .from(file)
				 .where(file.bbsOid.contains("NTF_"))
				 .fetchOne();
		return nextBbs;
	}
	
	/** 플랫폼 아이디 별 notice 리스트 조회 */
	public List<Notice> findByPltfrmId(String pltfrmId) {
		LocalDateTime now = LocalDateTime.now();
		
		return query.select(projection())
				.from(notice)
				.where(notice.pltfrmId.eq(pltfrmId)
						.and(notice.mainPopupYn.eq("Y")))
				.orderBy(notice.ntfOid.asc())
				.fetch();
	}
}

//.and(notice.popupStDt.before(now)
//		.and(notice.popupFnsDt.after(now)))
