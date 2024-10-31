package net.jw.twin.repository.db.institution.service;

import net.jw.twin.repository.db.institution.model.Institution;
import net.jw.twin.repository.db.institution.model.InstitutionSearch;
import net.jcms.framework.base.service.BaseService;
import java.util.Map;
import java.util.List;

public interface InstitutionService extends BaseService<Institution, InstitutionSearch> {


	public void insertList(List<Institution> datas);
	public int countNullCheck(InstitutionSearch search);
	public List<Institution> selectListNullCheck(InstitutionSearch search);

	public int deleteSoft(Institution data);

}