package kr.co.n2m.platform.admin.feature.codegroup.query;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.codegroup.entity.Codegroup;
import kr.co.n2m.platform.admin.feature.codegroup.entity.QCodegroup;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CodegroupQuery {

    private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QCodegroup codegroup = QCodegroup.codegroup;

	public BooleanBuilder predicate(Codegroup searchVo) {
		
		BooleanBuilder search = new BooleanBuilder();

		if(StringUtil.isNotEmpty(searchVo.getSearchWord())) {
			search.and(codegroup.grpNm.contains(searchVo.getSearchWord()))
				.or(codegroup.grpVal.contains(searchVo.getSearchWord()));
		}
		if(StringUtil.isNotEmpty(searchVo.getGrpNm())) {
		search.and(codegroup.grpNm.contains(searchVo.getGrpNm()));
		}
		if(StringUtil.isNotEmpty(searchVo.getGrpVal())) {
			search.and(codegroup.grpVal.contains(searchVo.getGrpVal()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getPltfrmId())) {
			search.and(codegroup.pltfrmId.eq(searchVo.getPltfrmId()));
		}

		if(StringUtil.equals(searchVo.getUseYn(), "Y")) {
			search.and(codegroup.useYn.eq("Y"));
		}
		if(StringUtil.equals(searchVo.getUseYn(), "N")) {
			search.and(codegroup.useYn.eq("N"));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(codegroup.regDt.between(parseSt, parseEd));
		}
		if(StringUtil.isNotEmpty(searchVo.getSearchAmdSt()) && StringUtil.isNotEmpty(searchVo.getSearchAmdEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(codegroup.amdDt.between(parseSt, parseEd));
		}
		
		return search;
	}
	
	public QBean<Codegroup> projection(){
		
		return Projections.bean(Codegroup.class, 
				codegroup.grpId,
				codegroup.grpNm,
				codegroup.grpVal,
				codegroup.grpDesc,
				codegroup.upCdGrpId,
				codegroup.useYn,
				codegroup.pltfrmId,
				codegroup.cdType,
				codegroup.regDt,
				codegroup.regrId,
				codegroup.regrNm,
				codegroup.amdDt,
				codegroup.amdrId,
				codegroup.amdrNm
		);
	}
	
	/** 코드 그룹 목록 개수. */
	public long getCodegroupListCount(Codegroup searchVo) {
		return query.select(codegroup.count())
					.from(codegroup)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** 코드 그룹 목록 조회 */
	public List<Codegroup> getCodegroupList(Codegroup searchVo) {
		List<Codegroup> resultList= null;
		int offset= 0;
		int limit= 10;
		
		if(searchVo.isPaging()) {
			offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize();
			limit = searchVo.getPageListSize();
			
			resultList= query.select(projection())
							 .from(codegroup)
							 .where(predicate(searchVo))
							 .offset(offset)
							 .limit(limit)
							 .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				resultList = query.select(projection())
								  .from(codegroup)
								  .where(predicate(searchVo))
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit= config.getListMaxRowCount();
				
				resultList = query.select(projection())
								  .from(codegroup)
								  .where(predicate(searchVo))
								  .limit(limit)
								  .fetch(); 
			}
		}
		return resultList;
	}
	
	/** 코드 그룹 상세 조회 */
	public Codegroup getCodegroupDetail(String grpId) {
		return query.select(projection())
					.from(codegroup)
					.where(codegroup.grpId.eq(grpId))
					.fetchOne();
	}
	
	/** 코드 그룹 ID 조회 */
	public String findGrpId(String grpId) {
		return query.select(codegroup.grpId)
					.from(codegroup)
					.where(codegroup.grpId.eq(grpId))
					.fetchOne();
	}
	
    /** 코드 그룹 생성 ID 조회 */
	public String getGrpId(Codegroup codegroupVo) {
		return query.select(codegroup.grpId.substring(3, 8).max().coalesce("0"))
					.from(codegroup)
					.fetchOne();
	}

	/** 코드 그룹 삭제 */
	public void removeCodegroup(String grpId) {
		query.delete(codegroup)
			 .where(codegroup.grpId.eq(grpId)).execute();
	}
	
}
