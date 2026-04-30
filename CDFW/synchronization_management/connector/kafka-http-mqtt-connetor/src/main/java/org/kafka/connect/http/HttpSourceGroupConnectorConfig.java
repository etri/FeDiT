package org.kafka.connect.http;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class HttpSourceGroupConnectorConfig extends AbstractConfig {

    public static ConfigDef CONFIG = new ConfigDef()
            .define("api.base.url", Type.STRING, "https://localhost:8080", Importance.HIGH, "api server base url")
            .define("api.change.url", Type.LIST, " ", Importance.HIGH, "api server change url")
            .define("kafka.topic", Type.STRING, "UnalliedDigitalObjects", Importance.HIGH, "kafka topic name")
            .define("poll.interval.ms", Type.INT, 6000, Importance.LOW, "Frequency in ms to poll for new data")
            .define("digital.twin.id", Type.LIST, "digital_twin_id", Importance.HIGH, "digital_twin_id")
            .define("digital.object.id", Type.LIST, "digital_object_id", Importance.HIGH, "object_id for kafka key")
            .define("data.source.format", Type.STRING, "json", Importance.HIGH, "json");

    public HttpSourceGroupConnectorConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}

