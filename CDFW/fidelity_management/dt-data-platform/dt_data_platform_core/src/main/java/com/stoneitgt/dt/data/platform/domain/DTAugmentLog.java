package com.stoneitgt.dt.data.platform.domain;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DTAugmentLog {
    private int augmentLogSeq;
    private int augmentSeq;
    private String derpn;
    private int modelSeq;
    private int fileSeq;
    private int dataPrcsCnt;
    private String augmentStatus;
    private String errTp;
    private String errLct;
    private String errCd;
    private String errNm;
    private String errCn;
    private String useYn;
    private String delYn;
    private String regDt;
    private String dataCrtLastHr;
}
