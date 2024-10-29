package kr.co.n2m.platform.admin.feature.faq.query;

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
public class FaqAttachFileQuery {
	
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
	
	public List<AttachFile> getFaqAttachFileList(String faqOid, AttachFile fileVo) {
		return query.selectFrom(file)
			.where(file.contsOid.eq(faqOid), file.bbsOid.contains("FAQ_"))
			.orderBy(file.contsOid.desc())
			.fetch();
	}

	public void removeFaqAttachFiles(String faqOid) {
		query.delete(file)
			 .where(file.contsOid.eq(faqOid))
			 .execute();
	}
	
	public void removeFaqAttachFile(String fileRestoNm) {
		query.delete(file)
			 .where(file.bbsOid.contains("FAQ_"), file.fileRestoNm.eq(fileRestoNm))
			 .execute();
	}

}
