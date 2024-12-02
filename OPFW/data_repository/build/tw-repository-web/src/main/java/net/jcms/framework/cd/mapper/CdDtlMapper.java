package net.jcms.framework.cd.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.cd.model.CdDtl;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CdDtlMapper extends BaseMapper<CdDtl, CdDtl>{
	Integer existCount (CdDtl cdDtl);

	Integer countChek(CdDtl cdDtl);
}
