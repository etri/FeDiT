package net.jw.twin.repository.db.dataUse.service;

import net.jw.twin.repository.db.dataUse.mapper.DataUseMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

@Service(value="dataUseService")
public class DataUseServiceImpl extends DataUseServiceAbst<DataUseMapper> implements DataUseService{
	@Override
	@Autowired
	@Qualifier("dataUseMapper")
	protected void setMapper (DataUseMapper mapper) {
		super.setMapper (mapper);
	}
}