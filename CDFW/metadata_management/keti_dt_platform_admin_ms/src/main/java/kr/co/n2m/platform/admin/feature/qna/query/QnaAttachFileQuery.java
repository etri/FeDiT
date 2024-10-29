package kr.co.n2m.platform.admin.feature.qna.query;

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
public class QnaAttachFileQuery {
	
	private final JPAQueryFactory query;
	private final QAttachFile file= QAttachFile.attachFile;
	
	public BooleanBuilder predicate(AttachFile searchVo) {
		
		BooleanBuilder search = new BooleanBuilder();

		if(StringUtil.isNotEmpty(searchVo.getAtcOid())) {
			search.and(file.atcOid.eq(searchVo.getAtcOid()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getContsOid())) {
			search.and(file.contsOid.eq(searchVo.getContsOid()));
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
	
	/** QNA 첨부파일 목록 조회. */
	public List<AttachFile> getQnaAttachFileList(String qnaOid, AttachFile fileVo) {
		return query.selectFrom(file)
				.where(file.contsOid.eq(qnaOid), file.bbsOid.contains("QNA_"))
				.orderBy(file.contsOid.desc())
				.fetch();
	}
	
	public void removeQnaAttachFiles(String qnaOid) {
		query.delete(file)
			 .where(file.contsOid.eq(qnaOid))
			 .execute();
	}
	
	public void removeQnaAttachFile(String fileRestoNm) {
		query.delete(file)
		 	 .where(file.bbsOid.contains("QNA_"), file.fileRestoNm.eq(fileRestoNm))
			 .execute();
	}

}
