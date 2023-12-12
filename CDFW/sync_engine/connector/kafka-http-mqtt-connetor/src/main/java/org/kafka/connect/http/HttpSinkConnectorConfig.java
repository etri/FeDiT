package org.kafka.connect.http;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class HttpSinkConnectorConfig extends AbstractConfig { // 기본적으로 topics 를 받음 (반드시 SinkConnector 생성할 때 지정해주어야 함)

    public static ConfigDef CONFIG = new ConfigDef()
            .define("http.api.url", Type.STRING, "https://localhost:8080", Importance.HIGH, "api server url");
//            .define("kafka.topic", Type.STRING, "test", Importance.HIGH, "kafka topic name");

    public HttpSinkConnectorConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}
