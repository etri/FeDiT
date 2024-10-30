package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class DTModelMetaUserItemPreprocessMapInterpl {
    // 사용자 메타 항목 전처리 보간 순번 
    private int userMetaItemPprcsInterplSeq;

    // 사용자 메타 항목 순번 
    private int userMetaItemSeq;

    // 보간 유형 
    private String interplTp;

    // 순서 
    private int ordby;
}
