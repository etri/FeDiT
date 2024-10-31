package net.jw.twin.repository.client.dbExt.institutionExt.service;

import net.jw.twin.repository.db.institution.model.Institution;
import net.jw.twin.repository.db.institution.model.InstitutionSearch;
import net.jw.twin.repository.db.institution.service.InstitutionService;

import java.util.List;
import java.util.Map;

public interface InstitutionServiceExt extends InstitutionService {

    List<Map<String, Object>> selectListWithManagerName(InstitutionSearch search);
    void updateInstitution(Institution institution);
}
