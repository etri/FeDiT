package net.jw.twin.repository.db.daemon.service;

import net.jw.twin.repository.db.daemon.mapper.DaemonMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

@Service(value="daemonService")
public class DaemonServiceImpl extends DaemonServiceAbst<DaemonMapper> implements DaemonService{
	@Override
	@Autowired
	@Qualifier("daemonMapper")
	protected void setMapper (DaemonMapper mapper) {
		super.setMapper (mapper);
	}
}