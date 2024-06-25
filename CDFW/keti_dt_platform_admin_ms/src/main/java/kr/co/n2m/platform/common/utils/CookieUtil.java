package kr.co.n2m.platform.common.utils;

import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import kr.co.n2m.platform.common.constant.Constants;

public class CookieUtil {
	
	public boolean setTokenCookie(HttpSession session, Map<String, String> receivedData, HttpServletResponse response) {

		
		Cookie cookie = new Cookie("token", receivedData.get("access_token"));
		cookie.setPath("/");
		cookie.setDomain("localhost");
		String expires = receivedData.get("expires_in");
		String status = receivedData.get("status");
		
		if(StringUtil.isNotNull(expires)) {
			long expiresUnixTime = Long.parseLong(receivedData.get("expires_in"));
			int maxAge = (int) (expiresUnixTime - (System.currentTimeMillis() / 1000));
			cookie.setMaxAge(maxAge);
			response.addCookie(cookie);
			
			response.setStatus(Integer.parseInt(receivedData.get("status")));
			return true;
		}
		if(status.equals("403")) {
		    session.invalidate();
			return false;
		}
		return false;
	}

}
