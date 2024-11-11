package net.jcms.framework.util;

import net.jcms.framework.cd.model.CdDtl;
import net.jcms.framework.cd.service.CdDtlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CdUtil {
	static private CdDtlService cdDtlSvc = null;
	
	@Autowired
	public CdUtil(CdDtlService cdDtlSvc) {
		CdUtil.cdDtlSvc = cdDtlSvc;
	}
	
	public static CdDtl cdDtl(String cdId, String cdDtlId) {
		if(StrUtil.isEmpty(cdId) || StrUtil.isEmpty(cdDtlId)) return null;
		CdDtl cds = new CdDtl();
		cds.setCdId(cdId);
		cds.setCdDtlId(cdDtlId);
		return cdDtlSvc.select(cds);
	}

	public static String cdDtlName(String cdId, String cdDtlId) {
		if(StrUtil.isEmpty(cdId) || StrUtil.isEmpty(cdDtlId)) return null;
		CdDtl cds = new CdDtl();
		cds.setCdId(cdId);
		cds.setCdDtlId(cdDtlId);
		return cdDtlSvc.select(cds).getCdDtlNm();
	}
	
	public static List<CdDtl> cdDtlList(String cdId) {
		if(StrUtil.isEmpty(cdId)) return null;
		CdDtl cds = new CdDtl();
		cds.setPagingYn(false);
		cds.setSort("CD_DTL_ORD");		
		cds.setSortOrd("asc");
		cds.setCdId(cdId);
		return cdDtlSvc.selectList(cds);
	}
}
