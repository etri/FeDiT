package net.jw.twin.repository.db.ext.dataUseExt.service;

import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.ext.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.db.dataUse.model.DataUseSearch;
import net.jw.twin.repository.db.dataUse.service.DataUseService;
import net.jw.twin.repository.db.restKey.model.RestKey;

import java.util.List;
import java.util.Map;

public interface DataUseServiceExt extends DataUseService {
    boolean isCallCountBelowMax(DataUse dataUse);
    DataUse selectByDataCode(DataUseSearchExt param);
    DataUse selectByServiceId(DataUseSearchExt param);
}
