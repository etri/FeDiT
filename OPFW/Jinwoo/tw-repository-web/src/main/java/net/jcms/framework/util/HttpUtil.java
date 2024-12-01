package net.jcms.framework.util;

import javax.servlet.http.HttpServletRequest;

public class HttpUtil {

	/**
	 * 접속 아이디를 얻어온다.
	 */
	public static String getClientIp(HttpServletRequest request) {

		String clientIp = request.getHeader("X-Forwarded-For");
		if (clientIp == null || clientIp.length() == 0 || "unknown".equalsIgnoreCase(clientIp)) {  
		    clientIp = request.getHeader("Proxy-Client-IP");  
		}  
		if (clientIp == null || clientIp.length() == 0 || "unknown".equalsIgnoreCase(clientIp)) {  
		    clientIp = request.getHeader("WL-Proxy-Client-IP");  
		}  
		if (clientIp == null || clientIp.length() == 0 || "unknown".equalsIgnoreCase(clientIp)) {  
		    clientIp = request.getHeader("HTTP_CLIENT_IP");  
		}  
		if (clientIp == null || clientIp.length() == 0 || "unknown".equalsIgnoreCase(clientIp)) {  
		    clientIp = request.getHeader("HTTP_X_FORWARDED_FOR");  
		}  
		if (clientIp == null || clientIp.length() == 0 || "unknown".equalsIgnoreCase(clientIp)) {  
		    clientIp = request.getRemoteAddr();  
		}
		return clientIp;
		
		/*
		String clientIp = request.getHeader("HTTP_X_FORWARDED_FOR");
		if(null == clientIp || clientIp.length() == 0 || clientIp.toLowerCase().equals("unknown")){
			clientIp = request.getHeader("REMOTE_ADDR");
		}

		if(null == clientIp || clientIp.length() == 0 || clientIp.toLowerCase().equals("unknown")){
			clientIp = request.getRemoteAddr();
		}
		return clientIp;
		*/
	}
	
	public static String getDomain(HttpServletRequest request) {
		String domain = request.getServerName();
		if(request.getServerPort() != 80) {
			domain += ":"+request.getServerPort();
		}
		return domain;
	}
}
