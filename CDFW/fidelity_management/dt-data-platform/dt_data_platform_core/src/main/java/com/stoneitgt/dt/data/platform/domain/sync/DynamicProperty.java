package com.stoneitgt.dt.data.platform.domain.sync;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DynamicProperty<T> {
    @Builder.Default
    private String type = "Property";

    // T는 Map<String, Object>가 될 수도 있고, 특정 DTO(WeatherValue)가 될 수도 있습니다.
    private T value;

    private String observedAt;
}