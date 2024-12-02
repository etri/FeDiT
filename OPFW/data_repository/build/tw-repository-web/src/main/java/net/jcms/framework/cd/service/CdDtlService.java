package net.jcms.framework.cd.service;

import net.jcms.framework.base.service.BaseService;
import net.jcms.framework.cd.model.CdDtl;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface CdDtlService extends BaseService<CdDtl, CdDtl> {
	
	Integer existCount (CdDtl cdDtl);
	
	Map<String, List<CdDtl>> selectJson();
	
	List<CdDtl> selectJson(String cdId);

	void initJson();

	Integer countChek(CdDtl cdDtl);

	Map<String, Object> insert (CdDtl cdDtl, MultipartFile activeIcon, MultipartFile inactiveIcon) throws IOException;
}
