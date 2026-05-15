package com.stoneitgt.dt.data.platform.domain.meta;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder // @Builder 대신 사용
@NoArgsConstructor
@AllArgsConstructor
public class Pagination {
    private boolean isPaging;
    private int curPage;
    private int pageListSize;
    private int startIndex;
    private int totalListSize;
    private int totalPage;
    private int limitListSize;
}
