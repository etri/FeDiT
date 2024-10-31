package net.jcms.framework.cd.web;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.cd.model.Cd;
import net.jcms.framework.cd.model.CdCls;
import net.jcms.framework.cd.service.CdClsService;
import net.jcms.framework.cd.service.CdService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@Slf4j
public class CdClsController extends BaseController{
	
	@Resource (name="cdClsService")
	private CdClsService cdClsService;
	
	@Resource (name="cdService")
	private CdService cdService;
	
	//화면전환
	@RequestMapping("/system/cd/mng.mng")
	public String site(Model model, Cd cd) {
		// model.addAttribute("cdClsList", cdClsService.selectList(cdCls));
		model.addAttribute("cdList", cdService.selectList(cd));
		return "system/cd/mng";
	}
	
	//리스트 재전송
	@RequestMapping(value="/system/cdCls/list.mng", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, List<CdCls>> list(HttpServletRequest request, CdCls cdCls) {
		Map<String, List<CdCls>> result = new HashMap<String, List<CdCls>>();
		result.put("result", cdClsService.selectList(cdCls));
		return  result;
	}
	
	//상세 내역 전송
	@RequestMapping(value="/system/cdCls/select.mng", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> select(HttpServletRequest request, CdCls cdCls) {
		Map<String, Object> result = new HashMap<String, Object>();
		result.put("result", cdClsService.select(cdCls));
		return result;
	}
	
	
	//등록
	@RequestMapping(value="/system/cdCls/insert.mng", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> insert(HttpServletRequest request, CdCls cdCls) {
		Map<String, Object> result = new HashMap<String, Object>();
		if (cdClsService.existCount(cdCls) > 0) {//코드분류아이디 또는 코드분류이름이 중복된 경우
			result.put("result", "duplicate");
			result.put("message", "이미 등록된 코드 분류입니다. 다시 등록하여 주십시오.");
		} else {
			cdCls.setRegId(getUserId());
			cdClsService.insert(cdCls);
			result.put("result", "success");
		}

		return result;
	}
	
	//수정
	@RequestMapping(value="/system/cdCls/update.mng", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> update(HttpServletRequest request, CdCls cdCls) {
		Map<String, Object> result = new HashMap<String, Object>();
		cdCls.setUpdId(getUserId());
		cdClsService.update(cdCls);
		result.put("result", "success");

		return result;
	}
	
	//삭제
	@RequestMapping(value="/system/cdCls/delete.mng", method=RequestMethod.POST)
	@ResponseBody
	public Map<String, Object> delete(HttpServletRequest request, CdCls cdCls) {
		Map<String, Object> result = new HashMap<String, Object>();
		Cd cd = new Cd();
		cd.setCdClsId(cdCls.getCdClsId());
		int cdCnt = cdService.count(cd);
		if (cdCnt > 0) {
			result.put("result", "cntFail");
		} else {
			cdCls.setDelId(getUserId());
			//cdClsService.delete(cdCls);
			result.put("result", "success");
		}

		return result;
	}
}
