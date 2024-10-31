package net.jw.twin.repository.db.daemon.service;

import net.jw.twin.repository.db.daemon.model.Daemon;
import net.jw.twin.repository.db.daemon.model.DaemonSearch;
import net.jcms.framework.base.service.BaseService;
import java.util.Map;
import java.util.List;

public interface DaemonService extends BaseService<Daemon, DaemonSearch> {


	public void insertList(List<Daemon> datas);
	public int countNullCheck(DaemonSearch search);
	public List<Daemon> selectListNullCheck(DaemonSearch search);

}