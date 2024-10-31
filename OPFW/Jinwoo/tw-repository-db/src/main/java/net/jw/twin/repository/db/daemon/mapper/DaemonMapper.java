package net.jw.twin.repository.db.daemon.mapper;

import org.apache.ibatis.annotations.Mapper;
import net.jw.twin.repository.db.daemon.model.Daemon;
import net.jw.twin.repository.db.daemon.model.DaemonSearch;
import net.jcms.framework.base.mapper.BaseMapper;
import java.util.List;

@Mapper
public interface DaemonMapper extends BaseMapper<Daemon, DaemonSearch> {
	void insertList(List<Daemon> datas);
	int countNullCheck(DaemonSearch search);
	List<Daemon> selectListNullCheck(DaemonSearch search);
}