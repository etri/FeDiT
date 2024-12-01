package net.jcms.framework.security.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.security.model.LoginLog;
import net.jcms.framework.security.model.LoginLogSearch;

import java.util.List;

public interface LoginLogService extends BaseService<LoginLog, LoginLogSearch> {
	
	public void logout(Long loginLogId);

	List<LoginLogSearch> countByDate(LoginLogSearch loginLogSearch);
	
}
