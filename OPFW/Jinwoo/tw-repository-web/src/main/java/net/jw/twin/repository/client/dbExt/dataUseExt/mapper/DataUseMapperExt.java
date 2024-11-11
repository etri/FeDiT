package net.jw.twin.repository.client.dbExt.dataUseExt.mapper;

import net.jw.twin.repository.client.dbExt.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.db.dataUse.mapper.DataUseMapper;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface DataUseMapperExt extends DataUseMapper {
    int countAlreadyRequested(DataUseSearch search);
    List<Map<String, Object>> selectDataUseSearchExtList(DataUseSearchExt search);
}
