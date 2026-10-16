package kr.co.n2m.platform.admin.feature.auth.query;

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

import kr.co.n2m.platform.admin.feature.apigroup.entity.Api;
import kr.co.n2m.platform.admin.feature.apigroup.entity.Apigroup;
import kr.co.n2m.platform.admin.feature.apigroup.entity.QApi;
import kr.co.n2m.platform.admin.feature.apigroup.entity.QApigroup;
import kr.co.n2m.platform.admin.feature.auth.entity.Auth;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthApi;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthMenu;
import kr.co.n2m.platform.admin.feature.auth.entity.AuthUser;
import kr.co.n2m.platform.admin.feature.auth.entity.QAuth;
import kr.co.n2m.platform.admin.feature.auth.entity.QAuthApi;
import kr.co.n2m.platform.admin.feature.auth.entity.QAuthMenu;
import kr.co.n2m.platform.admin.feature.auth.entity.QAuthUser;
import kr.co.n2m.platform.admin.feature.codegroup.entity.QCode;
import kr.co.n2m.platform.admin.feature.menu.entity.Menu;
import kr.co.n2m.platform.admin.feature.menu.entity.QMenu;
import kr.co.n2m.platform.admin.feature.user.entity.QUser;
import kr.co.n2m.platform.admin.feature.user.entity.User;
import kr.co.n2m.platform.common.config.ApplicationConfig;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AuthQuery {
	
	private final ApplicationConfig config;
	private final JPAQueryFactory query;
	private final QMenu menu = QMenu.menu;
	private final QAuth auth = QAuth.auth;
	private final QAuth authJ = new QAuth("authJ");
	private final QCode code = QCode.code;
	private final QMenu menuJ = new QMenu("menuJ");
	private final QCode codeJ = new QCode("codeJ");
	private final QAuthMenu authmenu = QAuthMenu.authMenu;
	private final QAuthUser authUser = QAuthUser.authUser;
	private final QApigroup apigroup = QApigroup.apigroup;
	private final QAuthApi authapi = QAuthApi.authApi;
	private final QApi api = QApi.api;

	public BooleanBuilder authPredicate(Auth searchVo) {
		
		BooleanBuilder search = new BooleanBuilder();
		
		// 권한명 + 설명 검색
		if(StringUtil.isNotEmpty(searchVo.getSearchWord())) {
			search.and(auth.autName.contains(searchVo.getSearchWord()))
				.or(auth.autDesc.contains(searchVo.getSearchWord()));
		}
		
		// 권한아이디 검색
		if(StringUtil.isNotEmpty(searchVo.getAutId())) {
			search.and(auth.autId.eq(searchVo.getAutId()));
		}
		
		// 권한명 검색
		if(StringUtil.isNotEmpty(searchVo.getAutName())) {
			search.and(auth.autName.contains(searchVo.getAutName()));
		}
		
		// 권한설명 검색
		if(StringUtil.isNotEmpty(searchVo.getAutDesc())) {
			search.and(auth.autDesc.contains(searchVo.getAutDesc()));
		}
		
		if(StringUtil.equals(searchVo.getTypeCd(), "COD_00001")) {
			search.and(auth.typeCd.eq(searchVo.getTypeCd()));
		}
		
		if(StringUtil.equals(searchVo.getTypeCd(), "COD_00002")) {
			search.and(auth.typeCd.eq(searchVo.getTypeCd()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getPltfrmId())) {
			search.and(auth.pltfrmId.eq(searchVo.getPltfrmId()));
		}
		
		// 사용여부 검색
		if(StringUtil.equals(searchVo.getUseYn(), "Y")) {
			search.and(auth.useYn.eq("Y"));
		}
		if(StringUtil.equals(searchVo.getUseYn(), "N")) {
			search.and(auth.useYn.eq("N"));
		}
		
		// 등록일시 검색
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(auth.regDt.between(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
					StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegSt())) {
			search.and(auth.regDt.after(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
		}
		
		if(StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
			search.and(auth.regDt.before(StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
		}
		
		return search;
	}

	public BooleanBuilder authPredicateByPltfrmIdAndUserId(String pltfrmId, String userId) {

		BooleanBuilder search = new BooleanBuilder();

		if(StringUtil.isNotEmpty(pltfrmId)) {
			search.and(auth.pltfrmId.eq(pltfrmId));
		}

		if(StringUtil.isNotEmpty(userId)) {
			search.and(authUser.userid.eq(userId));
		}

		return search;
	}

	public BooleanBuilder authUserPredicate(AuthUser searchVo) {
		
		BooleanBuilder search = new BooleanBuilder();
		
		
		return search;
	}
	
	public BooleanBuilder menuPredicate(Menu menuVo) {
		
		BooleanBuilder search = new BooleanBuilder();
		
		if(StringUtil.isNotEmpty(menuVo.getUpMenuOid())) {
			search.and(menu.upMenuOid.eq(menuVo.getUpMenuOid()));
		}
		
		if(StringUtil.equals(menuVo.getTypeCd(), "COD_00001")) {
			search.and(menu.typeCd.eq(menuVo.getTypeCd()));
		}
		
		if(StringUtil.equals(menuVo.getTypeCd(), "COD_00002")) {
			search.and(menu.typeCd.eq(menuVo.getTypeCd()));
		}
		
		if(StringUtil.isNotEmpty(menuVo.getPltfrmId())) {
			search.and(menu.pltfrmId.eq(menuVo.getPltfrmId()));
		}

		if(StringUtil.equals(menuVo.getSearchType(), "tree")) {
			search.and(menu.upMenuOid.eq("0"));
		}
		
		if(StringUtil.equals(menuVo.getUseYn(), "Y")) {
			search.and(menu.useYn.eq("Y"));
		}
		if(StringUtil.equals(menuVo.getUseYn(), "N")) {
			search.and(menu.useYn.eq("N"));
		}
		if(StringUtil.equals(menuVo.getAdmrYn(), "Y")) {
			search.and(menu.admrYn.eq("Y"));
		}
		if(StringUtil.equals(menuVo.getAdmrYn(), "N")) {
			search.and(menu.admrYn.eq("N"));
		}
		
		return search;
	}
	
	public BooleanBuilder apiPredicate(Apigroup searchVo) {

			BooleanBuilder search = new BooleanBuilder();
			
			// API 그룹 OID 검색
			if(StringUtil.isNotEmpty(searchVo.getGrpOid())) {
				search.and(apigroup.grpOid.eq(searchVo.getGrpOid()));
			}
			
			// 플랫폼 아이디 검색
			if(StringUtil.isNotEmpty(searchVo.getPltfrmId())) {
				search.and(apigroup.pltfrmId.eq(searchVo.getPltfrmId()));
			}
			
			// 사용자 여부 검색
			if(StringUtil.equals(searchVo.getUseYn(), "Y")) {
				search.and(apigroup.useYn.eq("Y"));
			}
			
			if(StringUtil.equals(searchVo.getUseYn(), "N")) {
				search.and(apigroup.useYn.eq("N"));
			}	
			
			// 등록일시 검색
			if(StringUtil.isNotEmpty(searchVo.getSearchRegSt()) && StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
				search.and(apigroup.regDt.between(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay(),
						StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
			}
			
			if(StringUtil.isNotEmpty(searchVo.getSearchRegSt())) {
				search.and(apigroup.regDt.after(StringUtil.parseLocalDate(searchVo.getSearchRegSt(), "yyyy-MM-dd").atStartOfDay()));
			}
			
			if(StringUtil.isNotEmpty(searchVo.getSearchRegEd())) {
				search.and(apigroup.regDt.before(StringUtil.parseLocalDate(searchVo.getSearchRegEd(), "yyyy-MM-dd").atTime(LocalTime.MAX)));
			}
			
			return search;
		}
	
	
	public QBean<Auth> authProjection(){
		
		return Projections.bean(Auth.class, 
							auth.autOid,
							auth.autId,
							auth.autName,
							auth.useYn,
							auth.regDt,
							auth.regrId,
							auth.regrNm,
							auth.amdDt,
							auth.amdrId,
							auth.amdrNm,
							auth.autDesc,
							auth.pltfrmId,
							auth.typeCd,
							new CaseBuilder()
								.when(auth.useYn.eq(Boolean.toString(true)))
								.then("사용")
								.otherwise("미사용").as("useYnName")
							
				);
		
		
	}
	
	public QBean<AuthUser> userProjection() {
		
		return Projections.bean(AuthUser.class,
				authUser.autOid,
				authUser.email,
				authUser.userid,
				authUser.nickname,
				authUser.phone
		);
	}
	
	public QBean<Menu> menuProjection(){
			
			return Projections.bean(Menu.class, 
					menu.menuOid,
					menu.menuOid.as("key"),
					menu.menuId,
					menu.menuNm,
					menu.menuNm.as("title"),
					menuJ.menuNm.as("upMenuName"),
					menu.upMenuOid,
					menu.menuDesc,
					menu.useYn,
					code.cdVal.as("tgtCdVal"),
					code.cdNm.as("tgtCdNm"),
					menu.menuUrl,
					menu.urlParam,
					menu.typeCd,
					menu.odrg,
					menu.popupYn,
					menu.popupWdth,
					menu.popupHght,
					menu.regDT,
					menu.regrId,
					menu.regrNm,
					menu.amdDT,
					menu.amdrId,
					menu.amdrNm,
					menu.admrYn,
					authmenu.readYn,
					authmenu.writeYn,
					authmenu.amdYn,
					authmenu.delYn,	
					authmenu.autOid
			);
		}
	
	public QBean<Apigroup> apiProjection() {
		
		return Projections.bean(Apigroup.class,
				apigroup.grpOid,
				apigroup.grpName,
				apigroup.grpDesc,
				apigroup.useYn,
				apigroup.pltfrmId,
				apigroup.regDt,
				apigroup.regrId,
				apigroup.regrNm,
				apigroup.amdDt,
				apigroup.amdrId,
				apigroup.amdrNm
		);		
	}
	
	public QBean<AuthApi> authApiapiProjection(){		
		
		return Projections.bean(AuthApi.class,
				authapi.autOid,
				authapi.grpOid
		);
	}
	
	/************************************** 권한  **************************************/
	
	
	/** 권한 목록수. */ 
	public long getAuthListCount(Auth searchVo) {
		return query.select(auth.count())
					.from(auth)
					.where(authPredicate(searchVo))
					.fetchFirst();
	}
	
	
	/** 권한 목록 조회. */ 
	public List<Auth> getAuthList(Auth searchVo) {
		
		int offset = 0;
		int limit = 10;

		List<Auth> resultList = null;
		if (searchVo.isPaging()) {
			offset = (searchVo.getCurPage() - 1) * searchVo.getPageListSize();
			limit  = searchVo.getPageListSize();

			resultList = query.select(authProjection())
							  .from(auth)
							  .leftJoin(authJ)
							  .on(auth.autOid.eq(authJ.autOid))
							  .leftJoin(code)
							  .on(auth.typeCd.eq(code.cdId))
							  .where(authPredicate(searchVo))
							  .offset(offset)
							  .limit(limit)
							  .fetch();
		}
		else {
			if (searchVo.getSearchLimit() != null && searchVo.getSearchLimit().length == 2) {
				offset = searchVo.getSearchLimit()[0];
				limit  = searchVo.getSearchLimit()[1];
				
				resultList = query.select(authProjection())
								  .from(auth)
								  //.leftJoin(authJ)
								  //.on(auth.autOid.eq(authJ.autOid))
								  //.leftJoin(code)
								  //.on(auth.typeCd.eq(code.cdId))
								  .where(authPredicate(searchVo))
								  .offset(offset)
								  .limit(limit)
								  .fetch(); 
			}
			else {
				limit = config.getListMaxRowCount();
				
				resultList = query.select(authProjection())
							   	  .from(auth)
							   	  //.leftJoin(authJ)
								  //.on(auth.autOid.eq(authJ.autOid))
							   	  //.leftJoin(code)
								  //.on(auth.typeCd.eq(code.cdId))
								  .where(authPredicate(searchVo))
								  .fetch(); 
			}
		}

		return resultList;
	}

	public List<Auth> getAuthListByPltfrmIdAndUserId(String pltfrmId, String userId) {
		return  query.select(authProjection())
				.from(auth)
				.leftJoin(authUser)
				.on(auth.autOid.eq(authUser.autOid))
				.where(authPredicateByPltfrmIdAndUserId(pltfrmId, userId))
				.fetch();
	}

	/** 권한 OID 조회 */
	public String getAuthOid(String autOid, String userid) {
		return query.select(authUser.autOid)
					.from(authUser)
					.leftJoin(auth)
					.on(auth.autOid.eq(authUser.autOid))
					.where(authUser.autOid.eq(autOid),(authUser.userid.eq(userid)))
					.fetchOne();
	}
	
	/** AuthMenu OID 조회 */
	public String getAuthMenuOid(String autOid) {
		return query.select(authmenu.autOid)
					.from(authmenu)
					.where(authmenu.autOid.eq(autOid))
					.fetchOne();
	}
	
	/** Auth - AuthOid 조회 */
	public String getAutOid(String autOid) {
		return query.select(auth.autOid)
				.from(auth)
				.where(auth.autOid.eq(autOid))
				.fetchOne();
	}
	
	/** 권한 목록 상세 조회. */ 
	public Auth getAuth(String autOid) {
		return query.select(authProjection())
					.from(auth)
					.where(auth.autOid.eq(autOid))
					.fetchOne();
	}
	
	public void removeAuth(String authOid) {
		query.delete(auth)
			 .where(auth.autOid.eq(authOid)).execute();
	}
	
	  /************************************** 권한 사용자 **************************************/
	  
	  
		public List<AuthUser> getUserList(AuthUser searchVo) {
			  
			int offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize(); 
			int limit = searchVo.getPageListSize();
			  
			return query.select(userProjection()) 
						.from(authUser) 
						.where(authUser.autOid.eq(searchVo.getAutOid()))
						.offset(offset)
						.limit(limit) 
						.fetch(); 
			}
		
		
		public AuthUser getUserDetail(AuthUser authUserEntity) {
			
			return query.select(userProjection())
						.from(authUser)
						.where(authUser.userid.eq(authUserEntity.getUserid())
							.and(authUser.autOid.eq(authUserEntity.getAutOid())))
						.fetchOne();
		}
		
		
		/** 권한 사용자 ID 조회 */
		public String getUserOid(String autOid, String userOid) {
			return query.select(authUser.userid)
						.from(authUser)
						.leftJoin(auth)
						.on(auth.autOid.eq(authUser.autOid))
						.where(authUser.autOid.eq(autOid))
						.fetchOne();
		}
		
		
		public void removeAuthUserList(String autOid) {
			query.delete(authUser)
				.where(authUser.autOid.eq(autOid))
				.execute();
		}
		
		public void removeAuthUser(String autOid, String userid) {
			query.delete(authUser)
				.where(authUser.autOid.eq(autOid)
						.and(authUser.userid.eq(userid))).execute();
		}

  /************************************** 권한 메뉴 **************************************/		

		
		/** 권한 메뉴 목록 조회 */
		public List<Menu> getMenu(Menu menuVo) {
				return query.select(menuProjection())
						.from(menu)
						.leftJoin(menuJ)
						.on(menu.upMenuOid.eq(menuJ.menuOid))
						.leftJoin(code)
						.on(menu.menuTgtCd.eq(code.cdId))
						.leftJoin(authmenu)
						.on(menu.menuOid.eq(authmenu.menuOid).and(authmenu.autOid.eq(menuVo.getAutOid())))
						.where(menuPredicate(menuVo))					
						.orderBy(menu.odrg.asc())
						.fetch();				
		}	
		
		/** 메뉴 하위 목록 조회 */
		public List<Menu> setSubMenu(String autOid, Menu menuVo){
			Menu subMenu = new Menu();
			subMenu.builder();
			subMenu.setUpMenuOid(menuVo.getMenuOid());
			subMenu.setAutOid(autOid);
			
			return query.select(menuProjection())
						.from(menu)
						.leftJoin(menuJ)
						.on(menu.upMenuOid.eq(menuJ.menuOid))
						.leftJoin(code)
						.on(menu.menuTgtCd.eq(code.cdId))
						.leftJoin(authmenu)
						.on(menu.menuOid.eq(authmenu.menuOid).and(authmenu.autOid.eq(autOid)))
						.where(menuPredicate(subMenu))
						.orderBy(menu.odrg.asc())
						.fetch();
		}
		
		public Menu getAuthMenu(AuthMenu authMenuEntity) {
			return query.select(Projections.fields(Menu.class, 
						menu.menuOid,
						menu.menuId,
						menu.menuNm,
						menu.upMenuOid,
						menu.menuDesc,
						menu.menuTgtCd,
						menu.useYn,
						menu.menuUrl,
						menu.urlParam,
						menu.typeCd,
						menu.pltfrmId,
						menu.odrg,
						menu.popupYn,
						menu.popupWdth,
						menu.popupHght,
						menu.regDT,
						menu.regrId,
						menu.regrNm,
						menu.amdDT,
						menu.amdrId,
						menu.amdrNm,
						authmenu.autOid,
						authmenu.readYn,
						authmenu.writeYn,
						authmenu.amdYn,
						authmenu.delYn
					))
					.from(menu)
					.leftJoin(authmenu)
					.on(menu.menuOid.eq(authmenu.menuOid)) 	
					.where(
							menu.menuOid.eq(authMenuEntity.getMenuOid())
							.and(authmenu.autOid.eq(authMenuEntity.getAutOid()))
					)
					.fetchOne();
		}
		
		/** 권한 메뉴 OID 조회 */
		public String getMenuOid(String autOid, String menuOid) {
			return query.select(authmenu.menuOid)
						.from(authmenu)
						.leftJoin(auth)
						.on(auth.autOid.eq(authmenu.autOid))
						.leftJoin(menu)
						.on(menu.menuOid.eq(authmenu.menuOid))
						.where(authmenu.autOid.eq(autOid),(authmenu.menuOid.eq(menuOid)))
						.fetchOne();
		}
		
		/** Menu - menuOid 조회 */
		public String getMenuOid(String menuOid) {
			return query.select(menu.menuOid)
					.from(menu)
					.where(menu.menuOid.eq(menuOid))
					.fetchOne();
		}
		
		@Transactional
		public void removeAuthMenuList(String autOid) {
			query.delete(authmenu)
				.where(authmenu.autOid.eq(autOid)).execute();
		}

		@Transactional
		public void removeAuthMenu(AuthMenu searchVo) {
			query.delete(authmenu)
			.where(authmenu.menuOid.eq(searchVo.getSearchMenuOid())).execute();
		}
		

		
		/************************************** 권한 API 그룹 **************************************/	
		
		
		/** 권한 API 그룹 목록 조회 */
		public List<Apigroup> getApigroupList(Apigroup searchVo) {
			  	
			int offset = (searchVo.getCurPage() -1) * searchVo.getPageListSize(); 
			int limit = searchVo.getPageListSize();
			
			
			List<Apigroup> resultList  = null;
			if (searchVo.isPaging()) {
				resultList =  query.select(apiProjection()) 
						.from(apigroup) 
						.leftJoin(authapi)
						.on(apigroup.grpOid.eq(authapi.grpOid)) 
						.where(authapi.autOid.eq(searchVo.getAutOid()),apiPredicate(searchVo))
						.offset(offset)
						.limit(limit) 
						.fetch(); 
			}else {
				limit = config.getListMaxRowCount();
				
				resultList =  query.select(apiProjection()) 
						.from(apigroup) 
						.leftJoin(authapi)
						.on(apigroup.grpOid.eq(authapi.grpOid)) 
						.where(authapi.autOid.eq(searchVo.getAutOid()),apiPredicate(searchVo))
						.fetch(); 
			}
			return resultList;
		}
		
		/** 권한 API 그룹 상세 조회 */
		public Apigroup getApigroupDetail(AuthApi authApiEntity) {
			return query.select(Projections.fields(Apigroup.class,
						apigroup.grpOid,
						apigroup.grpName,
						apigroup.grpDesc,
						apigroup.useYn,
						apigroup.pltfrmId,
						apigroup.regDt,
						apigroup.regrId,
						apigroup.regrNm,
						apigroup.amdDt,
						apigroup.amdrId,
						apigroup.amdrNm
					))
					.from(apigroup)
					.leftJoin(authapi)
					.on(apigroup.grpOid.eq(authapi.grpOid))
					.where(
							apigroup.grpOid.eq(authApiEntity.getGrpOid())
							.and(authapi.autOid.eq(authApiEntity.getAutOid()))
					)

					.fetchOne();
		}
		
		/** 권한 API 그룹 Oid 멀티 생성*/
		public List<AuthApi> createApiOidList(String autOid, AuthApi apiVo){
		//	return query.insert(apigroup)
				return null;	
		}
		
		/** API Oid값 */
		public String setNextId(AuthApi apiVo) {
			String nextId = query.select(authapi.autOid.max())
								 .from(authapi)
								 .fetchOne();
			return nextId;
		}
		
		/** API 그룹 Oid 조회 */
		public String getGrpOid(String autOid, String grpOid) {
			return query.select(authapi.grpOid)
						.from(authapi)
						.leftJoin(auth)
						.on(auth.autOid.eq(authapi.autOid))
						.leftJoin(apigroup)
						.on(apigroup.grpOid.eq(authapi.grpOid))
						.where(authapi.autOid.eq(autOid),(authapi.grpOid.eq(grpOid)))
						.fetchOne();
		}
		
		/** Apigroup - GrpOid 조회 */
		public String getGrpOid(String grpOid) {
			return query.select(apigroup.grpOid)
					.from(apigroup)
					.where(apigroup.grpOid.eq(grpOid))
					.fetchOne();
		}
		
		/** 권한 API 그룹 전체 삭제 */
		public void removeAuthApigroupList(String oid) {
			query.delete(authapi)
				.where(authapi.autOid.eq(oid))
				.execute();
		}

		/** 권한 API 그룹 삭제 */
		public void removeAuthApigroup(String searchVo) {
			query.delete(authapi)
			.where(authapi.grpOid.eq(searchVo))
			.execute();
		}


		/** 로그인 한 아이디 정보 -> api 리스트 찾기 */
		public List<Api> findApiFromUserID(String userId, List<String> defaultAutOidList) {
			// TODO Auto-generated method stub
			
//			JPAQuery<Api> apiAuthList = 
//					query.select(api)
//						.from(api)
//						.leftJoin(authapi)
//						.on(api.grpOid.eq(authapi.grpOid))
//						.leftJoin(authUser)
//						.on(authUser.autOid.eq(authapi.autOid))
//						.where(authUser.userid.eq(userId))
//						.distinct();
			
			JPAQuery<Api> apiAuthList = 
					query.select(api)
						.from(auth)
						.join(authUser).on(auth.autOid.eq(authUser.autOid))
						.join(authapi).on(auth.autOid.eq(authUser.autOid))
						.join(apigroup).on(apigroup.grpOid.eq(authapi.grpOid))
						.join(api).on(api.grpOid.eq(api.grpOid))
						.where(
							     auth.useYn.eq("Y")
							.and(apigroup.useYn.eq("Y"))
							.and(api.useYn.eq("Y"))
							.and(
									authUser.userid.eq(userId)
							        .or(auth.autOid.in(defaultAutOidList))
								)
						 )
						.distinct();			
			
			List<Api> list = apiAuthList.fetch();
			return list;
		}	
}

