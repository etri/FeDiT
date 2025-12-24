package kr.co.n2m.platform.meta.portal.notifc.domain;

import java.io.Serializable;
import java.util.List;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 내 알림 검색 Vo
 *
 * @author  n2m
 */
@Schema(description="내 알림 검색 Vo")
@Getter
@Setter
public class NotifcMySearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
    @Schema(description = "알림 메시지")    
	private String srchNotifcMsg;
	
    @Schema(description = "로그인 사용자 ID", hidden=true)
	private String loginUserId;

    @Schema(description = "로그인 사용자 권한 목록", hidden=true)	    
	private List<String> myAuthList;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	
}
