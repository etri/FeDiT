package kr.co.n2m.platform.admin.feature.platform.query;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.platform.entity.Platform;
import kr.co.n2m.platform.admin.feature.platform.entity.QPlatform;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PlatformQuery {

	private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QPlatform platform = QPlatform.platform;
	
	public BooleanBuilder predicate(Platform searchVo) {
		
		BooleanBuilder search = new BooleanBuilder();
		
		if(StringUtil.isNotEmpty(searchVo.getPltfrmId())) {
			search.and(platform.pltfrmId.eq(searchVo.getPltfrmId()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getPltfrmNm())) {
			search.and(platform.pltfrmNm.eq(searchVo.getPltfrmNm()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getPltfrmDesc())) {
			search.and(platform.pltfrmDesc.eq(searchVo.getPltfrmDesc()));
		}
		
		if(StringUtil.equals(searchVo.getUseYn(), "Y")) {
			search.and(platform.useYn.eq("Y"));
		}
		
		if(StringUtil.equals(searchVo.getUseYn(), "N")) {
			search.and(platform.useYn.eq("N"));
		}

		if (StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			LocalDateTime parseSt = LocalDateTime.parse(searchVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd = LocalDateTime.parse(searchVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(platform.regDt.between(parseSt, parseEd));
		}
			
		if (StringUtil.isNotEmpty(searchVo.getSearchAmdSt()) && StringUtil.isNotEmpty(searchVo.getSearchAmdEd())) {
			LocalDateTime parseSt = LocalDateTime.parse(searchVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd = LocalDateTime.parse(searchVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(platform.amdDt.between(parseSt, parseEd));
		}
		
		return search;
	}
	
	public QBean<Platform> projection() {
	
		return Projections.bean(Platform.class,
				platform.pltfrmId,
				platform.pltfrmId.as("key"),				
				platform.pltfrmNm,
				platform.pltfrmNm.as("title"),
				platform.pltfrmDesc,
				platform.useYn,
				platform.regDt,
				platform.regrId,
				platform.regrNm,
				platform.amdDt,
				platform.amdrId,
				platform.amdrNm,
				platform.odrg,
				platform.mainScrnExistYn
			);
	}
	
	/** 플랫폼 목록수. */ 
	public long getPlatformListCount(Platform searchVo) {
		return query.select(platform.count())
					.from(platform)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** 플랫폼 목록 조회. */ 
	public List<Platform> getPlatformList(Platform searchVo) {
		
		int offset = 0;
		int limit = 10;
		
		List<Platform> resultList = null;
		if (searchVo.isPaging()) {
			offset = (searchVo.getCurPage() - 1) * searchVo.getPageListSize();
			limit  = searchVo.getPageListSize();

			resultList = query.select(projection())
							  .from(platform)
							  .where(predicate(searchVo))
							  .orderBy(platform.odrg.asc())
							  .offset(offset)
							  .limit(limit)
							  .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				resultList = query.select(projection())
								  .from(platform)
								  .where(predicate(searchVo))
								  .orderBy(platform.odrg.asc())
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit = config.getListMaxRowCount();
				
				resultList = query.select(projection())
							   	  .from(platform)
								  .where(predicate(searchVo))
								  .orderBy(platform.odrg.asc())
								  .fetch(); 
			}
		}

		return resultList;
	}
	
	/** 플랫폼 목록 상세 조회. */ 
	public Platform getPlatformDetail(String pltfrmId) {
		return query.select(projection())
				.from(platform)
				.where(platform.pltfrmId.eq(pltfrmId))
				.fetchOne();
	}
	
	/** 플랫폼 ID 조회. */
	public String getPltfrmId(String pltfrmId) {
		return query.select(platform.pltfrmId)
				.from(platform)
				.where(platform.pltfrmId.eq(pltfrmId))
				.fetchOne();
	}
	
	/** 플랫폼 삭제. */
	public void removePlatform(String pltfrmId) {
		query.delete(platform)
			 .where(platform.pltfrmId.eq(pltfrmId))
			 .execute();
	}
	
}

