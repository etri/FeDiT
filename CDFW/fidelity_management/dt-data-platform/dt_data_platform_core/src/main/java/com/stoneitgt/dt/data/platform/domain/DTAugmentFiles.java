package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class DTAugmentFiles {
	
    // 파일 순번 
    private int fileSeq;

    // 증강 순번 
    private int augmentSeq;

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
   
    
}
