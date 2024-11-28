package net.jw.twin.repository.db.dataCategoryDesc.service;

import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDesc;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDescSearch;
import net.jcms.framework.base.service.BaseService;
import java.util.Map;
import java.util.List;

public interface DataCategoryDescService extends BaseService<DataCategoryDesc, DataCategoryDescSearch> {


	public void insertList(List<DataCategoryDesc> datas);
	public int countNullCheck(DataCategoryDescSearch search);
	public List<DataCategoryDesc> selectListNullCheck(DataCategoryDescSearch search);

	public int deleteSoft(DataCategoryDesc data);

}