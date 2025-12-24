package kr.co.n2m.platform.admin.feature.img.query;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.attachfile.entity.QAttachFile;
import kr.co.n2m.platform.admin.feature.img.entity.Img;
import kr.co.n2m.platform.admin.feature.img.entity.QImg;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ImgQuery {

    private final ApplicationConfig config;
    private final JPAQueryFactory query;
    private final QImg img = QImg.img;
    private final QAttachFile file = QAttachFile.attachFile;
    
    public BooleanBuilder predicate(Img searchVo) {
    	BooleanBuilder search = new BooleanBuilder();
    	
		if(StringUtil.isNotEmpty(searchVo.getImgOid())) {
			search.and(img.imgOid.contains(searchVo.getImgOid()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd 'T'HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(img.regDt.between(parseSt, parseEd));
		}
		if(StringUtil.isNotEmpty(searchVo.getSearchAmdSt()) && StringUtil.isNotEmpty(searchVo.getSearchAmdEd())) {
			LocalDateTime parseSt= LocalDateTime.parse(searchVo.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd= LocalDateTime.parse(searchVo.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			
			search.and(img.amdDt.between(parseSt, parseEd));
		}
		
		// 플랫폼 아이디 검색
		if(StringUtil.isNotEmpty(searchVo.getPltfrmId())) {
			search.and(img.pltfrmId.eq(searchVo.getPltfrmId()));
		}
				
    	return search;
    }
    
	public QBean<Img> projection(){
		
		return Projections.bean(Img.class, 
				img.imgOid,
				img.imgNm,
				img.imgLnydNm,
				img.regDt,
				img.regrId,
				img.regrNm,
				img.amdDt,
				img.amdrId,
				img.amdrNm,
				img.pltfrmId,
				file.fileOriginNm,
				file.fileRestoNm,
				file.fileRestoPath,
				ExpressionUtils.as(
                        JPAExpressions.select(file)
                                .from(file)
                                .where(file.contsOid.eq(img.imgOid),file.bbsOid.contains("IMG_")),
                        "fileCount")
		);
	}
	
	/** 이미지 목록 개수. */
	public long getImgListCount(Img searchVo) {
		return query.select(img.count())
					.from(img)
					.where(predicate(searchVo))
					.fetchFirst();
	}
	
	/** 이미지 목록 조회 */
	public List<Img> getImgList(Img searchVo) {
		List<Img> list= null;
		int offset= 0;
		int limit= 10;
		
		if(searchVo.isPaging()) {
			offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize();
			limit = searchVo.getPageListSize();
			
			list= query.select(projection())
							 .from(img)
							 .leftJoin(file)
							 .on(img.imgOid.eq(file.contsOid),file.bbsOid.contains("IMG_"))
							 .where(predicate(searchVo))
							 .orderBy(img.regDt.desc())
							 .offset(offset)
							 .limit(limit)
							 .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				list = query.select(projection())
								  .from(img)
								  .leftJoin(file)
								  .on(img.imgOid.eq(file.contsOid),file.bbsOid.contains("IMG_"))
								  .where(predicate(searchVo))
								  .orderBy(img.regDt.desc())
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit= config.getListMaxRowCount();
				
				list = query.select(projection())
								  .from(img)
								  .leftJoin(file)
								  .on(img.imgOid.eq(file.contsOid),file.bbsOid.contains("IMG_"))
								  .where(predicate(searchVo))
								  .orderBy(img.regDt.desc())
								  .limit(limit)
								  .fetch(); 
			}
		}
		return list;
	}

	/** 이미지 상세 조회 */
	public Img getImgDetail(String imgOid) {
		return query.select(projection())
					.from(img)
					.leftJoin(file)
					.on(img.imgOid.eq(file.contsOid),file.bbsOid.contains("IMG_"))
					.where(img.imgOid.eq(imgOid))
					.fetchOne();
	}

	/** 이미지 OID 조회 */
	public String getImgOid(String imgOid) {
		return query.select(img.imgOid)
					.from(img)
					.where(img.imgOid.eq(imgOid))
					.fetchOne();
	}
	
	/** 이미지 OID 생성 */
	public String createImgOid() {
		return query.select(img.imgOid.castToNum(Integer.class).max().add(1).stringValue())
				.from(img)
				.fetchOne();
	}

	/** 이미지 삭제 */
	public void removeImg(String imgOid) {
		query.delete(img)
		 	 .where(img.imgOid.eq(imgOid)).execute();
	}
	
}
