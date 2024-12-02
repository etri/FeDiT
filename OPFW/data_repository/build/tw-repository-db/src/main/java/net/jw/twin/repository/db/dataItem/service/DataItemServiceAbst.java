package net.jw.twin.repository.db.dataItem.service;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jw.twin.repository.db.dataItem.mapper.DataItemMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

public abstract class DataItemServiceAbst<M extends DataItemMapper>
		extends BaseServiceAbst<DataItem, DataItemSearch, M> implements DataItemService {

	@Override
	public void insertList(List<DataItem> datas) {
		mapper.insertList(datas);
	}


	@Override
	public int countNullCheck(DataItemSearch search) {
		return mapper.countNullCheck(search);
	}


	@Override
	public List<DataItem> selectListNullCheck(DataItemSearch search) {
		return mapper.selectListNullCheck(search);
	}


	@Override
	public int deleteSoft(DataItem data) {
		data.setDelId(this.getUserId());
		return mapper.deleteSoft(data);
	}


}