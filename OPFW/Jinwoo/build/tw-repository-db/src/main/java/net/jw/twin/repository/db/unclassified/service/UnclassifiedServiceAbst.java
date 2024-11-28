package net.jw.twin.repository.db.unclassified.service;

import net.jcms.framework.base.model.BaseModel;
import net.jcms.framework.base.service.BaseServiceAbst;
import net.jw.twin.repository.db.unclassified.mapper.UnclassifiedMapper;

public abstract class UnclassifiedServiceAbst<M extends UnclassifiedMapper>
        extends BaseServiceAbst<BaseModel, BaseModel, M> implements UnclassifiedService {
}
