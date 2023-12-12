package kr.udt.security.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import kr.udt.security.service.impl.UdtWebUserMapper;

/**
 * @설명 : UDT 관리자웹 스프링 시큐리티 인증 프로바이더가 사용할 로그인검증 메서드 제공클래스
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2021. 10. 23
 * @비고 : 
 */
public class UdtUserDetailsService implements UserDetailsService{

	@Autowired
	private UdtWebUserMapper udtWebUserMapper;

	private static final Logger LOGGER = LoggerFactory.getLogger(UdtUserDetailsService.class);

	@Override
	public UserDetails loadUserByUsername(String userName) throws UsernameNotFoundException {
		// TODO Auto-generated method stub

		LOGGER.info("=========로그인정보 db조회==========");
		UdtWebUserVO user = udtWebUserMapper.getUserById(userName);
		LOGGER.info("=========로그인정보 db조회 완료==========");

		if(user == null) {
			throw new UsernameNotFoundException(userName);
		}

		return user;
	}


}