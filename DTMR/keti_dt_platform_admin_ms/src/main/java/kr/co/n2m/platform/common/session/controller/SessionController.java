package kr.co.n2m.platform.common.session.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.OauthProperty;
import kr.co.n2m.platform.common.utils.CookieUtil;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.StringUtil;
import kr.co.n2m.platform.common.utils.TokenUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
public class SessionController {

	@Autowired
	OauthProperty property;
	
	@PostMapping(value = "/session/login")
	public ResponseEntity<Object> loginSession (HttpServletRequest request, @RequestBody(required = true) Map<String, Object> params){
		
		HttpSession session = request.getSession();
	    session.setAttribute(Constants.SESSION_ATTR_TOKEN, params.get("refreshToken"));
	    session.setAttribute(Constants.SESSION_ATTR_TOKEN_EXPIRES, params.get("refreshExpires"));
	    session.setAttribute(Constants.SESSION_ATTR_USER_ID, params.get("userId"));
	    session.setAttribute(Constants.SESSION_ATTR_USER_NM, params.get("userNm"));
	    
	    return new ResponseEntity<Object>(null, null, HttpStatus.OK);
	}
	
	@GetMapping(value = "/session/hasRefreshToken")
	public ResponseEntity<Boolean> hasRefreshToken (HttpServletRequest request) throws IOException{
		//refresh token이 있는지 체크
		HttpSession session = request.getSession();

		boolean hasRefreshToken = false;
		try {
			hasRefreshToken = checkTokenExpiration(session);
			
			return new ResponseEntity<Boolean>(hasRefreshToken, null, HttpStatus.OK);
		}catch (Exception e) {
			log.error("", e.getMessage());
			return new ResponseEntity<Boolean>(hasRefreshToken, null, HttpStatus.OK);
		}
		
	}

	@GetMapping(value = "/session/getAccessTokenCookie")
	public ResponseEntity<Map<String, String>> getAceessTokenCookie (HttpServletRequest request, HttpServletResponse response) {
		Map<String, String> receivedData = new HashMap<>();
		receivedData = null;
		
		boolean hasRefreshToken;
		HttpSession session = request.getSession();
		
		try {
			
			hasRefreshToken = checkTokenExpiration(session);
			
			if(hasRefreshToken) {
				
				receivedData = TokenUtil.setAccessToken(request, property.getAccessToken());
				CookieUtil cookieUtil = new CookieUtil();
				if(cookieUtil.setTokenCookie(session, receivedData, response)) {
					return new ResponseEntity<Map<String, String>>(receivedData, null, HttpStatus.OK);
				}
				
			}
			
			return new ResponseEntity<Map<String, String>>(null, null, HttpStatus.UNAUTHORIZED);
			
		} catch (IOException e) {
			log.error("", e.getMessage());
			return new ResponseEntity<Map<String, String>>(null, null, HttpStatus.UNAUTHORIZED);
		}
	}
	
	@DeleteMapping(value = "/session/logout")
	public ResponseEntity<Object> logoutSession (HttpServletRequest request){
		HttpSession session = request.getSession();
		try {
			session = request.getSession();
			session.invalidate();
		} catch (IllegalStateException e) {
			log.error("", e.getMessage());
			throw e;
		}
		
		return new ResponseEntity<Object>(HttpStatus.NO_CONTENT);
	}
	
	private boolean checkTokenExpiration(HttpSession session) {
		// TODO refresh token 만료여부 확인
		try {
			
			String strExpires = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_TOKEN_EXPIRES);
			if(strExpires == null || strExpires == "") {
				return false;
			}
			long expires = (Long.parseLong(strExpires)) * 1000L;
			long cutTime = System.currentTimeMillis();
			
			if(!StringUtil.isEmpty(Constants.SESSION_ATTR_TOKEN) 
					 && expires > cutTime) {
				return true;
			} 
			
			return false;
		}catch (Exception e) {
			log.error("", e.getMessage());
			return false;
		}
	}
	
}
