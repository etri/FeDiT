package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;
import lombok.EqualsAndHashCode;


@Data
@EqualsAndHashCode(callSuper = true) // 부모 클래스 필드 포함한 equals 및 hashCode 자동 생성
public class PreprocessDatatableRender extends DatatableRender {
    private String target_file_name;
    private String index_trgt_col;
    private String vrfc_trgt_col;
}
