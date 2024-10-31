package net.jw.twin.repository.db.dataItem.service;

import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jcms.framework.base.service.BaseService;
import java.util.Map;
import java.util.List;

public interface DataItemService extends BaseService<DataItem, DataItemSearch> {


	public void insertList(List<DataItem> datas);
	public int countNullCheck(DataItemSearch search);
	public List<DataItem> selectListNullCheck(DataItemSearch search);

	public int deleteSoft(DataItem data);

}