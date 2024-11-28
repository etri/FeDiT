package net.jcms.framework.security.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.security.mapper.ScurRscMapper;
import net.jcms.framework.security.model.ScurRsc;
import net.jcms.framework.security.service.ScurRscService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="scurRscService")
public class ScurRscServiceImpl extends BaseServiceAbst<ScurRsc, ScurRsc, ScurRscMapper> implements ScurRscService{

		@Override
		@Resource (name="scurRscMapper")
		protected void setMapper (ScurRscMapper mapper) {
			super.setMapper(mapper);
		}
	
}