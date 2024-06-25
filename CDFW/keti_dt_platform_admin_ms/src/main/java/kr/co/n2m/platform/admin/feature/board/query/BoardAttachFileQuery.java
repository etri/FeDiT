package kr.co.n2m.platform.admin.feature.board.query;

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
public class BoardAttachFileQuery {

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
	public List<AttachFile> getBoardPostAttachFileList(String pstngOid, AttachFile fileVo){
		return query.selectFrom(file)
				.where(file.contsOid.eq(pstngOid),file.bbsOid.contains("BBS_"))
				.orderBy(file.atcOid.desc())
				.fetch();
	}
	
	/** 콘텐츠 OID 조회 */
	public String findContsOid(String pstngOid) {
		return query.select(file.contsOid)
				.where(file.contsOid.eq(pstngOid))
				.fetchOne();
	}
	
	/** 게시판 OID 조회 */
	public List<String> findBbsOid(String pstngOid) {
		return query.select(file.bbsOid)
				 .from(file)
				 .where(file.contsOid.eq(pstngOid))
				 .fetch();
	}
	
	/** 게시판 OID 생성 */
	public String createBbsOid() {
		return query.select(file.bbsOid.substring(4, 10).max().coalesce("0"))
				 .from(file)
				 .where(file.bbsOid.contains("BBS_"))
				 .fetchOne();
	}
	
	/** 파일 삭제 */
	public void removeBoardPostAttachFile(String fileRestoNm) {
		query.delete(file)
			 .where(file.bbsOid.contains("BBS_"), file.fileRestoNm.eq(fileRestoNm))
		 	 .execute();
	}
	
}
