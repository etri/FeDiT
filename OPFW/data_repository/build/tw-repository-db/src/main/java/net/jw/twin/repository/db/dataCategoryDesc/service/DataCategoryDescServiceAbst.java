package net.jw.twin.repository.db.dataCategoryDesc.service;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDesc;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDescSearch;
import net.jw.twin.repository.db.dataCategoryDesc.mapper.DataCategoryDescMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

public abstract class DataCategoryDescServiceAbst<M extends DataCategoryDescMapper>
		extends BaseServiceAbst<DataCategoryDesc, DataCategoryDescSearch, M> implements DataCategoryDescService {

	@Override
	public void insertList(List<DataCategoryDesc> datas) {
		mapper.insertList(datas);
	}


	@Override
	public int countNullCheck(DataCategoryDescSearch search) {
		return mapper.countNullCheck(search);
	}


	@Override
	public List<DataCategoryDesc> selectListNullCheck(DataCategoryDescSearch search) {
		return mapper.selectListNullCheck(search);
	}


	@Override
	public int deleteSoft(DataCategoryDesc data) {
		data.setDelId(this.getUserId());
		return mapper.deleteSoft(data);
	}


}