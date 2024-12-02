package net.jcms.framework.pgm.service.impl;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.pgm.mapper.PgmMapper;
import net.jcms.framework.pgm.model.Pgm;
import net.jcms.framework.pgm.model.PgmSearch;
import net.jcms.framework.pgm.service.PgmService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="pgmService")
public class PgmServiceImpl extends BaseServiceAbst<Pgm, PgmSearch, PgmMapper> implements PgmService {

	@Override
	@Resource (name="pgmMapper")
	protected void setMapper (PgmMapper mapper) {
		super.setMapper (mapper);
	}	
}
