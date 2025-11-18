package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class DTModel {
	
    // 모델 순번 모델 순번
    private int modelSeq;

    // 모델 명 모델 명
    private String modelNm;

    // 모델 설명 모델 설명
    private String modelDerpn;

    // 학습 시작 일시 학습 시작 일시
    private String learningBgngDt;

    // 학습 종료 일시 학습 종료 일시
    private String learningEndDt;

     // 모델 상태 모델 상태
    private String modelStatus;
 
    // 단일트윈 여부 단일트윈 여부
    private String sdtYn;

    // 공개 여부 공개 여부
    private String rlsYn;

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
	
    private String interplTp;
    private String resmplTp;
    private String resmplintvltp;
    private int resmplIntvlValue;
	
	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
	List<MultipartFile> attachFilesCsv;
	
	// 모델 알고리즘 순번 모델 메타 순번
    private int modelAlgrmSeq;
    
    // 모델 매개변수 항목 순번 모델 메타 항목 순번
    private int modelParamsItemSeq;
    
    // 모델 매개변수 순번 모델 매개변수 순번
    private int modelParamsSeq;
    
    private String indexTrgtCol;
    private String prcsLevel;
    private String defaultResmplIntvlTp;
    private int defaultResmplIntvlValue;
    private String dataUseTp;
    
    private String jobLevel;
    private String filePath;
    
}
