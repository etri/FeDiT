package com.stoneitgt.dt.data.platform.domain.meta;

import lombok.Data;

@Data
public class BaseFileRequest {
    private String digital_twin_id;
    private String digital_twin_object_id;
    private Integer count;
    private String from;
    private String to;
    private String data_path;
    private String time_path;
    private String file_name;
    private String file_path;
}