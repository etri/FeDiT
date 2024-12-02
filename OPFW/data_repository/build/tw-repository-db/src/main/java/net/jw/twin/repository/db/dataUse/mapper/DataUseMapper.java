package net.jw.twin.repository.db.dataUse.mapper;

import org.apache.ibatis.annotations.Mapper;
import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import net.jcms.framework.base.mapper.BaseMapper;
import java.util.List;

@Mapper
public interface DataUseMapper extends BaseMapper<DataUse, DataUseSearch> {
	void insertList(List<DataUse> datas);
	int countNullCheck(DataUseSearch search);
	List<DataUse> selectListNullCheck(DataUseSearch search);
	int deleteSoft(DataUse data);
}