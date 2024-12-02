package kr.udt.security;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;

/**
 * @설명 : 권한없는 페지이 접근시 동작하는 핸들러
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2021. 10. 23
 * @비고 : 아직 싸이트에 권한에 따른 페이지 접근이 없기에 동작하는 정도로만 만들고 상세한부분은 구현하지 않았다.
 *        참고로 security.xml에  인터셉터 롤 설정 url들은 기본적으로 로그인 자체를 하지 않았다면 302를 리턴하고 로그인 페이지로 간다.
 */
public class UdtUserDeniedHandler implements AccessDeniedHandler {

	private String errorPage = "/WEB-INF/jsp/login/loginPage.jsp";
	
	private static final Logger logger = LoggerFactory.getLogger(UdtUserDeniedHandler.class);
	@Override
	public void handle(HttpServletRequest req, HttpServletResponse res,AccessDeniedException ade) throws IOException, ServletException {
		// TODO Auto-generated method stub
		
		//csrf 토큰값 없을 경우에도 해당 메서드가 호출됌 
		
		String ajaxHeader = req.getHeader("X-Ajax-call");
		String result = "";

		res.setStatus(HttpServletResponse.SC_FORBIDDEN);
		res.setCharacterEncoding("UTF-8");
		
		logger.info("[권한없는 메뉴에 접근하였습니다.]");
		logger.info("LocalizedMessage : {}",ade.getLocalizedMessage());
		logger.info("Message : {}",ade.getMessage());
		logger.info("StackTrace : {}",ade.getStackTrace());
	
	    req.setAttribute("errMsg","접근 권한이 없습니다.");
		req.getRequestDispatcher("/WEB-INF/jsp/login/alertPage.jsp").forward(req, res);
		
	}
	public void setErrorPage(String errorPage) {
		if ((errorPage != null) && !errorPage.startsWith("/")) {
			throw new IllegalArgumentException("errorPage must begin with '/'");
		}
		this.errorPage = errorPage;
	}



}
