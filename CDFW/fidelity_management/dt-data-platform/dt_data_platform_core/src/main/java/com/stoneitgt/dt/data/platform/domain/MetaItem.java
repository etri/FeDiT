package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class MetaItem {

    // 메타 항목 순번 
    private int metaItemSeq;

    // 메타 순번 
    private int metaSeq;

    // 항목 순번 
    private int itemSeq;

    // 항목 논리 명 
    private String itemLogicNm;

    // 항목 물리 명 
    private String itemPhyscNm;

    // 항목 유형 
    private String itemTp;

    // 항목 깊이 
    private int itemDepth;

    // 항목 깊이 값 
    private String itemDepthValue;

    // 인덱스 기준 여부 
    private String indexCrtrYn;

	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
    
}
