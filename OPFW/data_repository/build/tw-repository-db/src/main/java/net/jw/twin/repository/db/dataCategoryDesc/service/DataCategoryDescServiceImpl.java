package net.jw.twin.repository.db.dataCategoryDesc.service;

import net.jw.twin.repository.db.dataCategoryDesc.mapper.DataCategoryDescMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

@Service(value="dataCategoryDescService")
public class DataCategoryDescServiceImpl extends DataCategoryDescServiceAbst<DataCategoryDescMapper> implements DataCategoryDescService{
	@Override
	@Autowired
	@Qualifier("dataCategoryDescMapper")
	protected void setMapper (DataCategoryDescMapper mapper) {
		super.setMapper (mapper);
	}
}