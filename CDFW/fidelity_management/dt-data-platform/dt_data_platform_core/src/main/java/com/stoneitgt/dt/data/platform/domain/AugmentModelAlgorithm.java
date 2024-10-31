package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class AugmentModelAlgorithm {
	
    // 모델 알고리즘 순번 모델 메타 순번
    private int modelAlgrmSeq;

    // 모델 알고리즘 모델 메타 코드
    private String modelAlgrm;

    // 모델 알고리즘 명 모델 메타 코드 명
    private String modelAlgrmNm;

    // 비고 비고
    private String rmrk;

    // 순서 순서
    private int ordby;

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
	private String loginUserId;
	private String loginUserIp;
	
}
