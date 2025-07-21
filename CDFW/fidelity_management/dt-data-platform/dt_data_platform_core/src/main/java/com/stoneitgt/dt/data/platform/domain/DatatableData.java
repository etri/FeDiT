package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

import java.util.List;

@Data
public class DatatableData {
    private int draw;
    private int recordsTotal;
    private int recordsFiltered;
    private List<List<String>> data;
}
