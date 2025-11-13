package kr.co.n2m.platform.meta.architecture.util;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import kr.co.n2m.platform.meta.architecture.code.Constant;

/**
 * TokenUtil
 * 
 * @author  n2m
 */
public class TokenUtil {
	
	public static Map<String,String> setAccessToken(HttpServletRequest request, String url) throws IOException {
		
		String method = "POST";
		String refreshToken =  SessionUtil.getSessionAttr(Constant.SESSION_ATTR_TOKEN);
		
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
