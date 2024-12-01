package net.jw.twin.repository.db.ext.dataUseExt.mapper;

import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.ext.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.db.dataUse.mapper.DataUseMapper;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface DataUseMapperExt extends DataUseMapper {
    DataUse selectByDataCode(DataUseSearchExt param);
    DataUse selectByServiceId(DataUseSearchExt param);
}
