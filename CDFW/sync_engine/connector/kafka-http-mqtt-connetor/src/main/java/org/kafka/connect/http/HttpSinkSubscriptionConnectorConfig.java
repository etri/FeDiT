package org.kafka.connect.http;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class HttpSinkSubscriptionConnectorConfig extends AbstractConfig { // 기본적으로 topics 를 받음 (반드시 SinkConnector 생성할 때 지정해주어야 함)

    public static ConfigDef CONFIG = new ConfigDef()
            .define("http.api.url", Type.LIST, "https://localhost:1234", Importance.HIGH, "http.api.url")
            .define("subscription.id", Type.STRING, "sub_id", Importance.HIGH, "subscription.id")
            .define("digital.twin.id", Type.STRING, "dt_id", Importance.HIGH, "digital.twin.id")
            .define("subscription.name", Type.STRING, "sub_name", Importance.HIGH, "subscription.name");

    public HttpSinkSubscriptionConnectorConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}