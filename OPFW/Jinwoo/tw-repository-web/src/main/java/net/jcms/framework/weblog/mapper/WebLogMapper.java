package net.jcms.framework.weblog.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.weblog.model.WebLog;
import net.jcms.framework.weblog.model.WebLogSearch;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WebLogMapper extends BaseMapper<WebLog, WebLogSearch> {
	
}
