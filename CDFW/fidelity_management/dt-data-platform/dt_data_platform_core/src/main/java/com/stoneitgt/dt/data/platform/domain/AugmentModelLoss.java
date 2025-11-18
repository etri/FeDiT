package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class AugmentModelLoss {
	
    // 모델 손실 순번 
    private int modelLossSeq;

    // 모델 순번 
    private int modelSeq;

    // 검증 유형 
    private String vrfcTp;

    // 학습차수 
    private int epochs;

    // 손실 
    private Double loss;

    // 검증 손실 
    private Double vrfcLoss;

    // 평균제곱오차 
    private Double mse;

    // 검증 평균제곱오차 
    private Double vrfcMse;

    // 사용 여부 
    private String useYn;

    // 삭제 여부 
    private String delYn;
    
	
	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
}
