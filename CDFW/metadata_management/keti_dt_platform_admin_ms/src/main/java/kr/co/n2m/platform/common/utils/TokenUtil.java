package kr.co.n2m.platform.common.utils;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;

import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.OauthProperty;
import net.bytebuddy.implementation.bytecode.Throw;

public class TokenUtil {
	
	public static Map<String,String> setAccessToken(HttpServletRequest request, String url) throws IOException {
		
		
		String method = "POST";
		HttpSession session = request.getSession(false);
		String refreshToken =  SessionUtil.getSessionAttr(Constants.SESSION_ATTR_TOKEN);
		
		Map<String,String> bodyMap = new HashMap<>();
		bodyMap.put("grant_type", "refresh_token");
		bodyMap.put("refresh_token", refreshToken);

		Map<String, String> headers = Collections.list(request.getHeaderNames())
			    .stream()
			    .collect(Collectors.toMap(h -> h, request::getHeader));
		
		String authId = headers.get("authorization");
		
		if(authId.equals(null)) {
			throw new IOException();
		}
		HttpRequestUtil httpRequest = new HttpRequestUtil();
		return httpRequest.sendHttpPostRequest(url, method, bodyMap, authId);
	}

}
