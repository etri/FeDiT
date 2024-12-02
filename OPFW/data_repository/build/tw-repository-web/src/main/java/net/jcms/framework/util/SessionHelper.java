package net.jcms.framework.util;

import net.jcms.framework.security.model.User;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;


/**
 * 세션 정보 관리
 */
public class SessionHelper {

	/**
	 * 사용자 정보를 읽어 온다.
	 */
	public static User getUser() {
		return (User) RequestContextHolder.getRequestAttributes().getAttribute("user", RequestAttributes.SCOPE_SESSION);
	}
	
    /**
     * attribute 값을 가져 오기 위한 method
     *
     * @param String  attribute key name
     * @return Object attribute obj
     */
	public static Object getSessionAttribute(String name) {
		return RequestContextHolder.getRequestAttributes().getAttribute(name, RequestAttributes.SCOPE_SESSION);
	}
	
    /**
     * attribute 설정 method
     *
     * @param String  attribute key name
     * @param Object  attribute obj
     * @return void
     */
	public static void setSessionAttribute(String name, Object object) {
		RequestContextHolder.getRequestAttributes().setAttribute(name, object,  RequestAttributes.SCOPE_SESSION);
	}
	
    /**
     * 설정한 attribute 삭제
     *
     * @param String  attribute key name
     * @return void
     */
    public static void removeAttribute(String name) {
        RequestContextHolder.getRequestAttributes().removeAttribute(name, RequestAttributes.SCOPE_SESSION);
    }
    
    /**
     * session id
     *
     * @param void
     * @return String SessionId 값
     */
    public static String getSessionId() {
        return RequestContextHolder.getRequestAttributes().getSessionId();
    }
}
