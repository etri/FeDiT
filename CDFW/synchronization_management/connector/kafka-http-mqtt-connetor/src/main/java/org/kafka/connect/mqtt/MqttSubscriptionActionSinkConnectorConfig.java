package org.kafka.connect.mqtt;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class MqttSubscriptionActionSinkConnectorConfig extends AbstractConfig {

    public static ConfigDef CONFIG = new ConfigDef()
            .define("filtering.action.list", Type.LIST, "default", Importance.HIGH, "Define filtering action List")
            .define("filtering.condition.list", Type.LIST, "default", Importance.HIGH, "Define filtering condition List")
            .define("mqtt.broker.uri", Type.STRING, "tcp://localhost:1883", Importance.HIGH, "full uri to mqtt broker")
            .define("mqtt.client.id", Type.STRING, "kafka_mqtt_sink_connector", Importance.MEDIUM, "mqtt client id")
            .define("mqtt.topic", Type.STRING, "mqttDataFormatSinkTest", Importance.HIGH, "mqtt topic name")
            .define("resource.type", Type.STRING, "digital_object", Importance.HIGH, "resource.type")
            .define("key.topic", Type.STRING, "digital_id", Importance.HIGH, "key.topic");

    public MqttSubscriptionActionSinkConnectorConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}
