package net.jw.twin.repository.client.service;

import net.jw.twin.repository.db.daemon.model.DaemonSearch;

import java.util.List;
import java.util.Map;

public interface CollectorService {
    Map<String, Object> getMonitoringDataList(DaemonSearch search);
}
