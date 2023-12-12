package kr.udt.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetailsService;

import kr.udt.security.service.UdtWebUserVO;

/**
 * @설명 : UDT 관리자웹 스프링 시큐리티 인증 프로바이더
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 10. 23
 * @비고 : 
 */
public class UdtAuthenticationProvider implements AuthenticationProvider {

	@Autowired
	private UserDetailsService userDetailsService;
	
	private static final Logger LOGGER = LoggerFactory.getLogger(UdtAuthenticationProvider.class);

	@Override
	public Authentication authenticate(Authentication authentication) throws AuthenticationException {
		// TODO Auto-generated method stub

		String loginUserName = String.valueOf(authentication.getPrincipal());
		String loginPassword = String.valueOf(authentication.getCredentials());
		
		LOGGER.info(loginUserName +" 로그인을 시도합니다.");
		LOGGER.info("Security 인증정보 : [" + authentication+"]");


		UdtWebUserVO user = (UdtWebUserVO) userDetailsService.loadUserByUsername(loginUserName);

		if(!matchPassword(loginPassword, user.getPassword())) {
			throw new BadCredentialsException(loginUserName);
		}

		if(!user.isEnabled()) {
			throw new BadCredentialsException(loginUserName);
		}

		LOGGER.info(loginUserName +" 로그인에 성공했습니다.");
		return new UsernamePasswordAuthenticationToken(loginUserName, loginPassword, user.getAuthorities());
	}

	@Override
	public boolean supports(Class<?> authentication) {
		// TODO Auto-generated method stub
		return true;
	}

	private boolean matchPassword(String loginPassword, String password) {

		return loginPassword.equals(password);

	}


}