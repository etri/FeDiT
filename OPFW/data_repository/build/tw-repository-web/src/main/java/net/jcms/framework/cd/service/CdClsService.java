package net.jcms.framework.cd.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.cd.model.CdCls;

public interface CdClsService extends BaseService<CdCls, CdCls> {
	Integer existCount (CdCls cdCls);
}
