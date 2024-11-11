package net.jcms.framework.cd.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.cd.model.CdCls;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CdClsMapper extends BaseMapper<CdCls, CdCls>{
	Integer existCount (CdCls cdCls);
}
