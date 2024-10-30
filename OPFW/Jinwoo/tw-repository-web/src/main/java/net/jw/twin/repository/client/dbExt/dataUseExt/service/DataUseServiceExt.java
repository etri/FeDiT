package net.jw.twin.repository.client.dbExt.dataUseExt.service;

import net.jw.twin.repository.client.dbExt.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import net.jw.twin.repository.db.dataUse.service.DataUseService;

import java.util.List;
import java.util.Map;

public interface DataUseServiceExt extends DataUseService {
    int countAlreadyRequested(DataUseSearch search);
    List<Map<String, Object>> selectDataUseSearchExtList(DataUseSearchExt search);
}
