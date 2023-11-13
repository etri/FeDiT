package org.kafka.connect.http;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class HttpSourceConnectorOldConfig extends AbstractConfig{

    public static ConfigDef CONFIG = new ConfigDef()
            .define("http.url", Type.STRING, "https://localhost:8080", Importance.HIGH, "http server url")
//            .define("api.key", Type.STRING, "data", Importance.HIGH, "api json key value")
            .define("kafka.topic", Type.STRING, "test", Importance.HIGH, "kafka topic name");


    public HttpSourceConnectorOldConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}

