package org.kafka.connect.mqtt;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigException;
import org.apache.kafka.connect.connector.Task;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.source.SourceConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MqttSourceConnector extends SourceConnector{

    private final Logger logger = LoggerFactory.getLogger(MqttSourceConnector.class);
    private Map<String, String> configProperties;

    @Override
    public String version() {
        return "1.0";
    }


    @Override
    public void start(Map<String, String> props) {
        this.configProperties = props;
        try {
            logger.info("MqttSourceConnector props : " + props.toString());
            new MqttSourceConnectorConfig(props);
        } catch (ConfigException e) {
            throw new ConnectException(e.getMessage(), e);
        }
    }


    @Override
    public Class<? extends Task> taskClass() {
        return MqttSourceTask.class; // 일단은 커넥터 하나당 태스크를 하나만 만들거라서 명시적으로 지정해줌
    }

    @Override
    public List<Map<String, String>> taskConfigs(int maxTasks) { // task 에 어떤 config 를 넣을 것인지를 지정. 현재는 모든 task 에 동일한 config 가 들어가기 때문에 모든 taskConfigs 가 동일하게 들어가게 함
        List<Map<String, String>> taskConfigs = new ArrayList<>();
        Map<String, String> taskProps = new HashMap<>();
        taskProps.putAll(configProperties);
        for (int i = 0; i < maxTasks; i++) {
            taskConfigs.add(taskProps);
        }
        return taskConfigs;
    }

    @Override
    public void stop() { // 현재는 리소스를 initializing 하는 부분이 없기 때문에 아무것도 안적혀 있음

    }

    @Override
    public ConfigDef config() {
        return MqttSourceConnectorConfig.CONFIG;
    }
}
