package com.stoneitgt.dt.data.platform.domain.sync;


import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DigitalTwinObjectDataWrapper {
    private String id;
    private String type;

    @JsonProperty("@context")
    private List<String> context;

    private LocationProperty location;

    // 제네릭 Wildcard(?)를 사용하여 다양한 타입의 Property를 수용합니다.
    @JsonIgnore
    @Builder.Default
    private Map<String, DynamicProperty<?>> measurements = new HashMap<>();

    @JsonAnySetter
    public void addMeasurement(String key, JsonNode value) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        if (!Arrays.asList("id", "type", "@context", "location").contains(key)) {
            // 역직렬화 시에는 기본적으로 Map 구조로 읽어들입니다.
            DynamicProperty<Map<String, Object>> prop = mapper.readValue(
                    value.traverse(),
                    new TypeReference<DynamicProperty<Map<String, Object>>>() {
                    }
            );
            this.measurements.put(key, prop);
        }
    }

    @JsonAnyGetter
    public Map<String, DynamicProperty<?>> getMeasurements() {
        return measurements;
    }
}
