package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class AugmentModelMetaItem {
	
    // 모델 매개변수 항목 순번 모델 메타 항목 순번
    private int modelParamsItemSeq;

    // 모델 알고리즘 순번 모델 메타 순번
    private int modelAlgrmSeq;

    // 모델 매개변수 항목 모델 메타 항목
    private String modelParamsItem;

    // 모델 매개변수 항목 명 모델 메타 항목 명
    private String modelParamsItemNm;

    // 모델 매개변수 항목 유형 모델 메타 항목 유형
    private String modelParamsItemTp;

    // 모델 매개변수 항목 기준 1번 모델 메타 항목 기준 1번
    private String modelParamsItemCrtr1;

    // 모델 매개변수 항목 기준 2번 모델 메타 항목 기준 2번
    private String modelParamsItemCrtr2;

    private String modelParamsDerpn;
    
    
    // 순서 순서
    private int ordby;

    // 사용 여부 사용 여부
    private String useYn;

    // 삭제 여부 삭제 여부
    private String delYn;
    
	
	private int loginUserSeq;
	private String loginUserId;
	private String loginUserIp;
	
}
