package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import javax.validation.Valid;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.session.RowBounds;

import com.stoneitgt.dt.data.platform.domain.User;


@Mapper
public interface UserMapper {

	User findByUserId(String userId);

	int updateLastLoginDate(int userSeq);

	List<Map<String, Object>> getUserMenuList(String auth);

	List<Map<String, Object>> getUserList(Map<String, Object> params);

	List<Map<String, Object>> getUserList(Map<String, Object> params, RowBounds rowBounds);

	User getUserInfo(int userSeq);

	int existedUserId(String id);

	int saveUser(User user);

	int deleteUser(Map<String, Object> params);

	int updateUser(@Valid User user);
}
