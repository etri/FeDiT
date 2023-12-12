package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class AugmentModelFID {
	
    // 모델 평가지표 순번 
    private Integer modelFidSeq;

    // 모델 순번 
    private Integer modelSeq;

    // 학습차수 
    private Integer epochs;

    // 평가지표 점수 
    private Double fidScore;

    // 실제 파일 명 
    private String realFileNm;

    // 가짜 파일 명 
    private String fakeFileNm;

    // 실제 가짜 파일 명 
    private String realFakeFileNm;

    // 사용 여부 
    private String useYn;

    // 삭제 여부 
    private String delYn;
    
	
	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
}
