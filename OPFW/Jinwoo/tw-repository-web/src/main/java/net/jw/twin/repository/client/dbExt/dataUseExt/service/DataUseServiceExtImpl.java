package net.jw.twin.repository.client.dbExt.dataUseExt.service;

import net.jw.twin.repository.client.dbExt.dataUseExt.mapper.DataUseMapperExt;
import net.jw.twin.repository.client.dbExt.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import net.jw.twin.repository.db.dataUse.service.DataUseServiceAbst;
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
    public int countAlreadyRequested(DataUseSearch search) {
        return mapper.countAlreadyRequested(search);
    }

    @Override
    public List<Map<String, Object>> selectDataUseSearchExtList(DataUseSearchExt search) { return mapper.selectDataUseSearchExtList(search); }
}
