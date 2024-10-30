package net.jcms.framework.security.filter;

import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@Slf4j
public class SpringSecurityAjaxFilter implements Filter {
	private FilterConfig filterConfig;

	@Setter
	private List<String> excludedUrls;

	private static final Logger logger = LoggerFactory.getLogger(SpringSecurityAjaxFilter.class);
	private String ajaxHeader;
    public SpringSecurityAjaxFilter() {
    }

	public void init(FilterConfig filterConfig) throws ServletException {
		this.filterConfig = filterConfig;
	}

	public String getAjaxHeader() {
		return ajaxHeader;
	}

	public void setAjaxHeader(String ajaxHeader) {
		this.ajaxHeader = ajaxHeader;
	}


	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
	      HttpServletRequest req = (HttpServletRequest) request;
	      HttpServletResponse res = (HttpServletResponse) response;
	      if (isAjaxRequest(req)) {
	          try {
				  boolean isExcluded = excludedUrls.stream().anyMatch( excludedUrl->{
					  if(req.getServletPath().contains(excludedUrl)){
						  return true;
					  }
					  return false;
				  });

				  if(!isExcluded) {
					  if (req.getSession().getAttribute("user") == null) {
						  StackTraceElement cth = Thread.currentThread().getStackTrace()[1];
						  log.error("오류발생 >> 파일명: " + cth.getFileName() + ", 함수명: "+cth.getMethodName()+", 줄수: "+cth.getLineNumber());
						  res.sendError(HttpServletResponse.SC_FORBIDDEN);
					  }
				  }

				  chain.doFilter(req, res);
	          } catch (AccessDeniedException e) {
				StackTraceElement cth = Thread.currentThread().getStackTrace()[1];
				log.error("오류발생 >> 파일명: " + cth.getFileName() + ", 함수명: "+cth.getMethodName()+", 줄수: "+cth.getLineNumber());
				res.sendError(HttpServletResponse.SC_FORBIDDEN);
	          } catch (AuthenticationException e) {
				StackTraceElement cth = Thread.currentThread().getStackTrace()[1];
				log.error("오류발생 >> 파일명: " + cth.getFileName() + ", 함수명: "+cth.getMethodName()+", 줄수: "+cth.getLineNumber());
				res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
	          }
	     }else{
	          chain.doFilter(req, res);
	     }

	}

	private boolean isAjaxRequest(HttpServletRequest req) {

        return req.getHeader(ajaxHeader) != null && req.getHeader(ajaxHeader).equals(Boolean.TRUE.toString());
	}

	public void destroy() {
	}
}

