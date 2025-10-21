package kr.co.n2m.platform.common.interceptor;

import java.security.PublicKey;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import kr.co.n2m.platform.admin.feature.auth.service.AuthService;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.property.AuthorizationProperty;
import kr.co.n2m.platform.common.property.OauthProperty;
import kr.co.n2m.platform.common.utils.CacheServiceUtil;
import kr.co.n2m.platform.common.utils.CookieUtil;
import kr.co.n2m.platform.common.utils.SessionUtil;
import kr.co.n2m.platform.common.utils.TokenUtil;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CommonHandlerInterceptor implements HandlerInterceptor {

	@Autowired
	private CacheServiceUtil cache;
	
	@Autowired
	private OauthProperty property;
	
	@Autowired
	private AuthorizationProperty authProperty;
	
	@Autowired
	private AuthService authService;
	
    private static final String MDC_KEY = "requestId";
    private static final String HDR = "X-Request-Id";
	
	@Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		// 추적용 requestId
        String requestId = request.getHeader(HDR);
        if (requestId == null || requestId.isEmpty()) {
        	requestId = UUID.randomUUID().toString();
        }
        MDC.put(MDC_KEY, requestId);
        response.setHeader(HDR, requestId);
		
		String clientIP = getClientIpAddr(request);
		String token = request.getHeader(Constants.AUTHTOKEN_HEADER);
		HttpSession session = request.getSession(false);
			
		 String requestURI = request.getRequestURI();

        if (requestURI.startsWith("/admin/session")) {
        	return true;
        }
        
        if (requestURI.startsWith("/admin/platform") && request.getMethod().equals("GET")) {
            return true;
        }

		if (token == null) {
			// 401 에러
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			log.warn("401 token null!");
			return false;

		} else if (token.startsWith("Basic ")) {
			// 인증 토큰 없음
			//session에 refreshToken이 있을 때 access token발급 후 전달해주기.
			if(session != null) {
				if(SessionUtil.getSessionAttr(Constants.SESSION_ATTR_TOKEN) != null) {
					Map<String,String> receivedData = TokenUtil.setAccessToken(request, property.getAccessToken());
					
					CookieUtil cookieUtil = new CookieUtil();
					if(! cookieUtil.setTokenCookie(session, receivedData, response)) {
						response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					}
					
				}
			}
			else {
				// 401 에러
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				return false;
			}
		} else {
			//Bearer 제외한 token정보 빼내기
			String[] jwtDataArr = token.split(" ");
			String jwtData = jwtDataArr[1]; 
			
			//캐시에 public key가 없으면 생성, 있으면 생성x
			PublicKey publicKey;
			publicKey = cache.getPublicKey(property.getPublicKey());
			
			//인증 체크
			try {
				Jwts.parserBuilder().setSigningKey(publicKey).build().parseClaimsJws(jwtData);
		    
		    }catch(ExpiredJwtException e) {
		    	//access Token이 만료된 경우 -> refresh token을 가지고 access token 재요청 -> cookie에 set 후 front로 전달
		    	//access token + expires 생성하기
		    	if(session != null) {
		    		if(SessionUtil.getSessionAttr(Constants.SESSION_ATTR_TOKEN) != null) {
						Map<String,String> receivedData = TokenUtil.setAccessToken(request, property.getAccessToken());
						
						CookieUtil cookieUtil = new CookieUtil();
						if(! cookieUtil.setTokenCookie(session, receivedData, response)) {
							response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
						}
					}
		    	}
				else {
					//401에러
					response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
					return false;
				}
				
		    }catch(JwtException e) {        
		    	//Token이 변조된 경우 -> 401에러로 재로그인 요청
		        e.printStackTrace();
		        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);	
		        return false;
		    }
			
			boolean check = Boolean.parseBoolean(authProperty.getAuthorization());
			if(check) {
				//인가 체크 (해당 아이디가 허용하고 있는 MENU에 대한 권한 검색)
				// 있으면 TRUE, 없으면 403에러
				if (isCommonUri(requestURI, request.getMethod())) return true;

				// checkAuthorization
				String sessionUserId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
				if(StringUtils.isNotBlank(sessionUserId)) {
					Map<String,String> authMap = new HashMap<>();
					authMap.put("url", request.getRequestURI() );
					authMap.put("method", request.getMethod());
					authMap.put("userId", sessionUserId);
					
					List<String> defaultAutOidList = new ArrayList<>();
					if (Boolean.parseBoolean(authProperty.getDefaultAuthUseFlag())) {
						authProperty.getDefaultAuthList().forEach(str -> defaultAutOidList.add(str)); // 기본 권한
					}					
					
					boolean checkAuth = authService.getAuthorizationData(authMap, defaultAutOidList);
					log.debug("{} {} {} authorization = {}", sessionUserId, request.getMethod(), request.getRequestURI(), checkAuth);
					if (!checkAuth) {
						response.setStatus(HttpServletResponse.SC_FORBIDDEN);
						return false;
					}
				} else {
					log.debug("{} {} {} authorization = {}", "No UserId", request.getMethod(), request.getRequestURI(), false);
					response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);	
					return false;
				}
			}
		}

		log.debug("============================================================");
		log.debug("Common Interceptor Check Client IP Address   : {}", clientIP);
		log.debug("Common Interceptor Check Authorization Token : {}", token);

		return true;
	}

	@Override
	public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, @Nullable ModelAndView modelAndView) throws Exception {
		// TODO 
	}
	
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, @Nullable Exception ex) throws Exception {
        // 요청 처리 종료 시 MDC 정리 (예외 발생 시에도 호출됨)
        MDC.remove(MDC_KEY);
    }	

	private static String getClientIpAddr(HttpServletRequest request) {
		String ip = request.getHeader("X-Forwarded-For");
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) { ip = request.getHeader("Proxy-Client-IP"); }
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) { ip = request.getHeader("WL-Proxy-Client-IP"); }
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) { ip = request.getHeader("HTTP_CLIENT_IP"); }
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) { ip = request.getHeader("HTTP_X_FORWARDED_FOR"); }
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) { ip = request.getRemoteAddr(); }
		return ip;
	}
	
	// TODO 이 부분을 묶어서 관리할 API 그룹이 필요
	private boolean isCommonUri(String uri, String method) {
		if (uri.startsWith("/admin/platform")) return true;
		if (uri.startsWith("/admin/getBreadCrumb")) return true;
		if ("GET".equals(method) && "/admin/usermenu".equals(uri)) return true;
		if ("GET".equals(method) && uri.startsWith("/admin/codegroup")) return true;
		if ("GET".equals(method) && "/admin/auth/admin".equals(uri)) return true;
		if ("GET".equals(method) && "/admin/myauthlist".equals(uri)) return true;
		if ("GET".equals(method) && "/admin/myauthrization".equals(uri)) return true;
		// TODO /admin/notice/meta/popup 공지사항 팝업 고려 필요...
		
		return false;
	}
}
