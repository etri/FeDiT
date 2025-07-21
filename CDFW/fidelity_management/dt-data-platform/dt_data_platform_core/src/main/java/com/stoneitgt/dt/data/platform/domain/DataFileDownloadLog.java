package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

@Data
public class DataFileDownloadLog {
    private int logSeq;
    private int fileSeq;
    private int modelSeq;

    //사용 여부
    private String useYn;
    //삭제 여부
    private String delYn;

    //등록자 정보
    private int regUserSeq;
    private String regDt;
    private String regIp;

    //수정자 정보
    private int mdfcnUserSeq;
    private String mdfcnDt;
    private String mdfcnIp;

    //삭제자 정보
    private int delUserSeq;
    private String delDt;
    private String delIp;

    private String userNm;
    private int downloads;
}
