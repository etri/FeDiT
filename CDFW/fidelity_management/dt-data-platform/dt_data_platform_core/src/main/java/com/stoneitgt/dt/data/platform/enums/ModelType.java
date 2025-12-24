package com.stoneitgt.dt.data.platform.enums;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum ModelType {
    META_MODEL("META_MODEL", "데이터 증강 도구"), META_ETC_MODEL("META_ETC_MODEL", "유효성 검증 도구");
    private final String keyword;
    private final String koKeyword;

    ModelType(String keyword, String koKeyword) {
        this.keyword = keyword;
        this.koKeyword = koKeyword;
    }

    public String getKeyword() {
        return this.keyword;
    }

    public String getKoKeyword() {
        return this.koKeyword;
    }
}