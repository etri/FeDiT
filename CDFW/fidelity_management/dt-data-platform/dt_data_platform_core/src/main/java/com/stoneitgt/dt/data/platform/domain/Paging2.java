package com.stoneitgt.dt.data.platform.domain;

import org.apache.ibatis.session.RowBounds;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 페이징 사용 파라미터
 * 
 *
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Paging2 {

	@Builder.Default
	private int page = 1; // 페이지 번호
	@Builder.Default
	private int size = 10; // 게시글 수

	private int first; // 첫 번째 페이지 번호
	private int last; // 마지막 페이지 번호
	private int prev; // 이전 페이지 번호
	private int next; // 다음 페이지 번호
	private int from; // 시작 페이지 (페이징 네비 기준)
	private int to; // 끝 페이지 (페이징 네비 기준)
	private int total; // 게시글 전체 수
	@Builder.Default
	private int pageGroupSize = 10;
	private int begin;
	private int end;
	@Builder.Default
	private boolean show = true;
	
	public Paging2(int size) {
		this.page = 1;
		this.size = size;
	}

	public Paging2(int page, int size) {
		this.page = page;
		this.size = size;
	}

	/**
	 * @param total the totalCount to set
	 */
	public void setTotal(int total) {
		this.total = total;
		this.makePaging();
	}

	/**
	 * 페이징 생성
	 */
	private void makePaging() {
		// 게시 글 전체 수가 없는 경우
		if (this.total == 0) {
			return;
		}

		// 기본 값 설정
		if (this.page == 0) {
			this.page = 1;
		}

		// 기본 값 설정
		if (this.size == 0) {
			this.size = 10;
		}

		// 마지막 페이지
		int finalPage = (total + (this.size - 1)) / this.size;

		// 기본 값 설정
		if (this.page > finalPage) {
			this.page = finalPage;
		}

		// 현재 페이지 유효성 체크
		if (this.page < 0 || this.page > finalPage) {
			this.page = 1;
		}

		if (this.pageGroupSize == 0) {
			this.pageGroupSize = 10;
		}

		boolean isNowFirst = this.page == 1; // 시작 페이지 (전체)
		boolean isNowFinal = this.page == finalPage; // 마지막 페이지 (전체)

		int startPage = ((this.page - 1) / this.pageGroupSize) * this.pageGroupSize + 1; // 시작 페이지 (페이징 네비 기준)
		int endPage = startPage + this.pageGroupSize - 1; // 끝 페이지 (페이징 네비 기준)

		if (endPage > finalPage) { // [마지막 페이지 (페이징 네비 기준) > 마지막 페이지] 보다 큰 경우
			endPage = finalPage;
		}

//		this.setFirst(1); // 첫 번째 페이지 번호

		if (isNowFirst) {
			this.first = 1;
			this.prev = 1; // 이전 페이지 번호
		} else {
			// 이전 10개 페이지 번호
			this.first = ((this.page - 1 < 1 || startPage - this.pageGroupSize < 1) ? 1
					: (startPage - this.pageGroupSize));
			// 이전 페이지 번호
			this.prev = ((this.page - 1) < 1 ? 1 : (this.page - 1));
		}

		// 시작 페이지 (페이징 네비 기준)
		this.begin = startPage;

		// 끝 페이지 (페이징 네비 기준)
		this.end = endPage;

		if (isNowFinal) {
			// 다음 페이지 번호
			this.next = finalPage;
			// 마지막 페이지 번호
			this.last = finalPage;
		} else {
			// 다음 10개 페이지 번호
			this.next = ((this.page + 1) > finalPage ? finalPage : (this.page + 1)); // 다음 페이지 번호
			this.last = ((this.page + 1) > finalPage || (startPage + pageGroupSize) > finalPage ? finalPage
					: (startPage + pageGroupSize));
		}

		this.from = (this.page - 1) * this.size + 1;
		int to = (this.page - 1) * this.size + this.size;
		if (to > this.total) {
			this.to = this.total;
		} else {
			this.to = to;
		}
	}

	public RowBounds getPaging() {
		int offSet = (this.page - 1) * this.size + 1;
		int limit = this.size; //this.page * this.size;
		return new RowBounds(offSet, limit);
	}

}