package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class Verify {
    // 검증순번 식별자 
    private int vrfcSeq;

    // 검증유형
    private String vrfcTp;

    // 검증명
    private String vrfcNm;
    
    // 규칙1
    private String ruleValue1;
    
    // 규칙2
    private String ruleValue2;
    
    // 규칙3
    private String ruleValue3;
    
    // 규칙3
    private String ruleValue4;
    
    // 순서 
    private int ordby;

    // 사용 여부 
    private String useYn;

    // 삭제 여부 
    private String delYn;

    // 등록 사용자 순번 
    private int regUserSeq;

    // 등록 일시 
    private String regDt;

    // 등록 IP 
    private String regIp;

    // 수정 사용자 순번 
    private int mdfcnUserSeq;

    // 수정 일시 
    private String mdfcnDt;

    // 수정 IP 
    private String mdfcnIp;

    // 삭제 사용자 순번 
    private int delUserSeq;

    // 삭제 일시 
    private String delDt;

    // 삭제 IP 
    private String delIp;

    private String type;
    
	// 로그인 사용자
	private int loginUserSeq;

	// 로그인 사용자 ip
	private String loginUserIp;

}
