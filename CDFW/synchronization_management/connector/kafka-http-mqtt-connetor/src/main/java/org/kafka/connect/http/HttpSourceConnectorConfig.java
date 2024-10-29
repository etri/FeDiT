package org.kafka.connect.http;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class HttpSourceConnectorConfig extends AbstractConfig{

    public static ConfigDef CONFIG = new ConfigDef()
            .define("api.url", Type.STRING, "https://localhost:8080", Importance.HIGH, "api server url")
            .define("api.key", Type.STRING, "data", Importance.HIGH, "api json key value")
            .define("kafka.topic", Type.STRING, "test", Importance.HIGH, "kafka topic name")
            .define("poll.interval.ms", Type.INT, 0, Importance.LOW, "Frequency in ms to poll for new data")            
            .define("digital.twin.id", Type.STRING, "digital_twin_id", Importance.HIGH, "federated_digital_twin_id")
            .define("federated.digital.twin.id", Type.STRING, "federated_digital_twin_id", Importance.HIGH, "federated_digital_twin_id")
            .define("sensor.id", Type.STRING, "SensorID", Importance.HIGH, "sensor id for kafka key")
            .define("digital.object.id", Type.STRING, "digital_object_id", Importance.HIGH, "object_id for kafka key");


    public HttpSourceConnectorConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}

