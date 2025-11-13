package kr.co.n2m.platform.meta.architecture.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import lombok.Getter;
import lombok.Setter;

/**
 * API 처리결과 ID Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class ResultIdVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	/** ID */
	private Object id;
	
	
	
	public ResultIdVo() { /* default 생성자 */ }
	
	public ResultIdVo(Object id) {
		this.id = id;
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.MULTI_LINE_STYLE, true, true);
    }	
    
}
