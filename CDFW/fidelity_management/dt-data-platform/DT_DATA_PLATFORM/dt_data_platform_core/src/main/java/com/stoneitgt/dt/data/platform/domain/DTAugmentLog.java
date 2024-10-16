package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class DTAugmentLog {
	
    // 증강 로그 순번 
    private int augmentLogSeq;

    // 증강 순번 
    private int augmentSeq;

    // 설명 
    private String derpn;

    // 모델 순번 
    private int modelSeq;

    // 자료 처리 수 
    private int dataPrcsCnt;

    // 증강 상태 
    private String augmentStatus;

    // 오류 유형 
    private String errTp;

    // 오류 위치 
    private String errLct;

    // 오류 코드 
    private String errCd;

    // 오류 명 
    private String errNm;

    // 오류 내용 
    private String errCn;

    // 사용 여부 
    private String useYn;

    // 삭제 여부 
    private String delYn;

    // 등록 일시 
    private String regDt;
    
}
