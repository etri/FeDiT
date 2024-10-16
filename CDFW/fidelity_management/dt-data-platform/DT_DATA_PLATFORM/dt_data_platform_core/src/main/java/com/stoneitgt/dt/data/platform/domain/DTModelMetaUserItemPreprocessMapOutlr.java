package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class DTModelMetaUserItemPreprocessMapOutlr {
    // 사용자 메타 항목 전처리 이상치 순번 
    private int userMetaItemPprcsOutlrSeq;

    // 사용자 메타 항목 순번 
    private int userMetaItemSeq;

    // 이상치 처리 유형 
    private String outlrPrcsTp;

    // 이상치 표준 샘플 
    private Double outlrStandrdSmpl;

    // 이상치 샘플링 길이 
    private int outlrSmplngLen;

    // 이상치 EPS 
    private Double outlrEps;

    // 이상치 최소 샘플 
    private int outlrMinSmpl;

    // 이상치 클러스터 수 
    private int outlrClustCnt;

    // 이상치 클러스터 그룹 
    private int outlrClustGrp;

    // 순서 
    private int ordby;

}
