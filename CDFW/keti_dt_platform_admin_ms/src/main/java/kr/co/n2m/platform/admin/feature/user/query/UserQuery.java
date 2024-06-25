package kr.co.n2m.platform.admin.feature.user.query;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.user.entity.QUser;
import kr.co.n2m.platform.admin.feature.user.entity.User;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class UserQuery {
	
	private final JPAQueryFactory query;
	private final QUser user = QUser.user;		

	 public BooleanBuilder predicate(User searchEntity) {
		BooleanBuilder search = new BooleanBuilder();

		//검색 조건 미선택 시 모든 조건 조회
		if(StringUtil.isNotEmpty(searchEntity.getSearchWord())) {
			search.and(user.userId.contains(searchEntity.getSearchWord()))
				.or(user.userName.contains(searchEntity.getSearchWord()))
				.or(user.telNo.contains(searchEntity.getSearchWord()))
				.or(user.email.contains(searchEntity.getSearchWord()));
		}
		
		// 사용자아이디 검색
		if (StringUtil.isNotEmpty(searchEntity.getUserId())) {
			search.and(
				user.userId.contains(searchEntity.getUserId())
			);
		}

		// 사용자명 검색
		if (StringUtil.isNotEmpty(searchEntity.getUserName())) {
			search.and(
				user.userName.contains(searchEntity.getUserName())
			);
		}
		// 전화번호 검새
		if (StringUtil.isNotEmpty(searchEntity.getTelNo())) {
			search.and(
				user.telNo.contains(searchEntity.getTelNo())
			);
		}
		// 이메일 검색
		if (StringUtil.isNotEmpty(searchEntity.getEmail())) {
			search.and(
				user.email.contains(searchEntity.getEmail())
			);
		}
		// 관리자여부 검색
		if (StringUtil.isNotEmpty(searchEntity.getAdmrYn()) && StringUtil.checkYnValue(searchEntity.getAdmrYn())) {
			search.and(
				user.admrYn.eq(searchEntity.getAdmrYn())
			);
		}
		
		// 삭제여부 검색
		if (StringUtil.isNotEmpty(searchEntity.getDelYn()) && StringUtil.checkYnValue(searchEntity.getDelYn())) {
			search.and(
				user.delYn.eq(searchEntity.getDelYn())
			);
		}

		// 등록일시 검색
		if (StringUtil.isNotEmpty(searchEntity.getSearchRegSt()) && StringUtil.isNotEmpty(searchEntity.getSearchRegEd())) {
			LocalDateTime parseSt = LocalDateTime.parse(searchEntity.getSearchRegSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd = LocalDateTime.parse(searchEntity.getSearchRegEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			search.and(
				user.regDt.between(parseSt, parseEd)
			);
		}
		
		// 수정일시 검색
		if (StringUtil.isNotEmpty(searchEntity.getSearchAmdSt()) && StringUtil.isNotEmpty(searchEntity.getSearchAmdEd())) {
			LocalDateTime parseSt = LocalDateTime.parse(searchEntity.getSearchAmdSt(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			LocalDateTime parseEd = LocalDateTime.parse(searchEntity.getSearchAmdEd(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
			search.and(
				user.amdDt.between(parseSt, parseEd)
			);
		}

		return search;
	}

	public QBean<User> projection() {
		return Projections.bean(User.class,
				user.userOid,
				user.userId,
				user.userName,
				user.telNo,
				user.email,
				user.admrYn,
				user.delYn,
				user.lastLoginDt,
				user.pwdChgDt,
				user.regDt,
				user.regrId,
				user.regrNm,
				user.amdDt,
				user.amdrId,
				user.amdrNm
		);
	}

	/** 사용자 목록수. */
	public long getUserListCount(User searchEntity) {
		return query.select(user.count())
				.from(user)
				.where(predicate(searchEntity))
				.fetchFirst();
	}

	/** 사용자 목록 조회. */ 
	public List<User> getUserList(User searchEntity) {
		int offset = 0;
		int limit = 10;
		
		List<User> resultList = null;
		if (searchEntity.isPaging()) {
			offset = (searchEntity.getCurPage() - 1) * searchEntity.getPageListSize();
			limit  = searchEntity.getPageListSize();

			resultList = query.select(projection())
					.from(user)
					.where(predicate(searchEntity))
					.offset(offset)
					.limit(limit)
					.fetch();
		}
		else {
			if (searchEntity.getSearchLimit() != null && searchEntity.getSearchLimit().length == 2) {
				offset = searchEntity.getSearchLimit()[0];
				limit  = searchEntity.getSearchLimit()[1];
				
				resultList = query.select(projection())
						.from(user)
						.where(predicate(searchEntity))
						.offset(offset)
						.limit(limit)
						.fetch(); 
			}
			else {
				resultList = query.select(projection())
						.from(user)
						.where(predicate(searchEntity))
						.fetch(); 
			}
		}

		return resultList;
	}
	
	/** 사용자 목록 상세 조회. */
	public User getUser(String userOid) {
		return query.select(projection())
					.from(user)
					.where(user.userOid.eq(userOid))
					.fetchOne();
	}
	

	public void removeUser(String userOid) {
		query.delete(user)
   			 .where(user.userOid.eq(userOid))
   			 .execute();
	}
	
	
}
