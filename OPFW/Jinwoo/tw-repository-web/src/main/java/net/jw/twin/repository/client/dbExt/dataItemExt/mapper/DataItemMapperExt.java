package net.jw.twin.repository.client.dbExt.dataItemExt.mapper;

import net.jw.twin.repository.db.dataItem.mapper.DataItemMapper;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface DataItemMapperExt extends DataItemMapper {
    Map<String, Object> selectDataDetail(DataItemSearch search);

    int countDataDetail(DataItemSearch search);
    List<Map<String, Object>> selectListDataDetail(DataItemSearch search);
}
