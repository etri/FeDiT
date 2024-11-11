package net.jcms.main.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class WindowController {

	@RequestMapping ("/system/window/icons.mng")
	public String icons() {
		return "system/window/icons";
	}
	
}
