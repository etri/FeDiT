package net.jcms.framework.cd.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.cd.model.Cd;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CdMapper extends BaseMapper<Cd, Cd>{
	Integer existCount (Cd cd);
}
