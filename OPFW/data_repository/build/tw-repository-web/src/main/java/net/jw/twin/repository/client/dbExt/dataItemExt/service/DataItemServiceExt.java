package net.jw.twin.repository.client.dbExt.dataItemExt.service;

import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jw.twin.repository.db.dataItem.service.DataItemService;

import java.util.List;
import java.util.Map;

public interface DataItemServiceExt extends DataItemService {
    boolean        isValid(Long id);
    void           requestDataRegist(DataItem dataItem);

    Map<String, Object> selectDataDetail(DataItemSearch search);

    int countDataDetail(DataItemSearch search);
    List<Map<String, Object>> selectListDataDetail(DataItemSearch search);
}
