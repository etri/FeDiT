package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class DTModelEtc {
	
    // 기타 모델 순번 
    private int etcModelSeq;

    // 기타 모델 명 
    private String etcModelNm;

    // 기타 모델 설명 
    private String etcModelDerpn;

    // 기타 모델 유형 
    private String etcModelTp;

    // 대상 컬럼 
    private String trgtCol;

    // 모델 알고리즘 순번 
    private int modelAlgrmSeq;

    // 윈도우 크기 
    private int windowSz;

    // 배치 크기 
    private int batchSz;

    // 유닛 수 
    private int unitsCnt;

    // 테스트 크기 
    private Double testSz;

    // 학습차수 수 
    private int epochsCnt;

    // 조기종료 수 
    private int patienceCnt;

    // 학습 시작 일시 
    private String learningBgngDt;

    // 학습 종료 일시 
    private String learningEndDt;

    // 모델 상태 
    private String modelStatus;

    private String dataUseTp;
    
    // 공개 여부 
    private String rlsYn;

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
    
    
	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
	List<MultipartFile> attachFilesCsv;
    private String indexTrgtCol;
    
    
    
    
    
    
    
    
    
    
    
    // 기타 모델 손실 순번 
    private int etcModelLossSeq;

    // 검증 유형 
    private String vrfcTp;

    // 손실 
    private Double loss;

    // 검증 손실 
    private Double vrfcLoss;

    // 평균절대오차 
    private Double mae;

    // 검증 평균절대오차 
    private Double vrfcMae;

    // 모델 매개변수 항목 순번 
    private int modelParamsItemSeq;

    // 모델 매개변수 항목 
    private String modelParamsItem;

    // 모델 매개변수 항목 명 
    private String modelParamsItemNm;

    // 모델 매개변수 항목 유형 
    private String modelParamsItemTp;

    // 모델 매개변수 항목 기준 1번 
    private String modelParamsItemCrtr1;

    // 모델 매개변수 항목 기준 2번 
    private String modelParamsItemCrtr2;

    // 순서 
    private int ordby;

    // 모델 매개변수 설명 
    private String modelParamsDerpn;
    
    // 모델 알고리즘 
    private String modelAlgrm;

    // 모델 알고리즘 명 
    private String modelAlgrmNm;

    // 비고 
    private String rmrk;
   
    // 파일 순번 
    private int fileSeq;

    // 파일 명 
    private String fileNm;

    // 저장 파일 명 
    private String strgFileNm;

    // 연관 유형 
    private String refTp;

    // 파일 경로 
    private String filePath;

    // 파일 확장자 
    private String fileExtn;

    // 파일 크기 
    private int fileSz;

    // 파일 길이 
    private int fileLen;

    // 파일 내용물 유형 
    private String fileContsTp;
  
    
    
}
