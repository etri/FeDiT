package net.jw.twin.repository.db.restKey.mapper;

import org.apache.ibatis.annotations.Mapper;
import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jcms.framework.base.mapper.BaseMapper;
import java.util.List;

@Mapper
public interface RestKeyMapper extends BaseMapper<RestKey, RestKeySearch> {
	void insertList(List<RestKey> datas);
	int countNullCheck(RestKeySearch search);
	List<RestKey> selectListNullCheck(RestKeySearch search);
}