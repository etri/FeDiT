package kr.co.n2m.platform.common.utils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class SessionUtil {

	public static String getSessionAttr(String key) {
	    return getSessionAttr(key, "");
	}
	
	public static String getSessionAttr(String key, String defaultStr) {
        HttpServletRequest req = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        HttpSession session = req.getSession();
        if (session != null && session.getAttribute(key) != null) {
            String attrValue = session.getAttribute(key).toString();
            return StringUtil.isNotEmpty(attrValue) ? attrValue : defaultStr;
        }
        return defaultStr;
    }
}
