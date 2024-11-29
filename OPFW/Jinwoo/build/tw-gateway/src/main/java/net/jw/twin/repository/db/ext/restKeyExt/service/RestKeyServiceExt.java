package net.jw.twin.repository.db.ext.restKeyExt.service;

import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jw.twin.repository.db.restKey.service.RestKeyService;

public interface RestKeyServiceExt extends RestKeyService {

    RestKey test(RestKeySearch search);
    void usageRequest(String serviceId, String token);
    DataUse validateUsageRequest(String serviceId, String token);
}
