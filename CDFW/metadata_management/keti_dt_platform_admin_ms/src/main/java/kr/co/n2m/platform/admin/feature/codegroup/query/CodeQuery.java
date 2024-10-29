package kr.co.n2m.platform.admin.feature.codegroup.query;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.codegroup.entity.Code;
import kr.co.n2m.platform.admin.feature.codegroup.entity.Codegroup;
import kr.co.n2m.platform.admin.feature.codegroup.entity.QCode;
import kr.co.n2m.platform.admin.feature.codegroup.entity.QCodegroup;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CodeQuery {
	
    private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QCode code = QCode.code;
	private final QCodegroup codegroup = QCodegroup.codegroup;

	public BooleanBuilder predicate(Code searchVo) {

		BooleanBuilder search = new BooleanBuilder();
		
		if(StringUtil.isNotEmpty(searchVo.getGrpId())) {
			search.and(code.grpId.eq(searchVo.getGrpId()));
		}
		if(StringUtil.equals(searchVo.getGrpId(), searchVo.getGrpId())) {
			search.and(code.grpId.eq(searchVo.getGrpId()));
		}

		if(StringUtil.equals(searchVo.getUseYn(), "Y")) {
			search.and(code.useYn.eq("Y"));
		}
		if(StringUtil.equals(searchVo.getUseYn(), "N")) {
			search.and(code.useYn.eq("N"));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(code.regDt.between(parseSt, parseEd));
		}
		if(StringUtil.isNotEmpty(searchVo.getSearchAmdSt()) && StringUtil.isNotEmpty(searchVo.getSearchAmdEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(code.amdDt.between(parseSt, parseEd));
		}
		
		return search;
	}
	
	public QBean<Code> projection(){
		
		return Projections.bean(Code.class, 
				code.cdId,
				code.cdId.as("key"),
				code.cdNm,
				code.cdNm.as("title"),
				code.grpId,
				codegroup.grpNm,
				code.cdVal,
				code.cdDesc,
				code.upCdId,
				code.useYn,
				code.odrg,
				code.refNm,
				code.refVal,
				code.regDt,
				code.regrId,
				code.regrNm,
				code.amdDt,
				code.amdrId,
				code.amdrNm
		);
	}
	
	/** 코드 목록 개수. */
	public long getCodeListCount(Code searchVo) {
		return query.select(code.count())
					.from(code)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** 코드 목록 조회 */
	public List<Code> getCodeList(Code searchVo) {
		List<Code> list= null;
		int offset= 0;
		int limit= 10;
		
		if(searchVo.isPaging()) {
			offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize();
			limit = searchVo.getPageListSize();
			
			list= query.select(projection())
					   .from(code)
					   .leftJoin(codegroup)
					   .on(code.grpId.eq(codegroup.grpId))
					   .where(predicate(searchVo))
					   .offset(offset)
					   .limit(limit)
						.orderBy(code.odrg.asc())
					   .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				list = query.select(projection())
							.from(code)
							.leftJoin(codegroup)
							.on(code.grpId.eq(codegroup.grpId))
							.where(predicate(searchVo))
							.offset(offset)
							.limit(limit)
							.orderBy(code.odrg.asc())
							.fetch(); 
			}
			else {
				limit= config.getListMaxRowCount();
				
				list =  query.select(projection())
							 .from(code)
							 .leftJoin(codegroup)
							 .on(code.grpId.eq(codegroup.grpId))
							 .where(predicate(searchVo))
							 .limit(limit)
							 .orderBy(code.odrg.asc())
							 .fetch();
			}
		}
		return list;
	}
	
	/** 워크플로우 코드 목록 조회 */
	public List<Code> getWflowCodeList(Code searchVo) {
		String grpId = searchVo.getGrpId();
		
		List<Code> list= null;
		int offset= 0;
		int limit= 10;
		
		if(searchVo.isPaging()) {
			offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize();
			limit = searchVo.getPageListSize();
			
			list= query.select(projection())
					   .from(code)
					   .leftJoin(codegroup)
					   .on(code.grpId.eq(codegroup.grpId))
					   .where(code.grpId.eq(grpId))
					   .offset(offset)
					   .limit(limit)
						.orderBy(code.odrg.asc())
					   .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				list = query.select(projection())
							.from(code)
							.leftJoin(codegroup)
							.on(code.grpId.eq(codegroup.grpId))
							.where(code.grpId.eq(grpId))
							.offset(offset)
							.limit(limit)
							.orderBy(code.odrg.asc())
							.fetch(); 
			}
			else {
				limit= config.getListMaxRowCount();
				
				list =  query.select(projection())
							 .from(code)
							 .leftJoin(codegroup)
							 .on(code.grpId.eq(codegroup.grpId))
							 .where(code.grpId.eq(grpId))
							 .limit(limit)
							 .orderBy(code.odrg.asc())
							 .fetch();
			}
		}
		return list;
	}
	
	/** 코드 상세 조회 */
	public Code getCodeDetail(String cdId) {
		return query.select(projection())
					.from(code)
					.leftJoin(codegroup)
					.on(code.grpId.eq(codegroup.grpId))
					.where(code.cdId.eq(cdId))
					.fetchOne();
	}
	
	/** 코드 그룹 ID 조회 */
	public String getCodeGroupId(String cdId) {
		return query.select(code.grpId)
					.from(code)
					.leftJoin(codegroup)
					.on(code.grpId.eq(codegroup.grpId))
					.where(code.cdId.eq(cdId))
					.fetchOne();
	}
	
	/** 코드 ID 조회 */
	public String findCdId(String cdId) {
		return query.select(code.cdId)
					.from(code)
					.leftJoin(codegroup)
					.on(code.grpId.eq(codegroup.grpId))
					.where(code.cdId.eq(cdId))
					.fetchOne();
	}
	
    /** 코드 생성 ID 조회 */
	public String getCdId(Code codeVo) {
		return query.select(code.cdId.substring(4, 9).max().coalesce("0"))
					.from(code)
					.fetchOne();
	}
	
	/** 코드 순서 조회 */
	public int getOdrg(String grpId, Code codeVo) {
		return query.select(code.odrg.max())
					.from(code)
					.where(code.grpId.eq(grpId))
					.fetchOne();
	}

	/** 코드 삭제 */
	public void removeCode(String grpId, String codeId) {
		query.delete(code)
			 .where(code.grpId.eq(grpId),code.cdId.eq(codeId))
			 .execute();
	}

	/** 코드 전체 삭제 */
	public void removeCodeByCodegroupOid(String grpId) {
		query.delete(code)
			.where(code.grpId.eq(grpId)).execute();
	}
	
	
}
