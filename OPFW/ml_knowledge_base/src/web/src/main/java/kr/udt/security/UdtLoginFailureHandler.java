package kr.udt.security;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

/**
 * @설명 : UDT 관리자웹 스프링 시큐리티 로그인실패 핸들러
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 10. 23
 * @비고 : 스프링에서 정의된 익셉션에 따라 errormsg를 정의, 리퀘스트객체에 담아 로그인페이지로 포워딩한다
 * 		    이후 로그인 페이지에서는 errormsg 있을 경우 alert으로 표시한다. 
 *        보면 알겠지만, 아직 비동기 login 요청에 대한 실패처리는 작성하지 않았고 form을 이용한 로그인시에만 동작하는 핸들러이다. 
 */
public class UdtLoginFailureHandler implements AuthenticationFailureHandler {
	
	private static final Logger LOGGER = LoggerFactory.getLogger(UdtLoginFailureHandler.class);

	String defaultFailureUrl="/loginPage.do";
	@Override
	public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException e) throws IOException, ServletException {
		String errormsg="알 수 없는 이유로 로그인에 실패하였습니다. 관리자에게 문의하세요.";
		 if(e instanceof BadCredentialsException) {
	          errormsg = "아이디나 비밀번호가 맞지 않습니다. 다시 확인해주세요.";
	     } else if(e instanceof InternalAuthenticationServiceException) {
	    	 errormsg = "아이디나 비밀번호가 맞지 않습니다. 다시 확인해주세요.";
	     } else if(e instanceof DisabledException) {
	          errormsg = "계정이 비활성화되었습니다. 관리자에게 문의하세요.";
	     } else if(e instanceof CredentialsExpiredException) {
	    	  errormsg = "비밀번호 유효기간이 만료 되었습니다. 관리자에게 문의하세요.";
	     }
		 
		 request.setAttribute("failCause", errormsg);
		 request.getRequestDispatcher(defaultFailureUrl).forward(request, response);
		
	}
 
 
 
}

