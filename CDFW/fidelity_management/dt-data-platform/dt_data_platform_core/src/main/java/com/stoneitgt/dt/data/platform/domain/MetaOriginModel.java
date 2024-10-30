package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class MetaOriginModel {

    // 출처 메타 순번 
    private int originMetaSeq;

    // 단일트윈 고유 아이디 
    private String sdtUniqId;

    // 단일트윈 명 
    private String sdtNm;

    // 단일트윈 자료 URL 
    private String sdtDataUrl;

    // 단일트윈 버전 
    private Double sdtVer;

    // 단일트윈 생성 일시 
    private String sdtCrtDt;

    // 등록 일시 
    private String regDt;

	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
    
}
