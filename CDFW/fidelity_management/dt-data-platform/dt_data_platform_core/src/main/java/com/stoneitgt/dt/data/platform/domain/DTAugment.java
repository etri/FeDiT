package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class DTAugment {
	

    // 증강 순번 
    private int augmentSeq;

    // 제목 
    private String title;

    // 설명 
    private String derpn;

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

    // 자료 처리 수 
    private int dataPrcsCnt;

    // 자료 생성 간격 유형 
    private String dataCrtIntvlTp;

    // 자료 생성 간격 값 
    private String dataCrtIntvlValue;

    // 자료 생성 시작 시간 
    private String dataCrtBgngHr;

    // 자료 생성 최종 시간 
    private String dataCrtLastHr;

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
    
    private String simTp;
    
    private String cycleTp;
    private String cycleEndTp;
    
    private String cycleEndDsgnYmd;
    private String cycleBgngDsgnYmd;
    
    private String modelNm;
    List<MultipartFile> attachFiles;
 
    private List<String> preprocTrgtCol;
    
    private String indexTrgtCol;
    private int dataMaxLimitCnt;
    
}
