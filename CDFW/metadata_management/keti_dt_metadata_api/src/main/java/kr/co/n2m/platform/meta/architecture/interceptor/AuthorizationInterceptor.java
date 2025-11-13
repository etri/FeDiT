package kr.co.n2m.platform.meta.architecture.interceptor;

import java.security.PublicKey;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.AsyncHandlerInterceptor;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.UnsupportedJwtException;
import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.domain.LoginUserVo;
import kr.co.n2m.platform.meta.architecture.property.AuthorizationProperty;
import kr.co.n2m.platform.meta.architecture.property.OauthProperty;
import kr.co.n2m.platform.meta.architecture.property.SecurityProperty;
import kr.co.n2m.platform.meta.architecture.util.AuthUtil;
import kr.co.n2m.platform.meta.architecture.util.CacheServiceUtil;
import kr.co.n2m.platform.meta.architecture.util.CookieUtil;
import kr.co.n2m.platform.meta.architecture.util.SessionUtil;
import kr.co.n2m.platform.meta.architecture.util.TokenUtil;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonAuthDto;
import kr.co.n2m.platform.meta.portal.commondata.domain.CommonSearchVo;
import kr.co.n2m.platform.meta.portal.commondata.service.CommonDataService;
import kr.co.n2m.platform.meta.portal.pat.domain.PatCacheVo;
import kr.co.n2m.platform.meta.portal.pat.service.PatService;
import lombok.extern.slf4j.Slf4j;

/**
 * API 권한 Interceptor
 * 
 * @author  n2m
 */
@Slf4j
@Component
public class AuthorizationInterceptor implements AsyncHandlerInterceptor {
	
	@Autowired
	private CacheServiceUtil cache;
	
	@Autowired
	private OauthProperty property;
	
	@Autowired
	private SecurityProperty securityProperty;
	
	@Autowired
	private AuthorizationProperty authProperty;
	
	@Autowired
	private CommonDataService commonDataService;
	
	@Autowired
	private PatService patService;
	
	SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		
		String requestUri = request.getRequestURI();
		log.debug("requestURI : " + requestUri);
		
		String clientIP = AuthUtil.getClientIpAddr(request);
		log.debug("clientIP : " + clientIP);

		if (this.isPublicUri(request)) {
			log.debug(String.format("[HISTORY] ==> {\"method\":\"%s\",\"url\":\"%s\",\"requestor\":\"%s%s\",\"remote_ip\":\"%s\"}", request.getMethod(), request.getRequestURL(), "guest-", request.getRequestedSessionId(), clientIP));
			return true;
		}

		String token = request.getHeader(Constant.AUTHTOKEN_HEADER);
		HttpSession session = request.getSession(false);
		
		if (token == null) {
			
			//401에러
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			log.warn("401 token null!");	
			return false;
			
		} else if (token.startsWith("Basic ")) {
			
			// 인증 토큰 없음
			//session에 refreshToken이 있을 때 access token발급 후 전달해주기.
			if(session != null) {
				if(SessionUtil.getSessionAttr(Constant.SESSION_ATTR_TOKEN) != null) {
					Map<String,String> receivedData = TokenUtil.setAccessToken(request, property.getAccessToken());
					
					CookieUtil cookieUtil = new CookieUtil();
					if(! cookieUtil.setTokenCookie(session, receivedData, response)) {
						response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
						log.warn("401 Basic cookieUtil false!");
						return false;
					}
				}
			} else {
				//401에러
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				log.warn("401 Basic session null!");	
				return false;
			}
			
		} else {
			String jwtData = token
				.replaceFirst("(?i)^\\s*Bearer\\s+", "") // 앞쪽의 Bearer + 임의 공백 제거(대소문자 무시)
				.trim();
			
			PublicKey publicKey = cache.getPublicKey(property.getPublicKey());
			Claims claim = null;
			try {
				
				// 1. 사용자 인증인가 토큰 - 토큰검증 파싱
				claim = Jwts.parserBuilder().setSigningKey(publicKey).build().parseClaimsJws(jwtData).getBody();

		    } catch(UnsupportedJwtException e) {        
		    	
		    	// 2. 이 서버에서 발행한 PAT (개인 액세스 토큰) - 메타데이터 시스템 간 인터페이스 용으로 사용.
		    	/* 토큰 파싱 중 UnsupportedJwtException에 걸린 경우, PAT일 수 있으므로 한번 더 파싱하고 체크함 --START */
		    	try {
		    		claim = Jwts.parserBuilder().setSigningKey(securityProperty.getSecretKey()).build().parseClaimsJws(jwtData).getBody();
		    		String patkId = claim.getSubject().toString();
		    		
		    		PatCacheVo cacheVo = patService.getPatCache(patkId);
 		    		if(cacheVo == null) {
		    			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
						log.warn("401 Unauthorized : Could not find the token value in DB");
						return false;
		    		}
 		    		
 		    		Date now = new Date();
 		    		String nowStr = formatter.format(now);
 		    		if(StringUtils.isEmpty(cacheVo.getPatCacheInqDate()) || !nowStr.equals(cacheVo.getPatCacheInqDate())) {
 		    			patService.removePatCache(patkId);
 		    			cacheVo = patService.getPatCache(patkId);
 	 		    		if(cacheVo == null) {
 			    			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
 							log.warn("401 Unauthorized : Could not find the token value in DB");
 							return false;
 			    		}
 		    		}
		    		
		    	} catch(ExpiredJwtException e2) {
		    		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					log.warn("401 ExpiredJwtException : ", e2.getMessage());
					return false;
					
			    } catch(JwtException e2) {        
			        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			        log.warn("401 JwtException : ", e2.getMessage());
			        return false;
			        
			    } 
		    	
		    	// 인증 성공
				
				/* 권한(역할)
				    AUT_META_SYSADMIN		시스템 관리자
					AUT_META_DATADMIN		메타데이터 관리자
					AUT_META_DATPUBLISHER	메타데이터 제공자
					AUT_META_DATVIEWER		메타데이터 조회자
					AUT_META_DEFAULT		메타데이터 기본사용자 (로그인만 하면 기본적으로 주어지는 권한)
				 */
				String loginUserId = claim.get("patkRegrId").toString();
				String loginUserNm = claim.get("patkRegrNm").toString();
				List<String> roleList = new ArrayList<String>();
				if (Boolean.parseBoolean(authProperty.getDefaultAuthUseFlag())) {
					authProperty.getDefaultAuthList().forEach(str -> roleList.add(str)); // 기본 권한
				}
				
				roleList.add("AUT_META_DATADMIN"); // FIXME 2024-02-15 PAT 경우는 우선 [메타데이터 관리자] 권한을 준다.
				
				LoginUserVo loginUserVo = new LoginUserVo();
				loginUserVo.setUserId(loginUserId);
				loginUserVo.setUserNm(loginUserNm);
				loginUserVo.setRoleList(roleList);
				
				AuthUtil.setLoginUserVoToRequest(loginUserVo);
				
				log.debug(String.format("[HISTORY] ==> {\"method\":\"%s\",\"url\":\"%s\",\"requestor\":\"%s\",\"remote_ip\":\"%s\"}", request.getMethod(), request.getRequestURL(), loginUserVo.getUserId(), clientIP));
		    	
				return true;
				/* 토큰 파싱 중 UnsupportedJwtException에 걸린 경우, PAT일 수 있으므로 한번 더 파싱하고 체크함 --END */
		    	
		    } catch(ExpiredJwtException e) {
		    	if(session != null) {
		    		if(SessionUtil.getSessionAttr(Constant.SESSION_ATTR_TOKEN) != null) {
						Map<String,String> receivedData = TokenUtil.setAccessToken(request, property.getAccessToken());
						
						CookieUtil cookieUtil = new CookieUtil();
						if(! cookieUtil.setTokenCookie(session, receivedData, response)) {
							response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
							log.warn("401 ExpiredJwtException cookieUtil false : ", e.getMessage());
						}
					}
		    	} else {
					response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					log.warn("401 ExpiredJwtException session null : ", e.getMessage());
					return false;
				}
				
		    } catch(JwtException e) {        
		        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		        log.warn("401 JwtException : ", e.getMessage());
		        return false;
		    } 
			
			// 인증 성공
			
			/* 권한(역할)
			    AUT_META_SYSADMIN		시스템 관리자
				AUT_META_DATADMIN		메타데이터 관리자
				AUT_META_DATPUBLISHER	메타데이터 제공자
				AUT_META_DATVIEWER		메타데이터 조회자
				AUT_META_DEFAULT		메타데이터 기본사용자 (로그인만 하면 기본적으로 주어지는 권한)
			 */
			String loginUserId = claim.get(Constant.SESSION_ATTR_USER_ID).toString();
			String loginUserNm = claim.get(Constant.SESSION_ATTR_USER_NM).toString();
			List<String> roleList = new ArrayList<String>();
			if (Boolean.parseBoolean(authProperty.getDefaultAuthUseFlag())) {
				authProperty.getDefaultAuthList().forEach(str -> roleList.add(str)); // 기본 권한
			}
			
			CommonSearchVo authSearchVo = new CommonSearchVo();
			authSearchVo.setUserId(loginUserId);
			List<CommonAuthDto> authList = commonDataService.getMyAuthList(authSearchVo, token);
//			List<CommonAuthDto> authList = commonDataService.getMyAuthList(authSearchVo);
			if (authList != null && authList.size() > 0) {
				for (CommonAuthDto tDto : authList) {
					roleList.add(tDto.getAutOid());
				}
			}
			
			LoginUserVo loginUserVo = new LoginUserVo();
			loginUserVo.setUserId(loginUserId);
			loginUserVo.setUserNm(loginUserNm);
			loginUserVo.setRoleList(roleList);
			
			AuthUtil.setLoginUserVoToRequest(loginUserVo);
			
			log.debug(String.format("[HISTORY] ==> {\"method\":\"%s\",\"url\":\"%s\",\"requestor\":\"%s\",\"remote_ip\":\"%s\"}", request.getMethod(), request.getRequestURL(), loginUserVo.getUserId(), clientIP));
			
			// 인가 체크
			boolean check = Boolean.parseBoolean(authProperty.getAuthorization());
			if (check) {
				boolean checkAuth = commonDataService.checkAuthorization(request.getRequestURI(), request.getMethod(), token);
//				boolean checkAuth = commonDataService.checkAuthorization(request.getRequestURI(), request.getMethod(), roleList);
				log.debug("{} {} {} : authorization = {}", loginUserVo.getUserId(), request.getMethod(), request.getRequestURI(), checkAuth);
				if (!checkAuth) {
					response.setStatus(HttpServletResponse.SC_FORBIDDEN);
					return false;
				}
			}			
			
		}
		
		return true;
	}

	private boolean isPublicUri(HttpServletRequest request) {
		if (request.getMethod().equals("GET") && request.getServletPath().startsWith("/api/v1/public/")) return true;
		else return false;
	}

}
