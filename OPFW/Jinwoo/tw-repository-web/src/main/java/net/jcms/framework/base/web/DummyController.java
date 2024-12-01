package net.jcms.framework.base.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class DummyController {

	@RequestMapping ("/{step1}/{step2}/{step3}.mng")
	public String forward (@PathVariable String step1, @PathVariable String step2, @PathVariable String step3) {
		return step1 + "/" + step2 + "/" + step3;
	}
}
