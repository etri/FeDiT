package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class MetaOriginFullTextModel {

    // 출처 메타 전체 텍스트 순번 
    private int originMetaFullTextSeq;

    // 출처 메타 순번 
    private int originMetaSeq;

    // 단일트윈 전체 텍스트 
    private String sdtFullText;

    // 단일트윈 설명 
    private String sdtDerpn;

	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
    
}
