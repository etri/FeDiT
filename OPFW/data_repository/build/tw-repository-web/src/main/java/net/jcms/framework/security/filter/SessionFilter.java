package net.jcms.framework.security.filter;

import net.jcms.framework.security.model.User;
import net.jcms.framework.util.StrUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

public class SessionFilter implements Filter
{
	private static final Logger log = LoggerFactory.getLogger(SessionFilter.class);
	private Set<String> excludeUrls = new HashSet<>();

	public void destroy(){
	}
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
		if (log.isDebugEnabled()) {
			log.debug(" SessionFilter  시작 합니다. ");
		}
		HttpServletRequest request = (HttpServletRequest) req;
		HttpServletResponse response = (HttpServletResponse) res;

		HttpSession hs = request.getSession();
		Enumeration<String> enums = request.getAttributeNames();
		
		User user = (User)hs.getAttribute("user");
		String servletPath = ((HttpServletRequest)request).getServletPath().toString();
		boolean isExcluded = excludeUrls.stream().anyMatch(excludeUrl->{
			if(StrUtil.match(excludeUrl, servletPath)){
				return true;
			}
			return false;
		});
//		if (log.isDebugEnabled()) {
//			log.info("@@@@@세션의 속성 정보 출력@@@@@");
//			while (enums.hasMoreElements()) {
//				String  attributeName = enums.nextElement();
//				log.info(attributeName + " : " + hs.getAttribute(attributeName));
//			}
//			if(user != null){
//				log.info("user : " + user);
//				log.info("UserLoginId : " + user.getUserLoginId());
//				log.info("RoleAuth : " + user.getRoleAuth());
//			}
//		}

		if (!isExcluded && user == null) {
			if (log.isDebugEnabled()) { log.debug(" 인증값이 없습니다. "); }
			if (request.getRequestURI().startsWith("/public/user")) {
				response.sendRedirect(request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+request.getContextPath()+"/loginForm.mng"); // 이동할 페이지....
			} else {
				response.sendRedirect(request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+request.getContextPath()+"/login/loginForm.mng"); // 이동할 페이지....
			}
		}else{
			chain.doFilter(req, res);
		}

		if (log.isDebugEnabled()) { log.debug(" SessionFilter  종료 합니다. "); }        
	}
	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		//filterConfig.getInitParameter("loginURL");
		String excludeUrlsString = filterConfig.getInitParameter("excludedUrls");
		if(null!=excludeUrlsString) {
			String[] arraysStr = excludeUrlsString.split(",");
			excludeUrls.clear();
			List<String> trimmedStrings =
				Arrays.stream(arraysStr).map(String::trim).collect(Collectors.toList());
			excludeUrls.addAll(trimmedStrings);
		}
	}



//	public void doFilter(ServletRequest req, ServletResponse res,FilterChain chain) throws IOException, ServletException{
//		HttpServletRequest request = (HttpServletRequest) req;
//		HttpServletResponse response = (HttpServletResponse) res;
//		String url = request.getServletPath();
//
//		if ( urlList.contains(url) ){
//			chain.doFilter(req, res);
//		}else{
//			HttpSession session = request.getSession(false);
//
//			if ( session == null || session.getAttribute("userId") == null )
//			{
//				//System.out.println("## Filter Session Null - " + url);
//				response.sendRedirect("/index.jsp");
//			}
//			else
//			{
//				chain.doFilter(req, res);
//			}
//		}
//	}
//
//	public void init(FilterConfig config) throws ServletException{
//		String urls = config.getInitParameter("avoidUrls");
//		StringTokenizer token = new StringTokenizer(urls, ",");
//
//		urlList = new ArrayList();
//
//		while ( token.hasMoreTokens() ){
//			urlList.add(token.nextToken());
//		}
//	}
}