package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class SimulationModel {

    // 증강 순번 
    private int augmentSeq;

    // 제목 
    private String title;

    // 설명 
    private String derpn;

    // 전처리 순번 
    private int pprcsSeq;

    // 모델 순번 
    private int modelSeq;

    // 증강 유형 
    private String augmentTp;

    // 자료 유형 
    private String dataTp;

    // 증강 생성 시작 
    private String augmentCrtBgng;

    // 증강 생성 종료 
    private String augmentCrtEnd;

    // 자료 처리 일시 
    private String dataPrcsDt;

    // 자료 생성 간격 유형 
    private String dataCrtIntvlTp;

    // 자료 생성 간격 값 
    private int dataCrtIntvlValue;

    // 증강 상태 
    private String augmentStatus;

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
	
    private String modelNm;
    private String modelDerpn;
    
    private String modelFilePath;
    private String modelFileName;
    private String modelUseFilePath;
    private String modelUseFileName;
    private String testFilePath;
    private String testFileName;
    private String outputFileName;
    List<String> outputs;
    List<String> features;
    private int windowSize;
    private int batchSize;
    private int modelId;
    private String indexColumn;
    private String useModelYn;
    private String realTimeYn;
    private int dateTerm;
    private String prcsLevel;
    private String augmentFileSeq;
    private String augmentFilePath;
    private int modelAlgrmSeq;
    private String resmplIntvlTp;
    private int resmplIntvlValue;

    private String dataCrtBgngDt;
    private String dataCrtLastDt;
    private int dataMaxLimitCnt;
    
}
