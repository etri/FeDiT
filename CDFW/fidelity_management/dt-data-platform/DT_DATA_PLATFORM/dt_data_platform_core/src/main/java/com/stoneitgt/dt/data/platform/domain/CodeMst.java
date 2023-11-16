package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class CodeMst {
	   // 그룹 코드 
    private String grpCd;

    // 그룹 코드 명 
    private String grpCdNm;

    // 비고 
    private String rmrk;

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

	// 로그인 사용자
	private int loginUserSeq;

	// 로그인 사용자 ip
	private String loginUserIp;

	private String pageParams;
}
