package com.stoneitgt.dt.data.platform.domain.sync;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DigitalTwinObject {
    private String digital_twin_id;
    private String digital_object_id;
    private String digital_object_identifier;
    private String digital_object_name;
    private String description;
    private List<String> keywords;
    private String creation_time;
    private String modification_time;
    private String digital_object_data_access_type;
    private String digital_object_data_access_url;
    private String digital_object_control_url;
    private Map<String, Object> digital_object_data_model;
    private Integer digital_object_data_interval;
    private Map<String, Object> digital_object_control_request_model;
    private Map<String, Object> do_metadata;
    private Map<String, Object> preliminary_field;
    private List<String> subjects;
    private String digital_object_data_source_type;
    private String digital_object_data_source_url;
    private String digital_object_data_source_base_url;
    private Integer digital_object_control_delivery_timeout;
}