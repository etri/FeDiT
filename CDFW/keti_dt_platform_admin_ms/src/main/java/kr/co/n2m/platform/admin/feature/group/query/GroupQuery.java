package kr.co.n2m.platform.admin.feature.group.query;

import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.group.entity.Group;
import kr.co.n2m.platform.admin.feature.group.entity.GroupUser;
import kr.co.n2m.platform.admin.feature.group.entity.QGroup;
import kr.co.n2m.platform.admin.feature.group.entity.QGroupUser;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class GroupQuery {
	
	private final ApplicationConfig config;
	private final JPAQueryFactory query;
	
	private final QGroup group = QGroup.group;
	private final QGroup groupJ = new QGroup("groupJ");
	private final QGroupUser groupUser = QGroupUser.groupUser;

	public BooleanBuilder groupPredicate(Group searchVo) {
		
		BooleanBuilder search = new BooleanBuilder();
		
		if(StringUtil.isNotEmpty(searchVo.getSearchWord())) {
			search.and(group.grpNm.contains(searchVo.getSearchWord())).or(group.grpDesc.contains(searchVo.getSearchWord()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getGrpId())) {
			search.and(group.grpId.eq(searchVo.getGrpId()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getGrpNm())) {
			search.and(group.grpNm.contains(searchVo.getGrpNm()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getGrpDesc())) {
			search.and(group.grpDesc.contains(searchVo.getGrpDesc()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(group.regDt.between(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
					StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt())) {
			search.and(group.regDt.after(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
		}
		if(StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(group.regDt.before(StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		return search;
	}
	
	public BooleanBuilder groupUserPredicate(GroupUser searchVo) {
		
		BooleanBuilder search = new BooleanBuilder();
		
		if(StringUtil.isNotEmpty(searchVo.getGrpId())) {
			search.and(groupUser.grpId.eq(searchVo.getGrpId()));
		}
		if(StringUtil.isNotEmpty(searchVo.getUserId())) {
			search.and(groupUser.userId.eq(searchVo.getUserId()));
		}
		
		return search;
	}

	public BooleanBuilder GroupUserPredicate(GroupUser searchVo) {
		BooleanBuilder search = new BooleanBuilder();
		return search;
	}
	
	public QBean<Group> GroupProjection(){
		return Projections.bean(Group.class,
					group.grpId,
					group.grpNm,
					group.grpDesc,
					group.regDt,
					group.regrId,
					group.regrNm,
					group.amdDt,
					group.amdrId,
					group.amdrNm
				);
	}
	
	public QBean<GroupUser> userProjection() {
		return Projections.bean(GroupUser.class,
				groupUser.grpId,
				groupUser.userId
		);
	}
	
	
	/** 그룹 목록 수. */ 
	public long getGroupListCount(Group searchVo) {
		return query.select(group.count())
					.from(group)
					.where(groupPredicate(searchVo))
					.fetchFirst();
	}
	
	
	/** 그룹 목록 조회. */ 
	public List<Group> getGroupList(Group searchVo) {
		int offset = 0;
		int limit = 10;

		List<Group> resultList = null;
		if (searchVo.isPaging()) {
			offset = (searchVo.getCurPage() - 1) * searchVo.getPageListSize();
			limit  = searchVo.getPageListSize();

			resultList = query.select(GroupProjection())
							  .from(group)
							  .leftJoin(groupJ)
							  .on(group.grpId.eq(groupJ.grpId))
							  .where(groupPredicate(searchVo))
							  .offset(offset)
							  .limit(limit)
							  .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				resultList = query.select(GroupProjection())
								  .from(group)
								  .where(groupPredicate(searchVo))
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit = config.getListMaxRowCount();
				resultList = query.select(GroupProjection())
							   	  .from(group)
								  .where(groupPredicate(searchVo))
								  .fetch(); 
			}
		}
		return resultList;
	}

	/** 그룹 ID 조회 */
	public String getGroupId(String grpId) {
		return query.select(group.grpId)
				.from(group)
				.where(group.grpId.eq(grpId))
				.fetchOne();
	}
	
	/** 그룹 ID 조회 - grpId, userId */
	public String findGroupId(String grpId, String userId) {
		return query.select(groupUser.grpId)
					.from(groupUser)
					.leftJoin(group)
					.on(group.grpId.eq(groupUser.grpId))
					.where(groupUser.grpId.eq(grpId),(groupUser.userId.eq(userId)))
					.fetchOne();
	}
	
	/** 그룹 상세 조회. */ 
	public Group getGroupDetail(String grpId) {
		return query.select(GroupProjection())
					.from(group)
					.where(group.grpId.eq(grpId))
					.fetchOne();
	}
	
	/** 그룹 삭제 */
	public void removeGroup(String grpId) {
		query.delete(group)
			 .where(group.grpId.eq(grpId)).execute();
	}
	
	
	/************************************** 그룹 사용자 **************************************/
	  
	  
	/** 그룹 사용자 목록 조회 */
	public List<GroupUser> getGroupUserList(GroupUser searchVo) {
		int offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize(); 
		int limit = searchVo.getPageListSize();
		  
		return query.select(userProjection()) 
					.from(groupUser)
					.where(groupUserPredicate(searchVo))
					.offset(offset)
					.limit(limit)
					.fetch(); 
	}
	
	/** 그룹 사용자 목록 조회 - 전체 */
	public List<GroupUser> getAllUserList(){
		return query.select(userProjection())
					.from(groupUser)
					.fetch();
	}
	
	/** 그룹 ID별 사용자 목록 조회 */
	public List<GroupUser> getGroupUserListByGrpId(String grpId){
		return query.select(userProjection())
					.from(groupUser)
					.where(groupUser.grpId.eq(grpId))
					.fetch();
	}
	
	/** 그룹 사용자 상세 조회 */
	public GroupUser getGroupUserDetail(String grpId, String userId) {
		return query.select(userProjection())
					.from(groupUser)
					.where(groupUser.userId.eq(userId)
						.and(groupUser.grpId.eq(grpId)))
					.fetchOne();
	}
	
	/** 그룹 사용자 ID 조회 */
	public String getUserId(String grpId) {
		return query.select(groupUser.userId)
					.from(groupUser)
					.leftJoin(group)
					.on(group.grpId.eq(groupUser.grpId))
					.where(groupUser.grpId.eq(grpId))
					.fetchOne();
	}
	
	public String findUserId(String userId) {
		return query.select(groupUser.userId)
					.from(groupUser)
					.where(groupUser.userId.eq(userId))
					.fetchOne();
	}
	
	/** 그룹 사용자 전체 삭제 */
	public void removeGroupUserList(String grpId) {
		query.delete(groupUser)
			.where(groupUser.grpId.eq(grpId))
			.execute();
	}
	
	/** 그룹 사용자 삭제 */
	public void removeGroupUser(String grpId, String userId) {
		query.delete(groupUser)
			.where(groupUser.grpId.eq(grpId)
					.and(groupUser.userId.eq(userId))).execute();
	}

}

