package net.jcms.framework.weblog.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.weblog.mapper.WebLogMapper;
import net.jcms.framework.weblog.model.WebLog;
import net.jcms.framework.weblog.model.WebLogSearch;
import net.jcms.framework.weblog.service.WebLogService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="webLogService")
public class WebLogServiceImpl extends BaseServiceAbst<WebLog, WebLogSearch, WebLogMapper> implements WebLogService {

	@Override
	@Resource (name="webLogMapper")
	protected void setMapper (WebLogMapper mapper) {
		super.setMapper (mapper);
	}
}
