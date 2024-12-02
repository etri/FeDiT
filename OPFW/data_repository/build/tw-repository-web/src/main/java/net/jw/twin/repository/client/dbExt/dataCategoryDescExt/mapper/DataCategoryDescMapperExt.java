package net.jw.twin.repository.client.dbExt.dataCategoryDescExt.mapper;

import net.jw.twin.repository.db.dataCategoryDesc.mapper.DataCategoryDescMapper;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDesc;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDescSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface DataCategoryDescMapperExt extends DataCategoryDescMapper {
    List<DataCategoryDesc> selectListWithIconFileInfo(DataCategoryDescSearch search);
}
