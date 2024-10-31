package net.jw.twin.repository.db.dataCategoryDesc.mapper;

import org.apache.ibatis.annotations.Mapper;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDesc;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDescSearch;
import net.jcms.framework.base.mapper.BaseMapper;
import java.util.List;

@Mapper
public interface DataCategoryDescMapper extends BaseMapper<DataCategoryDesc, DataCategoryDescSearch> {
	void insertList(List<DataCategoryDesc> datas);
	int countNullCheck(DataCategoryDescSearch search);
	List<DataCategoryDesc> selectListNullCheck(DataCategoryDescSearch search);
	int deleteSoft(DataCategoryDesc data);
}