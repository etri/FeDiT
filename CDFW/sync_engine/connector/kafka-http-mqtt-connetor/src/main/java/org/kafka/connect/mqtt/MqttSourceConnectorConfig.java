package org.kafka.connect.mqtt;

import org.apache.kafka.common.config.AbstractConfig;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.common.config.ConfigDef.Type;

import java.util.Map;

public class MqttSourceConnectorConfig extends AbstractConfig{

    public static ConfigDef CONFIG = new ConfigDef()
            .define("mqtt.broker.uri", Type.STRING, "tcp://localhost:1883", Importance.HIGH, "full uri to mqtt broker")
            .define("mqtt.client.id", Type.STRING, "kafka_source_connector", Importance.MEDIUM, "mqtt client id")
            .define("mqtt.topic", Type.STRING, "test", Importance.HIGH, "mqtt topic name")
            .define("digital.twin.id", Type.STRING, "digital_twin_id", Importance.HIGH, "digital_twin_id")
            .define("kafka.topic", Type.STRING, "Sensors", Importance.HIGH, "kafka topic name")
            .define("sensor.id", Type.STRING, "SensorID", Importance.HIGH, "sensor id for kafka key");

    public MqttSourceConnectorConfig(Map<String, String> props) {  // 생성자(Constructor)
        super(CONFIG, props); // 위에 설정한 CONFIG 값이랑 받아온 props 로 부모클래스 생성자 호출
    }
}
