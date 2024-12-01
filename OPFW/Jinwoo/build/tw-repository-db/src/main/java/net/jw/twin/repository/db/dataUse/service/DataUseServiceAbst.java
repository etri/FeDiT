package net.jw.twin.repository.db.dataUse.service;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import net.jw.twin.repository.db.dataUse.mapper.DataUseMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

public abstract class DataUseServiceAbst<M extends DataUseMapper>
		extends BaseServiceAbst<DataUse, DataUseSearch, M> implements DataUseService {

	@Override
	public void insertList(List<DataUse> datas) {
		mapper.insertList(datas);
	}


	@Override
	public int countNullCheck(DataUseSearch search) {
		return mapper.countNullCheck(search);
	}


	@Override
	public List<DataUse> selectListNullCheck(DataUseSearch search) {
		return mapper.selectListNullCheck(search);
	}


	@Override
	public int deleteSoft(DataUse data) {
		data.setDelId(this.getUserId());
		return mapper.deleteSoft(data);
	}


}