package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class DTModelColumn {
	
    // 모델 컬럼 순번 모델 매개변수 순번
    private int modelColSeq;

    // 모델 순번 모델 순번
    private int modelSeq;

    // 모델 컬럼 유형 모델 메타 순번
    private String modelColTp;

    // 모델 컬럼 명 모델 메타 항목 순번
    private String modelColNm;

    // 모델 매개변수 항목 값 모델 메타 항목 값
    private String modelParamsItemValue;

    // 사용 여부 사용 여부
    private String useYn;

    // 삭제 여부 삭제 여부
    private String delYn;
    
	
	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
}
