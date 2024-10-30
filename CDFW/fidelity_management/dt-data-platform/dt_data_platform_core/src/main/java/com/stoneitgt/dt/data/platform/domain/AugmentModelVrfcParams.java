package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class AugmentModelVrfcParams {
	
    // 모델 자료 검증 순번 모델 설명
    private int modelDataVrfcSeq;

    // 모델 순번 모델 유형
    private int modelSeq;

    // 검증 순번 학습 시작 일시
    private int vrfcSeq;

    // 단위 항목 
    private String unitItem;

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
