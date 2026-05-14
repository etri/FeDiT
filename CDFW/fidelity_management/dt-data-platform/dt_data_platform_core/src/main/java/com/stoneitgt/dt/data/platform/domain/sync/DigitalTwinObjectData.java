package com.stoneitgt.dt.data.platform.domain.sync;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DigitalTwinObjectData {
    private String digital_twin_id;
    private String digital_object_id;
    private String rowtime;
    // private DigitalTwinObjectDataWrapper data;
    private Map<String, Object> data;
    private String location;
}
