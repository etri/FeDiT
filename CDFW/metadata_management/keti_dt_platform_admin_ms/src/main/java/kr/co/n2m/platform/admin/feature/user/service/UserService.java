package kr.co.n2m.platform.admin.feature.user.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.admin.feature.user.entity.User;
import kr.co.n2m.platform.admin.feature.user.query.UserQuery;
import kr.co.n2m.platform.admin.feature.user.query.UserRepository;
import kr.co.n2m.platform.common.constant.Constants;
import kr.co.n2m.platform.common.keygen.UniqueKeyGenerator;
import kr.co.n2m.platform.common.utils.SessionUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserQuery userQuery;
	private final UserRepository userRepository;

	/** The unique key generator. */
	@Resource(name = "timeBaseUniqueKeyGenerator")
	private UniqueKeyGenerator uniqueKeyGenerator;

	public Map<String, Object> getUserListByPaging(User searchEntity) {
		Map<String, Object> resultMap = new HashMap<>();

		long totalCount = userQuery.getUserListCount(searchEntity);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchEntity, page);
		page.setTotalListSize(totalCount);

		if (totalCount > 0) {
			searchEntity.setPaging(true);
			List<User> list = userQuery.getUserList(searchEntity);
			resultMap.put("data", list);
		} else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);

		return resultMap;
	}

	/** 사용자 목록 조회. */
	public List<User> getUserList(User searchEntity) {
		return userQuery.getUserList(searchEntity);
	}

	/** 사용자 목록 상세 조회. */
	public User getUser(String userOid) {
		return userQuery.getUser(userOid);
	}

	/** 사용자 생성. */ 
	@Transactional
	public String createUser(User userEntity) {
		// Step 1. User ID 중복 체크
		User searchUser = new User();
		searchUser.setUserId(userEntity.getUserId());
		List<User> searchResultUser = userQuery.getUserList(searchUser);
		if (searchResultUser.size() > 0) {
			return null;
		}

		// Step 2. 사용자 등록
		String oid = uniqueKeyGenerator.getUniqueKey(null);
		userEntity.setUserOid(oid);
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			userEntity.setRegrId(userId);
		}
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			userEntity.setRegrNm(userNm);
		}
		
		userRepository.save(userEntity);

		return oid;
	}

	/** 사용자 정보 수정. */ 
	@Transactional
	public String modifyUser(User userEntity) {
		// Step 1. User ID 중복 체크
		User searchUser = new User();
		searchUser.setUserId(userEntity.getUserId());
		List<User> searchResultUser = userQuery.getUserList(searchUser);
		if (searchResultUser.size() > 0) {
			boolean bDuplication = false;
			for (User temp : searchResultUser) {
				// 조회 시 수정 대상 사용자는 비교대상에서 제외
				if (temp.getUserOid().equals(userEntity.getUserOid())) {
					continue;
				}

				if (temp.getUserId().equals(userEntity.getUserId())) {
					bDuplication = true;
					break;
				}
			}
			if (bDuplication) {
				// 기존에 사용하고 있는 아이디로 변경된 경우
				return null;
			}
		}

		// Step 2. 사용자 수정
		
		String userId = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_ID);
		if(userId != null) {
			userEntity.setAmdrId(userId);
		}
		
		String userNm = SessionUtil.getSessionAttr(Constants.SESSION_ATTR_USER_NM);
		if(userNm != null) {
			userEntity.setAmdrNm(userNm);
		}
		
		userRepository.save(userEntity);
		
		return userEntity.getUserOid();
	}

	/** 사용자 정보 삭제. */
	@Transactional
	public void removeUser(String userOid) {
		userQuery.removeUser(userOid);
	}

}
