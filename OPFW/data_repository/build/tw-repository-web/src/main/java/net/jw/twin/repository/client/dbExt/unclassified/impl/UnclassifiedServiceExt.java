package net.jw.twin.repository.client.dbExt.unclassified.impl;


import net.jw.twin.repository.db.unclassified.service.UnclassifiedService;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

public interface UnclassifiedServiceExt extends UnclassifiedService {
    boolean userHasValidKey(Long userId);
}
