package kr.co.n2m.platform.meta.architecture.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.SqlDatePart;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;


/**
 * API 검색조건 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
@Alias("searchVo")
public class SearchVo extends PageVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	// 2025-07-25 dateTime 기본적으로 소수점6자리(마이크로초)로 설정.
	@Getter(AccessLevel.NONE)
	@Schema(description="SQL 날짜 format", hidden=true)
	private String sqlDateFormat = SqlDatePart.iso6z.format();
	
	/** 정렬순서 필드 */
	@Schema(description="정렬 순서 필드")
	private String sortField;
	
	/** 정렬순서 조건 */
	@Schema(description="정렬 순서 조건. (ascending/descending)")
	private String sortOrder;		

	/** 검색기간 시작일 */
	private String srchStartDd;

	/** 검색기간 종료일 */	
	private String srchEndDd;
	
	public SearchVo() { /* default 생성자 */ }
	
	public SearchVo(PageVo pageVo) {	
		super(pageVo);
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.MULTI_LINE_STYLE, true, true);
    }	
}
