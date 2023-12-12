package kr.co.n2m.platform.meta.architecture.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;

/**
 * page Vo
 * 
 * @author  n2m
 */
@Schema(description="Page Vo")
public class PageVo {
	
	/**
	 * <pre>
	 * isPaging 이 false 일 경우 한계 리스트 크기
	 * 
	 * 모든 데이터를 조회시 LIMIT_LIST_SIZE 보다 데이터 건수가 더 많다면 처리시 페이징해서 처리해야 한다!!
	 * </pre>
	 */
	protected static final int LIMIT_LIST_SIZE = 2000;

	@Schema(description="isPaging", defaultValue="true", hidden=true)
	private boolean isPaging = true;
	
	@Schema(description = "현재 페이지", defaultValue="1", minimum="1", maximum="10000")
	private int curPage = 1;
//	@Schema(description = "한 번에 보여주는 페이지 번호 블럭 크기", defaultValue="5")
//	/private int blockSize = 5;
	@Schema(description = "페이지 리스트 크기", defaultValue="10", minimum="1", maximum="100")
	private int pageListSize = 10;
	@Schema(description="startIndex (=offset)", hidden=true)
	private int startIndex;
	@Schema(description="총 건수", defaultValue="0", accessMode=AccessMode.READ_ONLY)
	private int totalListSize;
	@Schema(description="총 페이지 수", defaultValue="0", accessMode=AccessMode.READ_ONLY)
	private int totalPage;

	
	public PageVo() { /* default 생성자 */ }
	
	public PageVo(PageVo pageVo) {
		this.setCurPage(pageVo.getCurPage());
//		this.setBlockSize(pageVo.getBlockSize());
		this.setPageListSize(pageVo.getPageListSize());
		this.setStartIndex(pageVo.getStartIndex());
		this.setTotalListSize(pageVo.getTotalListSize());
		this.setTotalPage(pageVo.getTotalPage());
		this.setIsPaging(pageVo.getIsPaging());
	}
	
	
	public int getCurPage() {
		return curPage;
	}
	public void setCurPage(int curPage) {
		if(curPage <= 0) {
			curPage = 1;
		}		
		this.curPage = curPage;
	}
	public int getTotalPage() {
		return totalPage;
	}
	public void setTotalPage(int totalPage) {
		this.totalPage = totalPage;
	}
	public int getStartIndex() {
		return startIndex;
	}
	public void setStartIndex(int startIndex) {
		this.startIndex = startIndex;
	}
//	public int getBlockSize() {
//		return blockSize;
//	}
//	public void setBlockSize(int blockSize) {
//		this.blockSize = blockSize;
//	}
	public int getPageListSize() {
		return pageListSize;
	}
	public void setPageListSize(int pageListSize) {
		this.pageListSize = pageListSize;
	}
	public int getTotalListSize() {
		return totalListSize;
	}
	public void setTotalListSize(int totalListSize) {
		this.totalListSize = totalListSize;
		this.startIndex = (this.curPage-1) * this.pageListSize;
		this.totalPage = this.totalListSize % this.pageListSize == 0 ? this.totalListSize / this.pageListSize : this.totalListSize / this.pageListSize + 1;
		
	}
	public boolean getIsPaging() {
		return isPaging;
	}
	public void setIsPaging(boolean isPaging) {
		this.isPaging = isPaging;
	}
	
	@Schema(description="한계 리스트 크기", defaultValue="2000", hidden=true, accessMode=AccessMode.READ_ONLY)
	public int getLimitListSize() {
		return LIMIT_LIST_SIZE;
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }		

}
