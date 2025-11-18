package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class DTModelEtcMetaUserItem {
    // 사용자 메타 항목 순번 
    private int userMetaItemSeq;

    // 모델 순번 
    private int etcModelSeq;

    // 출처 메타 항목 순번 
    private int originMetaItemSeq;

    // 순서 
    private int ordby;

    // 인덱스 기준 여부 
    private String indexCrtrYn;
    
    private String userPprcsFullStngValue;
    
    private String twinId;
    private String twinObjId;

    private String sdtId;
    private String sdtObjId;
}
