package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class DTModelMetaUserItemPreprocessMapVrfc {
    // 사용자 메타 항목 전처리 검증 순번 
    private int userMetaItemPprcsVrfcSeq;

    // 사용자 메타 항목 순번 
    private int userMetaItemSeq;

    // 검증 유형 
    private String vrfcTp;

    // 검증 지우기 유형 
    private String vrfcClearTp;

    // 규칙 값 1번 
    private String ruleValue1;

    // 규칙 값 2번 
    private String ruleValue2;

    // 규칙 값 3번 
    private String ruleValue3;

    // 규칙 값 4번 
    private String ruleValue4;

    // 순서 
    private int ordby;
}
