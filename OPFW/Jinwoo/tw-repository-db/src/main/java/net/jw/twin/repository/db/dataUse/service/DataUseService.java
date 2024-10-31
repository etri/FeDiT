package net.jw.twin.repository.db.dataUse.service;

import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import net.jcms.framework.base.service.BaseService;
import java.util.Map;
import java.util.List;

public interface DataUseService extends BaseService<DataUse, DataUseSearch> {


	public void insertList(List<DataUse> datas);
	public int countNullCheck(DataUseSearch search);
	public List<DataUse> selectListNullCheck(DataUseSearch search);

	public int deleteSoft(DataUse data);

}