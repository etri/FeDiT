package net.jcms.main.web;

import net.jcms.framework.base.web.BaseController;
import net.jcms.framework.cd.service.CdDtlService;
import net.jcms.framework.file.service.FileItemService;
import net.jcms.framework.security.model.User;
import net.jw.twin.repository.config.MessageSourceUtil;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.global.FrontGlobal;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class MainController extends BaseController {

	@Resource(name="cdDtlService")
	CdDtlService cdDtlService;

	@Resource (name="fileItemService")
	private FileItemService fileItemService;

	@RequestMapping("/user/index.mng")
	public String systemIndex (Model model) throws IOException {
		String msg = MessageSourceUtil.getMessage("test.msg");

		model.addAttribute("name", "name");
		model.addAttribute("msg", msg);

		return "system/main";
	}

	@RequestMapping ("/user/main.mng")
	public String systemMain () {
		return "system/main";
	}
	
	@RequestMapping ("/system/init.mng")
	public String systemInit () {
		return "system/main";
	}

	@RequestMapping ("/system/index.mng")
	public String systemIndex () {
		return "redirect:" + "/system/collector/monitor.mng?currentMenuId=1011";
	}
}
