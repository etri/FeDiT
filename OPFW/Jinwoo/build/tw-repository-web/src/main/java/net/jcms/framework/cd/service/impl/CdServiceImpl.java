package net.jcms.framework.cd.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.cd.mapper.CdMapper;
import net.jcms.framework.cd.model.Cd;
import net.jcms.framework.cd.service.CdService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="cdService")
public class CdServiceImpl extends BaseServiceAbst<Cd, Cd, CdMapper> implements CdService{

		@Override
		@Resource (name="cdMapper")
		protected void setMapper (CdMapper mapper) {
			super.setMapper(mapper);
		}

		@Override
		public Integer existCount(Cd cd) {
			return mapper.existCount(cd);
		}

}
