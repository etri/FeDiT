/**
 *
 */
package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 공통 도메인 항목 
 * @author jhpark
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class BaseDomain extends Paging {
    private int srno;
    private String regId;
    private String regDt;
    private String uptId;
    private String uptDt;

    private String searchKeyword;
    private String searchField;
}
