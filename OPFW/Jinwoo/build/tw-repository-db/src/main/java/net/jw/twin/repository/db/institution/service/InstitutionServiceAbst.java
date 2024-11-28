package net.jw.twin.repository.db.institution.service;

import net.jcms.framework.base.service.BaseServiceAbst;
import net.jw.twin.repository.db.institution.model.Institution;
import net.jw.twin.repository.db.institution.model.InstitutionSearch;
import net.jw.twin.repository.db.institution.mapper.InstitutionMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

public abstract class InstitutionServiceAbst<M extends InstitutionMapper>
		extends BaseServiceAbst<Institution, InstitutionSearch, M> implements InstitutionService {

	@Override
	public void insertList(List<Institution> datas) {
		mapper.insertList(datas);
	}


	@Override
	public int countNullCheck(InstitutionSearch search) {
		return mapper.countNullCheck(search);
	}


	@Override
	public List<Institution> selectListNullCheck(InstitutionSearch search) {
		return mapper.selectListNullCheck(search);
	}


	@Override
	public int deleteSoft(Institution data) {
		data.setDelId(this.getUserId());
		return mapper.deleteSoft(data);
	}


}