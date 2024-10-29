package kr.co.n2m.platform.admin.feature.notice.query;

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
public class NoticeAttachFileQuery {
	
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
	
	public List<AttachFile> getNoticeAttachFileList(String ntfOid, AttachFile fileVo) { 
		return query.selectFrom(file) 
					.where(file.contsOid.eq(ntfOid), file.bbsOid.contains("NTF_"))
					.orderBy(file.contsOid.desc()) 
					.fetch(); 
		}
	 
	public void removeNoticeAttachFiles(String ntfOid) {
		query.delete(file)
			 .where(file.contsOid.eq(ntfOid))
			 .execute();
	}
	
	public void removeNoticeAttachFile(String fileRestoNm) {
		query.delete(file)
			 .where(file.bbsOid.contains("NTF_"), file.fileRestoNm.eq(fileRestoNm))
			 .execute();
	}
	
}
