package net.jcms.framework.cd.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.cd.model.CdDtl;
import net.jcms.framework.cd.service.CdDtlService;
import net.jcms.framework.file.model.FileItem;
import net.jcms.framework.file.model.FileItemSearch;
import net.jcms.framework.file.service.FileItemService;
import net.jcms.framework.util.StrUtil;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 상세코드 관리 Controller
 * 
 * @author machineguy
 *
 */
@Controller
@Slf4j
public class CdDtlController extends BaseController{
	
	@Resource (name="cdDtlService")
	private CdDtlService cdDtlService;

	@Resource (name="fileItemService")
	private FileItemService fileItemService;

	/**
	 * 상세 코드 목록을 json 으로 반환
	 * @param request
	 * @param cdDtl
	 * @return
	 */
	@RequestMapping(value="/system/cdDtl/list.json")
	@ResponseBody
	public Map<String, Object> list(HttpServletRequest request, CdDtl cdDtl) {
		Map<String, Object> result = new HashMap<String, Object>();
		String sort = request.getParameter("columns[" + request.getParameter("order[0][column]") + "][name]");
		String sortOder = request.getParameter("order[0][dir]");
		cdDtl.setSort(sort);
		cdDtl.setSortOrd(sortOder);
		cdDtl.setPagingYn(true);

		String recSt = request.getParameter("search[value]");
		if (recSt.equals("사용")) {
			cdDtl.setUseSt("Y");
		} else if (recSt.equals("사용안함")) {
			cdDtl.setUseSt("N");
		}

		if (StrUtil.isEmpty(cdDtl.getCdId())) {
			result.put("recordsTotal", 0);
			result.put("recordsFiltered", 0);
			result.put("data", "");
		} else {
			int totalCount = cdDtlService.count(cdDtl);
			result.put("recordsTotal", totalCount);
			result.put("recordsFiltered", totalCount);

			List<Map<String, Object>> data = new ArrayList<Map<String, Object>>();
			List<CdDtl> channelTpList = cdDtlService.selectList(cdDtl);
			for (CdDtl item : channelTpList) {
				Map<String, Object> map = new HashMap<String, Object>();
				map.put("item", item);

				Long activeIconId = item.getCdDtlActiveIcon();
				if (null != activeIconId) {
					FileItemSearch fileItemSearch = new FileItemSearch();
					fileItemSearch.setItemId(activeIconId);
					FileItem activeIcon = fileItemService.select(fileItemSearch);
					if (null != activeIcon) {
						map.put("activeIcon", activeIcon.getSaveFileNm());
						map.put("activeIconFileNm", activeIcon.getFileNm());
					}
				}

				Long inactiveIconId = item.getCdDtlInactiveIcon();
				if (null != inactiveIconId) {
					FileItemSearch fileItemSearch = new FileItemSearch();
					fileItemSearch.setItemId(inactiveIconId);
					FileItem inactiveIcon = fileItemService.select(fileItemSearch);
					if (null != inactiveIcon) {
						map.put("inactiveIcon", inactiveIcon.getSaveFileNm());
						map.put("inactiveIconFileNm", inactiveIcon.getFileNm());
					}
				}
				data.add(map);
			}
			result.put("data", data);
			//result.put("data", cdDtlService.selectList(cdDtl));
		}
		result.put("result", "success");

		return result;
	}
	
	/**
	 * 상세코드 등록
	 * 
	 * @param request
	 * @param cdDtl
	 * @return
	 */
	@RequestMapping(value="/system/cdDtl/insert.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> insert(HttpServletRequest request, CdDtl cdDtl, MultipartFile activeIcon, MultipartFile inactiveIcon) throws IOException {
		return cdDtlService.insert(cdDtl, activeIcon, inactiveIcon);
	}
	
	
	/**
	 * 상세코드 수정
	 * @param request
	 * @param cdDtl
	 * @return
	 */
	@RequestMapping(value="/system/cdDtl/update.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> update(HttpServletRequest request, CdDtl cdDtl, MultipartFile activeIcon, MultipartFile inactiveIcon,
									  								Boolean deleteActiveIcon, Boolean deleteInactiveIcon) throws IOException {
		Map<String, Object> result = new HashMap<String, Object>();

		CdDtl orig = cdDtlService.select(cdDtl);

		if (false == activeIcon.isEmpty()) {
			Long itemId = cdDtl.getCdDtlActiveIcon();
			if (null == itemId) {
				FileItem fileItem = fileItemService.saveFile(activeIcon);
				itemId = fileItem.getItemId();
				cdDtl.setCdDtlActiveIcon(itemId);
			} else {
				fileItemService.updateFile(activeIcon, itemId);
			}
		} else if (deleteActiveIcon) {
			Long itemId = orig.getCdDtlActiveIcon();
			if (null != itemId) {
				FileItemSearch fileItemSearch = new FileItemSearch();
				fileItemSearch.setItemId(itemId);
				FileItem fileItem = fileItemService.select(fileItemSearch);
				if (null != fileItem) {
					fileItemService.delete(fileItem);
				}
				cdDtl.setCdDtlActiveIcon(null);
			}
		}

		if (false == inactiveIcon.isEmpty()) {
			Long itemId = cdDtl.getCdDtlInactiveIcon();
			if (null == itemId) {
				FileItem fileItem = fileItemService.saveFile(inactiveIcon);
				itemId = fileItem.getItemId();
				cdDtl.setCdDtlInactiveIcon(itemId);
			} else {
				fileItemService.updateFile(inactiveIcon, itemId);
			}
		} else if (deleteInactiveIcon) {
			Long itemId = orig.getCdDtlInactiveIcon();
			if (null != itemId) {
				FileItemSearch fileItemSearch = new FileItemSearch();
				fileItemSearch.setItemId(itemId);
				FileItem fileItem = fileItemService.select(fileItemSearch);
				if (null != fileItem) {
					fileItemService.delete(fileItem);
				}
				cdDtl.setCdDtlInactiveIcon(null);
			}
		}

		cdDtl.setUpdId(getUserId());
		cdDtlService.update(cdDtl);

		//cdDtlService.initJson();
		result.put("result", "success");

		return result;
	}
	
	
	/**
	 * 상세코드 삭제
	 * @param request
	 * @param cdDtl
	 * @return
	 */
	@RequestMapping(value="/system/cdDtl/delete.json", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> delete(HttpServletRequest request, CdDtl cdDtl) {
		Map<String, Object> result = new HashMap<String, Object>();
		CdDtl orig = cdDtlService.select(cdDtl);
		{
			Long itemId = orig.getCdDtlActiveIcon();
			if (null != itemId) {
				fileItemService.deleteFileById(itemId);
			}

			itemId = orig.getCdDtlInactiveIcon();
			if (null != itemId) {
				fileItemService.deleteFileById(itemId);
			}
		}

		cdDtl.setDelId(getUserId());
		cdDtlService.delete(cdDtl);

		//cdDtlService.initJson();
		result.put("result", "success");

		return result;
	}
}
