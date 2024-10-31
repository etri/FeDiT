package net.jw.twin.repository.db.restKey.service;

import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jcms.framework.base.service.BaseService;
import java.util.Map;
import java.util.List;

public interface RestKeyService extends BaseService<RestKey, RestKeySearch> {


	public void insertList(List<RestKey> datas);
	public int countNullCheck(RestKeySearch search);
	public List<RestKey> selectListNullCheck(RestKeySearch search);

}