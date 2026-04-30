package org.kafka.connect.http;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigException;
import org.apache.kafka.connect.connector.Task;
import org.apache.kafka.connect.source.SourceConnector;
import org.apache.kafka.connect.errors.ConnectException;

import java.util.*;
import java.util.stream.Collectors;

public class HttpSourceGroupMultiTaskConnector extends SourceConnector{

    private Map<String, String> configProperties;

    @Override
    public void start(Map<String, String> props) {
        this.configProperties = props;
        try {
            new HttpSourceGroupMultiTaskConnectorConfig(props);
            this.configProperties = new HashMap<>(props);
        } catch (ConfigException e) {
            throw new ConnectException("Failed to start connector: " + e.getMessage(), e);
        }
    }

    @Override
    public Class<? extends Task> taskClass() {
        return HttpSourceGroupMultiTaskTask.class;
    }

    @Override
    public List<Map<String, String>> taskConfigs(int maxTasks) {
        List<Map<String, String>> result = new ArrayList<>();

        HttpSourceGroupMultiTaskConnectorConfig cfg =
            new HttpSourceGroupMultiTaskConnectorConfig(this.configProperties);

        // 1) URL 리스트 정규화: trim/빈값 제거/중복 제거/정렬(결정성)
        List<String> raw = cfg.getList("api.change.url");
        if (raw == null) raw = Collections.emptyList();

        List<String> changeUrls = raw.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // 실제 Task 수 = min(maxTasks, URL 개수) 단, URL이 0개면 1개 Task로 base만 폴링
        int urlCount = changeUrls.size();
        int taskCount = (urlCount == 0) ? 1 : Math.min(maxTasks, urlCount);

        // 2) 분배 전략: hash(권장) / round_robin
        String strategy = cfg.getString("distribution.strategy");
        List<List<String>> buckets = new ArrayList<>();
        for (int i = 0; i < taskCount; i++) buckets.add(new ArrayList<>());

        if (urlCount > 0) {
            if ("round_robin".equalsIgnoreCase(strategy)) {
                for (int i = 0; i < changeUrls.size(); i++) {
                    buckets.get(i % taskCount).add(changeUrls.get(i));
                }
            } else {
                // default: hash (결정적)
                for (String u : changeUrls) {
                    int idx = Math.floorMod(u.hashCode(), taskCount);
                    buckets.get(idx).add(u);
                }
            }
        }

        // 3) per-task config 생성
        for (int i = 0; i < taskCount; i++) {
            Map<String, String> taskProps = new HashMap<>(this.configProperties);

            // ✅ Task 전용 URL 키(권장): task.change.urls
            // - Task는 이 값을 우선 사용
            // - backward 호환을 위해 api.change.url도 같이 내려줌
            String joined = (urlCount > 0) ? String.join(",", buckets.get(i)) : "";
            taskProps.put("task.change.urls", joined);
            taskProps.put("api.change.url", joined);

            // 로깅/디버깅용 메타
            taskProps.put("task.index", String.valueOf(i));
            taskProps.put("task.count", String.valueOf(taskCount));

            result.add(taskProps);
        }

        return result;

    }

    @Override
    public void stop() {
    }

    @Override
    public ConfigDef config() {
        return HttpSourceGroupMultiTaskConnectorConfig.CONFIG;
    }

    @Override
    public String version() {
        return "1.0";
    }
}
