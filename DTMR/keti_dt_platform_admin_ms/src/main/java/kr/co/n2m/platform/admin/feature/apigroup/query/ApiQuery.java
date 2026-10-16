package kr.co.n2m.platform.admin.feature.apigroup.query;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.apigroup.entity.Api;
import kr.co.n2m.platform.admin.feature.apigroup.entity.QApi;
import kr.co.n2m.platform.admin.feature.apigroup.entity.QApigroup;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ApiQuery {
	
	private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QApi api = QApi.api;
	private final QApigroup apigroup = QApigroup.apigroup;

	public BooleanBuilder predicate(Api searchVo) {
		BooleanBuilder search = new BooleanBuilder();
		
		// API OID 검색
		if(StringUtil.isNotEmpty(searchVo.getApiOid())) {
			search.and(api.apiOid.eq(searchVo.getApiOid()));
		}
		
		// API group OID 검색
		if(StringUtil.isNotEmpty(searchVo.getGrpOid())) {
			search.and(api.grpOid.eq(searchVo.getGrpOid()));
		}
		
		// API 명 검색
		if(StringUtil.isNotEmpty(searchVo.getApiName())) {
			search.and(api.apiName.contains(searchVo.getApiName()));
		}
		
		// API 설명 검색
		if(StringUtil.isNotEmpty(searchVo.getApiDesc())) {
			search.and(api.apiDesc.contains(searchVo.getApiDesc()));
		}
		
		// 사용 여부
		if(StringUtil.isNotEmpty(searchVo.getUseYn()) && StringUtil.checkYnValue(searchVo.getUseYn())) {
			search.and(api.useYn.eq(searchVo.getUseYn()));
		}
			
		// 등록일시 검색
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(api.regDt.between(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
					StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt())) {
			search.and(api.regDt.after(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(api.regDt.before(StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
			
			
			return search;
		}
	
		public QBean<Api> projection() {
			
			return Projections.bean(Api.class,
					api.apiOid,
					api.grpOid,
					api.apiName,
					api.apiDesc,
					api.apiUrl,
					api.mthdCd,				
					api.useYn,
					api.regDt,
					api.regrId,
					api.regrNm,
					api.amdDt,
					api.amdrId,
					api.amdrNm
			);		
		}
		
		/** API 목록수. */ 
		public long getApiListCount(Api searchVo) {
			return query.select(api.count())
						.from(api)
						.where(predicate(searchVo))
						.fetchFirst();
		}
		
		
		/** API 목록 조회. */ 
		public List<Api> getApiList(Api searchVo) {
			
			int offset = 0;
			int limit = 10;
			
			List<Api> resultList = null;
			if (searchVo.isPaging()) {
				
				offset = (searchVo.getCurPage() - 1) * searchVo.getPageListSize();
				limit  = searchVo.getPageListSize();

				resultList = query.select(projection())
								  .from(api)
								  .leftJoin(apigroup)
								  .on(api.grpOid.eq(apigroup.grpOid))
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
									  .from(api)
									  .leftJoin(apigroup)
									  .on(api.grpOid.eq(apigroup.grpOid))
									  .where(predicate(searchVo))
									  .offset(offset)
									  .limit(limit)
									  .fetch();
				}
				else {
					limit = config.getListMaxRowCount();
					
					resultList = query.select(projection())
									  .from(api)
									  .leftJoin(apigroup)
									  .on(api.grpOid.eq(apigroup.grpOid))
									  .where(predicate(searchVo))
									  .fetch(); 
				}
			}

			return resultList;
		}
		
		/** API OID 조회. */
		public String getApiOid(String apiOid) {
			return query.select(api.apiOid)
						.from(api)
						.leftJoin(apigroup)
						.on(api.grpOid.eq(apigroup.grpOid))
						.where(api.apiOid.eq(apiOid))
						.fetchOne();
		}
		
		/** API GROUP OID 조회. */
		public String getGrpOid(String grpOid, String apiOid) {
			return query.select(api.grpOid)
						.from(api)
						.leftJoin(apigroup)
						.on(api.grpOid.eq(apigroup.grpOid))
						.where(api.apiOid.eq(apiOid))
						.fetchOne();
		}
		
		/** API 목록 상세 조회. */
		public Api getApiDetail(Api apiEntity) {
			return query.select(Projections.fields(Api.class,
						api.apiOid,
						api.grpOid,
						api.apiName,
						api.apiDesc,
						api.apiUrl,
						api.mthdCd,
						api.useYn,
						api.regDt,
						api.regrId,
						api.regrNm,
						api.amdDt,
						api.amdrId,
						api.amdrNm
					))
					.from(api)
					.leftJoin(apigroup)
					.on(api.grpOid.eq(apigroup.grpOid))
					.where(
							api.grpOid.eq(apiEntity.getGrpOid())
							.and(api.apiOid.eq(apiEntity.getApiOid()))
					)
					.fetchOne();
		}
		
		/** API 삭제. */
		public void removeApi(String apiOid) {
			query.delete(api)
			.where(api.apiOid.eq(apiOid))
			.execute();
		}
		
		/** API 목록 삭제. */
		public void removeApiList(String grpOid) {
			query.delete(api)
			.where(api.grpOid.eq(grpOid))
			.execute();
		}
		
	}
