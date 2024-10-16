package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class DTModelMetaUserItemPreprocessMapResmpl {
    // 사용자 메타 항목 전처리 리샘플링 순번 
    private int userMetaItemPprcsResmplSeq;

    // 사용자 메타 항목 순번 
    private int userMetaItemSeq;

    // 리샘플링 유형 
    private String resmplTp;

    // 리샘플링 간격 유형 
    private String resmplIntvlTp;

    // 리샘플링 간격 값 
    private int resmplIntvlValue;

    // 순서 
    private int ordby;
}
