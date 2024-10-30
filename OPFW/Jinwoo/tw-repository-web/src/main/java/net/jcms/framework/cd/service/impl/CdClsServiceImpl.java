package net.jcms.framework.cd.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.cd.mapper.CdClsMapper;
import net.jcms.framework.cd.model.CdCls;
import net.jcms.framework.cd.service.CdClsService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="cdClsService")
public class CdClsServiceImpl extends BaseServiceAbst<CdCls, CdCls, CdClsMapper> implements CdClsService{

	@Override
	@Resource (name="cdClsMapper")
	protected void setMapper (CdClsMapper mapper) {
		super.setMapper(mapper);
	}

	@Override
	public Integer existCount (CdCls cdCls) {
		return mapper.existCount (cdCls);
	}
}
