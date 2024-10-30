package com.stoneitgt.dt.data.platform.domain;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.Data;

/**
 * 유저 파라미터 - 스프링시큐리티 및 세션 처리용 (UserDetails)
 *
 *
 */
@Data
public class User implements UserDetails {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private Collection<? extends GrantedAuthority> authorities;

	private boolean accountNonExpired;

	private boolean accountNonLocked;

	private boolean credentialsNonExpired;

	private boolean enabled;

	//@NotBlank
	//@Size(min = 6, max = 20)
	//@Pattern(regexp = "^[a-z0-9]{6,20}$", message = "{id.illeal_match}")
	private String id;

	//@NotBlank
	private String password;

	private String passwordConfirm;

	/*
	@NotBlank
	@Size(min = 2, max = 50)
	private String name;
	*/
	
	//@NotBlank
	//@Size(min = 2, max = 50)
	private String username;
	

	   // 사용자 순번 
    private int userSeq;

    // 사용자 아이디 
    private String userId;

    // 사용자 비밀번호 
    private String userPw;

    // 사용자 명 
    private String userNm;

    // 사용자 권한 코드 
    private String userAuthCd;

    // 고유 식별 키 
    private String uniqIdnKey;

    // 사용자 이메일 
    private String userEml;
    private String userEml1;
    private String userEml2;
    private String userEml3;

    // 사용자 생일 일자 
    private String userBirthYmd;

    // 사용자 연락처 1번 
    private String userCont1;

    // 사용자 연락처 2번 
    private String userCont2;

    // 사용자 연락처 3번 
    private String userCont3;

    // 사용자 휴대폰 1번 
    private String userHp1;

    // 사용자 휴대폰 2번 
    private String userHp2;

    // 사용자 휴대폰 3번 
    private String userHp3;

    // 사용자 우편번호 
    private String userZip;

    // 사용자 도로 명 주소 
    private String userRoadNmAddr;

    // 사용자 지번 주소 
    private String userLotnoAddr;

    // 사용자 상세 주소 
    private String userDtlAddr;

    // 이용약관 동의 여부 
    private String tncndAgreYn;

    // 개인정보 동의 여부 
    private String prvcAgreYn;

    // 정보 제공 동의 여부 
    private String infoPvsnAgreYn;

    // API 키 
    private String apiKey;

    // API 키 사용 여부 
    private String apiKeyUseYn;

    // API 사용 만료 일자 
    private String apiUseExpdYmd;

    // API 키 시작 일자 
    private String apiKeyBgngYmd;

    // API 키 만료 일자 
    private String apiKeyExpdYmd;

    // 시각화 API 사용 여부 
    private String visualApiUseYn;

    // 자료 API 사용 여부 
    private String dataApiUseYn;

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

    private String newPassword;
    private String tempPassword;
    private String tempPasswordConfirm;

	// 권한
	private List<Map<String, Object>> authMenu;

	private List<Map<String, Object>> useAuthMenu;
	
	private int loginUserSeq;

	private String pageParams;

	private int checkedIdFlag;

	private String loginUserIp;
	private String loginUserId;
}
