package com.stoneitgt.dt.data.platform.domain;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ErrorLog {

    // 오류 순번 모델 설명
    private Integer errSeq;

    // 모델 순번 모델 순번
    private Integer modelSeq;

    // 증강 순번 
    private Integer augmentSeq;

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
    private Integer regUserSeq;

    // 등록 일시 등록 일시
    private String regDt;

    // 등록 IP 등록 IP
    private String regIp;

    // 수정 사용자 순번 수정 사용자 순번
    private Integer mdfcnUserSeq;

    // 수정 일시 수정 일시
    private String mdfcnDt;

    // 수정 IP 수정 IP
    private String mdfcnIp;

    // 삭제 사용자 순번 삭제 사용자 순번
    private Integer delUserSeq;

    // 삭제 일시 삭제 일시
    private String delDt;

    // 삭제 IP 삭제 IP
    private String delIp;
    private Integer loginUserSeq;  // 변경
    private String loginUserIp;    // 변경
    private String status;         // 변경
}
