package com.stoneitgt.dt.data.platform.admin.service;

import java.util.List;
import java.util.Map;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.stoneitgt.dt.data.platform.admin.mapper.UserMapper;
import com.stoneitgt.dt.data.platform.domain.Paging;
import com.stoneitgt.dt.data.platform.domain.User;
import com.stoneitgt.dt.data.platform.util.StoneUtil;
import com.stoneitgt.dt.data.platform.util.StringUtil;

@Service
public class UserService implements UserDetailsService {

	@Autowired
	private UserMapper userMapper;

	@Autowired
	private PasswordEncoder passwEncoder;

	@Override
	public User loadUserByUsername(String id) throws UsernameNotFoundException {
		return userMapper.findByUserId(id);
	}

	public int updateLastLoginDate(int userSeq) {
		return userMapper.updateLastLoginDate(userSeq);
	}

	public List<Map<String, Object>> getUserList(Map<String, Object> params) {
		return userMapper.getUserList(params);
	}

	public List<Map<String, Object>> getUserList(Map<String, Object> params, Paging paging) {
		return userMapper.getUserList(params, paging.getPaging());
	}

	public User getUserInfo(int userSeq) {
		User user = userMapper.getUserInfo(userSeq);
		if (StringUtil.isNotBlank(user.getUserBirthYmd())) {
			user.setUserBirthYmd(StoneUtil.dateToFormatString(user.getUserBirthYmd()));
		}
		return user;
	}

	public int existedUserId(String id) {
		return userMapper.existedUserId(id);
	}

	public int saveUser(User user) {
		if (StringUtil.isNotBlank(user.getPassword())) {
			user.setPassword(passwEncoder.encode(user.getPassword()));
		}
		if (StringUtil.isNotBlank(user.getUserBirthYmd())) {
			user.setUserBirthYmd(user.getUserBirthYmd().replaceAll("[^0-9]", ""));
		}
		return userMapper.saveUser(user);
	}

	public int deleteUser(Map<String, Object> params) {
		return userMapper.deleteUser(params);
	}

	public int updateUser(@Valid User user) {
		if (StringUtil.isNotBlank(user.getPassword())) {
			user.setPassword(passwEncoder.encode(user.getPassword()));
		}
		if (StringUtil.isNotBlank(user.getUserBirthYmd())) {
			user.setUserBirthYmd(user.getUserBirthYmd().replaceAll("[^0-9]", ""));
		}
		
		if (StringUtil.isNotBlank(user.getNewPassword())) {
			user.setNewPassword(passwEncoder.encode(user.getNewPassword()));
		}
		
		return userMapper.updateUser(user);
	}

}
