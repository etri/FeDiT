package net.jcms.framework.weblog.interceptor;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.menu.service.MenuService;
import net.jcms.framework.security.model.User;
import net.jcms.framework.util.HttpUtil;
import net.jcms.framework.weblog.model.WebLog;
import net.jcms.framework.weblog.service.WebLogService;
import org.apache.commons.lang3.ArrayUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.mvc.WebContentInterceptor;

import javax.annotation.Resource;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.Enumeration;

@Slf4j
public class WebLogInterceptor extends WebContentInterceptor {

//	@Autowired
//	private MenuService menuSvc;
	
	@Resource (name="webLogService")
	private WebLogService webLogService;
	
	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws ServletException {
		try {
			
			WebLog webLog = new WebLog();
			
			HttpSession session = request.getSession();
			webLog.getLoginLog ().setLoginLogId((Long) session.getAttribute("loginLogId"));
	    	webLog.setReqUrl(request.getServletPath().replace("/system/", ""));
	    	String[] reqUrl = webLog.getReqUrl().split("/");
	    	
//	    	String url = request.getServletPath();
//	    	Long uid = ((User)session.getAttribute("user")).getUserId();
	    	
	    	if(reqUrl[reqUrl.length-1].equals("list.mng") && request.getMethod().equals("GET")){
	    	}
	    	else{
	            Enumeration<String> paramNames = request.getParameterNames ();
	            StringBuilder sb = new StringBuilder (1000);
	            while (paramNames.hasMoreElements ()) {
	            	String paramName = paramNames.nextElement();
	            	String[] paramValues = request.getParameterValues (paramName);
	            	if("search[regex]".equals(paramName)){
	            		sb.delete(0,sb.length()+1);
	            	}
	            	else if("userPwd".equals(paramName)){
	            	}
	            	else if(!ArrayUtils.isEmpty (paramValues)) {
	            		sb.append (paramName).append (":");
	            		for (String paramValue : paramValues) {
	            			sb.append (paramValue).append (",");
	            		}
	            	}
	            }
	            if(sb.length() > 0)
	            	webLog.setReqParam(sb.substring(0, sb.length()-1));
	            else
	            	webLog.setReqParam("");
	            webLog.setReqMthd(request.getMethod());
	            webLog.setReqTp("S");
	            webLog.setReqIp(HttpUtil.getClientIp(request));
	            webLogService.insert(webLog);
	    	}
			// 이부분 뭐하는건지 모르겠음
//			String userRole = (session.getAttribute("userRole")).toString();
//            if( false == (userRole != null && userRole.equals(CodeValue.ROLE_AUTH.ROLE_SYSTEM.toString()))
//					&& uid!=1
//					&& menuSvc.checkUrlAuth(url)==false) {
//            	String ext = Menu.getUrlExt(url);
//            	if(ext.equals(".json")) {
//            		response.setContentType("application/json");
//            		PrintWriter out = response.getWriter();
//            		String msg = "{ result:'file', message: '사용권한이 없습니다.' }";
//            		out.print(msg);
//            		out.flush();
//            	} else {
//            		response.sendRedirect("/error/error.mng?errorCode=401");
//            	}
//            	return false;
//            }
		}catch(Exception e) {
			StackTraceElement cth = Thread.currentThread().getStackTrace()[1];
			log.error("오류발생 >> 파일명: " + cth.getFileName() + ", 함수명: "+cth.getMethodName()+", 줄수: "+cth.getLineNumber());
			return false;
		}
		return true;
	}
}

