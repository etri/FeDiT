package org.kafka.connect.http;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class HttpSinkSimulationConnectorConfig extends AbstractConfig { // 기본적으로 topics 를 받음 (반드시 SinkConnector 생성할 때 지정해주어야 함)

    public static ConfigDef CONFIG = new ConfigDef()
        .define("http.api.url", Type.STRING, "https://localhost:1234", Importance.HIGH, "api server url")
        .define("kafka.api.url", Type.STRING, "https://localhost:9092", Importance.HIGH, "api server url")
        .define("digital.twin.id", Type.STRING, "dt_id", Importance.HIGH, "digital.twin.id")
        .define("simulation.id", Type.STRING, "sub_id", Importance.HIGH, "simulation.id")
        .define("simulation.name", Type.STRING, "sub_name", Importance.HIGH, "simulation.name")
        .define("simulation.attribute", Type.LIST, Importance.HIGH, "simulation.attribute")
        .define("response.topic", Type.STRING, "_result", Importance.HIGH, "response.topic")
        .define("time.step", Type.INT, 1, Importance.HIGH, "time.step")
        .define("resource.type", Type.STRING, "digital_object", Importance.HIGH, "resource.type")
        .define("response.type", Type.STRING, "default", Importance.HIGH, "response.type")
        .define("include.input", Type.BOOLEAN, "false", Importance.HIGH, "include.input");
        

    public HttpSinkSimulationConnectorConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}
