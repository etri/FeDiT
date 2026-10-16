package kr.co.n2m.platform.meta.architecture.domain;

import java.util.List;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import lombok.Getter;
import lombok.Setter;

/**
 * 로그인 사용자 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class LoginUserVo {

	private String userId;

	private String userNm;
	
	private List<String> roleList;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	
    
}
