package kr.co.n2m.platform.admin.feature.group.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.Resource;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.admin.feature.common.entity.PagingVO;
import kr.co.n2m.platform.admin.feature.group.entity.Group;
import kr.co.n2m.platform.admin.feature.group.entity.GroupUser;
import kr.co.n2m.platform.admin.feature.group.query.GroupQuery;
import kr.co.n2m.platform.admin.feature.group.query.GroupRepository;
import kr.co.n2m.platform.admin.feature.group.query.GroupUserRepository;
import kr.co.n2m.platform.common.keygen.UniqueKeyGenerator;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class GroupService {

	private final GroupQuery groupQuery;
	private final GroupRepository groupRepository;
	private final GroupUserRepository userRepository;
	
	/** The unique key generator. */ 
	@Resource(name = "timeBaseUniqueKeyGenerator")
	private UniqueKeyGenerator uniqueKeyGenerator;
	
	
	/** 그룹 목록 페이징 조회 */
	public Map<String, Object> getGroupListByPaging(Group searchVo) {
		Map<String, Object> resultMap = new HashMap<>();
	
		long totalCount = groupQuery.getGroupListCount(searchVo);
		PagingVO page = new PagingVO();
		BeanUtils.copyProperties(searchVo, page);
		page.setTotalListSize(totalCount);
	
		if (totalCount > 0) {
			searchVo.setPaging(true);
			List<Group> list = groupQuery.getGroupList(searchVo);
			resultMap.put("data", list);
		}
		else {
			resultMap.put("data", null);
		}
		resultMap.put("page", page);
	
		return resultMap;
	}
	
	/** 그룹 목록 조회. */
	public List<Group> getGroupList(Group searchVo) {
		return groupQuery.getGroupList(searchVo);
	}

	/** 그룹 상세 조회 */
	public Group getGroupDetail(String grpId) {
		return groupQuery.getGroupDetail(grpId);
	}

	/** 그룹 생성 */
	@Transactional
	public String createGroup(Group groupVo) {
		String grpId = uniqueKeyGenerator.getUniqueKey(null);
		
		groupVo.setGrpId(grpId);
		groupVo.setGrpNm(groupVo.getGrpNm());
		groupVo.setGrpDesc(groupVo.getGrpDesc());
		groupRepository.save(groupVo);
		
		// 사용자 목록이 있을 경우 사용자 추가
		if(groupVo.getGroupUserList() != null) {
			createGroupUsersList(grpId,groupVo.getGroupUserList());
		}
		
		return grpId;
	}

	/** 그룹 수정 */
	@Transactional
	public String modifyGroup(Group groupVo) {
		String grpId = groupVo.getGrpId();
		String findGroupId = groupQuery.getGroupId(grpId);
		
		if(findGroupId != null) {
			if(findGroupId.equals(grpId)) {
				groupVo.setAmdDt(LocalDateTime.now());
				groupRepository.save(groupVo);
				
				// 사용자 목록이 있을 경우 사용자 추가
				if(groupVo.getGroupUserList() != null) {
					createGroupUsersList(grpId, groupVo.getGroupUserList());
					
					// list에 없는 사용자 삭제
					List<GroupUser> userIdList = groupQuery.getGroupUserListByGrpId(grpId);
					List<String> ids = new ArrayList<>();
					groupVo.getGroupUserList().forEach(data -> ids.add(data.getUserId()));
					
					userIdList.removeIf(dbUser -> ids.contains(dbUser.getUserId()));
				    userRepository.deleteAll(userIdList);
				}
				return grpId;
			}
		}
		return null;				
	}

	/** 그룹 삭제 */
	@Transactional
	public void removeGroup(String grpId) {
		groupQuery.removeGroup(grpId);
	}
	
	/** 그룹 전체 삭제 */
	@Transactional
	public void removeGroupData(String grpId) {
		try {
			groupQuery.removeGroup(grpId);
			groupQuery.removeGroupUserList(grpId);

		} catch (RuntimeException e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	
	/************************************** 그룹 사용자 **************************************/

	
	/** 그룹 사용자 목록 조회 */
	public List<GroupUser> getGroupUserList(GroupUser searchVo) {
		return groupQuery.getGroupUserList(searchVo);
	}

	/** 그룹 사용자 상세 조회 */
	public GroupUser getGroupUserDetail(String grpId, String userId) {
		return groupQuery.getGroupUserDetail(grpId, userId);
	}

	/** 그룹 사용자 생성 */
	@Transactional					
	public String createGroupUser(String grpId, GroupUser groupUserVo) {
		String userId = groupUserVo.getUserId();
		
		if(userId == null) {
			userId = uniqueKeyGenerator.getUniqueKey(null);
		}
		
		groupUserVo.setUserId(userId);
		groupUserVo.setGrpId(grpId);
		userRepository.save(groupUserVo);
		
		return userId;		
	}

	/** 그룹 사용자(멀티) 생성 */
	@Transactional 
	public void createGroupUsersList(String grpId, List<GroupUser> groupuserVo) {
		for(GroupUser groupUser : groupuserVo ) { 
			createGroupUser(grpId,groupUser); 
		}
	}
	 
	/** 그룹 사용자 전체 삭제 */
	@Transactional
	public void removeGroupUserList(String grpId) {
		groupQuery.removeGroupUserList(grpId);
	}
	
	/** 그룹 사용자 삭제 */
	@Transactional
	public void removeGroupUser(String grpId, String userid) {
		groupQuery.removeGroupUser(grpId, userid);
	}

}
