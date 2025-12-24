package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class Menu {
	
    // 메뉴 코드 메뉴코드
    private String menuCd;

    // 메뉴 명 메뉴이름
    private String menuNm;

    // 상위 메뉴 코드 상위메뉴코드
    private String upMenuCd;

    // 메뉴 URL 메뉴링크
    private String menuUrl;

    // 메뉴 아이콘 메뉴아이콘
    private String menuIcon;

    // 메뉴 클래스 메뉴클래스
    private String menuClass;

    // 순서 정렬
    private int ordby;

    // 사용 여부 삭제구분
    private String useYn;

    // 삭제 여부 삭제구분
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
	// 로그인 사용자
	private int loginUserSeq;

	// 로그인 사용자 ip
	private String loginUserIp;
		
	private String pageParams;
}
