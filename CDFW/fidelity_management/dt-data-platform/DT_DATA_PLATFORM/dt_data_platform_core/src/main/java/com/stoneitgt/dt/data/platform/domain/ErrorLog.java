package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class ErrorLog {
	
    // 오류 순번 모델 설명
    private int errSeq;

    // 모델 순번 모델 순번
    private int modelSeq;

    // 증강 순번 
    private int augmentSeq;

    // 오류 유형 오류 유형
    private String errTp;
    
    private String errCd;
    private String errNm;

    // 오류 위치 오류 위치
    private String errLct;

    // 오류 내용 오류 내용
    private String errCn;

    // 사용 여부 사용 여부
    private String useYn;

    // 삭제 여부 삭제 여부
    private String delYn;

    // 등록 사용자 순번 등록 사용자 순번
    private int regUserSeq;

    // 등록 일시 등록 일시
    private String regDt;

    // 등록 IP 등록 IP
    private String regIp;

    // 수정 사용자 순번 수정 사용자 순번
    private int mdfcnUserSeq;

    // 수정 일시 수정 일시
    private String mdfcnDt;

    // 수정 IP 수정 IP
    private String mdfcnIp;

    // 삭제 사용자 순번 삭제 사용자 순번
    private int delUserSeq;

    // 삭제 일시 삭제 일시
    private String delDt;

    // 삭제 IP 삭제 IP
    private String delIp;
    
    private int loginUserSeq;
    private String loginUserIp;
    
}
