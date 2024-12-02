package net.jcms.framework.cd.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.cd.model.Cd;

public interface CdService extends BaseService<Cd, Cd> {
	
	Integer existCount (Cd cd);
	
}
