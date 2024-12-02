package net.jw.twin.repository.db.ext.dataUseExt.service;

import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.ext.dataUseExt.mapper.DataUseMapperExt;
import net.jw.twin.repository.db.ext.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import net.jw.twin.repository.db.dataUse.service.DataUseServiceAbst;
import net.jw.twin.repository.db.restKey.model.RestKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service(value="dataUseServiceExt")
public class DataUseServiceExtImpl extends DataUseServiceAbst<DataUseMapperExt> implements DataUseServiceExt {

	@Override
	@Autowired
	@Qualifier("dataUseMapperExt")
	public void setMapper(DataUseMapperExt mapper) {
		super.setMapper(mapper);
	}

	@Override
	public boolean isCallCountBelowMax(DataUse dataUse) {
		return 0<(dataUse.getMaxCallCount()-dataUse.getCurrentCallCount());
	}

	@Override
	public DataUse selectByDataCode(DataUseSearchExt param) {
		return mapper.selectByDataCode(param);
	}

	@Override
	public DataUse selectByServiceId(DataUseSearchExt param) {
		return mapper.selectByServiceId(param);
	}
}
