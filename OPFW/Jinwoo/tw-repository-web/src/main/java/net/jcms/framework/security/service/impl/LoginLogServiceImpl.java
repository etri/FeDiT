package net.jcms.framework.security.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.security.mapper.LoginLogMapper;
import net.jcms.framework.security.model.LoginLog;
import net.jcms.framework.security.model.LoginLogSearch;
import net.jcms.framework.security.service.LoginLogService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;

@Service(value="loginLogService")
public class LoginLogServiceImpl extends BaseServiceAbst<LoginLog, LoginLogSearch, LoginLogMapper> implements LoginLogService {

	@Override
	@Resource (name="loginLogMapper")
	protected void setMapper (LoginLogMapper mapper) {
		super.setMapper (mapper);
	}
	
	public void logout(Long loginLogId) {
		LoginLog loginLogVO = new LoginLog();
		loginLogVO.setLoginLogId(loginLogId);
		update(loginLogVO);
	}


	@Override
	public List<LoginLogSearch> countByDate(
			LoginLogSearch loginLogSearch) {
		return mapper.countByDate (loginLogSearch);
	}
}
