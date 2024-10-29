/*******************************************************************************
 * 파일명 : AuthUtil.java
 * 작성자 : (주)엔투엠, heenim
 * 작성일자 : 2022. 07. 18.
 *
 * 클래스 개요:
 * =============================================================================
 * 수정내역
 * NO   수정일자         수정자     수정내역  
 * =============================================================================
 */
package kr.co.n2m.platform.meta.architecture.util;

import javax.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;

/**
 * AuthUtil
 * 
 * @author  n2m
 */
@Component
public class AuthUtil {
	
	public static final String ROLE_SYSADMIN = "AUT_META_SYSADMIN";
	public static final String ROLE_DEFAULT  = "AUT_META_DEFAULT" ;
	
	public static String getClientIpAddr(HttpServletRequest request) {
	    String ip = request.getHeader("X-Forwarded-For");
	 
	    if(ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
	        ip = request.getHeader("Proxy-Client-IP");
	    }
	    if(ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
	        ip = request.getHeader("WL-Proxy-Client-IP");
	    }
	    if(ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
	        ip = request.getHeader("HTTP_CLIENT_IP");
	    }
	    if(ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
	        ip = request.getHeader("HTTP_X_FORWARDED_FOR");
	    }
	    if(ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
	        ip = request.getRemoteAddr();
	    }
	 
	    return ip;
	}
	
	/**
	 * 현재 HttpServletRequest 리퀘스트 객체 가져오기.
	 * @return HttpServletRequest
	 */
	public static HttpServletRequest getCurrentHttpServletRequest() {
		HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
		return request;
	}
	
	/**
	 * 현재 서버 경로 가져오기. <br>
	 * ( http://localhost:6997/meta/api/v1/resource/dts?curPage=1 -> http://localhost:6997/meta )
	 * @return 
	 */
	public static String getServerPath() {
		HttpServletRequest request = getCurrentHttpServletRequest();
		
        StringBuilder path = new StringBuilder();
        String scheme = request.getScheme();
        int port = request.getServerPort();
        if (port < 0) {
            port = 80;
        }

        path.append(scheme);
        path.append("://");
        path.append(request.getServerName());
        if ((scheme.equals("http") && (port != 80))
            || (scheme.equals("https") && (port != 443))) {
        	path.append(':');
        	path.append(port);
        }
        path.append(request.getContextPath());
        return path.toString();
	}
	
	/**
	 * 로그인 사용자 정보를 Request 속성에 넣기
	 * @param loginUserVo
	 */
	public static void setLoginUserVoToRequest(LoginUserVo loginUserVo) {
		if (RequestContextHolder.getRequestAttributes() == null) throw new RuntimeException("Request context is null!");
		RequestContextHolder.getRequestAttributes().setAttribute("loginUserVo", loginUserVo, RequestAttributes.SCOPE_REQUEST);
	}

	/**
	 * 로그인 사용자 정보를 Request 속성에서 가져오기
	 * @return LoginUserVo
	 */
	public static LoginUserVo getLoginUserVoFromRequest() {
		if (RequestContextHolder.getRequestAttributes() == null) return null;
        return (LoginUserVo) RequestContextHolder.getRequestAttributes().getAttribute("loginUserVo", RequestAttributes.SCOPE_REQUEST);
	}
	
	/**
	 * 로그인 사용자 ID를 Request 속성에서 가져오기
	 * @return
	 */
	public static String getLoginUserId() {
		LoginUserVo loginUserVo = getLoginUserVoFromRequest();
		if (loginUserVo != null) {
			return loginUserVo.getUserId();
		} else {
			return "";
		}
	}
	
	/**
	 * 로그인 사용자 (Request 속성)의 시스템관리자 여부를 반환 
	 * @return
	 */
	public static boolean isSystemAdmin() {
		LoginUserVo loginUserVo = getLoginUserVoFromRequest();
		if (loginUserVo != null) {
			return loginUserVo.getRoleList().contains(ROLE_SYSADMIN);
		} else {
			return false;
		}
	}
	
	/**
	 * 로그인 사용자 (Request 속성)가 특정 역할을 가지고 있는지 여부를 반환
	 * @param roleId
	 * @return
	 */
	public static boolean hasRole(String roleId) {
		LoginUserVo loginUserVo = getLoginUserVoFromRequest();
		if (loginUserVo != null) {
			return loginUserVo.getRoleList().contains(roleId);
		} else {
			return false;
		}
	}
	
}


