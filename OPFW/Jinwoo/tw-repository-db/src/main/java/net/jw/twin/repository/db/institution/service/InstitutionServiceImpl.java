package net.jw.twin.repository.db.institution.service;

import net.jw.twin.repository.db.institution.mapper.InstitutionMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

@Service(value="institutionService")
public class InstitutionServiceImpl extends InstitutionServiceAbst<InstitutionMapper> implements InstitutionService{
	@Override
	@Autowired
	@Qualifier("institutionMapper")
	protected void setMapper (InstitutionMapper mapper) {
		super.setMapper (mapper);
	}
}