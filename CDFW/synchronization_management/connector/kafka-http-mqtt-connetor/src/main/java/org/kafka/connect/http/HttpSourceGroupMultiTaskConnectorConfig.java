package org.kafka.connect.http;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class HttpSourceGroupMultiTaskConnectorConfig extends AbstractConfig {

    public static ConfigDef CONFIG = new ConfigDef()
            .define("api.base.url", Type.STRING, "https://localhost:8080", Importance.HIGH, "api server base url")
            .define("api.change.url", Type.LIST, "", Importance.HIGH, "api server change url")
            .define("poll.interval.ms", Type.INT, 6000, Importance.LOW, "Frequency in ms to poll for new data")
            .define("digital.twin.id", Type.LIST, "", Importance.HIGH, "digital_twin_id")
            .define("digital.object.id", Type.LIST, "", Importance.HIGH, "object_id for kafka key")
            .define("sensor.id", Type.LIST, "", Importance.HIGH, "sensor_id for kafka key")
            .define("data.source.format", Type.STRING, "json", Importance.HIGH, "json")
            // ✅ 추가: HTTP timeout (리밸런싱/stop 시 블로킹 최소화)
            .define("http.connect.timeout.ms", Type.INT, 3000, Importance.LOW, "HTTP connect timeout ms")
            .define("http.read.timeout.ms", Type.INT, 7000, Importance.LOW, "HTTP read timeout ms")

            // ✅ 추가: URL 분배 전략
            // - hash: URL 해시 기반 결정적 분배(default)
            // - round_robin: 라운드로빈 분배
            .define("distribution.strategy", Type.STRING, "hash", Importance.LOW, "hash | round_robin");
    public HttpSourceGroupMultiTaskConnectorConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}

