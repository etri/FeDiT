package org.kafka.connect.mqtt;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class MqttSinkActionConnectorConfig extends AbstractConfig {

    public static ConfigDef CONFIG = new ConfigDef()
            .define("filtering.action.list", Type.LIST, "null", Importance.HIGH, "Define filtering action List")
            .define("filtering.condition.list", Type.LIST, "null", Importance.HIGH, "Define filtering condition List")
            .define("mqtt.client.id", Type.STRING, "kafka_mqtt_sink_connector", Importance.MEDIUM, "mqtt client id")
            .define("mqtt.broker.uri", Type.STRING, "tcp://localhost:1883", Importance.HIGH, "full uri to mqtt broker")
            .define("mqtt.topic", Type.STRING, "mqttSinkTest", Importance.HIGH, "mqtt topic name")
            .define("digital.object.id", Type.STRING, "digital_object_id", Importance.HIGH, "digital.object.id");

    public MqttSinkActionConnectorConfig(Map<String, String> props) {
        super(CONFIG, props);
    }
}
