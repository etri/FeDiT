package net.jcms.framework.security.mapper;

import net.jcms.framework.base.mapper.BaseMapper;
import net.jcms.framework.security.model.LoginLog;
import net.jcms.framework.security.model.LoginLogSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface LoginLogMapper extends BaseMapper<LoginLog, LoginLogSearch> {
    List<LoginLogSearch> countByDate(LoginLogSearch loginLogSearch);
}
