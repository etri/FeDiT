package com.stoneitgt.dt.data.platform.domain.meta;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;
@Data
@SuperBuilder // @Builder 대신 사용
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedDigitalTwinMetadata extends Pagination {
    private Integer arrayDataLimit;
    private String objectRefFormat;
    private String dTw_objs_attr;
    private String dTw_attr_name;
    private List<DigitalTwinMetadata> data;
}
