package net.jw.twin.repository.db.restKey.service;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jw.twin.repository.db.restKey.mapper.RestKeyMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

public abstract class RestKeyServiceAbst<M extends RestKeyMapper>
		extends BaseServiceAbst<RestKey, RestKeySearch, M> implements RestKeyService {

	@Override
	public void insertList(List<RestKey> datas) {
		mapper.insertList(datas);
	}


	@Override
	public int countNullCheck(RestKeySearch search) {
		return mapper.countNullCheck(search);
	}


	@Override
	public List<RestKey> selectListNullCheck(RestKeySearch search) {
		return mapper.selectListNullCheck(search);
	}


}