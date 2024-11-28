package net.jw.twin.repository.db.daemon.service;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jw.twin.repository.db.daemon.model.Daemon;
import net.jw.twin.repository.db.daemon.model.DaemonSearch;
import net.jw.twin.repository.db.daemon.mapper.DaemonMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

public abstract class DaemonServiceAbst<M extends DaemonMapper>
		extends BaseServiceAbst<Daemon, DaemonSearch, M> implements DaemonService {

	@Override
	public void insertList(List<Daemon> datas) {
		mapper.insertList(datas);
	}


	@Override
	public int countNullCheck(DaemonSearch search) {
		return mapper.countNullCheck(search);
	}


	@Override
	public List<Daemon> selectListNullCheck(DaemonSearch search) {
		return mapper.selectListNullCheck(search);
	}


}