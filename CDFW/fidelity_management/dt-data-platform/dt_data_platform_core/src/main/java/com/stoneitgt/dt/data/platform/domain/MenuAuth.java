package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import lombok.Data;

@Data
public class MenuAuth {
    // 권한 코드 권한
    private String authCd;

    // 메뉴 코드 메뉴코드
    private String menuCd;

    // 조회 권한 여부 조회권한구분
    private String inqAuthYn;

    // 작성 권한 여부 쓰기권한구분
    private String wrtAuthYn;

    // 수정 권한 여부 수정권한구분
    private String mdfcnAuthYn;

    // 삭제 권한 여부 삭제권한구분
    private String delAuthYn;

    // 삭제 여부 사용구분
    private String delYn;

    // 등록 사용자 순번 등록사용자순번
    private int regUserSeq;

    // 등록 일시 등록일자
    private String regDt;

    // 등록 IP 등록IP
    private String regIp;

    // 수정 사용자 순번 수정사용자순번
    private int mdfcnUserSeq;

    // 수정 일시 수정일자
    private String mdfcnDt;

    // 수정 IP 수정IP
    private String mdfcnIp;

    // 삭제 사용자 순번 삭제사용자순번
    private int delUserSeq;

    // 삭제 일시 삭제일자
    private String delDt;

    // 삭제 IP 삭제IP
    private String delIp;
    
	//권한 트리값
	private List<String> values; 
	
	// 로그인 사용자
	private int loginUserSeq;

	// 로그인 사용자 ip
	private String loginUserIp;
		
	private String pageParams;
}
