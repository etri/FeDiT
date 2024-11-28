package net.jw.twin.repository.client.dbExt.unclassified.impl;

import net.jcms.framework.security.service.UserRoleService;
import net.jw.twin.repository.client.dbExt.unclassified.mapper.UnclassifiedMapperExt;
import net.jw.twin.repository.db.unclassified.service.UnclassifiedServiceAbst;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service(value="unclassifiedServiceExt")
public class UnclassifiedServiceExtImpl extends UnclassifiedServiceAbst<UnclassifiedMapperExt> implements UnclassifiedServiceExt {
    @Resource(name="userRoleService")
    private UserRoleService userRoleService;

    @Override
    @Resource(name= "unclassifiedMapperExt")
    protected void setMapper (UnclassifiedMapperExt mapper) {
        super.setMapper (mapper);
    }

    @Override
    public boolean userHasValidKey(Long userId) {
        return false;
    }
}
