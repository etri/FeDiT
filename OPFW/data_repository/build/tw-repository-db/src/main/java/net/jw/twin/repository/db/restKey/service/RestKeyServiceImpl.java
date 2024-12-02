package net.jw.twin.repository.db.restKey.service;

import net.jw.twin.repository.db.restKey.mapper.RestKeyMapper;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

@Service(value="restKeyService")
public class RestKeyServiceImpl extends RestKeyServiceAbst<RestKeyMapper> implements RestKeyService{
	@Override
	@Autowired
	@Qualifier("restKeyMapper")
	protected void setMapper (RestKeyMapper mapper) {
		super.setMapper (mapper);
	}
}