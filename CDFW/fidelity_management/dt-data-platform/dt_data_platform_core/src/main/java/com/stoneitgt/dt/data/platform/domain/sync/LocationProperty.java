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
public class LocationProperty {
    private String type; // "GeoProperty"
    private Map<String, Object> value; // type, coordinates 포함
}
