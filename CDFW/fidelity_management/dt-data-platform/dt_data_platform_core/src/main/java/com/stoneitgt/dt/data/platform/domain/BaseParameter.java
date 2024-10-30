package com.stoneitgt.dt.data.platform.domain;


import com.stoneitgt.dt.data.platform.util.StringUtil;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.extern.slf4j.Slf4j;

/**
 * 공통 파라미터 - db 검색 기능에 사용
 * @author sjpark
 *
 */
@Slf4j
@Data
@EqualsAndHashCode(callSuper = true)
public class BaseParameter extends Paging {

	private String keyword;
	private String subKeyword;

	private String field;
	private String subField;
	
	
	private String tempKeword;
	
	
	public void setTempKeword(String keyword) {
		if(StringUtil.isEmpty(keyword)) {
			tempKeword = null;
		}
		this.tempKeword = keyword.toLowerCase();
	}
	
	//private String year;
	//private List<Map<String, Object>> programYear;
	

	// 정렬방식
	private String sortType;
	private String subSortType;

	// 정렬필드
	private String sortName;
	private String subSortName;

	// 년도
	private String year;

	// 카테고리
	private String category;

	// 기간시작일
	private String fromDate;

	// 기간종료일
	private String toDate;

	// 로그인 사용자
	private int loginUserSeq;

	// 메뉴코드
	private String menuCd;
	
	// 카테고리
	private String categoryType;
	
	//문의진행상태
	private String status;
	
	//섹션seq 검색용
	private int sectionSeq;
	
	/*추가*/
	//키원드 종류
	private String keywordKind;
	//검색 플래그
	private int searchFlag;
	//리스트 더보기 플래그
	private int addListFlag;
	//리스트 가져올 페이지 번호
	private int getPageNum;
	//리스트 첫번째 부터 모두 조회 여부
	private String firstYn;
	//리스트 가져올 row수
	private int rowSize;
	
	private String bannerType;
	private String templateType;
	private String boardTp;
}