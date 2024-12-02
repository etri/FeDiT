package net.jcms.framework.interceptor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.mvc.WebContentInterceptor;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


@Slf4j
public class Init extends WebContentInterceptor {

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws ServletException {
		try {
			
		}catch(RuntimeException e) {
			StackTraceElement cth = Thread.currentThread().getStackTrace()[1];
			log.error("오류발생 >> 파일명: " + cth.getFileName() + ", 함수명: "+cth.getMethodName()+", 줄수: "+cth.getLineNumber());
			return false;
		}
		return true;
	}
	
}
