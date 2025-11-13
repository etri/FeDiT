package kr.co.n2m.platform.admin.feature.img.query;

import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.attachfile.entity.AttachFile;
import kr.co.n2m.platform.admin.feature.attachfile.entity.QAttachFile;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ImgAttachFileQuery {

	private final JPAQueryFactory query;
	private final QAttachFile file= QAttachFile.attachFile;
	
	public BooleanBuilder predicate(AttachFile searchVo) {
		
		BooleanBuilder search = new BooleanBuilder();

		if(StringUtil.isNotEmpty(searchVo.getAtcOid())) {
			search.and(file.atcOid.eq(searchVo.getAtcOid()));
		}
		
		return search;
	}
	
	public QBean<AttachFile> projection(){
		
		return Projections.bean(AttachFile.class, 
				file.atcOid,
				file.contsOid,
				file.fileOriginNm,
				file.fileRestoNm,
				file.fileRestoPath,
				file.fileSize
		);
	}

	/** 첨부 파일 조회 */
	public List<AttachFile> getImgAttachFileList(String imgOid, AttachFile fileVo){
		return query.selectFrom(file)
				.where(file.contsOid.eq(imgOid),file.bbsOid.contains("IMG_"))
				.orderBy(file.atcOid.desc())
				.fetch();
	}
	
	/** 콘텐츠 OID 조회 */
	public String findContsOid(String imgOid) {
		return query.select(file.contsOid)
				.where(file.contsOid.eq(imgOid))
				.fetchOne();
	}
	
	/** 게시판 OID 생성 */
	public String createBbsOid() {
		return query.select(file.bbsOid.substring(4, 10).max().coalesce("0"))
				 .from(file)
				 .where(file.bbsOid.contains("IMG_"))
				 .fetchOne();
	}
	
	/** 파일 삭제 */
	public void removeImgAttachFile(String fileRestoNm) {
		query.delete(file)
		 	 .where(file.bbsOid.contains("IMG_"), file.fileRestoNm.eq(fileRestoNm))
		 	 .execute();
	}
	
}
