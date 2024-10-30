package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class DTModelMetaUserItemPreprocessMapUnit {

    // 사용자 메타 항목 전처리 단위 순번 
    private int userMetaItemPprcsUnitSeq;

    // 사용자 메타 항목 순번 
    private int userMetaItemSeq;

    // 단위 유형 
    private String unitTp;

    // 단위 코드 1번 
    private String unitCd1;

    // 단위 코드 2번 
    private String unitCd2;

    // 순서 
    private int ordby;

}
