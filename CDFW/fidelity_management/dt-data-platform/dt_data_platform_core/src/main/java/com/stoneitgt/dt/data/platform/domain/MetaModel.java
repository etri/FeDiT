package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class MetaModel {

    // 메타 순번 
    private int metaSeq;

    // 단일트윈 순번 
    private int sdtSeq;

    // 단일트윈 명 
    private String sdtNm;

    // 등록 사용자 순번 
    private int regUserSeq;

    // 등록 일시 
    private String regDt;

    // 등록 IP 
    private String regIp;

    // 수정 사용자 순번 
    private int mdfcnUserSeq;

    // 수정 일시 
    private String mdfcnDt;

    // 수정 IP 
    private String mdfcnIp;

    // 삭제 사용자 순번 
    private int delUserSeq;

    // 삭제 일시 
    private String delDt;

    // 삭제 IP 
    private String delIp;


	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
    
}
