package com.stoneitgt.dt.data.platform.domain;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

/**
 * 시스템관리 파라미터
 * @author sjpark
 *
 */
@Data
public class SiteConfigParameter {

    // 식별자 
    private int srno;

    // 제목 
    private String title;

    // 스타일 
    private String style;

    // 테그 
    private String tag;

    // 로고 
    private String logo;

    // 사이트 설명 
    private String siteDescription;

    // 메인 설명 
    private String mainDescription;

    // 테마 
    private String thema;

    // 등록 아이디 
    private String regId;

    // 등록 일시 
    private String regDt;

    // 수정 아이디 
    private String uptId;
    
    // 수정 일시 
    private String uptDt;
    
    private String crudAuth;

    private String stylePath;
    
    private String logoPath;
    
    private List<MultipartFile> uploadStyle;

    private List<MultipartFile> uploadLogo;
}
