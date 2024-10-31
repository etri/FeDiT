package net.jw.twin.repository.db.dataItem.mapper;

import org.apache.ibatis.annotations.Mapper;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jcms.framework.base.mapper.BaseMapper;
import java.util.List;

@Mapper
public interface DataItemMapper extends BaseMapper<DataItem, DataItemSearch> {
	void insertList(List<DataItem> datas);
	int countNullCheck(DataItemSearch search);
	List<DataItem> selectListNullCheck(DataItemSearch search);
	int deleteSoft(DataItem data);
}