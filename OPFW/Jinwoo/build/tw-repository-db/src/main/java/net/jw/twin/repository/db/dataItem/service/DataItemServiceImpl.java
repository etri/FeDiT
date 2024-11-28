package net.jw.twin.repository.db.dataItem.service;

import net.jw.twin.repository.db.dataItem.mapper.DataItemMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

@Service(value="dataItemService")
public class DataItemServiceImpl extends DataItemServiceAbst<DataItemMapper> implements DataItemService{
	@Override
	@Autowired
	@Qualifier("dataItemMapper")
	protected void setMapper (DataItemMapper mapper) {
		super.setMapper (mapper);
	}
}