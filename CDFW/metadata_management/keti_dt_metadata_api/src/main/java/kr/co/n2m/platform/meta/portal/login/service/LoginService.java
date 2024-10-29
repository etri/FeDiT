package kr.co.n2m.platform.meta.portal.login.service;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
//@Transactional(transactionManager = "rdbTransactionManager")
public class LoginService {
	
//	@Value("${security.app-salt}")
//	private String appSalt;
//	
//	@Value("${security.web-app-id}")
//	private String webAppId;	
//	
//	@Value("${security.web-app-pw}")
//	private String webAppPw;	
//	
//	@Value("${security.app-app-id}")
//	private String appAppId;
//	
//	@Value("${security.app-app-pw}")
//	private String appAppPw;
//	
//	@Autowired
//	private UserService userService;
//	
//	@Autowired
//	private EduGroupService eduGroupService;
//	
//	@Autowired
//	private AuthService authService;
//	
//	@Autowired
//	private LoginMapper loginMapper;
//	
//	
//	/**
//	 * App 체크
//	 * @Author      : heenim
//	 * @Date        : 2022. 07. 18.
//	 * @param appId
//	 * @param appPw
//	 * @throws BizInfoException
//	 */
//	private void checkApplicationInfo(String appId, String appPw) throws BizInfoException {
//		if (StringUtils.isBlank(appId) || StringUtils.isBlank(appPw)) throw new BizInfoException("허용된 서버가 아닙니다.");
//		String chkPw = appId + "_" + AuthUtil.getServerEnv();
//		String encAppPw = SecurityUtil.encodePassword(chkPw, appSalt);
//		// log.debug("[App 체크] encAppPw : " + encAppPw);			
//		if (!StringUtils.equals(encAppPw, appPw)) throw new BizInfoException("허용된 서버가 아닙니다.");
//	}
//	
//	/**
//	 * RSA 모듈 가져오기
//	 * @Author      : heenim
//	 * @Date        : 2022. 10. 04.
//	 * @return
//	 */
//	public Map<String, Object> getRsaModule() {
//		log.debug("[RSA 모듈 가져오기] 서비스 시작");
//		
//		Map<String, Object> resMap = new HashMap<>();
//		
//		// 필요없음. resMap.put("RSAModulus"  , AuthUtil.getPublicKeyModulus());
//		// 필요없음. resMap.put("RSAExponent" , AuthUtil.getPublicKeyExponent());
//		resMap.put("RSAPublicKey", AuthUtil.getPublicKeyStr());
//		
//		log.debug("[RSA 모듈 가져오기] 서비스 종료");
//		return resMap;
//	}
//	
//	/**
//	 * 로그인
//	 * @Author      : heenim
//	 * @Date        : 2022. 07. 18.
//	 * @param params
//	 * @param request
//	 * @return
//	 */
//	public Map<String, Object> login(HashMap<String, String> params, HttpServletRequest request) {	
//		log.debug("[로그인] 서비스 시작");
//		
//		String loginUserType = StringUtil.avoidNull(params.get("loginUserType"), "ADM"); // ADM 관리자, EDU_GROUP 교육그룹
//		String userId        = params.get("userId");
//		String userPw        = params.get("userPw");
//		String appId         = params.get("appId");
//		String appPw         = params.get("appPw");
//		String loginIps      = AuthUtil.getClientIpAddr(request);
//		
//		Map<String, Object> resMap = new HashMap<>();
//		LoginUserVo loginUserVo = null;
//		String eduGroupId = "";
//		
//		try {
//			// 필수 체크
//			if (StringUtils.isBlank(userId) || StringUtils.isBlank(userPw)) throw new AuthException("ID 나 비밀번호를 입력하지 않았습니다.");
//						
//			// ID, PASSWORD 복호화
//			userId = AuthUtil.decryptRS256(userId);
//			userPw = AuthUtil.decryptRS256(userPw);
//			
//			log.debug(String.format("serverEnv: %s,  loginUserType : %s,  userId : %s,  appId : %s,  loginIps : %s", AuthUtil.getServerEnv(), loginUserType, userId, appId, loginIps));
//			
//			// App 체크
//			this.checkApplicationInfo(appId, appPw);
//
//			// 교육그룹 로그인
//			if (StringUtils.equals(loginUserType, AuthUtil.LOGIN_USR_TYPE_EDU_GROUP)) {
//				
//				EduGroupVo eduGroupVo = eduGroupService.getEduGroupByLoginId(userId);
//				if (eduGroupVo == null) throw new AuthException("해당 교육그룹이 존재하지 않습니다.");
//				
//				String encPw = SecurityUtil.encodePassword(userPw, eduGroupVo.getEduGroupPasswdSalt());
//				// log.debug("[로그인] encPw : " + encPw);			
//				if (!StringUtils.equals(encPw, eduGroupVo.getEduGroupPasswd())) throw new AuthException("비밀번호가 틀립니다.");
//				
//				// log.debug("[로그인] 비밀번호 확인");
//				
//				if (!StringUtils.equals(eduGroupVo.getEduGroupUsrStatCd(), "CG006_USE")) throw new BizInfoException("교육그룹의 계정이 [" + eduGroupVo.getEduGroupUsrStatCdName() + "] 상태입니다. 관리자에게 문의해 주세요.");
//
//				List<String> roleList = this.getRoleListByLoginUserId(userId, loginUserType);
//				
//				loginUserVo = new LoginUserVo();
//				loginUserVo.setLoginUserType(loginUserType);
//				loginUserVo.setUserId(eduGroupVo.getEduGroupLoginId());
//				loginUserVo.setUserName(eduGroupVo.getEduGroupName());
//				loginUserVo.setUserOrganCd("EDU_GROUP");
//				loginUserVo.setUserOrganCdName("교육그룹");
//				loginUserVo.setRoleList(roleList);
//				loginUserVo.setAppId(appId);
//				loginUserVo.setLoginIps(loginIps);
//				
//				eduGroupId = eduGroupVo.getEduGroupId();
//				
//		    // 관리자 로그인
//			} else {
//			
//				UserVo userVo = userService.getUser(userId);
//				if (userVo == null) throw new AuthException("해당 사용자가 존재하지 않습니다.");
//				
//				String encPw = SecurityUtil.encodePassword(userPw, userVo.getUsrPasswdSalt());
//				// log.debug("[로그인] encPw : " + encPw);			
//				if (!StringUtils.equals(encPw, userVo.getUsrPasswd())) throw new AuthException("비밀번호가 틀립니다.");
//				
//				// log.debug("[로그인] 비밀번호 확인");
//				userVo.setUsrPasswd(null);
//				userVo.setUsrPasswdSalt(null);
//				
//				if (!StringUtils.equals(userVo.getUsrStatCd(), "CG006_USE")) throw new BizInfoException("사용자의 계정이 [" + userVo.getUsrStatCdName() + "] 상태입니다. 관리자에게 문의해 주세요.");
//				
//				List<String> roleList = this.getRoleListByLoginUserId(userId, loginUserType);
//				if (!roleList.contains("ROLE_DEFAULT")) {
//					roleList.add("ROLE_DEFAULT");
//				}
//				
//				loginUserVo = new LoginUserVo();
//				loginUserVo.setLoginUserType(loginUserType);
//				loginUserVo.setUserId(userVo.getUsrId());
//				loginUserVo.setUserName(userVo.getUsrName());
//				loginUserVo.setUserOrganCd(userVo.getUsrOrganCd());
//				loginUserVo.setUserOrganCdName(userVo.getUsrOrganCdName());
//				loginUserVo.setRoleList(roleList);
//				loginUserVo.setAppId(appId);
//				loginUserVo.setLoginIps(loginIps);
//				
//			}
//			
//			
//			// 토큰 발급
//			//String token = AuthUtil.createJwtTokenRS256(loginUserVo);
//			//log.debug("RS256 token (" + token.length() + "): " + token);
//			//String refreshToken = token;
//			TokenVo tokenVo = this.getNewToken(loginUserVo);
//			String token = tokenVo.getTokenVs();
//			String refreshToken = tokenVo.getRefreshTokenVs();
//			log.debug("RS256 token1 (" + token.length() + "): " + token);
//			log.debug("RS256 token2 (" + refreshToken.length() + "): " + refreshToken);
//			
//			// 사용자 정보
//			Map<String, Object> userMap = new HashMap<>();
//			userMap.put("loginUsrType"  , loginUserType);
//			userMap.put("usrId"			, loginUserVo.getUserId());
//			userMap.put("usrName"		, loginUserVo.getUserName());
//			userMap.put("usrOrganCd"	, loginUserVo.getUserOrganCd());
//			userMap.put("usrOrganCdName", loginUserVo.getUserOrganCdName());
//			userMap.put("roleList"		, loginUserVo.getRoleList());
//			// 추가 정보
//			userMap.put("eduGroupId"	, eduGroupId);
//					
//			resMap.put("resCd"       , "100");
//			resMap.put("resMessage"  , "로그인에 성공했습니다.");
//			resMap.put("authToken"   , token);
//			resMap.put("refreshToken", refreshToken);
//			resMap.put("user"        , userMap);			
//			
//			// 새로 조회 하도록 내 메뉴 캐시 초기화
//			authService.clearMyMenuCache(loginUserVo.getUserId(), loginUserType);
//			
//			// 로그인 이력 등록
//			try {
//				Map<String, Object> histMap = new HashMap<>();
//				histMap.put("loginHistId"      , String.valueOf(System.currentTimeMillis()));
//				histMap.put("loginUsrId"       , loginUserVo.getUserId());
//				histMap.put("loginUsrType"     , loginUserType);
//				histMap.put("loginIps"         , loginIps);
//				histMap.put("loginHistSourceVs", "login");
//				loginMapper.insertLoginHist(histMap);
//			} catch (Exception e) {
//				log.error("[로그인] 로그인 이력 등록 실패/오류", e);
//			}
//			
//		} catch (AuthException e) {
//			log.error("[로그인] 사용자 권한 없음 : 해당 사용자가 존재하지 않거나 비밀번호가 틀립니다. " + e.getMessage());			
//			resMap.put("resCd"     , "101");
//			resMap.put("resMessage", "해당 사용자가 존재하지 않거나 비밀번호가 틀립니다.");
//
//		} catch (BizInfoException e) {
//			log.error("[로그인] 기타 오류 : " + e.getMessage());			
//			resMap.put("resCd"     , "104");
//			resMap.put("resMessage", e.getMessage());
//			
//		} catch (Exception e) {
//			log.error("[로그인] 기타 오류2 : " + e.getMessage());			
//			resMap.put("resCd"     , "104");
//			resMap.put("resMessage", "로그인 처리 중 오류가 발생했습니다.");
//			
//		}
//		
//		log.debug("[로그인] 서비스 종료");
//		return resMap;
//	}
//	
//	/**
//	 * 토큰 등록 하고 새 토큰 정보 반환
//	 * @Author      : heenim
//	 * @Date        : 2022. 08. 24.
//	 * @param loginUserVo
//	 * @return
//	 */
//	private TokenVo getNewToken(LoginUserVo loginUserVo) {
//		log.debug("[토큰 등록 하고 새 토큰 정보 반환] 서비스 시작");
//		TokenVo tokenVo = null;
//		
//		try {
//			// 기존 토큰 정보 삭제
//			String appIdEnv = loginUserVo.getAppId() + "_" + AuthUtil.getServerEnv();
//			TokenVo delParamVo = new TokenVo();
//			delParamVo.setAppId(appIdEnv);
//			delParamVo.setUsrId(loginUserVo.getUserId());
//			delParamVo.setLoginUsrType(loginUserVo.getLoginUserType());
//			
//			loginMapper.deleteTokenByAppUsr(delParamVo);
//			
//			// 신규 토큰 ID (JTI) 조회
//			String jti = loginMapper.selectNewJti();
//			
//			// 토큰 생성
//			tokenVo = AuthUtil.createJwtTokenRS256(jti, loginUserVo);
//			
//			// 새 토큰 정보 등록
//			loginMapper.insertToken(tokenVo);
//			
//		} catch (Exception e) {
//			log.error("[토큰 등록 하고 새 토큰 정보 반환] 실패/오류", e);
//			throw new GlobalException(e);
//		}	
//
//		log.debug("[토큰 등록 하고 새 토큰 정보 반환] 서비스 종료");
//		return tokenVo;
//	}
//	
//	/**
//	 * 로그인사용자의 역할 목록 조회
//	 * @Author      : heenim
//	 * @Date        : 2022. 07. 28.
//	 * @param userId
//	 * @param loginUserType
//	 * @return
//	 */
//	private List<String> getRoleListByLoginUserId(String userId, String loginUserType) {
//		log.debug("[로그인사용자의 역할 목록 조회] 서비스 시작");
//		List<String> list = Collections.emptyList();
//		
//		try {
//			Map<String, String> paramMap = new HashMap<>();
//			paramMap.put("loginUserId"  , userId);
//			paramMap.put("loginUserType", loginUserType);
//			
//			list= loginMapper.selectRoleListByLoginUserId(paramMap);
//
//		} catch(Exception e) {
//			log.error("[로그인사용자의 역할 목록 조회] 실패/오류");
//			throw new GlobalException(e);
//		}
//		
//		log.debug("[로그인사용자의 역할 목록 조회] 서비스 종료");
//		return list;
//	}	
//	
////	/**
////	 * 공개키 조회
////	 * @Author      : heenim
////	 * @Date        : 2022. 08. 24.
////	 * @param params
////	 * @param request
////	 * @return
////	 */
////	public Map<String, Object> getPublicKey(HashMap<String, String> params, HttpServletRequest request) {
////		log.debug("[공개키 조회] 서비스 시작");
////		Map<String, Object> resMap = new HashMap<>();
////		
////		String appId         = params.get("appId");
////		String appPw         = params.get("appPw");
////		
////		try {	
////			// App 체크
////			this.checkApplicationInfo(appId, appPw);
////		
////			resMap.put("publickey", AuthUtil.getPublicKeyStr());		
////			
////		} catch (Exception e) {
////			log.error("[공개키 조회] 실패/오류", e);
////			throw new GlobalException(e);
////		}			
////			
////		log.debug("[공개키 조회] 서비스 종료");
////		return resMap;		
////	}
//	
//	/**
//	 * refreshToken 으로 새 토큰 발급
//	 * @Author      : heenim
//	 * @Date        : 2022. 08. 24.
//	 * @param params
//	 * @return
//	 */
//	public Map<String, Object> getNewTokenByRefreshToken(HashMap<String, String> params, HttpServletRequest request) {
//		log.debug("[refreshToken 으로 새 토큰 발급] 서비스 시작");
//		Map<String, Object> resMap = new HashMap<>();
//		
//		String appId         = params.get("appId");
//		String appPw         = params.get("appPw");
//		String refreshToken  = params.get("refreshToken");
//		String authToken     = params.get("authToken");
//		String loginIps      = AuthUtil.getClientIpAddr(request);		
//		String appIdEnv      = appId + "_" + AuthUtil.getServerEnv();
//		Date   now           = new Date();
//		
//		log.debug(String.format("serverEnv: %s,  appId : %s,  loginIps : %s", AuthUtil.getServerEnv(), appId, loginIps));
//		
//		try {	
//			
//			// 1. 체크
//			
//			// App 체크
//			this.checkApplicationInfo(appId, appPw);
//			
//			// 필수 체크
//			if (StringUtils.isBlank(refreshToken)) throw new ResBadRequestException("잘못된 요청입니다.");
//			
//			// 토큰 파싱
//			Jws<Claims> claims = AuthUtil.parseClaimsJwsRS256("Bearer " + refreshToken);
//			if (claims == null) throw new AuthException("권한없음! 리프레쉬 토큰 파싱 중 오류가 발생했습니다.");
//			
//			// 유효성 체크 (토큰 존재 확인, 토큰 만료시각 확인, 토큰 정보 비교 확인)
//			Claims payload = claims.getBody();		
//			boolean isValidToken = !payload.getExpiration().before(now);
//			if (!isValidToken) throw new AuthException("권한없음! 리프레쉬 토큰이 만료되었습니다. (토큰)");
//				
//			TokenVo paramVo = new TokenVo();
//			paramVo.setTokenId(payload.getId()); // jti
//			TokenVo selVo = loginMapper.selectToken(paramVo);	
//			if (selVo == null) throw new AuthException("권한없음! 토큰 정보가 존재하지 않습니다. : " + payload.getId());
//			
//			if (!StringUtils.equals(selVo.getAppId(), appIdEnv) || !StringUtils.equals(selVo.getUsrId(), payload.getSubject())) throw new AuthException("권한없음! 토큰 정보가 일치하지 않습니다. : " + payload.getId());
//			
//			if (!StringUtils.equals(selVo.getTokenVs(), authToken)) throw new AuthException("권한없음! 토큰 정보가 일치하지 않습니다. (탈취?) : " + payload.getId());
//			
//			long eTime = Long.valueOf(selVo.getRefreshExpireTimeVs());
//			Date eDate = new Date(eTime);
//			if (eDate.before(now)) throw new AuthException("권한없음! 리프레쉬 토큰이 만료되었습니다. (DB)");
//			
//			
//			// 2. 새 토큰 발급 (기존 토큰 삭제하고 새 토큰 반환)
//			
//			String userId        = selVo.getUsrId();
//			String loginUserType = selVo.getLoginUsrType();
//			LoginUserVo loginUserVo = null;
//			
//			// 교육그룹 토큰 정보 설정
//			if (StringUtils.equals(loginUserType, AuthUtil.LOGIN_USR_TYPE_EDU_GROUP)) {
//				
//				EduGroupVo eduGroupVo = eduGroupService.getEduGroupByLoginId(selVo.getUsrId());
//				if (eduGroupVo == null) throw new AuthException("해당 교육그룹이 존재하지 않습니다.");
//				
//				if (!StringUtils.equals(eduGroupVo.getEduGroupUsrStatCd(), "CG006_USE")) throw new BizInfoException("교육그룹의 계정이 [" + eduGroupVo.getEduGroupUsrStatCdName() + "] 상태입니다. 관리자에게 문의해 주세요.");
//
//				List<String> roleList = this.getRoleListByLoginUserId(userId, loginUserType);
//				
//				loginUserVo = new LoginUserVo();
//				loginUserVo.setLoginUserType(loginUserType);
//				loginUserVo.setUserId(eduGroupVo.getEduGroupLoginId());
//				loginUserVo.setUserName(eduGroupVo.getEduGroupName());
//				loginUserVo.setUserOrganCd("EDU_GROUP");
//				loginUserVo.setUserOrganCdName("교육그룹");
//				loginUserVo.setRoleList(roleList);
//				loginUserVo.setAppId(appId);
//				loginUserVo.setLoginIps(loginIps);
//				
//		    // 관리자 토큰 정보 설정
//			} else {
//			
//				UserVo userVo = userService.getUser(userId);
//				if (userVo == null) throw new AuthException("해당 사용자가 존재하지 않습니다.");
//				
//				userVo.setUsrPasswd(null);
//				userVo.setUsrPasswdSalt(null);
//				
//				if (!StringUtils.equals(userVo.getUsrStatCd(), "CG006_USE")) throw new BizInfoException("사용자의 계정이 [" + userVo.getUsrStatCdName() + "] 상태입니다. 관리자에게 문의해 주세요.");
//				
//				List<String> roleList = this.getRoleListByLoginUserId(userId, loginUserType);
//				if (!roleList.contains("ROLE_DEFAULT")) {
//					roleList.add("ROLE_DEFAULT");
//				}
//				
//				loginUserVo = new LoginUserVo();
//				loginUserVo.setLoginUserType(loginUserType);
//				loginUserVo.setUserId(userVo.getUsrId());
//				loginUserVo.setUserName(userVo.getUsrName());
//				loginUserVo.setUserOrganCd(userVo.getUsrOrganCd());
//				loginUserVo.setUserOrganCdName(userVo.getUsrOrganCdName());
//				loginUserVo.setRoleList(roleList);
//				loginUserVo.setAppId(appId);
//				loginUserVo.setLoginIps(loginIps);
//				
//			}
//			
//			// 토큰 발급
//			TokenVo tokenVo = this.getNewToken(loginUserVo);
//			String newToken = tokenVo.getTokenVs();
//			String newRefreshToken = tokenVo.getRefreshTokenVs();
//			log.debug("RS256 token1 (" + newToken.length() + "): " + newToken);
//			log.debug("RS256 token2 (" + newRefreshToken.length() + "): " + newRefreshToken);
//			
//			resMap.put("resCd"       , "100");
//			resMap.put("resMessage"  , "정상적으로 처리되었습니다.");		
//			resMap.put("authToken"   , newToken);
//			resMap.put("refreshToken", newRefreshToken);			
//			
//			
//			// 새로 조회 하도록 내 메뉴 캐시 초기화
//			authService.clearMyMenuCache(loginUserVo.getUserId(), loginUserType);
//			
//			// 로그인 이력 등록
//			try {
//				Map<String, Object> histMap = new HashMap<>();
//				histMap.put("loginHistId"      , String.valueOf(System.currentTimeMillis()));
//				histMap.put("loginUsrId"       , loginUserVo.getUserId());
//				histMap.put("loginUsrType"     , loginUserType);
//				histMap.put("loginIps"         , loginIps);
//				histMap.put("loginHistSourceVs", "refresh");
//				loginMapper.insertLoginHist(histMap);
//			} catch (Exception e) {
//				log.error("[refreshToken 으로 새 토큰 발급] 로그인 이력 등록 실패/오류", e);
//			}
//		
//		} catch (ResBadRequestException | BizInfoException e) {
//			log.info("[refreshToken 으로 새 토큰 발급] 실패/오류 (정보성) : {}", e.getMessage());
//			resMap.put("resCd"     , "101");
//			resMap.put("resMessage", "허용된 서버가 아니거나 잘못된 요청입니다.");		
//			
//		} catch (Exception e) {
//			log.error("[refreshToken 으로 새 토큰 발급] 실패/오류", e);
//			resMap.put("resCd"     , "104");
//			resMap.put("resMessage", "처리 중 오류가 발생했습니다.");
//			
//		}			
//		
//		log.debug("[refreshToken 으로 새 토큰 발급] 서비스 종료");
//		return resMap;		
//	}
//	
//	/**
//	 * 로그아웃
//	 * @Author      : heenim
//	 * @Date        : 2022. 08. 24.
//	 * @param params
//	 * @return
//	 */
//	public Map<String, Object> logout(HashMap<String, String> params) {
//		log.debug("[로그아웃] 서비스 시작");
//		Map<String, Object> resMap = new HashMap<>();
//		
//		String loginUserType = StringUtil.avoidNull(params.get("loginUserType"), "ADM"); // ADM 관리자, EDU_GROUP 교육그룹
//		String userId        = params.get("userId");
//		String appId         = params.get("appId");
//		
//		try {
//			// 토큰 정보 삭제
//			String appIdEnv = appId + "_" + AuthUtil.getServerEnv();
//			TokenVo delParamVo = new TokenVo();
//			delParamVo.setAppId(appIdEnv);
//			delParamVo.setUsrId(userId);
//			delParamVo.setLoginUsrType(loginUserType);
//			
//			loginMapper.deleteTokenByAppUsr(delParamVo);
//			
//			resMap.put("resCd"       , "100");
//			resMap.put("resMessage"  , "로그아웃에 성공했습니다.");
//			
//		} catch (Exception e) {
//			log.error("[로그아웃] 실패/오류", e);
//			throw new GlobalException(e);
//		}	
//
//		log.debug("[로그아웃] 서비스 종료");
//		return resMap;
//	}
	
}
