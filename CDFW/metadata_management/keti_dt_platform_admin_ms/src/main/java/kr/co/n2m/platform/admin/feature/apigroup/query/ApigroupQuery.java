package kr.co.n2m.platform.admin.feature.apigroup.query;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.apigroup.entity.Apigroup;
import kr.co.n2m.platform.admin.feature.apigroup.entity.QApi;
import kr.co.n2m.platform.admin.feature.apigroup.entity.QApigroup;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ApigroupQuery {
	
	private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QApi api = QApi.api;
	private final QApigroup apigroup = QApigroup.apigroup;

	public BooleanBuilder predicate(Apigroup searchVo) {

		BooleanBuilder search = new BooleanBuilder();
		
		if(StringUtil.isNotEmpty(searchVo.getSearchWord())) {
			search.and(apigroup.grpName.contains(searchVo.getSearchWord()))
				.or(apigroup.pltfrmId.contains(searchVo.getSearchWord()));
		}
				
		// API 그룹 OID 검색
		if(StringUtil.isNotEmpty(searchVo.getGrpOid())) {
			search.and(apigroup.grpOid.eq(searchVo.getGrpOid()));
		}
		
		// 플랫폼 아이디 검색
		if(StringUtil.isNotEmpty(searchVo.getPltfrmId())) {
			search.and(apigroup.pltfrmId.eq(searchVo.getPltfrmId()));
		}
		
		// API 그룹 명 검색
		if(StringUtil.isNotEmpty(searchVo.getGrpName())) {
			search.and(apigroup.grpName.contains(searchVo.getGrpName()));
		}
		
		// 사용자 여부 검색
		if(StringUtil.equals(searchVo.getUseYn(), "Y")) {
			search.and(apigroup.useYn.eq("Y"));
		}
		
		if(StringUtil.equals(searchVo.getUseYn(), "N")) {
			search.and(apigroup.useYn.eq("N"));
		}	
		
		// 등록일시 검색
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(apigroup.regDt.between(parseSt, parseEd));
		}
		
		// 수정일시 검색
		if(StringUtil.isNotEmpty(searchVo.getSearchAmdSt()) && StringUtil.isNotEmpty(searchVo.getSearchAmdEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(apigroup.amdDt.between(parseSt, parseEd));
		}
				
		return search;
	}
	
	public QBean<Apigroup> projection() {
		
		return Projections.bean(Apigroup.class,
				apigroup.grpOid,
				apigroup.grpName,
				apigroup.grpDesc,
				apigroup.useYn,
				apigroup.pltfrmId,
				apigroup.regDt,
				apigroup.regrId,
				apigroup.regrNm,
				apigroup.amdDt,
				apigroup.amdrId,
				apigroup.amdrNm
		);		
	}
	
	/** API 그룹 목록수. */ 
	public long getApigroupListCount(Apigroup searchVo) {
		return query.select(apigroup.count())
					.from(apigroup)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** API 그룹 목록 조회. */ 
	public List<Apigroup> getApigroupList(Apigroup searchVo) {
		
		int offset = 0;
		int limit = 10;
		
		List<Apigroup> resultList = null;
		if (searchVo.isPaging()) {
			offset = (searchVo.getCurPage() - 1) * searchVo.getPageListSize();
			limit  = searchVo.getPageListSize();

			resultList = query.select(projection())
							  .from(apigroup)
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
								  .from(apigroup)
								  .where(predicate(searchVo))
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit = config.getListMaxRowCount();
				
				resultList = query.select(projection())
							   	  .from(apigroup)
								  .where(predicate(searchVo))
								  .fetch(); 
			}
		}

		return resultList;
	}
	
	/** API 그룹 OID 조회. */
	public String getGrpOid(String grpOid) {
		return query.select(apigroup.grpOid)
					.from(apigroup)
					.where(apigroup.grpOid.eq(grpOid))
					.fetchOne();
	}
	
	/** API 그룹 목록 상세 조회. */ 
	public Apigroup getApigroupDetail(String grpOid) {
		return query.select(projection())
					.from(apigroup)
					.where(apigroup.grpOid.eq(grpOid))
					.fetchOne();
	}
	
	/** API 그룹 삭제. */ 
	public void removeApigroup(String grpOid) {
		query.delete(apigroup)
			 .where(apigroup.grpOid.eq(grpOid))
			 .execute();
	}
	
	public void removeApigroupOid(String grpOid) {
		query.delete(api)
			 .where(api.grpOid.eq(grpOid))
			 .execute();
	}

	public void deleteById(String grpOid) {
		// TODO Auto-generated method stub
		
	}
	
}
