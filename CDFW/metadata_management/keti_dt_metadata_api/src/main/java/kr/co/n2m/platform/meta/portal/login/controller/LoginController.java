package kr.co.n2m.platform.meta.portal.login.controller;

import kr.co.n2m.platform.meta.architecture.component.ResponseComponent;

//@Tag(name="로그인 Controller", description="로그인 관련")
//@Slf4j
//@RestController
public class LoginController extends ResponseComponent {
		
/*
현재...........
{
  "type": "adminSystem",
  "userId": "n2m_iot",
  "nickname": "엔투엠",
  "email": "n2m@n2m.co.kr",
  "role": "System_Admin",
  "iat": 1681453620,
  "exp": 1681457220,
  "aud": "pikNIazqYhwHfWmpQdbZ",
  "iss": "urn:datahub:cityhub:security"
}	
 */
	
//	/**
//	 * 로그인
//	 * @Author      : heenim
//	 * @Date        : 2022. 07. 18.
//	 * @param params
//	 * @param request
//	 * @return
//	 */
//	@Operation(description="로그인")
//	@PostMapping("/portal/login")
//	public ResponseEntity<Object> login(@RequestBody HashMap<String, String> params, HttpServletRequest request) {
//		
//		Map<String, Object> resMap = null; // loginService.login(params, request);
//
//		return makeResponseEntity(resMap);		
//	}	
//
//	/**
//	 * 공개키
//	 * @Author      : heenim
//	 * @Date        : 2022. 07. 18.
//	 * @param params
//	 * @return
//	 */
//	@Operation(description="공개키")
//	@GetMapping("/api/v1/green/ath/token/publickey")
//	public ResponseEntity<Object> getPublicKey(@RequestParam HashMap<String, String> params) {
//		
//		Map<String, Object> resMap = new HashMap<>();
//		resMap.put("publickey", AuthUtil.getPublicKeyStr());
//		
//		return makeResponseEntity(resMap);
//	}
//	
//	/**
//	 * refreshToken 으로 새 토큰 발급
//	 * @Author      : heenim
//	 * @Date        : 2022. 08. 24.
//	 * @param params
//	 * @param request
//	 * @return
//	 */
//	@Operation(description="새토큰")
//	@PostMapping("/api/v1/green/com/token/new")
//	public ResponseEntity<Object> getNewTokenByRefreshToken(@RequestBody HashMap<String, String> params, HttpServletRequest request) {
//		
//		Map<String, Object> resMap = loginService.getNewTokenByRefreshToken(params, request);
//
//		return makeResponseEntity(resMap);		
//	}	
//	
//	/**
//	 * 로그아웃
//	 * @Author      : heenim
//	 * @Date        : 2022. 08. 24.
//	 * @param params
//	 * @param request
//	 * @return
//	 */
//	@Operation(description="로그아웃")
//	@PostMapping("/portal/logout")
//	public ResponseEntity<Object> logout(@RequestBody HashMap<String, String> params) {
//		
//		Map<String, Object> resMap = null; //loginService.logout(params);
//
//		return makeResponseEntity(resMap);		
//	}	
	
}
