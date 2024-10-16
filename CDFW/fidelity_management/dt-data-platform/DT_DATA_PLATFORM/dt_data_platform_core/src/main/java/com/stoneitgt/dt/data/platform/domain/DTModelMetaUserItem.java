package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class DTModelMetaUserItem {
    // 사용자 메타 항목 순번 
    private int userMetaItemSeq;

    // 모델 순번 
    private int modelSeq;

    // 출처 메타 항목 순번 
    private int originMetaItemSeq;

    // 순서 
    private int ordby;

    // 인덱스 기준 여부 
    private String indexCrtrYn;
    
    private String userPprcsFullStngValue;
    
    private String twinId;
    private String twinObjId;
    
}
