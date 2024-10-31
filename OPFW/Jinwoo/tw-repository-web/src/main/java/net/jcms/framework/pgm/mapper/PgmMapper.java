package net.jcms.framework.pgm.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.pgm.model.Pgm;
import net.jcms.framework.pgm.model.PgmSearch;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PgmMapper extends BaseMapper<Pgm, PgmSearch> {
	
}
