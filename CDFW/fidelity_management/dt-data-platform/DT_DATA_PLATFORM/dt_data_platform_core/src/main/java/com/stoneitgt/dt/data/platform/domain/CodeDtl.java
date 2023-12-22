package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class CodeDtl {
    // 그룹 코드 
    private String grpCd;

    // 상세 코드 
    private String dtlCd;

    // 상세 코드 명 
    private String dtlCdNm;

    // 비고 
    private String rmrk;

    // 연관 코드 
    private String refCd;

    // 연관 클래스 
    private String refClass;

    // 연관 값 
    private String refValue;

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
