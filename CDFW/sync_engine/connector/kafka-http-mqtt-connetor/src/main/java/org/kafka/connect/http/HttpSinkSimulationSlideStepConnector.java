package org.kafka.connect.http;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigException;
import org.apache.kafka.connect.connector.Task;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.sink.SinkConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HttpSinkSimulationSlideStepConnector extends SinkConnector {

    private final Logger logger = LoggerFactory.getLogger(HttpSinkSimulationSlideStepConnector.class);
    private Map<String, String> configProperties;

    @Override
    public void start(Map<String, String> props) {
        this.configProperties = props;
        try {
            logger.info("HttpSinkSimulationSlideStepConnector props : " + props.toString());
            new HttpSinkSimulationSlideStepConnectorConfig(props);
        } catch (ConfigException e) {
            throw new ConnectException(e.getMessage(), e);
        }
    }

    @Override
    public Class<? extends Task> taskClass() {
        return HttpSinkSimulationSlideStepTask.class;
    }

    @Override
    public List<Map<String, String>> taskConfigs(int maxTasks) {
        List<Map<String, String>> taskConfigs = new ArrayList<>();
        Map<String, String> taskProps = new HashMap<>();
        taskProps.putAll(configProperties);
        for (int i = 0; i < maxTasks; i++) {
            taskConfigs.add(taskProps);
        }
        return taskConfigs;
    }

    @Override
    public void stop() {

    }

    @Override
    public ConfigDef config() {
        return HttpSinkSimulationSlideStepConnectorConfig.CONFIG;
    }

    @Override
    public String version() {
        return "1.0";
    }
}
