package net.jw.twin.repository.client.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.jw.twin.repository.db.daemon.model.Daemon;
import net.jw.twin.repository.db.daemon.model.DaemonSearch;
import net.jw.twin.repository.db.daemon.service.DaemonService;
import net.jw.twin.repository.util.PrometheusUtil;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollectorServiceImpl implements CollectorService {
    private final DaemonService daemonService;
    private final PrometheusUtil prometheusUtil;

    @Override
    public Map<String, Object> getMonitoringDataList(DaemonSearch search) {
        Map<String, Object> map = new HashMap<>();
        List<Daemon> daemonList = daemonService.selectList(search);

        long timestamp = System.currentTimeMillis() / 1000;
        String startTimestamp = String.valueOf(timestamp - 60 * 60); // 1hr
        String endTimestamp = String.valueOf(timestamp);

        List<Object> monitorDataList = daemonList.stream().map(daemon -> {
            daemon.setValues(prometheusUtil.fetchMonitoringData(daemon.getLabel(), startTimestamp, endTimestamp));
            return daemon;
        }).collect(Collectors.toList());

        if (!monitorDataList.isEmpty()) {
            map.put("data", monitorDataList);
        } else {
            map.put("data", null);
        }
        return map;
    }
}
