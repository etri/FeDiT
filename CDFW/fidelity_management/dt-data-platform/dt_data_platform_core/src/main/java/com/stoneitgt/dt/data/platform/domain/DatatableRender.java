package com.stoneitgt.dt.data.platform.domain;

import lombok.Data;

import java.util.List;

@Data
public class DatatableRender {
    private int draw;
    private List<Column> columns;
    private List<Order> order;
    private int start;
    private int length;
    private Search search;
    private String file_name;
    private String file_path;
    private int target_row_count;

    @Data
    public static class Column {
        private int data;
        private String name;
        private boolean searchable;
        private boolean orderable;
        private Search search;
    }

    @Data
    public static class Order {
        private int column;
        private String dir;
    }

    @Data
    public static class Search {
        private String value;
        private boolean regex;
    }
}
