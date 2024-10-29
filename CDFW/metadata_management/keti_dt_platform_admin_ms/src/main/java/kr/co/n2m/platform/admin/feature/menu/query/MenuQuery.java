package kr.co.n2m.platform.admin.feature.menu.query;

import java.util.List;

import org.springframework.stereotype.Component;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.QBean;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

import kr.co.n2m.platform.admin.feature.codegroup.entity.QCode;
import kr.co.n2m.platform.admin.feature.menu.entity.Menu;
import kr.co.n2m.platform.admin.feature.menu.entity.QMenu;
import kr.co.n2m.platform.common.utils.StringUtil;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MenuQuery {

	private final JPAQueryFactory query;
	private final QMenu menu = QMenu.menu;
	private final QMenu menuJ = new QMenu("menuJ");
	private final QCode code = QCode.code;
	
	public BooleanBuilder predicate(Menu menuVo) {

		BooleanBuilder search = new BooleanBuilder();
		
		if(StringUtil.isNotEmpty(menuVo.getUpMenuOid())) {
			search.and(menu.upMenuOid.eq(menuVo.getUpMenuOid()));
		}
		
		if(StringUtil.isNotEmpty(menuVo.getTypeCd())) {
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

	public QBean<Menu> projection(){
		
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
				menu.menuIcon,
				menu.regDT,
				menu.regrId,
				menu.regrNm,
				menu.amdDT,
				menu.amdrId,
				menu.amdrNm,
				menu.admrYn
		);
	}
	
	public QBean<Menu> getMenu(){
		
		return Projections.bean(Menu.class, 
				menu.menuOid,
				menu.menuOid.as("key"),
				menu.menuId,
				menu.menuNm,
				menu.menuNm.as("title"),
				menuJ.menuNm.as("upMenuName"),
				menu.upMenuOid,
				menu.menuDesc,
				menu.menuTgtCd.as("tgtCdVal"),
				code.cdNm.as("tgtCdNm"),
				menu.useYn,
				new CaseBuilder()
				.when(menu.useYn.eq(Boolean.toString(true)))
				.then("표시")
				.otherwise("표시 안함").as("useYnName"),
				new CaseBuilder()
				.when(menu.useYn.eq(Boolean.toString(true)))
				.then("icon-no")
				.otherwise("").as("iconCls"),
				menu.menuUrl,
				menu.urlParam,
				menu.typeCd,
				menu.odrg,
				menu.popupYn,
				menu.popupWdth,
				menu.popupHght,
				menu.menuIcon,
				menu.regDT,
				menu.regrId,
				menu.regrNm,
				menu.amdDT,
				menu.amdrId,
				menu.amdrNm,
				menu.admrYn
		);
	}
	
	/** 메뉴 전체 목록 조회 */
	public List<Menu> getMenu(Menu menuVo) {
		return query.select(projection())
					.from(menu)
					.leftJoin(menuJ)
					.on(menu.upMenuOid.eq(menuJ.menuOid))
					.leftJoin(code)
					.on(menu.menuTgtCd.eq(code.cdId))
					.where(predicate(menuVo))
					.orderBy(menu.odrg.asc())
					.fetch();
	}
	
	/** 플랫폼 Id 목록 조회 */
	public List<Menu> getPltfrmIdMenu(Menu menuVo) {
		return query.select(projection())
					.from(menu)
					.leftJoin(menuJ)
					.on(menu.upMenuOid.eq(menuJ.menuOid))
					.leftJoin(code)
					.on(menu.menuTgtCd.eq(code.cdId))
					.where(predicate(menuVo))
					.orderBy(menu.upMenuOid.asc())
					.fetch();
	}
	
	/** 메뉴 하위 목록 조회 */
	public List<Menu> setSubMenu(Menu menuVo){
		Menu subMenu = new Menu();
		subMenu.builder();
		subMenu.setUpMenuOid(menuVo.getMenuOid());
		
		return query.select(projection())
					.from(menu)
					.leftJoin(menuJ)
					.on(menu.upMenuOid.eq(menuJ.menuOid))
					.leftJoin(code)
					.on(menu.menuTgtCd.eq(code.cdId))
					.where(predicate(subMenu))
					.orderBy(menu.odrg.asc())
					.fetch();
	}

	/** 메뉴 상세 조회 */
	public Menu getMenu(String oid) {
		Menu menuVo = null;
		
		if(oid.startsWith("MNU")) {
			menuVo= query.select(getMenu())
						 .from(menu)
						 .leftJoin(menuJ)
						 .on(menu.upMenuOid.eq(menuJ.menuOid))
						 .leftJoin(code)
						 .on(menu.menuTgtCd.eq(code.cdId))
						 .where(menu.menuId.eq(oid))
						 .fetchOne();
		}else {
			menuVo= query.select(getMenu())
						 .from(menu)
						 .leftJoin(menuJ)
						 .on(menu.upMenuOid.eq(menuJ.menuOid))
						 .leftJoin(code)
						 .on(menu.menuTgtCd.eq(code.cdId))
						 .where(menu.menuOid.eq(oid))
						 .fetchOne();
		}
		return menuVo;
	}
	
	/** 메뉴 아이디값 */
	public String setNextId(Menu menuVo) {
		String nextId = query.select(menu.menuId.substring(4, 10).max().coalesce("0"))
							 .from(menu).fetchOne();
		return nextId;
	}
	
	/** 메뉴 삭제 목록 조회 */
	public List<Menu> getRemoveMenu(String menuOid){
		
		return query.select(projection())
				.from(menu)
				.leftJoin(menuJ)
				.on(menu.upMenuOid.eq(menuJ.menuOid))
				.leftJoin(code)
				.on(menu.menuTgtCd.eq(code.cdId))
				.where(menu.upMenuOid.eq(menuOid).or(menu.menuOid.eq(menuOid)))
				.orderBy(menu.odrg.asc())
				.fetch();
	}
	
	/** 메뉴 삭제 */
	public void removeMenu(String menuOid) {
		query.delete(menu)
			 .where(menu.upMenuOid.eq(menuOid).or(menu.menuOid.eq(menuOid))).execute();
	}

	public String findByMenuOid(String menuOid) {
		
		return query.select(menu.menuOid)
				.from(menu)
				.where(menu.menuOid.eq(menuOid))
				.fetchOne();
	}
	
}
