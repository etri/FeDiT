package kr.udt.security.web;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * @설명 :  UDT 관리자웹 로그인 컨트롤러(Spring security 사용)
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 10. 23
 * @비고 :  
 */
@Controller
public class LoginController {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(LoginController.class);

	@RequestMapping(value="/loginPage.do")
	public String loginPage() throws IOException{
		return "login/loginPage";
	}
	
	@RequestMapping(value="/udt/main.do")
	public String mainPage(ModelMap model) throws IOException{
		model.addAttribute("menuNo", "menu-li-1");
		return "udt/data/dashBoard";
	}
	
	
}