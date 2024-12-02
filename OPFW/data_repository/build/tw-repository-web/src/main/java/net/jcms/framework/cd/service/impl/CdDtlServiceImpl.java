package net.jcms.framework.cd.service.impl;


import net.jcms.framework.base.service.BaseServiceAbst;
import net.jcms.framework.cd.mapper.CdDtlMapper;
import net.jcms.framework.cd.model.Cd;
import net.jcms.framework.cd.model.CdDtl;
import net.jcms.framework.cd.service.CdDtlService;
import net.jcms.framework.cd.service.CdService;
import net.jcms.framework.file.model.FileItem;
import net.jcms.framework.file.service.FileItemService;
import net.jcms.framework.util.ApplicationHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service(value="cdDtlService")
public class CdDtlServiceImpl extends BaseServiceAbst<CdDtl, CdDtl, CdDtlMapper> implements CdDtlService {

	@Resource (name="cdService")
	private CdService cdService;

	@Resource (name="fileItemService")
	private FileItemService fileItemService;

	@Override
	@Resource (name="cdDtlMapper")
	protected void setMapper (CdDtlMapper mapper) {
		super.setMapper(mapper);
	}

	@Override
	public Integer existCount(CdDtl cdDtl) {
		return mapper.existCount(cdDtl);
	}

	@Override
	public Map<String, List<CdDtl>> selectJson() {
		if(ApplicationHelper.cdDtlMap == null) {
			initJson();
		}
		return ApplicationHelper.cdDtlMap;
	}

	@Override
	public List<CdDtl> selectJson(String cdId) {
		Map<String, List<CdDtl> > cdDtlMap = selectJson();
		return cdDtlMap.get(cdId);
	}

	@Override
	public void initJson() {
		Map<String, List<CdDtl>> cdDtlMap = new HashMap<String, List<CdDtl>>();
		Cd cdSearch = new Cd();
		CdDtl cdDtl;
		List<Cd> cdList = cdService.selectList(cdSearch);
		for(Cd cd : cdList) {
			cdDtl = new CdDtl();
			cdDtl.setCdId(cd.getCdId());
			cdDtl.setSort("CD_DTL_ORDER");
			cdDtlMap.put(cd.getCdId(), selectList(cdDtl));
		}
		ApplicationHelper.cdDtlMap = cdDtlMap;
	}

	@Override
	public Integer countChek(CdDtl cdDtl) {
		return mapper.countChek(cdDtl);
	}


	@Transactional
	public Map<String, Object> insert (CdDtl cdDtl, MultipartFile activeIcon, MultipartFile inactiveIcon) throws IOException {
		Map<String, Object> result = new HashMap<String, Object>();
		Long activeIconId = null;
		Long inactiveIconId = null;

		if(false == activeIcon.isEmpty()) {
			FileItem fileItem = fileItemService.saveFile(activeIcon);
			activeIconId = fileItem.getItemId();
			cdDtl.setCdDtlActiveIcon(activeIconId);
		}

		if(false == inactiveIcon.isEmpty()) {
			FileItem fileItem = fileItemService.saveFile(inactiveIcon);
			inactiveIconId = fileItem.getItemId();
			cdDtl.setCdDtlInactiveIcon(inactiveIconId);
		}

		if(existCount(cdDtl) > 0) {//코드분류아이디 또는 코드분류이름이 중복된 경우
			result.put("result", "duplicate");
			result.put("message", "이미 등록된 코드 입니다. 다시 등록하여 주십시오.");
		} else {
			cdDtl.setRegId(getUserId());
			insert(cdDtl);

			result.put("result", "success");
		}
//			throw new RuntimeException(); // 롤백 테스트
		return result;
	}
}
