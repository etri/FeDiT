package kr.co.n2m.platform.admin.feature.common.entity;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PagingVO extends BaseVO {

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private int curPage = 1;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private int blockSize = 5;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private int pageListSize = 10;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private int startIndex;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private long totalListSize;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private long totalPage;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private boolean paging = false;
	
	public void setTotalListSize(long totalListSize) {
		if(totalListSize > 0) {
			this.totalListSize = totalListSize;
			this.startIndex = (this.curPage-1) * this.pageListSize;
			this.totalPage = this.totalListSize % this.pageListSize == 0 ? this.totalListSize / this.pageListSize : this.totalListSize / this.pageListSize + 1;
		}
	}
	
}
