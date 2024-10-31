package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class MetaOriginItemModel {

    // 출처 메타 항목 순번 
    private int originMetaItemSeq;

    // 출처 메타 순번 
    private int originMetaSeq;

    // 단일트윈 항목 순서 
    private int sdtItemOrdby;

    // 단일트윈 항목 영문 명 
    private String sdtItemEngNm;

    // 단일트윈 항목 한글 명 
    private String sdtItemKornNm;

    // 단일트윈 항목 유형 
    private String sdtItemTp;

    // 단일트윈 항목 깊이 
    private int sdtItemDepth;

    // 단일트윈 항목 깊이 값 
    private String sdtItemDepthValue;

	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
    
}
