package kr.co.n2m.platform.meta.collection.domain;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Schema(description="메타데이터 수집 결과 Dto")
@Getter
@Setter
public class CollectionResultDto {

    @Schema(description = "수집 작업 아이디")
    private String colecWrkId;
    
    @Schema(description = "수집 작업 결과 (처리중/성공/실패)")
    private String result;
	
    @Schema(description = "루트 메타데이터셋 아이디")
    private String rootMedataSetId;

    @Schema(description = "생성 메타데이터셋 아이디 목록")
    private List<String> medataSetIdList;

    @Schema(description = "수집 작업 메시지")
    private String message;

    public CollectionResultDto() { /* default 생성자 */ }
    
    public CollectionResultDto(CollectionWorkDto workDto) {
    	this.colecWrkId = workDto.getColecWrkId();
    	this.result = workDto.getColecWrkSttusMtcdNm();
    	this.rootMedataSetId = workDto.getRootMedataSetId();
    	this.medataSetIdList = workDto.getMedataSetIdList();
    	this.message = workDto.getColecWrkMsg();
    }
}
